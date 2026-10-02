import './styles/main.css';
import { createTuning, TUNING_FIELDS } from './game/config/tuning';
import { FixedLoop } from './game/core/fixedLoop';
import { KeyboardInput } from './game/core/input';
import { SCENARIOS } from './game/content/scenarios';
import { PlaygroundRenderer } from './rendering/playgroundRenderer';
import type { PhysicsSimulation, LoadPreset } from './game/physics/simulation';

const app = document.querySelector<HTMLElement>('#app')!;
let cleanup: (() => void) | undefined;
let routeVersion = 0;
function showMenu(): void {
  routeVersion++; cleanup?.(); cleanup = undefined;
  history.replaceState(null, '', location.pathname);
  app.innerHTML = `<section class="title-screen">
    <div class="company-mark" aria-hidden="true">🐢</div>
    <p class="eyebrow">Servicio de mudanzas del bosque</p>
    <h1>MUDANZAS<br>TORTUGA, S.L.</h1>
    <p class="tagline">Con la casa a cuestas.</p>
    <p class="prototype-note">Estamos preparando nuestra primera ruta.</p>
    <span class="status-pill">Prototipo de físicas · 0.1</span>
  </section>`;
}
async function showPlayground(): Promise<void> {
  const version = ++routeVersion;
  cleanup?.(); cleanup = undefined;
  history.replaceState(null, '', location.pathname + '?mode=physics');
  app.innerHTML = `<div class="playground">
    <header class="toolbar"><div><strong>🐢 MUDANZAS TORTUGA, S.L.</strong><span>Physics playground · 60 Hz</span></div>
      <nav aria-label="Herramientas"><button id="reset">Reiniciar <kbd>R</kbd></button>
      <button id="pause">Pausa <kbd>Esc</kbd></button><button id="step" disabled>Un paso <kbd>N</kbd></button>
      <button id="debug" aria-pressed="true">Colliders <kbd>D</kbd></button><button id="menu">Portada</button></nav></header>
    <section class="workbench">
      <div class="stage-column"><div class="status-bar"><output id="metrics" aria-label="Estado de simulación"></output>
        <div id="cargo-status" aria-label="Carga retenida"></div></div>
        <div id="canvas-host" tabindex="0" aria-label="Zona de prueba de físicas"></div>
        <p class="control-strip"><kbd>←</kbd><kbd>→</kbd> velocidad · <kbd>↑</kbd><kbd>↓</kbd> caparazón / nadar · <span id="pause-state">En marcha</span></p>
        <p id="scenario-note" class="scenario-note"></p>
      </div>
      <aside class="tuning-panel"><label for="scenario">Escenario</label>
        <select id="scenario">${SCENARIOS.map(s => '<option value="' + s.id + '">' + s.label + '</option>').join('')}</select>
        <label for="load">Carga inicial</label><select id="load"><option value="full">Mudanza completa</option><option value="light">Solo sofá · comparación de peso</option></select>
        <details open><summary>Parámetros de prueba</summary><p class="hint">Cambiar un valor reinicia el tramo. La pausa se conserva.</p>
        <div class="fields">${TUNING_FIELDS.map(f => '<label class="tuning-field">' + f.label +
          '<input type="number" data-tuning="' + f.key + '" min="' + f.min + '" max="' + f.max + '" step="' + f.step + '"></label>').join('')}</div>
        <button id="baseline">Restaurar valores base</button></details>
        <details><summary>Qué estamos probando</summary><p>La carga se conecta al caparazón por contactos. Un rebote breve se puede recuperar; una pérdida definitiva queda fuera de la mudanza.</p>
        <p>En el agua, más peso permite bajar y aprovechar una corriente más fuerte. Don Tortuga sigue siempre hacia la derecha.</p></details>
        <p class="hint">Los tramos son diagnósticos, sin puntuación ni niveles reales.</p>
      </aside>
    </section>
  </div>`;
  const tuning = createTuning();
  const host = document.querySelector<HTMLElement>('#canvas-host')!;
  const { PhysicsSimulation } = await import('./game/physics/simulation');
  if (version !== routeVersion) return;
  const renderer = await PlaygroundRenderer.create(host, tuning);
  if (version !== routeVersion) { renderer.dispose(); return; }
  const input = new KeyboardInput();
  const loop = new FixedLoop(1 / tuning.physicsHz, tuning.maxFrameSeconds, tuning.maxStepsPerFrame);
  let scenario = SCENARIOS[0];
  let load: LoadPreset = 'full';
  let simulation: PhysicsSimulation;
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
    renderer.render(snapshot, debug ? simulation.debugVertices() : undefined);
    if (performance.now() - lastReadout < 100) return;
    lastReadout = performance.now();
    metrics.value = snapshot.turtle.biome + ' · ' + snapshot.turtle.speed.toFixed(2) + ' m/s · ' +
      (snapshot.turtle.angle * 180 / Math.PI).toFixed(1) + '° · ' + snapshot.turtle.mass.toFixed(1) + ' kg · ' +
      snapshot.time.toFixed(2) + ' s · ' + Math.round(fps) + ' FPS';
    metrics.dataset.tick = String(snapshot.tick);
    metrics.dataset.time = String(snapshot.time);
    metrics.dataset.x = String(snapshot.turtle.x);
    metrics.dataset.y = String(snapshot.turtle.y);
    metrics.dataset.angle = String(snapshot.turtle.angle);
    metrics.dataset.mass = String(snapshot.turtle.mass);
    metrics.dataset.biome = snapshot.turtle.biome;
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
  }
  function reset(): void {
    const next = new PhysicsSimulation(scenario, tuning, load);
    simulation?.dispose(); simulation = next;
    loop.reset(); input.clear(); lastFrame = performance.now(); lastReadout = -1;
    renderer.setScenario(scenario); note.textContent = scenario.description;
    render();
  }
  function pause(value = !loop.paused): void {
    loop.paused = value; loop.reset(); input.clear(); lastFrame = performance.now(); lastReadout = -1;
    pauseButton.innerHTML = value ? 'Continuar <kbd>Esc</kbd>' : 'Pausa <kbd>Esc</kbd>';
    stepButton.disabled = !value; render();
  }
  function singleStep(): void { loop.singleStep(() => simulation.step()); lastReadout = -1; render(); }
  function toggleDebug(): void {
    debug = !debug;
    document.querySelector('#debug')!.setAttribute('aria-pressed', String(debug)); render();
  }
  const keys = (event: KeyboardEvent) => {
    if (event.repeat || event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
    if (event.key === 'Escape') { event.preventDefault(); pause(); }
    if (event.key.toLowerCase() === 'r') reset();
    if (event.key.toLowerCase() === 'n') singleStep();
    if (event.key.toLowerCase() === 'd') toggleDebug();
  };
  const visibility = () => { if (document.hidden) pause(true); };
  document.querySelector('#reset')!.addEventListener('click', reset);
  pauseButton.addEventListener('click', () => pause());
  stepButton.addEventListener('click', singleStep);
  document.querySelector('#debug')!.addEventListener('click', toggleDebug);
  document.querySelector('#menu')!.addEventListener('click', showMenu);
  document.querySelector<HTMLSelectElement>('#scenario')!.addEventListener('change', event => {
    scenario = SCENARIOS.find(s => s.id === (event.target as HTMLSelectElement).value)!; reset(); host.focus();
  });
  document.querySelector<HTMLSelectElement>('#load')!.addEventListener('change', event => {
    load = (event.target as HTMLSelectElement).value as LoadPreset; reset(); host.focus();
  });
  for (const field of document.querySelectorAll<HTMLInputElement>('[data-tuning]')) {
    const applyField = () => {
      const definition = TUNING_FIELDS.find(f => f.key === field.dataset.tuning)!;
      const value = field.valueAsNumber;
      if (!field.checkValidity() || !Number.isFinite(value)) { updateFields(); return; }
      if (tuning[definition.key] === value) return;
      tuning[definition.key] = value; reset();
    };
    field.addEventListener('change', applyField);
    field.addEventListener('blur', applyField);
  }
  document.querySelector('#baseline')!.addEventListener('click', () => {
    Object.assign(tuning, createTuning()); updateFields(); reset();
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
    loop.advance(elapsed, () => simulation.step(input.read()));
    render(); raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  host.focus();
}
function reportError(error: unknown): void {
  cleanup?.(); cleanup = undefined;
  console.error(error);
  app.innerHTML = '<section class="error"><h1>No hemos podido preparar la mudanza.</h1><p>Recarga la página para volver a intentarlo.</p><pre></pre></section>';
  app.querySelector('pre')!.textContent = error instanceof Error ? error.message : String(error);
}
window.addEventListener('keydown', event => {
  if (event.shiftKey && event.key.toLowerCase() === 'p' && !location.search.includes('mode=physics')) {
    event.preventDefault(); void showPlayground().catch(reportError);
  }
});
if (new URLSearchParams(location.search).get('mode') === 'physics') void showPlayground().catch(reportError);
else showMenu();
