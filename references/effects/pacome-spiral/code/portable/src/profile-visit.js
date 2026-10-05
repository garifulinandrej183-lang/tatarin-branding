const startedKey = 'tatarin.profile-visit.started-at';
const seenKey = 'tatarin.profile-visit.about-seen';
const attentionAt = 10_000;
const redirectAt = 30_000;

export function markProfileAboutSeen(windowRef = window) {
  try {
    windowRef.sessionStorage.setItem(seenKey, '1');
  } catch {
    // Storage can be unavailable in private or restricted browsing contexts.
  }
}

export function initProfileVisit({
  windowRef = window,
  documentRef = document,
  now = () => Date.now(),
  setTimer = (callback, delay) => windowRef.setTimeout(callback, delay),
  clearTimer = id => windowRef.clearTimeout(id),
  aboutUrl
} = {}) {
  const links = [...documentRef.querySelectorAll('[data-profile-visit-name]')];
  if (!links.length && !aboutUrl) return () => {};

  let storage;
  let startedAt;
  try {
    storage = windowRef.sessionStorage;
    if (storage.getItem(seenKey) === '1') return () => {};
    const rawStart = storage.getItem(startedKey);
    const savedStart = Number(rawStart);
    const currentTime = now();
    if (rawStart !== null && rawStart.trim() !== '' && Number.isFinite(savedStart) && savedStart >= 0 && savedStart <= currentTime)
      startedAt = savedStart;
    else {
      startedAt = currentTime;
      storage.setItem(startedKey, String(startedAt));
    }
  } catch {
    return () => {};
  }

  let attentionTimer = null;
  let redirectTimer = null;
  let stopped = false;
  let suspended = false;
  let listenersAttached = false;
  let onVisibilityChange = () => {};
  let onPageHide = () => {};
  let onPageShow = () => {};
  let onMotionChange = () => {};
  const reducedMotion = (() => {
    try { return windowRef.matchMedia('(prefers-reduced-motion: reduce)'); }
    catch { return null; }
  })();

  const clearTimers = () => {
    if (attentionTimer !== null) clearTimer(attentionTimer);
    if (redirectTimer !== null) clearTimer(redirectTimer);
    attentionTimer = null;
    redirectTimer = null;
  };

  const removeAttention = () => {
    for (const link of links) link.classList.remove('profile-name-attention', 'profile-name-attention-static');
  };

  const disable = () => {
    stopped = true;
    clearTimers();
    removeAttention();
    if (listenersAttached) {
      reducedMotion?.removeEventListener?.('change', onMotionChange);
      documentRef.removeEventListener('visibilitychange', onVisibilityChange);
      windowRef.removeEventListener('pagehide', onPageHide);
      windowRef.removeEventListener('pageshow', onPageShow);
      listenersAttached = false;
    }
  };

  const seenInSession = () => {
    try { return storage.getItem(seenKey) === '1'; }
    catch { disable(); return true; }
  };

  const applyAttention = () => {
    if (stopped || suspended || documentRef.visibilityState === 'hidden') return;
    const className = reducedMotion?.matches ? 'profile-name-attention-static' : 'profile-name-attention';
    for (const link of links) {
      link.classList.remove('profile-name-attention', 'profile-name-attention-static');
      link.classList.add(className);
    }
  };

  onMotionChange = () => {
    if (links.some(link => link.classList.contains('profile-name-attention') || link.classList.contains('profile-name-attention-static')))
      applyAttention();
  };

  const schedule = deadline => setTimer(() => {
    if (stopped || suspended) return;
    if (documentRef.visibilityState === 'hidden') return;
    reconcile();
  }, Math.max(0, deadline - now()));

  const reconcile = () => {
    if (stopped || suspended) return;
    if (seenInSession()) { disable(); return; }
    const elapsed = now() - startedAt;
    if (elapsed >= attentionAt) applyAttention();
    if (elapsed >= redirectAt) {
      if (documentRef.visibilityState === 'hidden') return;
      try {
        storage.setItem(seenKey, '1');
      } catch {
        disable();
        return;
      }
      const destination = aboutUrl || links.find(link => link.href)?.href;
      disable();
      try { if (destination) windowRef.location.assign(destination); }
      catch { /* A blocked navigation must not break the page. */ }
      return;
    }
    clearTimers();
    if (elapsed < attentionAt) attentionTimer = schedule(startedAt + attentionAt);
    redirectTimer = schedule(startedAt + redirectAt);
  };

  onVisibilityChange = () => {
    if (documentRef.visibilityState === 'hidden') clearTimers();
    else reconcile();
  };
  onPageHide = () => { suspended = true; clearTimers(); };
  onPageShow = event => {
    if (!event.persisted) return;
    suspended = false;
    reconcile();
  };

  reducedMotion?.addEventListener?.('change', onMotionChange);
  documentRef.addEventListener('visibilitychange', onVisibilityChange);
  windowRef.addEventListener('pagehide', onPageHide);
  windowRef.addEventListener('pageshow', onPageShow);
  listenersAttached = true;
  reconcile();

  return disable;
}

if (typeof document !== 'undefined' && document.querySelector('[data-profile-visit-about]'))
  markProfileAboutSeen();
