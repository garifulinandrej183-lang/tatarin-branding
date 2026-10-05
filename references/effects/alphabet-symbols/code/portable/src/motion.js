import { MotionScene } from './motion/motion-scene.js';

const $ = selector => document.querySelector(selector);
const canvas = $('.scene-canvas');
const fallback = $('.static-composition');
const dialog = $('[data-help-dialog]');
const helpButton = $('[data-help-open]');
const closeHelpButton = $('[data-help-close]');
const pauseButton = $('[data-pause]');
const touchButton = $('[data-touch]');
const refreshButton = $('[data-refresh]');
const pauseText = $('[data-pause-text]');
const pauseIcon = $('[data-pause-icon]');
const pauseLabel = $('[data-pause-label]');
const generationLabel = $('[data-generation]');
const announcement = $('[data-announcement]');
const touchHint = $('[data-touch-hint]');

let engine = null;
let paused = false;
let reduced = false;
let touchMode = true;
let helpOpen = false;
let generation = 1;
let focusReturn = null;
let modelContextAbort = null;

const icon = {
  pause: '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>',
  play: '<path d="m7 4 13 8-13 8z"/>'
};

const setPaused = value => {
  paused = Boolean(value);
  if (engine) engine.setPaused(paused || helpOpen);
  updateControls();
};

const setHelpOpen = value => {
  helpOpen = Boolean(value);
  if (engine) engine.setPaused(paused || helpOpen);
  updateControls();
};

function updateControls() {
  const staticMode = reduced;
  pauseButton.disabled = staticMode;
  pauseButton.setAttribute('aria-pressed', String(paused));
  pauseText.textContent = staticMode ? 'Статично' : paused ? 'Продолжить' : 'Пауза';
  pauseIcon.innerHTML = paused ? icon.play : icon.pause;
  pauseLabel.textContent = staticMode ? 'Без анимации' : 'Пауза';
  pauseLabel.hidden = !staticMode && !paused;
  touchButton.setAttribute('aria-pressed', String(touchMode));
  touchButton.setAttribute('aria-label', touchMode ? 'Выключить перетягивание' : 'Включить перетягивание');
  touchHint.innerHTML = touchMode
    ? 'Проводи пальцем. Потяни за кольцо.<span>Выключи ладонь, чтобы прокручивать.</span>'
    : 'Нажми на поле — новая композиция.<span>Кнопка с ладонью включает перетягивание.</span>';
}

try {
  engine = new MotionScene(canvas, fallback, {
    ready() {},
    reduced(value) { reduced = value; updateControls(); },
    changed() {
      generation++;
      generationLabel.textContent = String(generation).padStart(2, '0');
      announcement.textContent = 'Композиция обновлена.';
    }
  });
} catch {
  fallback.dataset.hidden = 'false';
  canvas.style.opacity = '0';
  pauseLabel.hidden = true;
}

function refresh() {
  engine?.regenerate();
}

pauseButton.addEventListener('click', () => setPaused(!paused));
touchButton.addEventListener('click', () => {
  touchMode = !touchMode;
  engine?.setTouchMode(touchMode);
  updateControls();
});
refreshButton.addEventListener('click', refresh);

function closeHelp() {
  if (dialog.open) dialog.close();
  else setHelpOpen(false);
}

helpButton.addEventListener('click', () => {
  focusReturn = document.activeElement;
  setHelpOpen(true);
  try { dialog.showModal(); }
  catch { setHelpOpen(false); }
});
closeHelpButton.addEventListener('click', closeHelp);
dialog.addEventListener('click', event => {
  if (event.target !== dialog || event.detail === 0) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)
    closeHelp();
});
dialog.addEventListener('close', () => {
  setHelpOpen(false);
  if (focusReturn instanceof HTMLElement && focusReturn.isConnected) focusReturn.focus();
  focusReturn = null;
});

function registerModelContext() {
  let context;
  try { context = document.modelContext; } catch { return; }
  if (!context?.registerTool) return;
  const lifecycle = new AbortController();
  modelContextAbort = lifecycle;
  const empty = { type: 'object', properties: {}, additionalProperties: false };
  const checkEmpty = input => {
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length)
      throw new Error('Expected an empty object.');
  };
  const afterPaint = () => new Promise(resolve => requestAnimationFrame(() => resolve()));
  const register = tool => {
    try { void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}); }
    catch {}
  };
  register({
    name: 'read_composition_state', title: 'Текущее состояние композиции',
    description: 'Read the current composition, motion preference, and pause state without changing anything.',
    inputSchema: empty, annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute(input) { checkEmpty(input); return engine?.getState() ?? { status: 'not_ready' }; }
  });
  register({
    name: 'regenerate_composition', title: 'Обновить композицию',
    description: 'Immediately generate a new valid arrangement of the three rings and disc, using the visible New composition action.',
    inputSchema: empty, annotations: { readOnlyHint: false, untrustedContentHint: false },
    async execute(input) {
      checkEmpty(input);
      if (!engine) throw new Error('Scene unavailable.');
      refresh();
      await afterPaint();
      return engine.getState();
    }
  });
  register({
    name: 'set_motion_paused', title: 'Пауза движения',
    description: 'Set the same animation pause state as the visible Pause button. Reduced motion remains respected.',
    inputSchema: { type: 'object', properties: { paused: { type: 'boolean' } }, required: ['paused'], additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    async execute(input) {
      if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => key !== 'paused') || typeof input.paused !== 'boolean')
        throw new Error('Expected {paused: boolean}.');
      setPaused(input.paused);
      await afterPaint();
      return engine?.getState() ?? { status: 'not_ready' };
    }
  });
}

registerModelContext();
window.addEventListener('pagehide', event => {
  if (event.persisted) return;
  engine?.dispose();
  engine = null;
  modelContextAbort?.abort();
});
updateControls();
