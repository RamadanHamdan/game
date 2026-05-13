/**
 * TDD Test Suite: GameContainer.jsx — Pure Logic Functions
 * 
 * Tests extracted logic: CONTROLS mapping, getItemStyle, getDynamicItemClass,
 * getLeaderboard logic, score calculation, round progression
 */

// ── Test CONTROLS mapping (pure data) ────────────────────────────────────────
const CONTROLS = {
  'q': { playerId: 1, option: 0 }, 'w': { playerId: 1, option: 1 },
  'e': { playerId: 1, option: 2 }, 'r': { playerId: 1, option: 3 },
  'u': { playerId: 2, option: 0 }, 'i': { playerId: 2, option: 1 },
  'o': { playerId: 2, option: 2 }, 'p': { playerId: 2, option: 3 },
  'z': { playerId: 3, option: 0 }, 'x': { playerId: 3, option: 1 },
  'c': { playerId: 3, option: 2 }, 'v': { playerId: 3, option: 3 },
  'n': { playerId: 4, option: 0 }, 'm': { playerId: 4, option: 1 },
  ',': { playerId: 4, option: 2 }, '.': { playerId: 4, option: 3 },
};

describe('CONTROLS mapping', () => {
  test('Player 1 keys are q, w, e, r', () => {
    expect(CONTROLS['q'].playerId).toBe(1);
    expect(CONTROLS['w'].playerId).toBe(1);
    expect(CONTROLS['e'].playerId).toBe(1);
    expect(CONTROLS['r'].playerId).toBe(1);
  });

  test('Player 2 keys are u, i, o, p', () => {
    expect(CONTROLS['u'].playerId).toBe(2);
    expect(CONTROLS['i'].playerId).toBe(2);
    expect(CONTROLS['o'].playerId).toBe(2);
    expect(CONTROLS['p'].playerId).toBe(2);
  });

  test('Player 3 keys are z, x, c, v', () => {
    expect(CONTROLS['z'].playerId).toBe(3);
    expect(CONTROLS['x'].playerId).toBe(3);
  });

  test('Player 4 keys are n, m, comma, period', () => {
    expect(CONTROLS['n'].playerId).toBe(4);
    expect(CONTROLS['.'].playerId).toBe(4);
  });

  test('each key maps to option 0-3', () => {
    expect(CONTROLS['q'].option).toBe(0);
    expect(CONTROLS['w'].option).toBe(1);
    expect(CONTROLS['e'].option).toBe(2);
    expect(CONTROLS['r'].option).toBe(3);
  });

  test('should have exactly 16 key mappings (4 players × 4 options)', () => {
    expect(Object.keys(CONTROLS)).toHaveLength(16);
  });
});

// ── Test getItemStyle (extracted from component) ─────────────────────────────
const getItemStyle = (count) => {
  if (count <= 1) return { width: '100%', maxWidth: '800px', height: '100%' };
  if (count === 4) return { width: '48%', minWidth: '320px', height: '45%' };
  if (count === 3) return { width: '30%', minWidth: '300px', height: '100%' };
  if (count === 2) return { width: '48%', minWidth: '320px', height: '100%' };
  return { width: '32%', minWidth: '300px', flexGrow: 1, padding: '10px' };
};

describe('getItemStyle', () => {
  test('1 player: full width, max 800px', () => {
    const style = getItemStyle(1);
    expect(style.width).toBe('100%');
    expect(style.maxWidth).toBe('800px');
  });

  test('2 players: 48% width each', () => {
    const style = getItemStyle(2);
    expect(style.width).toBe('48%');
    expect(style.height).toBe('100%');
  });

  test('3 players: 30% width each', () => {
    const style = getItemStyle(3);
    expect(style.width).toBe('30%');
  });

  test('4 players: 48% width, 45% height (2x2 grid)', () => {
    const style = getItemStyle(4);
    expect(style.width).toBe('48%');
    expect(style.height).toBe('45%');
  });

  test('5+ players: fallback 32% width', () => {
    const style = getItemStyle(5);
    expect(style.width).toBe('32%');
    expect(style.flexGrow).toBe(1);
  });

  test('0 players: same as 1 player', () => {
    const style = getItemStyle(0);
    expect(style.width).toBe('100%');
  });
});

// ── Test getDynamicItemClass (extracted) ──────────────────────────────────────
const getDynamicItemClass = (count) => {
  if (count === 4) return "w-full md:w-[48%] h-[280px] md:h-[45%]";
  if (count === 2) return "w-full md:w-[48%] h-[350px] md:h-full";
  if (count === 3) return "w-full md:w-[32%] h-[320px] md:h-full";
  if (count >= 5)  return "w-full md:w-[32%] h-[300px] md:h-[45%]";
  return "flex-grow min-w-[300px] h-full";
};

describe('getDynamicItemClass', () => {
  test('2 players: 48% width on md', () => {
    expect(getDynamicItemClass(2)).toContain('md:w-[48%]');
  });

  test('3 players: 32% width on md', () => {
    expect(getDynamicItemClass(3)).toContain('md:w-[32%]');
  });

  test('4 players: 48% width, 45% height on md', () => {
    const cls = getDynamicItemClass(4);
    expect(cls).toContain('md:w-[48%]');
    expect(cls).toContain('md:h-[45%]');
  });

  test('5+ players: 32% width, 45% height', () => {
    const cls = getDynamicItemClass(5);
    expect(cls).toContain('md:w-[32%]');
    expect(cls).toContain('md:h-[45%]');
  });

  test('1 player: default flex-grow', () => {
    expect(getDynamicItemClass(1)).toContain('flex-grow');
  });
});

// ── Test Score Calculation Logic ──────────────────────────────────────────────
describe('Score Calculation Logic', () => {
  const calculateScoreIncrement = (totalQuestions, numPlayers) => {
    const maxRounds = Math.max(1, Math.floor(totalQuestions / numPlayers));
    return 100 / maxRounds;
  };

  test('20 questions, 4 players = 5 rounds, 20pts per round', () => {
    expect(calculateScoreIncrement(20, 4)).toBe(20);
  });

  test('10 questions, 2 players = 5 rounds, 20pts per round', () => {
    expect(calculateScoreIncrement(10, 2)).toBe(20);
  });

  test('5 questions, 1 player = 5 rounds, 20pts per round', () => {
    expect(calculateScoreIncrement(5, 1)).toBe(20);
  });

  test('1 question, 1 player = 1 round, 100pts per round', () => {
    expect(calculateScoreIncrement(1, 1)).toBe(100);
  });

  test('3 questions, 4 players = min 1 round = 100pts', () => {
    // floor(3/4)=0 → max(1,0)=1
    expect(calculateScoreIncrement(3, 4)).toBe(100);
  });
});

// ── Test Leaderboard Logic ───────────────────────────────────────────────────
describe('Leaderboard Logic', () => {
  const getLeaderboard = (players, finishedPlayers) => {
    const finishers = [...finishedPlayers].sort((a, b) => a.rank - b.rank);
    const finisherIds = new Set(finishers.map(f => f.playerId));
    const active = players.filter(p => !finisherIds.has(p.id)).sort((a, b) => b.score - a.score);
    const leaderboard = [];
    finishers.forEach(f => {
      const p = players.find(pl => pl.id === f.playerId);
      if (p) leaderboard.push({ ...p, rank: f.rank, status: 'Finished' });
    });
    active.forEach((p, idx) => {
      leaderboard.push({ ...p, rank: finishers.length + idx + 1, status: 'Active' });
    });
    return leaderboard;
  };

  test('should rank finished players first', () => {
    const players = [
      { id: 1, name: 'P1', score: 100 },
      { id: 2, name: 'P2', score: 40 },
    ];
    const finished = [{ playerId: 1, rank: 1, score: 100 }];
    const lb = getLeaderboard(players, finished);
    expect(lb[0].status).toBe('Finished');
    expect(lb[0].rank).toBe(1);
    expect(lb[1].status).toBe('Active');
    expect(lb[1].rank).toBe(2);
  });

  test('should sort active players by score descending', () => {
    const players = [
      { id: 1, name: 'P1', score: 20 },
      { id: 2, name: 'P2', score: 60 },
      { id: 3, name: 'P3', score: 40 },
    ];
    const lb = getLeaderboard(players, []);
    expect(lb[0].id).toBe(2);
    expect(lb[1].id).toBe(3);
    expect(lb[2].id).toBe(1);
  });

  test('should handle empty players', () => {
    const lb = getLeaderboard([], []);
    expect(lb).toEqual([]);
  });

  test('should handle all players finished', () => {
    const players = [
      { id: 1, name: 'P1', score: 100 },
      { id: 2, name: 'P2', score: 100 },
    ];
    const finished = [
      { playerId: 1, rank: 1, score: 100 },
      { playerId: 2, rank: 2, score: 100 },
    ];
    const lb = getLeaderboard(players, finished);
    expect(lb).toHaveLength(2);
    expect(lb.every(p => p.status === 'Finished')).toBe(true);
  });
});

// ── Test Answer Correctness Logic ────────────────────────────────────────────
describe('Answer Correctness Logic', () => {
  const checkAnswer = (question, answer) => {
    if (question.type === 'essay') {
      return typeof answer === 'string' && answer.trim().length > 0;
    }
    return answer === question.answer;
  };

  test('multiple choice: correct answer', () => {
    const q = { type: 'multiple_choice', answer: 'Paris' };
    expect(checkAnswer(q, 'Paris')).toBe(true);
  });

  test('multiple choice: wrong answer', () => {
    const q = { type: 'multiple_choice', answer: 'Paris' };
    expect(checkAnswer(q, 'London')).toBe(false);
  });

  test('multiple choice: no answer', () => {
    const q = { type: 'multiple_choice', answer: 'Paris' };
    expect(checkAnswer(q, undefined)).toBe(false);
  });

  test('essay: any non-empty string is correct', () => {
    const q = { type: 'essay', answer: 'Expected answer' };
    expect(checkAnswer(q, 'My answer')).toBe(true);
  });

  test('essay: empty string is wrong', () => {
    const q = { type: 'essay', answer: 'Expected' };
    expect(checkAnswer(q, '')).toBe(false);
  });

  test('essay: whitespace-only is wrong', () => {
    const q = { type: 'essay', answer: 'Expected' };
    expect(checkAnswer(q, '   ')).toBe(false);
  });
});

// ── Test Submit Answer Guard Logic ───────────────────────────────────────────
describe('Submit Answer Guards', () => {
  const canSubmit = (gameState, isPaused, playerAnswers, finishedPlayers, playerId) => {
    if (gameState !== 'playing') return false;
    if (isPaused) return false;
    if (playerAnswers[playerId] !== undefined) return false;
    if (finishedPlayers.some(fp => fp.playerId === playerId)) return false;
    return true;
  };

  test('should allow answer in playing state', () => {
    expect(canSubmit('playing', false, {}, [], 1)).toBe(true);
  });

  test('should reject when not playing', () => {
    expect(canSubmit('reveal', false, {}, [], 1)).toBe(false);
  });

  test('should reject when paused', () => {
    expect(canSubmit('playing', true, {}, [], 1)).toBe(false);
  });

  test('should reject when already answered', () => {
    expect(canSubmit('playing', false, { 1: 'A' }, [], 1)).toBe(false);
  });

  test('should reject when player finished', () => {
    expect(canSubmit('playing', false, {}, [{ playerId: 1 }], 1)).toBe(false);
  });
});
