/**
 * TDD Test Suite: components/PlayerCard.jsx
 * Tests for: getRankStyle logic
 */

// ── Test getRankStyle (extracted from PlayerCard) ────────────────────────────
const getRankStyle = (r) => {
  if (r === 1) return 'bg-yellow-400 text-black border-yellow-200 shadow-[0_0_15px_rgba(255,215,0,0.5)]';
  if (r === 2) return 'bg-gray-300 text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]';
  if (r === 3) return 'bg-orange-400 text-black border-orange-200 shadow-[0_0_10px_rgba(255,165,0,0.3)]';
  return 'bg-white/10 text-white/50 border-white/5';
};

describe('PlayerCard - getRankStyle', () => {
  test('rank 1 → gold style', () => {
    expect(getRankStyle(1)).toContain('bg-yellow-400');
    expect(getRankStyle(1)).toContain('text-black');
  });

  test('rank 2 → silver style', () => {
    expect(getRankStyle(2)).toContain('bg-gray-300');
  });

  test('rank 3 → bronze style', () => {
    expect(getRankStyle(3)).toContain('bg-orange-400');
  });

  test('rank 4+ → default subtle style', () => {
    expect(getRankStyle(4)).toContain('bg-white/10');
    expect(getRankStyle(10)).toContain('text-white/50');
  });
});
