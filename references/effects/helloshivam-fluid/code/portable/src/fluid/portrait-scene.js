/** Responsive DOM-to-texture mapping helpers for the GPU hero scene. */
export function containRect(boxWidth, boxHeight, imageWidth, imageHeight) {
  if (!(boxWidth > 0 && boxHeight > 0 && imageWidth > 0 && imageHeight > 0)) return [0, 0, 0, 0];
  const scale = Math.min(boxWidth / imageWidth, boxHeight / imageHeight);
  const width = imageWidth * scale / boxWidth;
  const height = imageHeight * scale / boxHeight;
  return [(1 - width) / 2, 0, width, height]; // center bottom
}

export function rectInHero(rect, heroRect) {
  return [(rect.left - heroRect.left) / heroRect.width, (heroRect.bottom - rect.bottom) / heroRect.height,
    rect.width / heroRect.width, rect.height / heroRect.height];
}

export function atlasRects(sizes, scale = 2, gutter = 2) {
  if (!sizes.length) return { width: 1, height: 1, rects: [] };
  const widths = sizes.map(({ width }) => Math.max(1, width));
  const maxHeight = Math.max(1, ...sizes.map(({ height }) => height));
  const height = maxHeight + gutter * 2;
  const total = widths.reduce((sum, width) => sum + width, 0) + gutter * (widths.length + 1);
  let offset = gutter;
  const rects = widths.map((width, index) => {
    const itemHeight = Math.max(1, sizes[index].height);
    const rect = [offset / total, (gutter + (maxHeight - itemHeight) / 2) / height,
      width / total, itemHeight / height];
    offset += width + gutter;
    return rect;
  });
  return { width: Math.ceil(total * scale), height: Math.ceil(height * scale), rects, scale, gutter };
}

export class PortraitScene {
  constructor(gl, hero, onReady = () => {}) {
    this.gl = gl;
    this.hero = hero;
    this.destroyed = false;
    this.ready = false;
    this.readyQueued = false;
    this.atlasBounds = [];
    this.photo = gl.createTexture();
    this.atlas = gl.createTexture();
    this.image = hero.querySelector('.hero-portrait');
    this.words = [...hero.querySelectorAll('.hero-word')].slice(0, 5);
    this.onReady = onReady;
    this.initTexture(this.photo);
    this.initTexture(this.atlas);
    this.loadPhoto();
    this.buildAtlas();
    this.fontPromise = document.fonts?.ready;
    this.fontPromise?.then(() => { if (!this.destroyed) { this.buildAtlas(); this.notifyReady(); } }).catch(() => {});
    this.handleImageLoad = () => { if (!this.destroyed) this.loadPhoto(); };
    this.image?.addEventListener('load', this.handleImageLoad);
  }
  initTexture(texture) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,0]));
  }
  loadPhoto() {
    if (this.destroyed || !this.image || !this.image.complete || !this.image.naturalWidth) return;
    try {
      const gl = this.gl;
      gl.activeTexture(gl.TEXTURE0 + 2); gl.bindTexture(gl.TEXTURE_2D, this.photo);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image); }
      finally { gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); }
      this.photoSize = [this.image.naturalWidth, this.image.naturalHeight];
      this.notifyReady();
    } catch { /* Keep the regular fluid display when the image cannot be uploaded. */ }
  }
  buildAtlas() {
    if (this.destroyed) return;
    if (!this.words.length) { this.atlasReady = true; return; }
    try {
    const canvas = document.createElement('canvas');
    const styles = this.words.map(word => getComputedStyle(word));
    const sizes = this.words.map(word => {
      const bounds = word.getBoundingClientRect();
      return { width: Math.max(1, bounds.width), height: Math.max(1, bounds.height) };
    });
    const layout = atlasRects(sizes);
    canvas.width = layout.width; canvas.height = layout.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.scale(layout.scale, layout.scale);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
    let x = layout.gutter;
    const maxHeight = sizes.reduce((max, size) => Math.max(max, size.height), 0);
    this.words.forEach((word, index) => {
      const style = styles[index], bounds = sizes[index];
      ctx.font = style.font || `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      ctx.fillText(word.textContent.trim(), x + bounds.width / 2, layout.gutter + maxHeight / 2, bounds.width);
      x += bounds.width + layout.gutter;
    });
    ctx.restore();
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + 3); gl.bindTexture(gl.TEXTURE_2D, this.atlas);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas); }
    finally { gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); }
    this.atlasBounds = layout.rects;
    this.atlasReady = true;
    this.notifyReady();
    } catch { /* Keep the regular fluid display when the atlas cannot be built. */ }
  }
  notifyReady() {
    if (this.destroyed || !this.photoSize || (this.words.length && !this.atlasReady) || this.readyQueued) return;
    this.ready = true;
    this.readyQueued = true;
    Promise.resolve().then(() => {
      this.readyQueued = false;
      if (this.destroyed || !this.ready) return;
      try { this.onReady(); } catch { /* Async resource readiness must not escape its event. */ }
    });
  }
  uniforms(renderer, time) {
    const heroRect = this.hero.getBoundingClientRect();
    const imageBox = this.image.getBoundingClientRect();
    const fit = containRect(imageBox.width, imageBox.height, ...this.photoSize);
    const imageBounds = rectInHero(imageBox, heroRect);
    const portraitRect = [imageBounds[0] + fit[0] * imageBounds[2], imageBounds[1],
      fit[2] * imageBounds[2], fit[3] * imageBounds[3]];
    renderer.texture('uPortrait', { texture: this.photo }, 2);
    renderer.texture('uWords', { texture: this.atlas }, 3);
    renderer.uniform('portraitRect', '4f', ...portraitRect);
    renderer.uniform('time', '1f', time / 1000);
    renderer.uniform('heroSize', '2f', heroRect.width, heroRect.height);
    for (let i = 0; i < 5; i++) {
      const word = this.words[i];
      const bounds = word ? rectInHero(word.getBoundingClientRect(), heroRect) : [0,0,0,0];
      const atlas = this.atlasBounds[i] || [0,0,0,0];
      renderer.uniform(`wordRect${i}`, '4f', ...bounds);
      renderer.uniform(`wordAtlas${i}`, '4f', ...atlas);
    }
  }
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.image?.removeEventListener('load', this.handleImageLoad);
    this.gl.deleteTexture(this.photo); this.gl.deleteTexture(this.atlas);
  }
}
