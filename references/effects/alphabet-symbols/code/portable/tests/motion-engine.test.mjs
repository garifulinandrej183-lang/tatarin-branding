import test from 'node:test';
import assert from 'node:assert/strict';
import { beginRingDrag, createLayout, Gesture, resizeRing, validLayout } from '../src/motion/motion-math.js';
import { signatureBeat, SignatureSchedule } from '../src/motion/motion-signature.js';

test('500 generated motion layouts protect the disc and keep accepted ring drags anchored', () => {
  let accepted = 0;
  for (let seed = 1; seed <= 500; seed++) {
    const layout = createLayout(seed);
    assert.ok(validLayout(layout), `seed ${seed} must produce a valid layout`);
    for (let index = 0; index < layout.rings.length; index++) {
      const ring = layout.rings[index];
      const pointer = { x: ring.x + ring.radius, y: ring.y };
      const drag = beginRingDrag(layout, index, pointer);
      for (const delta of [-1800, -700, -120, 0, 120, 700, 1800]) {
        const resized = resizeRing(layout, drag, { x: pointer.x + delta, y: pointer.y + delta * .2 });
        if (!resized) continue;
        accepted++;
        const candidate = { ...layout, rings: layout.rings.map((item, i) => i === index ? resized : item) };
        assert.ok(validLayout(candidate), 'an accepted drag must preserve the protected disc area');
        assert.ok(Math.abs(resized.x + drag.direction.x * resized.radius - drag.anchor.x) < 1e-6);
        assert.ok(Math.abs(resized.y + drag.direction.y * resized.radius - drag.anchor.y) < 1e-6);
      }
    }
  }
  assert.ok(accepted > 0);
});

test('gesture source distinguishes taps, drags, scrolls and cancelled or multi-touch input', () => {
  const gesture = new Gesture();
  assert.ok(gesture.down(1, { x: 0, y: 0 }, false));
  assert.equal(gesture.up(1), true);
  gesture.down(1, { x: 0, y: 0 }, false);
  gesture.move(1, { x: 30, y: 0 });
  assert.equal(gesture.up(1), false);
  gesture.down(1, { x: 0, y: 0 }, true);
  gesture.move(1, { x: 0, y: 100 });
  assert.equal(gesture.up(1), false, 'a touch scroll must not regenerate');
  gesture.down(1, { x: 0, y: 0 }, true);
  gesture.cancel(1);
  assert.equal(gesture.up(1), false);
  gesture.down(1, { x: 0, y: 0 }, true);
  assert.equal(gesture.down(2, { x: 1, y: 1 }, true), false);
  assert.equal(gesture.up(2), false);
  assert.equal(gesture.up(1), false);
  gesture.down(3, { x: 10, y: 10 }, true);
  assert.equal(gesture.up(3), true, 'a fresh touch must work after multi-touch cancellation');
});

test('signature timing preserves gather, pulse, scatter, hold, cooldown and restart on the animation clock', () => {
  assert.equal(signatureBeat(10).phase, 'gather');
  assert.equal(signatureBeat(10 + .849).phase, 'gather');
  assert.equal(signatureBeat(10 + .851).phase, 'pulse');
  assert.equal(signatureBeat(10 + .85 + 5 + .001).phase, 'scatter');
  assert.equal(signatureBeat(10 + .85 + 5 + 1.2 + .001).phase, 'hold');

  const schedule = new SignatureSchedule();
  schedule.interrupt(100, true);
  assert.equal(schedule.beat(4, 100).phase, 'burst');
  assert.equal(schedule.remaining(100), 30);
  assert.equal(schedule.beat(4, 101.2).phase, 'cooldown');
  assert.equal(schedule.remaining(129.2), 1);
  assert.equal(schedule.beat(15, 130).phase, 'gather');
  assert.equal(schedule.beat(15.851, 130.851).phase, 'pulse');
  assert.equal(schedule.remaining(130), 0);
});
