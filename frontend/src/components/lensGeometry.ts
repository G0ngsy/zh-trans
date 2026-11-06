export interface Box { left: number; top: number; width: number; height: number }
export interface Size { width: number; height: number }
export type Corner = 'nw' | 'ne' | 'sw' | 'se';
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
export function constrainBox(box: Box, size: Size): Box {
  const width = clamp(box.width, Math.min(64, size.width), size.width);
  const height = clamp(box.height, Math.min(64, size.height), size.height);
  return { width, height, left: clamp(box.left, 0, size.width - width), top: clamp(box.top, 0, size.height - height) };
}
export function resizeBox(box: Box, corner: Corner, dx: number, dy: number, size: Size): Box {
  let { left, top } = box;
  let right = left + box.width;
  let bottom = top + box.height;
  const minW = Math.min(64, size.width), minH = Math.min(64, size.height);
  if (corner.includes('w')) left = clamp(left + dx, 0, right - minW);
  else right = clamp(right + dx, left + minW, size.width);
  if (corner.includes('n')) top = clamp(top + dy, 0, bottom - minH);
  else bottom = clamp(bottom + dy, top + minH, size.height);
  return { left, top, width: right - left, height: bottom - top };
}
// object-cover with centered object-position; box excludes its 2px border.
export function videoCrop(box: Box, display: Size, source: Size): Box | null {
  if (Math.min(display.width, display.height, source.width, source.height) <= 0) return null;
  const scale = Math.max(display.width / source.width, display.height / source.height);
  const offsetX = (source.width * scale - display.width) / 2;
  const offsetY = (source.height * scale - display.height) / 2;
  const left = clamp((box.left + 2 + offsetX) / scale, 0, source.width);
  const top = clamp((box.top + 2 + offsetY) / scale, 0, source.height);
  const right = clamp((box.left + box.width - 2 + offsetX) / scale, 0, source.width);
  const bottom = clamp((box.top + box.height - 2 + offsetY) / scale, 0, source.height);
  return right > left && bottom > top ? { left, top, width: right - left, height: bottom - top } : null;
}
