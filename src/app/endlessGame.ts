import { createTuning } from '../game/config/tuning';
import type { Difficulty } from '../game/config/endless';
import { CARGO } from '../game/content/cargo';
import type { CargoKind } from '../game/content/cargo';
import { FixedLoop } from '../game/core/fixedLoop';
import { KeyboardInput } from '../game/core/input';
import { EndlessRun } from '../game/modes/endless/run';
import type { EndlessSnapshot } from '../game/modes/endless/run';
import { ContextualHelp } from '../game/systems/contextualHelp';
import { EndlessRenderer } from '../rendering/endlessRenderer';
import { VISUALS } from '../rendering/visualDefinitions';
import { publicAsset } from '../utils/publicAsset';
import { formatRunTime, GameNavigation } from './navigation';
import type { NavigationEffect } from './navigation';

const DIFFICULTY_LABELS: Readonly<Record<Difficulty, string>> = { easy: 'Fácil', normal: 'Normal', hard: 'Difícil' };
const LOSS_GROUP_SECONDS = 0.6;
const LOSS_NOTICE_SECONDS = 4;

/** Mounts one run. Restart repeats its seed and captured settings without reloading assets. */
export async function mountEndlessGame(app: HTMLElement, difficulty: Difficulty,
  onExit: () => void): Promise<() => void> {
  const tuning = createTuning();
  const navigation = new GameNavigation();
  navigation.beginRun();
  app.innerHTML = `<section class="endless-game" aria-label="Carrera Infinita">
    <div id="endless-canvas" tabindex="0" aria-label="Carrera. Esc para pausar."></div>
    <header class="run-hud" aria-label="Estado de la mudanza">
      <div class="run-brand">MUDANZAS TORTUGA, S.L. <span>${DIFFICULTY_LABELS[difficulty]}</span></div>
      <div class="run-cargo" aria-label="Carga inicial">${CARGO.map(item =>
        `<span class="cargo-icon" data-cargo="${item.id}" title="${item.label}"><img src="${publicAsset(VISUALS[item.id].path)}" alt="${item.label}"><span class="cargo-cross" aria-hidden="true">×</span></span>`).join('')}</div>
      <div class="run-metrics"><output id="run-time" aria-label="Tiempo">00:00</output>
        <span>⚑ <output id="run-pennants" aria-label="Banderines">0</output></span>
        <span>×<output id="run-multiplier" aria-label="Multiplicador siguiente">1</output></span>
        <strong><output id="run-score" aria-label="Puntuación">0</output> puntos</strong></div>
    </header>
    <button id="run-pause" class="run-pause" aria-label="Pausar recorrido" disabled>Pausa <kbd>Esc</kbd></button>
    <p id="loss-notice" class="loss-notice" role="status" hidden></p>
    <div id="run-overlay" class="run-overlay" hidden></div>
  </section>`;
  const host = app.querySelector<HTMLElement>('#endless-canvas')!;
  const overlay = app.querySelector<HTMLElement>('#run-overlay')!;
  const pauseButton = app.querySelector<HTMLButtonElement>('#run-pause')!;
  const timeOutput = app.querySelector<HTMLOutputElement>('#run-time')!;
  const pennantsOutput = app.querySelector<HTMLOutputElement>('#run-pennants')!;
  const multiplierOutput = app.querySelector<HTMLOutputElement>('#run-multiplier')!;
  const scoreOutput = app.querySelector<HTMLOutputElement>('#run-score')!;
  const notice = app.querySelector<HTMLElement>('#loss-notice')!;
  const renderer = await EndlessRenderer.create(host, tuning);
  let run: EndlessRun;
  try { run = new EndlessRun(tuning, difficulty); }
  catch (error) { renderer.dispose(); throw error; }
  const seed = run.descriptor.seed;
  const input = new KeyboardInput(window, () => run.cancelJump());
  const loop = new FixedLoop(1 / tuning.physicsHz, tuning.maxFrameSeconds, tuning.maxStepsPerFrame);
  const help = new ContextualHelp();
  const lost = new Set<CargoKind>();
  const pendingLoss = new Set<CargoKind>();
  let lossDeadline = 0;
  let noticeUntil = 0;
  let noticeIndex = 0;
  let lastFrame = performance.now();
  let lastHud = -1;
  let raf = 0;
  let disposed = false;
  let helpReset = false;

  function clearControls(): void {
    input.clear(); run.cancelJump(); loop.reset(); lastFrame = performance.now();
  }

  function render(): void {
    const snapshot = run.snapshot();
    const message = navigation.screen === 'running' ? help.active : undefined;
    renderer.render(snapshot, message ? message.keys + ' · ' + message.text : undefined);
    if (performance.now() - lastHud < 100 && !snapshot.ended) return;
    lastHud = performance.now();
    timeOutput.value = formatRunTime(snapshot.time);
    pennantsOutput.value = String(snapshot.pennantsCrossed);
    multiplierOutput.value = String(snapshot.pennantsCrossed + 1);
    scoreOutput.value = snapshot.score.toLocaleString('es-ES');
    host.dataset.tick = String(snapshot.physics.tick);
    host.dataset.time = String(snapshot.time);
    host.dataset.x = String(snapshot.physics.turtle.x + snapshot.logicalOffset);
    host.dataset.y = String(snapshot.physics.turtle.y);
    host.dataset.biome = snapshot.physics.turtle.biome;
    host.dataset.help = message?.id ?? '';
    host.dataset.score = String(snapshot.score);
    host.dataset.pennants = String(snapshot.pennantsCrossed);
    host.dataset.ended = String(snapshot.ended);
    host.dataset.screen = navigation.screen;
    host.dataset.seed = seed;
    host.dataset.difficulty = difficulty;
    host.dataset.paused = String(loop.paused);
    host.dataset.zoom = String(renderer.framing.zoom);
    for (const item of snapshot.physics.cargo) {
      const icon = app.querySelector<HTMLElement>('[data-cargo="' + item.id + '"]')!;
      icon.className = 'cargo-icon ' + item.state;
      icon.dataset.state = item.state;
      icon.setAttribute('aria-label', item.label + (item.state === 'lost' ? ': perdido' : ': en la mudanza'));
    }
    if (snapshot.time >= noticeUntil) notice.hidden = true;
  }

  function buttons(): string {
    return navigation.options.map((option, index) => `<button class="menu-option${index === navigation.selected ? ' selected' : ''}"
      data-menu-index="${index}"${option.disabled ? ' disabled' : ''}>
      <span class="selection-arrow" aria-hidden="true">${index === navigation.selected ? '►' : ''}</span>${option.label}
      ${option.detail ? '<small>' + option.detail + '</small>' : ''}</button>`).join('');
  }

  function showOverlay(): void {
    overlay.hidden = navigation.screen === 'running';
    pauseButton.hidden = !overlay.hidden;
    host.dataset.screen = navigation.screen;
    if (overlay.hidden) { overlay.replaceChildren(); host.focus(); return; }
    const snapshot = run.snapshot();
    let content: string;
    if (navigation.screen === 'results') {
      const result = snapshot.result!;
      const lastLoss = result.lastLoss.map(id => CARGO.find(item => item.id === id)!.label).join(', ');
      content = `<p class="eyebrow">Parte de servicio · Carrera Infinita</p>
        <h1>La mudanza<br>queda por el camino.</h1>
        <p class="result-score">${result.score.toLocaleString('es-ES')} <span>puntos</span></p>
        <dl class="result-details"><div><dt>Banderines</dt><dd>${result.pennantsCrossed}</dd></div>
          <div><dt>Tiempo</dt><dd>${formatRunTime(result.time)}</dd></div>
          <div><dt>Dificultad</dt><dd>${DIFFICULTY_LABELS[result.difficulty]}</dd></div></dl>
        <p class="last-loss">Última parada: ${lastLoss || 'la carga'}.</p>`;
    } else if (navigation.screen === 'confirm') {
      content = `<p class="eyebrow">Un momento, por favor</p><h1>${navigation.confirmation === 'restart' ? '¿Repetimos<br>el recorrido?' : '¿Volvemos<br>a la portada?'}</h1>
        <p>${navigation.confirmation === 'restart' ? 'La mudanza empieza de nuevo en la misma ruta.' : 'Esta mudanza termina aquí.'}</p>`;
    } else {
      content = `<p class="eyebrow">Descanso del servicio</p><h1>En pausa.</h1>
        ${helpReset ? '<p role="status">Los controles volverán al continuar.</p>' : ''}`;
    }
    overlay.innerHTML = `<section class="menu-card overlay-card" role="dialog" aria-modal="true"
      aria-label="${navigation.screen === 'results' ? 'Resultados' : navigation.screen === 'confirm' ? 'Confirmación' : 'Pausa'}">
      ${content}<nav class="menu-options" aria-label="Opciones">${buttons()}</nav></section>`;
    for (const button of overlay.querySelectorAll<HTMLButtonElement>('[data-menu-index]')) {
      button.addEventListener('click', () => {
        apply(navigation.select(Number(button.dataset.menuIndex)));
      });
    }
    overlay.querySelector<HTMLButtonElement>('.selected')?.focus();
  }

  function apply(effect?: NavigationEffect): void {
    if (effect?.type === 'exit') { onExit(); return; }
    if (effect?.type === 'reset-help') { help.reset(); helpReset = true; }
    if (effect?.type === 'restart') {
      const next = new EndlessRun(tuning, difficulty, seed);
      run.dispose(); run = next;
      help.reset(); lost.clear(); pendingLoss.clear();
      lossDeadline = 0; noticeUntil = 0; notice.hidden = true; helpReset = false;
    }
    if (effect?.type === 'resume') helpReset = false;
    loop.paused = navigation.paused;
    clearControls(); lastHud = -1;
    showOverlay(); render();
  }

  function observeLoss(snapshot: EndlessSnapshot): void {
    for (const item of snapshot.physics.cargo) {
      if (item.state === 'lost' && !lost.has(item.id)) {
        lost.add(item.id); pendingLoss.add(item.id);
        lastHud = -1;
        if (!lossDeadline) lossDeadline = snapshot.time + LOSS_GROUP_SECONDS;
      }
    }
    if (pendingLoss.size && (snapshot.time >= lossDeadline || snapshot.ended)) {
      const labels = [...pendingLoss].map(id => CARGO.find(item => item.id === id)!.label.toLowerCase()).join(', ');
      const messages = pendingLoss.size > 1
        ? ['La mudanza está tomando varios caminos.', 'Servicio de reparto… demasiado repartido.']
        : ['¿Mi ' + labels + ' también se muda por su cuenta?', 'Don Tortuga: parada para ' + labels + '.'];
      notice.textContent = messages[noticeIndex++ % messages.length];
      notice.hidden = false; noticeUntil = snapshot.time + LOSS_NOTICE_SECONDS;
      pendingLoss.clear(); lossDeadline = 0;
    }
  }

  function step(): void {
    if (navigation.screen !== 'running') return;
    run.step(input.read());
    const snapshot = run.snapshot();
    observeLoss(snapshot);
    if (snapshot.ended) {
      navigation.finishRun(); loop.paused = true;
      clearControls(); lastHud = -1; showOverlay();
      return;
    }
    help.update(1 / tuning.physicsHz, { inWater: snapshot.physics.turtle.biome === 'water' });
  }

  const keys = (event: KeyboardEvent): void => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.code === 'Escape') {
      event.preventDefault(); apply(navigation.escape()); return;
    }
    if (navigation.screen === 'running') return;
    if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(event.code)) {
      event.preventDefault(); navigation.move(event.code === 'ArrowDown' || event.code === 'ArrowRight' ? 1 : -1);
      showOverlay();
    } else if (event.code === 'Enter') { event.preventDefault(); apply(navigation.confirm()); }
  };
  const autoPause = (): void => { if (navigation.screen === 'running') apply(navigation.pause()); };
  const visibility = (): void => { if (document.hidden) autoPause(); };
  pauseButton.addEventListener('click', autoPause);
  window.addEventListener('keydown', keys);
  window.addEventListener('blur', autoPause);
  document.addEventListener('visibilitychange', visibility);
  function frame(now: number): void {
    if (disposed) return;
    const elapsed = Math.max(0, (now - lastFrame) / 1000); lastFrame = now;
    loop.advance(elapsed, step);
    render(); raf = requestAnimationFrame(frame);
  }
  help.update(0, { inWater: false });
  pauseButton.disabled = false;
  render(); host.focus();
  raf = requestAnimationFrame(frame);
  return () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    window.removeEventListener('keydown', keys);
    window.removeEventListener('blur', autoPause);
    document.removeEventListener('visibilitychange', visibility);
    input.dispose(); run.dispose(); renderer.dispose();
  };
}
