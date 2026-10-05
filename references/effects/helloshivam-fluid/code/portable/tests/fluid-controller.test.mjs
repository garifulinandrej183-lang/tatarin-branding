import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { projectRoot } from '../scripts/project.mjs';
import { FluidRenderer } from '../src/fluid/renderer.js';

const source = (await readFile(join(projectRoot, 'src/fluid/controller.js'), 'utf8'))
  .replace("import { FluidRenderer } from './renderer.js';", '')
  .replace('export function createFluidHero', 'function createFluidHero');

function harness({ reduced = false, fine = false, rendererFails = false, hintAvailable = true, sceneReady = true, introSeen = true, storageError = '' } = {}) {
  const rafs = new Map();
  const timers = new Map();
  let nextTimer = 1;
  let nextRaf = 1;
  const renderers = [];
  const sessionValues = new Map();
  if (introSeen) sessionValues.set('tatarin.fluid-intro.seen', '1');
  let currentStorageError = storageError;
  const sessionStorage = {
    getItem(key) { if (currentStorageError === 'read' || currentStorageError === 'access') throw new Error('storage read denied'); return sessionValues.get(key) ?? null; },
    setItem(key, value) { if (currentStorageError === 'write' || currentStorageError === 'access') throw new Error('storage write denied'); sessionValues.set(key, String(value)); },
  };
  let failNextRenderer = rendererFails;
  const listeners = new Map();
  class Target {
    addEventListener(type, callback) {
      const items = listeners.get(this) ?? new Map();
      const callbacks = items.get(type) ?? [];
      callbacks.push(callback);
      items.set(type, callbacks);
      listeners.set(this, items);
    }
    dispatch(type, event = {}) {
      for (const callback of listeners.get(this)?.get(type) ?? []) callback({ target: this, preventDefault() {}, ...event });
    }
  }
  class FakeRenderer {
    constructor(canvas, options) {
      if (failNextRenderer) { failNextRenderer = false; throw new Error('WebGL unavailable'); }
      this.aspect = 1;
      this.scene = { ready: sceneReady };
      this.options = options;
      this.calls = { resize: 0, seed: 0, paint: 0, step: 0, splat: 0, burst: 0, reset: 0, destroy: 0 };
      this.splats = [];
      this.paintTimes = [];
      renderers.push(this);
    }
    resize() { this.calls.resize++; return true; }
    seed() { this.calls.seed++; }
    paint(time) { this.calls.paint++; this.paintTimes.push(time); }
    reset() { this.calls.reset++; }
    burst() { this.calls.burst++; this.paint(undefined, { burst: true }); }
    step() { this.calls.step++; }
    splat(...args) { this.calls.splat++; this.splats.push(args); }
    destroy() { this.calls.destroy++; }
  }
  const media = query => {
    const state = { matches: query.includes('reduced') ? reduced : fine, callbacks: [] };
    state.addEventListener = (_, cb) => state.callbacks.push(cb);
    state.change = value => { state.matches = value; for (const cb of state.callbacks) cb(); };
    return state;
  };
  const reducedMedia = media('reduced');
  const fineMedia = media('fine');
  class Observer {
    constructor(callback) { this.callback = callback; Observer.instances.push(this); }
    observe() {}
    disconnect() {}
  }
  Observer.instances = [];
  class Element extends Target {
    constructor() { super(); const classes = new Set(); this.classList = { add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name), toggle: (name, force) => { const next = force ?? !classes.has(name); if (next) classes.add(name); else classes.delete(name); return next; } }; this.attributes = {}; this.textContent = ''; this.disabled = false; }
    querySelector(selector) {
      if (selector === '.fluid-canvas') return canvas;
      if (selector === '.motion-toggle') return toggle;
      if (selector === '.interaction-hint') return hintAvailable ? hint : null;
      return null;
    }
    getBoundingClientRect() { return this.box ?? { top: 0, bottom: 200, left: 0, width: 300, height: 200 }; }
    setAttribute(key, value) { this.attributes[key] = value; }
  }
  const hero = new Element();
  const canvas = new Element();
  const toggle = new Element();
  const hint = new Element();
  hint.hidden = true;
  const document = new Target();
  document.hidden = false;
  const window = new Target();
  window.sessionStorage = sessionStorage;
  window.IntersectionObserver = Observer;
  window.ResizeObserver = Observer;
  const context = {
    FluidRenderer: FakeRenderer,
    AbortController,
    document,
    window,
    IntersectionObserver: Observer,
    ResizeObserver: Observer,
    innerHeight: 800,
    devicePixelRatio: 1,
    performance: { now: () => currentTime },
    matchMedia: query => query.includes('prefers-reduced') ? reducedMedia : fineMedia,
    cancelAnimationFrame: id => rafs.delete(id),
    requestAnimationFrame: callback => { const id = nextRaf++; rafs.set(id, callback); return id; },
    clearTimeout: id => timers.delete(id),
    setTimeout: (callback, delay) => { const id = nextTimer++; timers.set(id, { callback, at: currentTime + delay }); return id; },
    Math,
  };
  let currentTime = 100;
  const create = runInNewContext(`${source}\ncreateFluidHero`, context);
  const controller = create(hero);
  const tick = (time = currentTime + 20) => {
    currentTime = time;
    for (const [id, timer] of [...timers]) {
      if (timer.at <= time) { timers.delete(id); timer.callback(); }
    }
    const queued = [...rafs.entries()];
    rafs.clear();
    for (const [, callback] of queued) callback(time);
  };
  const flushSetup = () => tick(currentTime + 1);
  return { controller, hero, canvas, toggle, hint, document, window, reducedMedia, fineMedia, renderers, rafs, timers, tick, flushSetup, sessionValues, setStorageError(value) { currentStorageError = value; } };
}

test('first eligible visit draws a finite central curved path without pointer input and marks the tab session', () => {
  const h = harness({ fine: true, introSeen: false });
  h.flushSetup();
  assert.equal(h.renderers[0].calls.splat, 0);
  for (let time = 120; time <= 1_720; time += 20) h.tick(time);
  const splats = h.renderers[0].splats;
  assert.ok(splats.length > 40, 'the startup path should be visible over several animation frames');
  assert.ok(splats.every(values => values.slice(0, 5).every(Number.isFinite)));
  assert.ok(Math.abs(splats[0][0] - 0.15) < 0.01);
  assert.ok(Math.abs(splats.at(-1)[0] - 0.85) < 0.01);
  assert.ok(splats.every(([x, y]) => x >= 0.15 && x <= 0.85 && y >= 0.51 && y <= 0.66));
  assert.equal(h.sessionValues.get('tatarin.fluid-intro.seen'), '1');
});

test('coarse startup swipe lasts three seconds while desktop keeps the 1.5-second path', () => {
  const coarse = harness({ introSeen: false });
  coarse.flushSetup();
  const coarseRenderer = coarse.renderers[0];
  for (let time = 120; time <= 1_620; time += 20) coarse.tick(time);
  const halfwayCount = coarseRenderer.calls.splat;
  assert.ok(halfwayCount > 30, 'the coarse path should still be active at 1.5 seconds');
  assert.ok(coarseRenderer.splats.at(-1)[0] < 0.85, 'the coarse path should not have reached its endpoint yet');
  for (let time = 1_640; time <= 3_120; time += 20) coarse.tick(time);
  const completedCount = coarseRenderer.calls.splat;
  assert.ok(Math.abs(coarseRenderer.splats.at(-1)[0] - 0.85) < 0.01, 'the coarse path should reach its endpoint at about three seconds');
  for (let time = 3_140; time <= 4_000; time += 20) coarse.tick(time);
  assert.equal(coarseRenderer.calls.splat, completedCount, 'no startup splats should occur after completion');

  const desktop = harness({ fine: true, introSeen: false });
  desktop.flushSetup();
  const desktopRenderer = desktop.renderers[0];
  for (let time = 120; time <= 1_620; time += 20) desktop.tick(time);
  assert.ok(Math.abs(desktopRenderer.splats.at(-1)[0] - 0.85) < 0.01, 'desktop should retain the original 1.5-second duration');
  const desktopCount = desktopRenderer.calls.splat;
  for (let time = 1_640; time <= 2_200; time += 20) desktop.tick(time);
  assert.equal(desktopRenderer.calls.splat, desktopCount, 'desktop startup splats should also stop after completion');
});

test('startup path waits for portrait readiness and does not replay after resize', () => {
  const h = harness({ fine: true, sceneReady: false, introSeen: false });
  h.flushSetup();
  const renderer = h.renderers[0];
  for (let time = 120; time <= 900; time += 20) h.tick(time);
  assert.equal(renderer.calls.splat, 0);
  renderer.scene.ready = true;
  renderer.options.onSceneReady();
  h.tick(920);
  assert.ok(renderer.calls.splat > 0);
  for (let time = 940; time <= 2_420; time += 20) h.tick(time);
  const count = renderer.calls.splat;
  h.window.dispatch('resize');
  h.flushSetup();
  for (let time = 2_440; time <= 4_000; time += 20) h.tick(time);
  assert.equal(renderer.calls.splat, count, 'resize must not restart the one-shot path');
});

test('readiness-scheduled intro survives hiding before its first splat', () => {
  const h = harness({ fine: true, sceneReady: false, introSeen: false });
  h.flushSetup();
  const renderer = h.renderers[0];
  renderer.scene.ready = true;
  renderer.options.onSceneReady();
  assert.ok(h.rafs.size > 0, 'scene readiness should schedule the first intro frame');

  h.document.hidden = true;
  h.document.dispatch('visibilitychange');
  assert.equal(h.rafs.size, 0, 'hiding should stop the scheduled frame');
  assert.equal(h.sessionValues.has('tatarin.fluid-intro.seen'), false, 'an unseen intro must not be consumed before its first splat');

  h.document.hidden = false;
  h.document.dispatch('visibilitychange');
  for (let time = 120; time <= 1_720; time += 20) h.tick(time);
  assert.ok(renderer.calls.splat > 40, 'the pending intro should begin after the page becomes eligible again');
  assert.equal(h.sessionValues.get('tatarin.fluid-intro.seen'), '1');
});

test('a session marker and reduced motion both suppress automatic startup splats', () => {
  const seen = harness({ fine: true });
  seen.flushSetup();
  for (let time = 120; time <= 1_800; time += 20) seen.tick(time);
  assert.equal(seen.renderers[0].calls.splat, 0);

  const reduced = harness({ reduced: true, introSeen: false });
  reduced.flushSetup();
  assert.equal(reduced.renderers.length, 0);
  reduced.toggle.dispatch('click');
  for (let time = 120; time <= 1_800; time += 20) reduced.tick(time);
  assert.equal(reduced.renderers[0].calls.splat, 0, 'an explicit animation override must not launch the automatic intro under reduced motion');
});

test('storage failures allow only one local intro and never throw', () => {
  const readFailure = harness({ fine: true, introSeen: false, storageError: 'read' });
  assert.doesNotThrow(() => readFailure.flushSetup());
  readFailure.tick(120);
  assert.ok(readFailure.renderers[0].calls.splat > 0);

  const writeFailure = harness({ fine: true, introSeen: false, storageError: 'write' });
  writeFailure.flushSetup();
  writeFailure.tick(120);
  assert.ok(writeFailure.renderers[0].calls.splat > 0);
  for (let time = 140; time <= 1_720; time += 20) writeFailure.tick(time);
  const count = writeFailure.renderers[0].calls.splat;
  writeFailure.window.dispatch('resize');
  writeFailure.flushSetup();
  for (let time = 1_740; time <= 3_300; time += 20) assert.doesNotThrow(() => writeFailure.tick(time));
  assert.equal(writeFailure.renderers[0].calls.splat, count);
});

test('valid field input cancels startup motion while control input does not count as a gesture', () => {
  const h = harness({ fine: true, introSeen: false });
  h.flushSetup();
  h.tick(120);
  const renderer = h.renderers[0];
  const beforeControl = renderer.calls.splat;
  h.hero.dispatch('pointermove', { pointerType: 'mouse', clientX: 150, clientY: 100, target: { closest: () => true } });
  h.tick(140);
  assert.ok(renderer.calls.splat > beforeControl, 'the demo should continue through pointer movement over a control');
  h.hero.dispatch('pointermove', { pointerType: 'mouse', clientX: 120, clientY: 100, target: { closest: () => false } });
  h.hero.dispatch('pointermove', { pointerType: 'mouse', clientX: 180, clientY: 115, target: { closest: () => false } });
  h.tick(160);
  const afterGesture = renderer.calls.splat;
  for (let time = 180; time <= 1_800; time += 20) h.tick(time);
  assert.equal(renderer.calls.splat, afterGesture, 'the fluid remains interactive but the intro does not resume');
});

test('suspend, visibility and context restoration never replay an already-started intro', () => {
  const h = harness({ fine: true, introSeen: false });
  h.flushSetup();
  h.tick(120);
  const first = h.renderers[0];
  assert.ok(first.calls.splat > 0);
  const started = first.calls.splat;
  h.controller.suspend();
  h.controller.resume();
  h.document.hidden = true;
  h.document.dispatch('visibilitychange');
  h.document.hidden = false;
  h.document.dispatch('visibilitychange');
  for (let time = 140; time <= 1_800; time += 20) h.tick(time);
  assert.equal(first.calls.splat, started);

  h.canvas.dispatch('webglcontextlost');
  h.canvas.dispatch('webglcontextrestored');
  for (let time = 1_820; time <= 2_200; time += 20) h.tick(time);
  assert.equal(h.renderers.length, 2);
  assert.equal(h.renderers[1].calls.splat, 0);
  h.controller.destroy();
});

test('initially hidden or unready scene waits for eligibility, and the RAF ends with the activity window', () => {
  const h = harness({ fine: true, sceneReady: false, introSeen: false });
  h.document.hidden = true;
  h.flushSetup();
  assert.equal(h.renderers.length, 0, 'an initially hidden page should not initialize the scene');
  h.document.hidden = false;
  h.document.dispatch('visibilitychange');
  h.flushSetup();
  const renderer = h.renderers[0];
  assert.equal(renderer.calls.splat, 0);
  renderer.scene.ready = true;
  renderer.options.onSceneReady();
  for (let time = 120; time <= 1_720; time += 20) h.tick(time);
  assert.ok(renderer.calls.splat > 40);
  for (let time = 2_000; time <= 8_000; time += 1_000) h.tick(time);
  assert.equal(h.rafs.size, 0);
  h.tick(8_100);
  assert.equal(h.rafs.size, 0);
});

test('interaction hint starts with pointer-specific copy, hides on scene input, and returns after eight idle seconds', () => {
  const h = harness({ fine: true });
  assert.equal(h.hint.hidden, false, 'the initial eligible state should show the hint');
  h.flushSetup();
  assert.equal(h.hint.textContent, 'Поводите курсором по экрану');
  assert.equal(h.hint.hidden, false);
  const scene = { closest: () => false };
  h.hero.dispatch('pointermove', { pointerType: 'mouse', clientX: 150, clientY: 100, target: scene });
  assert.equal(h.hint.hidden, true);
  assert.equal(h.timers.size, 1);
  h.tick(8099);
  assert.equal(h.hint.hidden, true);
  h.tick(8101);
  assert.equal(h.hint.hidden, false);
  assert.equal(h.timers.size, 0);
});

test('hint inactivity deadline resets on valid input; UI input, resize, and scene readiness do not reset it', () => {
  const h = harness({ fine: true });
  h.flushSetup();
  const scene = { closest: () => false };
  h.hero.dispatch('pointermove', { pointerType: 'mouse', clientX: 150, clientY: 100, target: scene });
  h.tick(5000);
  h.hero.dispatch('pointermove', { pointerType: 'mouse', clientX: 160, clientY: 100, target: scene });
  h.hero.dispatch('pointermove', { pointerType: 'mouse', clientX: 170, clientY: 100, target: { closest: () => true } });
  h.window.dispatch('resize');
  h.flushSetup();
  h.renderers[0].options.onSceneReady();
  h.tick(12999);
  assert.equal(h.hint.hidden, true);
  h.tick(13000);
  assert.equal(h.hint.hidden, false);
});

test('fine pointer changes update hint copy without canceling the active idle deadline', () => {
  const h = harness({ fine: true });
  h.flushSetup();
  h.hero.dispatch('pointermove', {
    pointerType: 'mouse', clientX: 150, clientY: 100, target: { closest: () => false },
  });
  h.tick(5000);
  h.fineMedia.change(false);
  assert.equal(h.hint.textContent, 'Проведите пальцем по экрану');
  assert.equal(h.hint.hidden, true);
  assert.equal(h.timers.size, 1);
  h.tick(8101);
  assert.equal(h.hint.hidden, false);
});

test('reduced motion off cancels the hint timer and on restores the idle hint', () => {
  const h = harness();
  h.flushSetup();
  h.hero.dispatch('pointermove', {
    pointerType: 'mouse', clientX: 150, clientY: 100, target: { closest: () => false },
  });
  assert.equal(h.timers.size, 1);
  h.reducedMedia.change(true);
  assert.equal(h.hint.hidden, true);
  assert.equal(h.timers.size, 0);
  h.reducedMedia.change(false);
  assert.equal(h.hint.hidden, false);
  assert.equal(h.timers.size, 0);
});

test('ineligible lifecycle states clear a pending hint timer and restore idle state on resume', () => {
  const h = harness({ fine: true });
  h.flushSetup();
  h.hero.dispatch('pointermove', {
    pointerType: 'mouse', clientX: 150, clientY: 100, target: { closest: () => false },
  });
  ObserverInstance(h).callback([{ isIntersecting: false }]);
  assert.equal(h.timers.size, 0);
  ObserverInstance(h).callback([{ isIntersecting: true }]);
  assert.equal(h.hint.hidden, false);

  h.hero.dispatch('pointermove', {
    pointerType: 'mouse', clientX: 160, clientY: 100, target: { closest: () => false },
  });
  h.controller.destroy();
  assert.equal(h.timers.size, 0);
  assert.equal(h.hint.hidden, true);

  const manualOff = harness({ fine: true });
  manualOff.flushSetup();
  manualOff.hero.dispatch('pointermove', {
    pointerType: 'mouse', clientX: 150, clientY: 100, target: { closest: () => false },
  });
  manualOff.toggle.dispatch('click');
  assert.equal(manualOff.timers.size, 0);
  assert.equal(manualOff.hint.hidden, true);

  const failed = harness({ fine: true });
  failed.flushSetup();
  failed.hero.dispatch('pointermove', {
    pointerType: 'mouse', clientX: 150, clientY: 100, target: { closest: () => false },
  });
  failed.canvas.dispatch('webglcontextlost');
  assert.equal(failed.timers.size, 0);
  assert.equal(failed.hint.hidden, true);
});

test('coarse hint copy and lifecycle eligibility hide the hint and clear timers', () => {
  const h = harness();
  h.flushSetup();
  assert.equal(h.hint.textContent, 'Проведите пальцем по экрану');
  h.hero.dispatch('pointerdown', { pointerType: 'touch', clientX: 150, clientY: 100, target: { closest: () => false } });
  assert.equal(h.hint.hidden, true);
  h.controller.suspend();
  assert.equal(h.hint.hidden, true);
  assert.equal(h.timers.size, 0);
  h.controller.resume();
  assert.equal(h.hint.hidden, false);
  h.fineMedia.change(true);
  assert.equal(h.hint.textContent, 'Поводите курсором по экрану');
  h.toggle.dispatch('click');
  assert.equal(h.hint.hidden, true);
  h.toggle.dispatch('click');
  h.document.hidden = true;
  h.document.dispatch('visibilitychange');
  assert.equal(h.hint.hidden, true);
});

test('hint stays hidden for reduced motion, WebGL failure, offscreen state, destroyed controllers, and missing markup', () => {
  const reduced = harness({ reduced: true });
  reduced.flushSetup();
  assert.equal(reduced.hint.hidden, true);
  const failed = harness({ rendererFails: true });
  failed.flushSetup();
  assert.equal(failed.hint.hidden, true);
  const offscreen = harness({ fine: true });
  offscreen.flushSetup();
  ObserverInstance(offscreen).callback([{ isIntersecting: false }]);
  assert.equal(offscreen.hint.hidden, true);
  offscreen.controller.destroy();
  assert.equal(offscreen.hint.hidden, true);
  assert.equal(offscreen.timers.size, 0);
  const withoutHint = harness({ hintAvailable: false });
  withoutHint.flushSetup();
  assert.equal(withoutHint.renderers.length, 1);
});

test('coarse devices seed and animate automatically without pointer input', () => {
  const h = harness();
  h.flushSetup();
  assert.equal(h.toggle.attributes['aria-pressed'], 'true');
  assert.equal(h.renderers.length, 1);
  assert.equal(h.renderers[0].calls.seed, 1);
  assert.ok(h.rafs.size > 0);
  h.tick(140);
  assert.ok(h.renderers[0].calls.step > 0);
  assert.equal(h.renderers[0].paintTimes[0], undefined, 'prepare should use the existing scene-time latch');
  assert.equal(h.renderers[0].paintTimes.at(-1), 140, 'animation frames should supply their timestamp');
});

test('reduced motion defaults off, while the explicit toggle enables it', () => {
  const h = harness({ reduced: true });
  h.flushSetup();
  assert.equal(h.toggle.attributes['aria-pressed'], 'false');
  assert.equal(h.renderers.length, 0);
  assert.equal(h.hero.classList.contains('has-fluid'), false);
  assert.equal(h.hero.classList.contains('is-portrait-mode'), true);
  h.toggle.dispatch('click');
  assert.equal(h.toggle.attributes['aria-pressed'], 'true');
  assert.equal(h.hero.classList.contains('is-portrait-mode'), false);
  assert.equal(h.rafs.size, 1);
  h.tick(140);
  assert.ok(h.renderers[0].calls.step > 0);
});

test('manual off survives resume, visibility, resize, and fine-pointer changes', () => {
  const h = harness({ fine: true });
  h.flushSetup();
  h.toggle.dispatch('click');
  assert.equal(h.toggle.attributes['aria-pressed'], 'false');
  assert.equal(h.hero.classList.contains('has-fluid'), true);
  assert.equal(h.hero.classList.contains('is-portrait-mode'), true);
  h.controller.resume();
  h.document.hidden = true;
  h.document.dispatch('visibilitychange');
  h.document.hidden = false;
  h.document.dispatch('visibilitychange');
  h.window.dispatch('resize');
  h.fineMedia.change(false);
  h.fineMedia.change(true);
  h.flushSetup();
  assert.equal(h.toggle.attributes['aria-pressed'], 'false');
  assert.equal(h.hero.classList.contains('has-fluid'), true);
  assert.equal(h.rafs.size, 0);
});

test('portrait mode keeps the photo lit while all GPU simulation work stays off', () => {
  const h = harness({ fine: true });
  h.flushSetup();
  const renderer = h.renderers[0];
  h.toggle.dispatch('click');
  assert.equal(h.hero.classList.contains('is-portrait-mode'), true);
  assert.equal(h.hero.classList.contains('has-portrait-burst'), true);
  assert.equal(h.hero.classList.contains('is-scene-paused'), false);
  const calls = { ...renderer.calls };

  h.controller.resume();
  h.window.dispatch('resize');
  h.flushSetup();
  renderer.options.onSceneReady();
  h.tick(180);
  for (const method of ['paint', 'step', 'splat']) assert.equal(renderer.calls[method], calls[method], `${method} must remain idle while portrait mode is active`);
  assert.equal(h.rafs.size, 0);

  h.toggle.dispatch('click');
  assert.equal(h.hero.classList.contains('is-portrait-mode'), false);
  assert.equal(h.hero.classList.contains('has-portrait-burst'), false);
  assert.equal(h.rafs.size, 1);
  h.tick(220);
  assert.ok(renderer.calls.step > calls.step, 'turning fluid back on should resume GPU frames');
});

test('still burst is reused for late scene readiness and rebuilt only after resize', () => {
  const h = harness({ fine: true });
  h.flushSetup();
  h.toggle.dispatch('click');
  const renderer = h.renderers[0];
  assert.equal(renderer.calls.burst, 1);
  const paints = renderer.calls.paint;
  renderer.options.onSceneReady();
  assert.equal(renderer.calls.burst, 1);
  assert.equal(renderer.calls.paint, paints, 'late readiness must not rerun a completed burst paint');

  h.hero.box = { top: 0, bottom: 220, left: 0, width: 340, height: 220 };
  h.window.dispatch('resize');
  h.flushSetup();
  assert.equal(renderer.calls.burst, 2, 'a changed drawing size should recreate the still burst');
  h.controller.resume();
  assert.equal(renderer.calls.burst, 2, 'same-size lifecycle resume should reuse its snapshot');
  assert.equal(h.rafs.size, 0);
});

test('CSS word drift pauses with scene lifecycle and resumes when the hero is available', () => {
  const h = harness({ fine: true });
  h.flushSetup();
  assert.equal(h.hero.classList.contains('is-scene-paused'), false);
  h.controller.suspend();
  assert.equal(h.hero.classList.contains('is-scene-paused'), true);
  h.controller.resume();
  assert.equal(h.hero.classList.contains('is-scene-paused'), false);
  h.document.hidden = true;
  h.document.dispatch('visibilitychange');
  assert.equal(h.hero.classList.contains('is-scene-paused'), true);
  h.document.hidden = false;
  h.document.dispatch('visibilitychange');
  assert.equal(h.hero.classList.contains('is-scene-paused'), false);
  ObserverInstance(h).callback([{ isIntersecting: false }]);
  assert.equal(h.hero.classList.contains('is-scene-paused'), true);
  ObserverInstance(h).callback([{ isIntersecting: true }]);
  assert.equal(h.hero.classList.contains('is-scene-paused'), false);
  h.controller.destroy();
  assert.equal(h.hero.classList.contains('is-scene-paused'), true);
});

test('reduced motion and WebGL failure start in the lit portrait mode without GPU animation', () => {
  const reduced = harness({ reduced: true });
  reduced.flushSetup();
  assert.equal(reduced.hero.classList.contains('is-portrait-mode'), true);
  assert.equal(reduced.renderers.length, 0);
  assert.equal(reduced.rafs.size, 0);

  const failed = harness({ rendererFails: true });
  failed.flushSetup();
  assert.equal(failed.hero.classList.contains('is-portrait-mode'), true);
  assert.equal(failed.renderers.length, 0);
  assert.equal(failed.rafs.size, 0);
});

test('manual portrait mode survives a context loss and restoration', () => {
  const h = harness({ fine: true });
  h.flushSetup();
  h.toggle.dispatch('click');
  const renderer = h.renderers[0];
  const steps = renderer.calls.step;
  h.canvas.dispatch('webglcontextlost');
  assert.equal(h.hero.classList.contains('is-portrait-mode'), true);
  h.canvas.dispatch('webglcontextrestored');
  assert.equal(h.hero.classList.contains('is-portrait-mode'), true);
  assert.equal(h.hero.classList.contains('has-portrait-burst'), true);
  assert.equal(h.rafs.size, 0);
  assert.equal(renderer.calls.step, steps);
  assert.equal(h.renderers.length, 2);
  assert.equal(h.renderers[1].calls.burst, 1);
});

test('scene readiness after restore follows the current mode if fluid is re-enabled first', () => {
  const h = harness({ fine: true, sceneReady: false });
  h.flushSetup();
  h.toggle.dispatch('click');
  h.canvas.dispatch('webglcontextlost');
  h.canvas.dispatch('webglcontextrestored');
  const restored = h.renderers[1];
  assert.equal(restored.calls.burst, 1);
  assert.equal(h.hero.classList.contains('has-portrait-burst'), false);

  h.toggle.dispatch('click');
  assert.equal(h.hero.classList.contains('is-portrait-mode'), false);
  assert.equal(h.rafs.size, 1);
  const paintsBeforeReady = restored.calls.paint;
  restored.scene.ready = true;
  restored.options.onSceneReady();
  assert.ok(restored.calls.paint > paintsBeforeReady, 'ready callback should prepare normal portrait compositing');
  assert.equal(restored.calls.burst, 1, 'late readiness must not start another burst');
  assert.equal(h.hero.classList.contains('has-portrait-burst'), false);
  assert.equal(h.rafs.size, 1, 'readiness should reuse the active fluid frame loop');
});

test('late scene readiness cannot restart animation after manual off or while hidden', () => {
  const h = harness({ fine: true });
  h.flushSetup();
  const ready = h.renderers[0].options.onSceneReady;
  h.toggle.dispatch('click');
  assert.equal(h.rafs.size, 0);
  ready();
  assert.equal(h.rafs.size, 0);
  h.toggle.dispatch('click');
  h.document.hidden = true;
  h.document.dispatch('visibilitychange');
  ready();
  assert.equal(h.rafs.size, 0);
});

test('suspend, hidden document, and offscreen state stop drawing; resume restarts it', () => {
  const h = harness();
  h.flushSetup();
  h.controller.suspend();
  assert.equal(h.rafs.size, 0);
  h.tick(500);
  assert.equal(h.renderers[0].calls.step, 0);
  h.controller.resume();
  assert.equal(h.rafs.size, 1);
  h.document.hidden = true;
  h.document.dispatch('visibilitychange');
  assert.equal(h.rafs.size, 0);
  h.document.hidden = false;
  h.document.dispatch('visibilitychange');
  assert.equal(h.rafs.size, 1);
  const intersection = ObserverInstance(h);
  intersection.callback([{ isIntersecting: false }]);
  assert.equal(h.rafs.size, 0);
  intersection.callback([{ isIntersecting: true }]);
  assert.equal(h.rafs.size, 1);
});

function ObserverInstance(h) { return h.window.IntersectionObserver.instances[0]; }

test('WebGL failure is graceful and a restored context prepares and resumes', () => {
  const h = harness({ rendererFails: true });
  h.flushSetup();
  assert.equal(h.toggle.disabled, true);
  h.canvas.dispatch('webglcontextlost');
  h.canvas.dispatch('webglcontextrestored');
  assert.equal(h.toggle.disabled, false);
  assert.equal(h.rafs.size, 1);
});

test('the animation stops after its seven second activity window', () => {
  const h = harness();
  h.flushSetup();
  for (let time = 200; time < 7300; time += 1000) h.tick(time);
  assert.equal(h.rafs.size, 0);
  const steps = h.renderers[0].calls.step;
  h.tick(7400);
  assert.equal(h.renderers[0].calls.step, steps);
});

test('touch tap wakes an idle fluid trail and ignores navigation controls', () => {
  const h = harness();
  h.flushSetup();
  h.tick(7200);
  assert.equal(h.rafs.size, 0);

  const renderer = h.renderers[0];
  const plainTarget = { closest: () => false };
  h.hero.dispatch('pointerdown', { pointerType: 'touch', clientX: 150, clientY: 100, target: plainTarget });
  assert.equal(renderer.calls.splat, 1);
  assert.equal(h.rafs.size, 1);

  h.hero.dispatch('pointermove', { pointerType: 'touch', clientX: 210, clientY: 100 });
  h.tick(7220);
  assert.ok(renderer.calls.splat > 1, 'movement should continue the fluid trail');

  const splatsBeforeControlTap = renderer.calls.splat;
  h.hero.dispatch('pointerdown', {
    pointerType: 'touch', clientX: 240, clientY: 100,
    target: { closest: selector => selector === 'a,button' },
  });
  assert.equal(renderer.calls.splat, splatsBeforeControlTap, 'touching a link or button must not add a splat');
});

test('renderer scene time stays latched for paints without a frame timestamp', () => {
  const times = [];
  const pair = () => ({
    read: { texel: [0.01, 0.01] },
    write: {},
    swap() { [this.read, this.write] = [this.write, this.read]; },
  });
  const renderer = {
    dye: pair(), bloom: pair(), scene: { ready: true, uniforms(_renderer, time) { times.push(time); } },
    use() {}, texture() {}, uniform() {}, draw() {},
  };
  FluidRenderer.prototype.paint.call(renderer, 1000);
  FluidRenderer.prototype.paint.call(renderer);
  FluidRenderer.prototype.paint.call(renderer, 2000);
  FluidRenderer.prototype.paint.call(renderer);
  assert.deepEqual(times, [1000, 1000, 2000, 2000]);
});
