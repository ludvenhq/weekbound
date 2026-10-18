import { describe, expect, it } from 'vitest';
import { contourSegments, mulberry32 } from './contours.ts';

describe('the contour map', () => {
  it('is the same on every visit', () => {
    expect(contourSegments(320, 200, 9)).toEqual(contourSegments(320, 200, 9));
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('draws six heights, every line inside the area', () => {
    const levels = contourSegments(640, 400, 9);
    expect(levels).toHaveLength(6);
    expect(levels.some((level) => level.segments.length > 0)).toBe(true);
    for (const { segments } of levels) {
      for (const [x1, y1, x2, y2] of segments) {
        for (const value of [x1, y1, x2, y2]) expect(Number.isFinite(value)).toBe(true);
        expect(Math.min(x1, x2)).toBeGreaterThanOrEqual(0);
        expect(Math.min(y1, y2)).toBeGreaterThanOrEqual(0);
        expect(Math.max(x1, x2)).toBeLessThanOrEqual(648);
        expect(Math.max(y1, y2)).toBeLessThanOrEqual(405);
      }
    }
  });
});
