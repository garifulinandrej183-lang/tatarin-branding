import { artworks } from "./spiral/spiral-art.js";
import { initProfileVisit } from "./profile-visit.js";

const page = document.querySelector(".spiral-page");
const stage = document.querySelector(".scene-stage");
const canvas = document.querySelector(".spiral-canvas");
const gallery = document.querySelector(".fallback-gallery");
let caption = document.querySelector(".art-caption");
const pauseButton = document.querySelector(".pause-button");
const stepButtons = [...document.querySelectorAll(".step-button")];
const stepHandlers = stepButtons.map((_, index) => () => step(index ? 1 : -1));
const motion = matchMedia("(prefers-reduced-motion: reduce)");
const pointer = matchMedia("(hover: none), (pointer: coarse)");
let reduced = motion.matches;
let coarse = pointer.matches;
let ready = false;
let paused = false;
let selected = 0;
let hovered = null;
let scene = null;
let loadGeneration = 0;
let disposed = false;
const cleanupProfileVisit = initProfileVisit({ aboutUrl: new URL("./about.html", document.baseURI).href });

// The build hashes HTML/CSS asset URLs but never rewrites JavaScript.
// Bind the original registry to the browser-resolved local fallback assets.
for (const artwork of artworks) {
  const image = gallery.querySelector(`[data-art-id="${artwork.id}"] img`);
  if (image) artwork.image = image.currentSrc || image.src;
}

function activeIndex() { return hovered ?? selected; }
function setReady(value) {
  ready = value && !reduced;
  page.classList.toggle("scene-ready", ready);
  page.classList.toggle("scene-static", !ready);
  gallery.setAttribute("aria-hidden", String(ready));
  gallery.querySelectorAll("a").forEach(link => { link.tabIndex = ready ? -1 : 0; });
  pauseButton.disabled = !ready;
  syncPause();
}
function syncPause() {
  pauseButton.setAttribute("aria-pressed", String(paused));
  pauseButton.setAttribute("aria-label", paused ? "Продолжить движение спирали" : "Приостановить движение спирали");
  pauseButton.title = paused ? "Продолжить" : "Пауза";
  pauseButton.innerHTML = paused
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 4 14 8-14 8z" /></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>';
}
function renderCaption() {
  const index = activeIndex();
  const art = artworks[index];
  const total = String(artworks.length).padStart(2, "0");
  const label = `Карточка ${art.number} из ${total}${art.title ? `: ${art.title}` : ""}`;
  const root = art.href ? document.createElement("a") : document.createElement("div");
  root.className = `art-caption ${art.href ? "" : "art-caption-static"}${art.title ? "" : " art-caption-empty"}`.trim();
  root.setAttribute("aria-label", art.href ? art.linkLabel : label);
  if (art.href) {
    root.href = art.href;
    root.target = "_blank";
    root.rel = "noopener noreferrer";
  }
  const image = document.createElement("img");
  image.src = art.image;
  image.width = image.height = 48;
  image.alt = "";
  root.append(image);
  if (art.title) {
    const text = document.createElement("span");
    text.className = "caption-text";
    const title = document.createElement("strong");
    title.textContent = art.title;
    text.append(title);
    if (art.subtitle) {
      const subtitle = document.createElement("small");
      subtitle.textContent = art.subtitle;
      text.append(subtitle);
    }
    root.append(text);
  }
  const count = document.createElement("span");
  count.className = "caption-count";
  count.setAttribute("aria-hidden", "true");
  count.append(document.createTextNode(art.number));
  const all = document.createElement("span");
  all.textContent = ` / ${total}`;
  count.append(all);
  root.append(count);
  if (caption.tagName === root.tagName) {
    for (const attribute of [...caption.attributes]) caption.removeAttribute(attribute.name);
    for (const attribute of [...root.attributes]) caption.setAttribute(attribute.name, attribute.value);
    caption.replaceChildren(...root.childNodes);
  } else {
    caption.replaceWith(root);
    caption = root;
  }
}
function updateHint() {
  const text = reduced || !ready ? "Карточки проектов" : coarse ? "Свайп в сторону или прокрутка" : "Прокрутите, чтобы вращать";
  document.querySelector(".hint-desktop").textContent = reduced || !ready ? "Карточки проектов" : coarse ? "Свайп или прокрутка" : "Прокрутите, чтобы вращать";
  document.querySelector(".hint-mobile").textContent = text;
  document.querySelector(".interaction-hint svg").innerHTML = coarse
    ? '<path d="m18 8 4 4-4 4M2 12h20M6 8l-4 4 4 4" />'
    : '<rect x="5" y="2" width="14" height="20" rx="7" /><path d="M12 6v4" />';
}
function choose(index) {
  selected = (index + artworks.length) % artworks.length;
  renderCaption();
}
function step(direction) {
  hovered = null;
  if (ready && scene) scene.step(direction);
  else choose(activeIndex() + direction);
}
function updatePointer() { coarse = pointer.matches; updateHint(); }
function onKeyDown(event) {
  if (event.target !== stage) return;
  if (["ArrowRight", "ArrowDown"].includes(event.key)) { event.preventDefault(); step(1); }
  else if (["ArrowLeft", "ArrowUp"].includes(event.key)) { event.preventDefault(); step(-1); }
  else if (event.key === "Enter" && artworks[activeIndex()].href) {
    event.preventDefault(); window.open(artworks[activeIndex()].href, "_blank", "noopener,noreferrer");
  } else if (event.key === " ") { event.preventDefault(); togglePaused(); }
}
function togglePaused() {
  if (!ready) return;
  paused = !paused;
  scene?.setPaused(paused);
  syncPause();
}
async function startScene() {
  const generation = ++loadGeneration;
  if (disposed || reduced) { setReady(false); return; }
  try {
    const { createSpiral } = await import("./spiral/spiral-scene.js");
    if (disposed || reduced || generation !== loadGeneration) return;
    const instance = await createSpiral({
      canvas, container: stage,
      onReady() { if (!disposed && generation === loadGeneration) { scene = instance; setReady(true); updateHint(); } },
      onFallback() { if (!disposed && generation === loadGeneration) { scene = null; hovered = null; setReady(false); renderCaption(); updateHint(); } },
      onSelected(index) { if (!disposed && generation === loadGeneration) { selected = index; renderCaption(); } },
      onHover(index) { if (!disposed && generation === loadGeneration) { hovered = index; renderCaption(); } },
      onActivate(index) {
        const href = artworks[index]?.href;
        if (!disposed && href) window.open(href, "_blank", "noopener,noreferrer");
      },
    });
    if (disposed || reduced || generation !== loadGeneration) { instance?.dispose(); return; }
    scene = instance;
    scene?.setPaused(paused);
    if (!instance) setReady(false);
  } catch {
    if (generation === loadGeneration) setReady(false);
  }
}
function onMotionChange() {
  reduced = motion.matches;
  loadGeneration++;
  scene?.dispose();
  scene = null;
  setReady(false);
  if (!reduced) startScene();
  updateHint();
}
function onPageHide(event) {
  if (event.persisted) { scene?.setCovered(true); return; }
  disposed = true;
  cleanupProfileVisit();
  loadGeneration++;
  scene?.dispose();
  scene = null;
  cleanupWordmark();
  motion.removeEventListener("change", onMotionChange);
  pointer.removeEventListener("change", updatePointer);
  stage.removeEventListener("keydown", onKeyDown);
  stepButtons.forEach((button, index) => button.removeEventListener("click", stepHandlers[index]));
  pauseButton.removeEventListener("click", togglePaused);
}
function onPageShow(event) {
  if (!event.persisted) return;
  if (!motion.matches && scene) scene.setCovered(false);
  updateHint();
}

stepButtons.forEach((button, index) => button.addEventListener("click", stepHandlers[index]));
pauseButton.addEventListener("click", togglePaused);
stage.addEventListener("keydown", onKeyDown);
motion.addEventListener("change", onMotionChange);
pointer.addEventListener("change", updatePointer);
window.addEventListener("pagehide", onPageHide);
window.addEventListener("pageshow", onPageShow);
renderCaption();
updateHint();
if (!reduced) startScene();

function cleanupWordmark() {
  if (wordmarkCleanup) wordmarkCleanup();
}
let wordmarkCleanup = setupWordmark();

function setupWordmark() {
  const mark = document.querySelector(".wordmark");
  const prefix = mark.querySelector(".wordmark-prefix");
  const name = mark.querySelector(".wordmark-name");
  const dot = mark.querySelector(".wordmark-typed-dot");
  const measure = mark.querySelector(".wordmark-measure");
  const actions = mark.closest(".site-nav").querySelector(".header-actions");
  const reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");
  let cycle = 0;
  let steps = [];
  let stopped = false;
  const fit = () => {
    if (stopped) return;
    const available = actions.getBoundingClientRect().left - mark.getBoundingClientRect().left - 12;
    const fullWidth = measure.getBoundingClientRect().width;
    const prefixWidth = measure.firstElementChild.getBoundingClientRect().width;
    mark.style.setProperty("--wordmark-scale", String(Math.min(1, Math.max(1, available) / Math.max(1, fullWidth))));
    mark.style.setProperty("--wordmark-shift", `${-prefixWidth}px`);
  };
  const reset = () => {
    steps.forEach(window.clearTimeout);
    steps = [];
    mark.classList.remove("is-typing", "is-settling", "is-point");
    prefix.textContent = "";
    name.textContent = "";
    dot.style.opacity = "0";
  };
  const later = (fn, delay) => steps.push(window.setTimeout(fn, delay));
  const play = () => {
    if (stopped || document.hidden || reducedQuery.matches) return;
    reset(); fit(); mark.classList.add("is-typing");
    let time = 0;
    ["made", "by", "tatarin"].forEach((word, index) => {
      const target = index < 2 ? prefix : name;
      if (index) later(() => { prefix.textContent += " "; }, time);
      for (const letter of word) { time += 260; later(() => { target.textContent += letter; }, time); }
      time += 400;
    });
    later(() => { dot.style.opacity = "1"; mark.classList.add("is-point"); }, time);
    later(() => mark.classList.add("is-settling"), time + 900);
    later(reset, time + 1700);
  };
  const schedule = () => {
    window.clearTimeout(cycle); reset();
    if (document.hidden || reducedQuery.matches || stopped) return;
    const tick = () => { play(); cycle = window.setTimeout(tick, 30000); };
    cycle = window.setTimeout(tick, 30000);
  };
  const resize = new ResizeObserver(fit);
  resize.observe(actions); resize.observe(mark.closest(".site-nav"));
  document.fonts.ready.then(fit);
  document.addEventListener("visibilitychange", schedule);
  reducedQuery.addEventListener("change", schedule);
  schedule(); play();
  return () => {
    if (stopped) return;
    stopped = true;
    window.clearTimeout(cycle); reset(); resize.disconnect();
    document.removeEventListener("visibilitychange", schedule);
    reducedQuery.removeEventListener("change", schedule);
  };
}
