import test from 'node:test';
import assert from 'node:assert/strict';
import { atlasRects, containRect, rectInHero, PortraitScene } from '../src/fluid/portrait-scene.js';

test('portrait contain mapping honors the image box and bottom alignment', () => {
  assert.deepEqual(containRect(400, 600, 200, 400), [0.125, 0, 0.75, 1]);
  const hero = { left: 10, top: 20, right: 610, bottom: 820, width: 600, height: 800 };
  const photoBox = { left: 110, top: 60, right: 510, bottom: 800, width: 400, height: 740 };
  assert.deepEqual(rectInHero(photoBox, hero), [1/6, 0.025, 2/3, 0.925]);
});

test('word atlas crops use each word’s measured dimensions', () => {
  const { rects } = atlasRects([{ width: 22, height: 32 }, { width: 84, height: 32 }]);
  assert.equal(rects.length, 2);
  for (const [x, y, width, height] of rects) {
    assert.ok(x >= 0 && y >= 0 && width > 0 && height > 0);
    assert.ok(x + width <= 1 && y + height <= 1);
  }
  assert.ok(rects[0][2] < rects[1][2]);
  assert.equal(rects[0][3], rects[1][3]);
});

test('cached photo readiness is asynchronous and is canceled by destroy', async () => {
  const previousDocument = globalThis.document;
  globalThis.document = { fonts: {} };
  try {
    const gl = {
      TEXTURE_2D: 1, TEXTURE_MIN_FILTER: 2, TEXTURE_MAG_FILTER: 3, TEXTURE_WRAP_S: 4,
      TEXTURE_WRAP_T: 5, LINEAR: 6, CLAMP_TO_EDGE: 7, RGBA: 8, UNSIGNED_BYTE: 9,
      TEXTURE0: 10, UNPACK_FLIP_Y_WEBGL: 11,
      createTexture: () => ({}), bindTexture() {}, texParameteri() {}, texImage2D() {},
      activeTexture() {}, pixelStorei() {}, deleteTexture() {},
    };
    const imageListeners = new Map();
    const image = { complete: true, naturalWidth: 1122, naturalHeight: 1402,
      addEventListener(type, fn) { imageListeners.set(type, fn); },
      removeEventListener(type) { imageListeners.delete(type); } };
    const hero = { querySelector: () => image, querySelectorAll: () => [], getBoundingClientRect: () => ({}) };
    let scene, callbacks = 0;
    scene = new PortraitScene(gl, hero, () => { assert.ok(scene); callbacks++; });
    assert.equal(callbacks, 0, 'constructor must not invoke the controller reentrantly');
    await Promise.resolve();
    assert.equal(callbacks, 1);
    scene.destroy();

    let canceled = 0;
    const late = new PortraitScene(gl, hero, () => { canceled++; });
    late.destroy();
    await Promise.resolve();
    assert.equal(canceled, 0);
    assert.equal(imageListeners.size, 0);
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
});
