import assert from 'node:assert/strict';
import { constrainBox, resizeBox, videoCrop } from '../src/components/lensGeometry.ts';
const size = { width: 390, height: 844 };
assert.deepEqual(constrainBox({ left: -20, top: 900, width: 500, height: 20 }, size), { left: 0, top: 780, width: 390, height: 64 });
for (const corner of ['nw', 'ne', 'sw', 'se']) {
  for (const dx of [-1000, 1000]) for (const dy of [-1000, 1000]) {
    const b = resizeBox({ left: 50, top: 100, width: 200, height: 150 }, corner, dx, dy, size);
    assert.ok(b.width >= 64 && b.height >= 64 && b.left >= 0 && b.top >= 0 && b.left + b.width <= 390 && b.top + b.height <= 844);
    if (corner.includes('w')) assert.equal(b.left + b.width, 250); else assert.equal(b.left, 50);
    if (corner.includes('n')) assert.equal(b.top + b.height, 250); else assert.equal(b.top, 100);
  }
}
for (const display of [size, { width: 844, height: 390 }]) {
  for (const source of [{ width: 1920, height: 1080 }, { width: 1080, height: 1920 }, { width: 640, height: 480 }]) {
    const box = { left: 50, top: 100, width: 200, height: 150 };
    const crop = videoCrop(box, display, source);
    const scale = Math.max(display.width/source.width, display.height/source.height);
    const offsetX = (source.width*scale-display.width)/2;
    const offsetY = (source.height*scale-display.height)/2;
    assert.ok(Math.abs(crop.left*scale-offsetX-(box.left+2)) < 1e-8);
    assert.ok(Math.abs(crop.top*scale-offsetY-(box.top+2)) < 1e-8);
    assert.ok(Math.abs(crop.width*scale-(box.width-4)) < 1e-8);
    assert.ok(crop.left >= 0 && crop.top >= 0 && crop.left+crop.width <= source.width && crop.top+crop.height <= source.height);
  }
}
assert.equal(videoCrop({ left: 0, top: 0, width: 64, height: 64 }, { width: 0, height: 0 }, size), null);
console.log('PASS: 16 corner boundary cases, 6 cover mappings, bounds and zero-size guards');

