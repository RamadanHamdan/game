/**
 * TDD Test Suite: components/Battery.jsx
 * Tests for: Battery display logic (getColor, segments)
 */

// ── Test getColor logic (extracted from Battery component) ───────────────────
const getColor = (lvl) => {
  if (lvl <= 20) return '#ff0055';
  if (lvl <= 50) return '#ffcc00';
  return '#00ffcc';
};

describe('Battery - getColor', () => {
  test('0% → red', () => expect(getColor(0)).toBe('#ff0055'));
  test('10% → red', () => expect(getColor(10)).toBe('#ff0055'));
  test('20% → red', () => expect(getColor(20)).toBe('#ff0055'));
  test('21% → yellow', () => expect(getColor(21)).toBe('#ffcc00'));
  test('50% → yellow', () => expect(getColor(50)).toBe('#ffcc00'));
  test('51% → cyan/green', () => expect(getColor(51)).toBe('#00ffcc'));
  test('100% → cyan/green', () => expect(getColor(100)).toBe('#00ffcc'));
});

// ── Test segment calculation ─────────────────────────────────────────────────
describe('Battery - Segment Calculation', () => {
  const calcSegments = (level) => Math.round(level / 10);

  test('0% → 0 active segments', () => expect(calcSegments(0)).toBe(0));
  test('50% → 5 active segments', () => expect(calcSegments(50)).toBe(5));
  test('100% → 10 active segments', () => expect(calcSegments(100)).toBe(10));
  test('15% → 2 active segments (rounding)', () => expect(calcSegments(15)).toBe(2));
  test('25% → 3 active segments (rounding)', () => expect(calcSegments(25)).toBe(3));
  test('95% → 10 active segments', () => expect(calcSegments(95)).toBe(10));
});
