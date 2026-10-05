import './styles/main.css';
import { getJamServices } from './app/services';
import { createTuning, exportSettings, TUNING_FIELDS, withTuning } from './game/config/tuning';
import type { Tuning } from './game/config/tuning';
import { createLevelCameraFraming } from './game/config/cameraFraming';
import { FixedLoop } from './game/core/fixedLoop';
import { isInteractiveTarget, KeyboardInput } from './game/core/input';
import { SCENARIOS } from './game/content/scenarios';
import { ContextualHelp } from './game/systems/contextualHelp';
import { PlaygroundRenderer } from './rendering/playgroundRenderer';
import type { PhysicsSimulation, LoadPreset } from './game/physics/simulation';
import { GameNavigation } from './app/navigation';
import type { NavigationEffect } from './app/navigation';
import { publicAsset } from './utils/publicAsset';
import { VISUALS } from './rendering/visualDefinitions';
import type { Difficulty } from './game/config/endless';

const app = document.querySelector<HTMLElement>('#app')!;
let cleanup: (() => void) | undefined;
let routeVersion = 0;
let activeRoute: 'menus' | 'playground' | 'endless' = 'menus';
function showMenu(): void {
  routeVersion++; cleanup?.(); cleanup = undefined;
  activeRoute = 'menus';
  history.replaceState(null, '', location.pathname);
  const navigation = new GameNavigation();
  function draw(): void {
    const title = navigation.screen === 'title';
    const credits = navigation.screen === 'credits';
    const heading = title ? 'MUDANZAS<br>TORTUGA, S.L.' : credits ? 'Créditos'
      : navigation.screen === 'mode' ? 'Elige tu<br>mudanza.' : '¿Cómo viene<br>el camino?';
    const buttons = navigation.options.map((option, index) => `<button class="menu-option${option.secondary ? ' secondary' : ''}${index === navigation.selected ? ' selected' : ''}"
      data-menu-index="${index}"${option.disabled ? ' disabled' : ''}><span class="selection-arrow" aria-hidden="true">${index === navigation.selected ? '►' : ''}</span>
      ${option.id === 'laboratory' ? '<img class="menu-gear" src="' + publicAsset('sprites/ui/laboratory.svg') + '" alt="" aria-hidden="true">' : ''}${option.label}${option.detail ? '<small>' + option.detail + '</small>' : ''}</button>`).join('');
    app.innerHTML = `<section class="title-screen${title ? '' : ' selection-screen'}" data-screen="${navigation.screen}">
      <div class="menu-card">
        <p class="eyebrow">Servicio de mudanzas del bosque</p><h1>${heading}</h1>
        ${title ? `<div class="title-cargo" aria-hidden="true">
          <img class="title-turtle" src="${publicAsset(VISUALS.turtle.frames[0])}" alt="">
          <img class="title-shell" src="${publicAsset(VISUALS.shell.path)}" alt="">
          <img class="title-sofa" src="${publicAsset(VISUALS.sofa.path)}" alt="">
          <img class="title-tv" src="${publicAsset(VISUALS.television.path)}" alt="">
          <img class="title-lamp" src="${publicAsset(VISUALS.floorLamp.path)}" alt="">
          <img class="title-glass" src="${publicAsset(VISUALS.cocktailGlass.path)}" alt="">
          </div><p class="tagline">Con la casa a cuestas.</p>` : ''}
        ${credits ? `<div class="credits-copy"><p>Dedicado a <a href="https://www.artstation.com/argorias" target="_blank" rel="noopener noreferrer">Argorias Svartha</a>, que me ha acompañado en los momentos más oscuros de mi vida. A mi madre, que me ha apoyado incondicionalmente incluso sin entender lo que hacía. Y a todos los agentes de inteligencia artificial que han ejecutado bucles interminables de pruebas y han tenido la paciencia infinita para lidiar con mis cambios de diseño de última hora durante toda la game jam.</p><p class="credits-signature">— Mike Fieldins</p></div>` : ''}
        <nav class="menu-options" aria-label="${navigation.screen === 'difficulty' ? 'Dificultad' : 'Opciones'}">${buttons}</nav>
        <p class="menu-key-hint"><kbd>↑</kbd><kbd>↓</kbd> elegir · <kbd>Enter</kbd> confirmar${title ? '' : ' · <kbd>Esc</kbd> volver'}</p>
        ${credits ? '<footer class="credits-copyright">Copyright © 2026 Mike Fieldins &amp; Argorias Svartha</footer>' : ''}
      </div>
    </section>`;
    for (const button of app.querySelectorAll<HTMLButtonElement>('[data-menu-index]')) {
      button.addEventListener('click', () => {
        activate(navigation.select(Number(button.dataset.menuIndex)));
      });
    }
    app.querySelector<HTMLButtonElement>('.selected')?.focus();
  }
  function activate(effect?: NavigationEffect): void {
    if (effect?.type === 'start') void showEndless(effect.difficulty).catch(reportError);
    else if (effect?.type === 'laboratory') void showPlayground().catch(reportError);
    else draw();
  }
  const keys = (event: KeyboardEvent): void => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.code === 'Enter' && event.target instanceof HTMLAnchorElement) return;
    if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(event.code)) {
      event.preventDefault(); navigation.move(event.code === 'ArrowDown' || event.code === 'ArrowRight' ? 1 : -1); draw();
    } else if (event.code === 'Enter') {
      event.preventDefault(); activate(navigation.confirm());
    } else if (event.code === 'Escape') { event.preventDefault(); navigation.escape(); draw(); }
  };
  window.addEventListener('keydown', keys);
  cleanup = () => window.removeEventListener('keydown', keys);
  draw();
}
async function showEndless(difficulty: Difficulty): Promise<void> {
  const version = ++routeVersion;
  cleanup?.(); cleanup = undefined; activeRoute = 'endless';
  app.innerHTML = '<section class="title-screen"><p class="eyebrow">Su hogar está en buenas patas.</p><h1>Preparando<br>la mudanza…</h1></section>';
  const { mountEndlessGame } = await import('./app/endlessGame');
  if (version !== routeVersion) return;
  const dispose = await mountEndlessGame(app, difficulty, showMenu);
  if (version !== routeVersion) { dispose(); return; }
  cleanup = dispose;
}
async function showPlayground(): Promise<void> {
  const version = ++routeVersion;
  cleanup?.(); cleanup = undefined;
  activeRoute = 'playground';
  history.replaceState(null, '', location.pathname + '?mode=physics');
  let tuning = createTuning();
  app.innerHTML = `<div class="playground">
    <header class="toolbar"><div><strong>🐢 MUDANZAS TORTUGA, S.L.</strong><span>Physics playground · 60 Hz</span></div>
      <nav aria-label="Herramientas"><button id="reset">Reiniciar <kbd>R</kbd></button>
      <button id="pause">Pausa <kbd>Esc</kbd></button><button id="step" disabled>Un paso <kbd>N</kbd></button>
      <button id="debug" aria-pressed="true">Colliders <kbd>C</kbd></button><button id="menu">Portada</button></nav></header>
    <section class="workbench">
      <div class="stage-column"><div class="status-bar"><output id="metrics" aria-label="Estado de simulación"></output>
        <div id="cargo-status" aria-label="Carga retenida"></div></div>
        <div id="canvas-host" tabindex="0" aria-label="Zona de prueba de físicas"></div>
        <p class="control-strip"><kbd>←/A</kbd><kbd>→/D</kbd> velocidad · <kbd>↑/W</kbd><kbd>↓/S</kbd> equilibrar caparazón, también en agua · <kbd>Espacio</kbd> mantener y soltar para saltar en seco; mantener para subir más rápido en agua · <span id="pause-state">En marcha</span></p>
        <p id="scenario-note" class="scenario-note"></p>
      </div>
      <aside class="tuning-panel"><label for="scenario">Escenario</label>
        <select id="scenario">${SCENARIOS.map(s => '<option value="' + s.id + '">' + s.label + '</option>').join('')}</select>
        <label for="load">Carga inicial</label><select id="load"><option value="full">Mudanza completa</option><option value="light">Solo sofá · comparación de peso</option><option value="empty">Sin carga · flotabilidad</option></select>
        <label class="help-preview"><input id="help-preview" type="checkbox"> Previsualizar ayudas</label>
        <details open><summary>Parámetros de prueba</summary><p class="hint">Cambiar un valor reinicia el tramo. La pausa se conserva. Los márgenes se miden en % desde la izquierda de esta escena, cuya escala es fija. La zona muerta reserva ese porcentaje a cada lado en un nivel normal.</p>
        <div class="fields">${TUNING_FIELDS.map(f => '<label class="tuning-field">' + f.label +
          '<input type="number" data-tuning="' + f.key + '" min="' + f.min + '" max="' + f.max + '" step="' + f.step + '"></label>').join('')}</div>
        <p id="tuning-error" class="tuning-error" role="status" hidden></p>
        <div class="camera-preview" aria-label="Composición prevista para un nivel normal">
          <p class="hint">Encuadre de nivel · vista orientativa</p>
          <div class="camera-preview-bar" aria-hidden="true"><span id="camera-rear-zone"></span><span id="camera-movement-zone"></span><span id="camera-front-zone"></span></div>
          <output id="camera-framing" class="hint"></output>
        </div>
        <button id="baseline">Restaurar settings</button><button id="export-settings">Exportar settings</button>
        <p class="hint">Para guardar los ajustes, reemplaza settings.txt en el repositorio con el archivo exportado y reconstruye el build.</p></details>
        <details><summary>Qué estamos probando</summary><p>La carga se conecta al caparazón por contactos. Un rebote breve se puede recuperar; una pérdida definitiva queda fuera de la mudanza.</p>
        <p>↑/W y ↓/S equilibran el caparazón tanto en seco como en agua. Carga Espacio en terreno seco y suéltalo para saltar.</p>
        <p>La carga conservada y la inercia de entrada determinan la profundidad en el agua. Mantén Espacio para subir más rápido. A mayor profundidad, la corriente ayuda más a avanzar. Ante un obstáculo, la cámara espera en el margen trasero hasta que puedas avanzar saltando.</p></details>
        <p class="hint">Los tramos son diagnósticos, sin puntuación ni niveles reales. Aquí la escala es fija. Cada nivel normal calculará su zoom al cargar y lo mantendrá durante el recorrido.</p>
      </aside>
    </section>
  </div>`;
  const host = document.querySelector<HTMLElement>('#canvas-host')!;
  const { PhysicsSimulation } = await import('./game/physics/simulation');
  if (version !== routeVersion) return;
  const renderer = await PlaygroundRenderer.create(host, tuning);
  if (version !== routeVersion) { renderer.dispose(); return; }
  let simulation: PhysicsSimulation;
  const input = new KeyboardInput(window, () => simulation?.cancelJump());
  const loop = new FixedLoop(1 / tuning.physicsHz, tuning.maxFrameSeconds, tuning.maxStepsPerFrame);
  const help = new ContextualHelp();
  const helpPreview = document.querySelector<HTMLInputElement>('#help-preview')!;
  const tuningError = document.querySelector<HTMLElement>('#tuning-error')!;
  let scenario = SCENARIOS[0];
  let load: LoadPreset = 'full';
  let debug = true;
  let raf = 0;
  let lastFrame = performance.now();
  let lastReadout = -1;
  let fps = 60;
  const pauseButton = document.querySelector<HTMLButtonElement>('#pause')!;
  const stepButton = document.querySelector<HTMLButtonElement>('#step')!;
  const metrics = document.querySelector<HTMLOutputElement>('#metrics')!;
  const cargoStatus = document.querySelector<HTMLElement>('#cargo-status')!;
  const pausedState = document.querySelector<HTMLElement>('#pause-state')!;
  const note = document.querySelector<HTMLElement>('#scenario-note')!;
  function render(): void {
    const snapshot = simulation.snapshot();
    const message = helpPreview.checked ? help.active : undefined;
    renderer.render(snapshot, debug ? simulation.debugVertices() : undefined,
      message ? message.keys + ' · ' + message.text : undefined);
    if (performance.now() - lastReadout < 100) return;
    lastReadout = performance.now();
    metrics.value = snapshot.turtle.biome + ' · ' + snapshot.turtle.speed.toFixed(2) + ' m/s · ' +
      'caparazón ' + (snapshot.turtle.angle * 180 / Math.PI).toFixed(1) + '° · suelo ' +
      (snapshot.turtle.bodyAngle * 180 / Math.PI).toFixed(1) + '° · ' + snapshot.turtle.mass.toFixed(1) + ' kg · ' +
      snapshot.time.toFixed(2) + ' s · ' + Math.round(fps) + ' FPS' +
      (snapshot.cameraBlocked ? ' · cámara esperando' : '');
    metrics.dataset.tick = String(snapshot.tick);
    metrics.dataset.time = String(snapshot.time);
    metrics.dataset.x = String(snapshot.turtle.x);
    metrics.dataset.y = String(snapshot.turtle.y);
    metrics.dataset.angle = String(snapshot.turtle.angle);
    metrics.dataset.bodyAngle = String(snapshot.turtle.bodyAngle);
    metrics.dataset.mass = String(snapshot.turtle.mass);
    metrics.dataset.biome = snapshot.turtle.biome;
    metrics.dataset.jumpCharging = String(snapshot.turtle.jumpCharging);
    metrics.dataset.help = message?.id ?? '';
    metrics.dataset.cameraX = String(snapshot.cameraX);
    metrics.dataset.cameraSpeed = String(snapshot.cameraSpeed);
    metrics.dataset.cameraBlocked = String(snapshot.cameraBlocked);
    metrics.dataset.shellY = String(snapshot.shell.y);
    cargoStatus.replaceChildren(...snapshot.cargo.map(c => {
      const label = document.createElement('span');
      label.className = 'cargo-chip ' + c.state;
      label.textContent = (c.state === 'lost' ? '✕ ' : c.state === 'separated' ? '↝ ' : '✓ ') + c.label;
      label.dataset.id = c.id; label.dataset.state = c.state;
      label.title = c.state + ' · grace ' + c.separatedSeconds.toFixed(2) + ' s';
      return label;
    }));
    pausedState.textContent = snapshot.turtle.x >= scenario.endX ? 'Fin del tramo · reinicia para repetir' :
      loop.paused ? 'En pausa' : 'En marcha';
  }
  function updateFields(): void {
    for (const field of document.querySelectorAll<HTMLInputElement>('[data-tuning]')) {
      const key = TUNING_FIELDS.find(f => f.key === field.dataset.tuning)!.key;
      field.value = String(tuning[key]);
    }
    const framing = createLevelCameraFraming(tuning);
    const percent = tuning.cameraDeadZonePercent;
    document.querySelector<HTMLElement>('#camera-rear-zone')!.style.width = percent + '%';
    document.querySelector<HTMLElement>('#camera-front-zone')!.style.width = percent + '%';
    document.querySelector<HTMLElement>('#camera-movement-zone')!.style.width = (100 - 2 * percent) + '%';
    document.querySelector<HTMLOutputElement>('#camera-framing')!.value =
      percent + '% detrás y delante · ventana ' + (tuning.cameraFront - tuning.cameraBack).toFixed(2) +
      ' m · campo visible ' + framing.visibleMetres.toFixed(2) + ' m';
  }
  function reset(nextTuning: Tuning = tuning): void {
    const next = new PhysicsSimulation(scenario, nextTuning, load);
    simulation?.dispose(); simulation = next; tuning = nextTuning;
    loop.reset(); input.clear(); help.reset(); lastFrame = performance.now(); lastReadout = -1;
    renderer.configure(tuning); renderer.setScenario(scenario); note.textContent = scenario.description;
    render();
  }
  function pause(value = !loop.paused): void {
    loop.paused = value; loop.reset(); input.clear(); simulation.cancelJump(); lastFrame = performance.now(); lastReadout = -1;
    pauseButton.innerHTML = value ? 'Continuar <kbd>Esc</kbd>' : 'Pausa <kbd>Esc</kbd>';
    stepButton.disabled = !value; render();
  }
  function advanceSimulation(useInput: boolean): void {
    const before = simulation.snapshot().tick;
    simulation.step(useInput ? input.read() : undefined);
    if (helpPreview.checked && simulation.snapshot().tick !== before) {
      help.update(1 / tuning.physicsHz, { inWater: simulation.snapshot().turtle.biome === 'water', paused: loop.paused });
    }
  }
  function singleStep(): void { loop.singleStep(() => advanceSimulation(false)); lastReadout = -1; render(); }
  function toggleDebug(): void {
    debug = !debug;
    document.querySelector('#debug')!.setAttribute('aria-pressed', String(debug)); render();
  }
  const keys = (event: KeyboardEvent) => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || isInteractiveTarget(event.target)) return;
    if (event.code === 'Escape') { event.preventDefault(); pause(); }
    if (event.code === 'KeyR') reset();
    if (event.code === 'KeyN') singleStep();
    if (event.code === 'KeyC') toggleDebug();
  };
  const visibility = () => { if (document.hidden) pause(true); };
  document.querySelector('#reset')!.addEventListener('click', () => { reset(); host.focus(); });
  pauseButton.addEventListener('click', () => { pause(); host.focus(); });
  stepButton.addEventListener('click', () => { singleStep(); host.focus(); });
  document.querySelector('#debug')!.addEventListener('click', () => { toggleDebug(); host.focus(); });
  document.querySelector('#menu')!.addEventListener('click', showMenu);
  document.querySelector<HTMLSelectElement>('#scenario')!.addEventListener('change', event => {
    scenario = SCENARIOS.find(s => s.id === (event.target as HTMLSelectElement).value)!; reset(); host.focus();
  });
  document.querySelector<HTMLSelectElement>('#load')!.addEventListener('change', event => {
    load = (event.target as HTMLSelectElement).value as LoadPreset; reset(); host.focus();
  });
  helpPreview.addEventListener('change', () => { help.reset(); input.clear(); simulation.cancelJump(); render(); host.focus(); });
  for (const field of document.querySelectorAll<HTMLInputElement>('[data-tuning]')) {
    const applyField = () => {
      const definition = TUNING_FIELDS.find(f => f.key === field.dataset.tuning)!;
      const value = field.valueAsNumber;
      // Spinner increments are a convenience; the schema accepts finer decimals.
      if (!Number.isFinite(value)) { updateFields(); return; }
      if (tuning[definition.key] === value) return;
      try {
        const candidate = withTuning(tuning, { [definition.key]: value });
        reset(candidate); tuningError.hidden = true;
      } catch (error) {
        tuningError.textContent = error instanceof Error ? error.message : String(error);
        tuningError.hidden = false;
      }
      updateFields();
    };
    field.addEventListener('change', applyField);
    field.addEventListener('blur', applyField);
  }
  document.querySelector('#baseline')!.addEventListener('click', () => {
    reset(createTuning()); updateFields(); tuningError.hidden = true; host.focus();
  });
  document.querySelector('#export-settings')!.addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([exportSettings(tuning)], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'settings.txt';
    document.body.append(link); link.click(); link.remove();
    // Give the browser its navigation task before releasing the Blob URL.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000); host.focus();
  });
  cleanup = () => {
    cancelAnimationFrame(raf); window.removeEventListener('keydown', keys);
    document.removeEventListener('visibilitychange', visibility);
    input.dispose(); simulation?.dispose(); renderer.dispose();
  };
  updateFields(); reset();
  window.addEventListener('keydown', keys);
  document.addEventListener('visibilitychange', visibility);
  function frame(now: number): void {
    const elapsed = Math.max(0, (now - lastFrame) / 1000); lastFrame = now;
    if (elapsed > 0) fps = fps * 0.95 + (1 / elapsed) * 0.05;
    loop.advance(elapsed, () => advanceSimulation(true));
    render(); raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  host.focus();
}
function reportError(error: unknown): void {
  cleanup?.(); cleanup = undefined;
  console.error(error);
  app.innerHTML = '<section class="error"><h1>No hemos podido preparar la mudanza.</h1><p>Revisa settings.txt o recarga la página para volver a intentarlo.</p><pre></pre></section>';
  app.querySelector('pre')!.textContent = error instanceof Error ? error.message : String(error);
}
window.addEventListener('keydown', event => {
  if (event.shiftKey && event.code === 'KeyP' && activeRoute === 'menus' && app.querySelector('[data-screen="title"]')) {
    event.preventDefault(); void showPlayground().catch(reportError);
  }
});
async function startApplication(): Promise<void> {
  const services = getJamServices();
  // Validate/read the packaged public catalog without requiring sign-in.
  await services.levels.listPublishedLevels();
  await services.session.getSession();
  if (new URLSearchParams(location.search).get('mode') === 'physics') await showPlayground();
  else showMenu();
}
void startApplication().catch(reportError);
