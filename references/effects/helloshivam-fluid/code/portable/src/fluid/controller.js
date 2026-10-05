import { FluidRenderer } from './renderer.js';

/** Owns one hero's interaction, preference and GPU lifecycle. */
export function createFluidHero(hero) {
  const canvas = hero.querySelector('.fluid-canvas');
  const toggle = hero.querySelector('.motion-toggle');
  const hint = hero.querySelector('.interaction-hint');
  if (!canvas || !toggle) return null;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const events = new AbortController();
  const listener = { signal: events.signal };
  const passive = { ...listener, passive: true };
  let choice = null;
  let available = true;
  let destroyed = false;
  let suspended = false;
  const initialBox = hero.getBoundingClientRect();
  let visible = initialBox.bottom > 0 && initialBox.top < innerHeight;
  let fluid = null;
  let raf = 0;
  let resizeRaf = 0;
  let lastFrame = 0;
  let deadline = 0;
  let previous = null;
  let pending = null;
  let hintTimer = 0;
  let hintDismissed = false;
  let burstPrepared = false;
  let burstSize = null;
  let normalSeedAfterBurst = false;
  let introConsumed = false;
  let introActive = false;
  let introStartedAt = null;
  let introDuration = null;
  let introPrevious = null;

  try {
    introConsumed = window.sessionStorage.getItem('tatarin.fluid-intro.seen') === '1';
  } catch {
    // Storage can be unavailable; local state still prevents replay in this controller.
  }

  const enabled = () => available && (choice ?? !reduced.matches);
  const canDraw = () => !destroyed && !suspended && visible && !document.hidden;

  function updateSceneState() {
    hero.classList.toggle('is-portrait-mode', !enabled());
    hero.classList.toggle('is-scene-paused', !canDraw());
  }

  function updateHint() {
    if (!hint) return;
    hint.textContent = finePointer.matches ? 'Поводите курсором по экрану' : 'Проведите пальцем по экрану';
    const eligible = enabled() && canDraw();
    if (!eligible) {
      if (hintTimer) clearTimeout(hintTimer);
      hintTimer = 0;
      hintDismissed = false;
    }
    const show = eligible && !hintDismissed;
    hint.hidden = !show;
  }

  function noteInteraction() {
    if (!hint || !enabled() || !canDraw()) return;
    hintDismissed = true;
    updateHint();
    if (hintTimer) clearTimeout(hintTimer);
    hintTimer = setTimeout(() => {
      hintTimer = 0;
      hintDismissed = false;
      updateHint();
    }, 8000);
  }

  function updateControl() {
    const active = enabled();
    toggle.textContent = active ? 'Отключить анимацию' : 'Включить анимацию';
    toggle.setAttribute('aria-pressed', String(active));
    toggle.disabled = !available;
  }

  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
    previous = null;
    pending = null;
  }

  function stopIntro(waitForEligibility = false) {
    if (!introActive) {
      if (!waitForEligibility) introConsumed = true;
      return;
    }
    introActive = false;
    if (!waitForEligibility || introStartedAt !== null) introConsumed = true;
    introStartedAt = null;
    introDuration = null;
    introPrevious = null;
  }

  function startIntroIfReady() {
    if (introConsumed || introActive || reduced.matches || !enabled() || !canDraw() || !fluid?.scene?.ready) return;
    introActive = true;
    introStartedAt = null;
    introDuration = finePointer.matches ? 1500 : 3000;
    introPrevious = null;
    wake();
  }

  function runIntro(now) {
    if (!introActive || !fluid?.scene?.ready) return;
    if (introStartedAt === null) introStartedAt = now;
    const progress = Math.min(1, Math.max(0, (now - introStartedAt) / introDuration));
    const eased = progress * progress * (3 - 2 * progress);
    const point = { x: 0.15 + eased * 0.7, y: 0.52 + Math.sin(progress * Math.PI) * 0.13 };
    const previousPoint = introPrevious ?? point;
    const hue = (now / 2500) % 1;
    fluid.splat(point.x, point.y, point.x - previousPoint.x, point.y - previousPoint.y, hue, 0.18);
    introPrevious = point;
    if (!introConsumed) {
      introConsumed = true;
      try { window.sessionStorage.setItem('tatarin.fluid-intro.seen', '1'); }
      catch { /* Local introConsumed state prevents a repeat during this controller lifetime. */ }
    }
    if (progress >= 1) {
      introActive = false;
      introConsumed = true;
      introStartedAt = null;
      introDuration = null;
      introPrevious = null;
    }
  }

  function fallback() {
    stopIntro(true);
    stop();
    available = false;
    hintDismissed = false;
    updateHint();
    hero.classList.remove('has-fluid');
    hero.classList.remove('has-portrait-burst');
    fluid?.destroy();
    fluid = null;
    burstPrepared = false;
    burstSize = null;
    normalSeedAfterBurst = false;
    updateSceneState();
    updateControl();
  }

  function prepare() {
    if (!canDraw() || !enabled()) return false;
    try {
      const box = hero.getBoundingClientRect();
      if (!box.width || !box.height) return false;
      fluid ??= new FluidRenderer(canvas, { hero, onSceneReady: () => {
        if (destroyed || !canDraw()) return;
        if (enabled()) prepare();
        else if (choice === false && burstPrepared) paintBurst();
      } });
      const initialized = fluid.resize(box.width, box.height, devicePixelRatio, finePointer.matches);
      if (initialized || normalSeedAfterBurst) fluid.seed();
      normalSeedAfterBurst = false;
      fluid.paint();
      if (enabled() || choice === false) hero.classList.add('has-fluid');
      if (enabled()) {
        startIntroIfReady();
        wake();
      }
      return true;
    } catch {
      fallback();
      return false;
    }
  }

  function paintBurst() {
    if (!fluid || !burstPrepared || choice !== false || !canDraw()) return false;
    if (!fluid.scene?.ready) {
      hero.classList.remove('has-portrait-burst');
      return false;
    }
    if (hero.classList.contains('has-portrait-burst')) return true;
    try {
      fluid.paint(undefined, { burst: true });
      hero.classList.add('has-portrait-burst');
      return true;
    } catch {
      fallback();
      return false;
    }
  }

  function prepareBurst() {
    if (!canDraw() || available === false || choice !== false) return false;
    try {
      const box = hero.getBoundingClientRect();
      if (!box.width || !box.height) return false;
      fluid ??= new FluidRenderer(canvas, { hero, onSceneReady: () => {
        if (destroyed || !canDraw()) return;
        if (enabled()) prepare();
        else if (choice === false) {
          if (burstPrepared) paintBurst();
          else prepareBurst();
        }
      } });
      fluid.resize(box.width, box.height, devicePixelRatio, finePointer.matches);
      const nextSize = [box.width, box.height, canvas.width, canvas.height, finePointer.matches];
      const resized = !burstSize || nextSize.some((value, index) => value !== burstSize[index]);
      const madeBurst = !burstPrepared || resized;
      if (madeBurst) {
        fluid.burst();
        burstPrepared = true;
        burstSize = nextSize;
        hero.classList.remove('has-portrait-burst');
      }
      if (madeBurst && fluid.scene?.ready) {
        hero.classList.add('has-portrait-burst');
        return true;
      }
      return paintBurst();
    } catch {
      fallback();
      return false;
    }
  }

  function wake() {
    if (!enabled() || !canDraw() || !fluid) return;
    deadline = performance.now() + 7000;
    if (!raf) {
      lastFrame = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }

  function frame(now) {
    raf = 0;
    if (!enabled() || !canDraw() || !fluid) return;
    const elapsed = now - lastFrame;
    if (elapsed >= 1000 / 60 - 1) {
      try {
        if (pending) {
          const next = pending;
          pending = null;
          if (previous) {
            const dx = next.x - previous.x;
            const dy = next.y - previous.y;
            const distance = Math.hypot(dx * fluid.aspect, dy);
            if (distance > 0.0003) {
              const count = Math.min(12, Math.max(1, Math.ceil(distance / 0.025)));
              const hue = (now / 2500) % 1;
              for (let i = 1; i <= count; i++) {
                fluid.splat(previous.x + dx * i / count, previous.y + dy * i / count,
                  dx / count, dy / count, hue, 0.85 / count);
              }
            }
          }
          previous = next;
        }
        runIntro(now);
        fluid.step(Math.min(elapsed / 1000, 1 / 30));
        fluid.paint(now);
        lastFrame = now;
      } catch {
        fallback();
        return;
      }
    }
    if (now < deadline || pending || introActive) raf = requestAnimationFrame(frame);
    else previous = null;
  }

  function position(event) {
    const box = hero.getBoundingClientRect();
    return { x: (event.clientX - box.left) / box.width, y: (event.clientY - box.top) / box.height };
  }

  hero.addEventListener('pointermove', event => {
    if (!enabled() || !canDraw() || !['mouse', 'pen', 'touch'].includes(event.pointerType)) return;
    if (event.target?.closest?.('a,button')) return;
    if (!fluid && !prepare()) return;
    const point = position(event);
    if (point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) {
      previous = null;
      pending = null;
      return;
    }
    noteInteraction();
    stopIntro();
    previous ??= point;
    pending = point;
    wake();
  }, passive);

  hero.addEventListener('pointerdown', event => {
    if (!enabled() || !canDraw() || !['pen', 'touch'].includes(event.pointerType) || event.target.closest('a,button')) return;
    if (!fluid && !prepare()) return;
    try {
      const point = position(event);
      if (point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) return;
      noteInteraction();
      stopIntro();
      fluid.splat(point.x, point.y, 0, 0, (performance.now() / 2500) % 1, 0.85);
      previous = point;
      wake();
    } catch { fallback(); }
  }, passive);

  const clearPointer = () => { previous = null; pending = null; };
  hero.addEventListener('pointerleave', clearPointer, listener);
  hero.addEventListener('pointercancel', clearPointer, listener);

  toggle.addEventListener('click', () => {
    stopIntro();
    choice = !enabled();
    hintDismissed = false;
    stop();
    if (enabled()) {
      hero.classList.remove('has-portrait-burst');
      if (burstPrepared && fluid) {
        try { fluid.reset(); normalSeedAfterBurst = true; }
        catch { fallback(); }
      }
      burstPrepared = false;
      burstSize = null;
    }
    updateSceneState();
    if (enabled()) prepare();
    else prepareBurst();
    updateControl();
    updateHint();
  }, listener);

  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    fallback();
  }, listener);
  canvas.addEventListener('webglcontextrestored', () => {
    available = true;
    hintDismissed = false;
    updateSceneState();
    if (enabled()) prepare();
    else if (choice === false) prepareBurst();
    updateControl();
    updateHint();
  }, listener);

  function preferenceChanged() {
    if (reduced.matches) stopIntro(true);
    stop();
    updateSceneState();
    if (enabled()) {
      prepare();
    } else if (choice === null) {
      hero.classList.remove('has-fluid');
    }
    updateControl();
    updateHint();
  }
  reduced.addEventListener('change', preferenceChanged, listener);
  finePointer.addEventListener('change', preferenceChanged, listener);

  function suspend() {
    stopIntro(true);
    suspended = true;
    stop();
    updateSceneState();
    if (hintTimer) clearTimeout(hintTimer);
    hintTimer = 0;
    hintDismissed = false;
    updateHint();
  }
  function resume() {
    suspended = false;
    updateSceneState();
    if (enabled()) prepare();
    else if (choice === false) prepareBurst();
    updateHint();
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) suspend();
    else resume();
  }, listener);

  const intersection = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (!visible) {
      stopIntro(true);
      stop();
      hintDismissed = false;
    }
    updateSceneState();
    if (visible && enabled()) prepare();
    else if (visible && choice === false) prepareBurst();
    updateHint();
  }) : null;
  intersection?.observe(hero);

  function resize() {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0;
      if (enabled()) prepare();
      else if (choice === false) prepareBurst();
    });
  }
  const observer = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;
  if (observer) observer.observe(hero);
  // Also catches moving the window to a display with a different pixel density.
  window.addEventListener('resize', resize, passive);

  updateControl();
  updateSceneState();
  updateHint();
  resize();

  return {
    suspend,
    resume,
    destroy() {
      destroyed = true;
      stopIntro();
      stop();
      updateSceneState();
      if (hintTimer) clearTimeout(hintTimer);
      hintTimer = 0;
      updateHint();
      cancelAnimationFrame(resizeRaf);
      events.abort();
      intersection?.disconnect();
      observer?.disconnect();
      fluid?.destroy();
      fluid = null;
    }
  };
}
