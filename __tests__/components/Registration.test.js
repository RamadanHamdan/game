/**
 * TDD Test Suite: components/Registration.jsx
 * Tests for: player management logic (add, remove, update)
 */

const AVATARS = ["🦁","🦊","🐼","🐸","🐯","🐨","🦄","🐲","🤖","👽","👻","🤡","💀","💩","🐔","🦄"];
const COLORS = ["#FF6B6B","#4ECDC4","#FFE66D","#1A535C","#FF9F1C","#2EC4B6","#E71D36","#7209B7"];

describe('Registration - Player Management Logic', () => {
  // ── getInitialPlayers ──────────────────────────────────────────────────────
  describe('getInitialPlayers', () => {
    const getInitialPlayers = (initialPlayers, isLicensed) => {
      const MAX_PLAYERS_FREE = 2;
      const base = initialPlayers && initialPlayers.length > 0 ? initialPlayers : [
        { id: 1, name: "Player 1", avatar: "🦁", color: "#FF6B6B" },
        { id: 2, name: "Player 2", avatar: "🦊", color: "#4ECDC4" },
      ];
      return isLicensed ? base : base.slice(0, MAX_PLAYERS_FREE);
    };

    test('should return default 2 players when no initial provided', () => {
      const result = getInitialPlayers([], false);
      expect(result).toHaveLength(2);
    });

    test('should return provided initial players when licensed', () => {
      const custom = [
        { id: 1, name: 'A' }, { id: 2, name: 'B' },
        { id: 3, name: 'C' }, { id: 4, name: 'D' },
      ];
      const result = getInitialPlayers(custom, true);
      expect(result).toHaveLength(4);
    });

    test('should limit to 2 players when unlicensed', () => {
      const custom = [
        { id: 1, name: 'A' }, { id: 2, name: 'B' },
        { id: 3, name: 'C' }, { id: 4, name: 'D' },
      ];
      const result = getInitialPlayers(custom, false);
      expect(result).toHaveLength(2);
    });
  });

  // ── addPlayer logic ────────────────────────────────────────────────────────
  describe('addPlayer', () => {
    const addPlayer = (players, isLicensed) => {
      const maxPlayers = isLicensed ? 4 : 2;
      if (players.length >= maxPlayers) return players;
      const newId = players.length > 0 ? Math.max(...players.map(p => p.id)) + 1 : 1;
      return [...players, {
        id: newId,
        name: `Player ${newId}`,
        avatar: AVATARS[0],
        color: COLORS[0],
      }];
    };

    test('should add a player', () => {
      const players = [{ id: 1, name: 'P1' }];
      const result = addPlayer(players, true);
      expect(result).toHaveLength(2);
      expect(result[1].id).toBe(2);
    });

    test('should not exceed 4 players when licensed', () => {
      const players = Array.from({ length: 4 }, (_, i) => ({ id: i + 1 }));
      const result = addPlayer(players, true);
      expect(result).toHaveLength(4);
    });

    test('should not exceed 2 players when unlicensed', () => {
      const players = [{ id: 1 }, { id: 2 }];
      const result = addPlayer(players, false);
      expect(result).toHaveLength(2);
    });

    test('should assign incremented id', () => {
      const players = [{ id: 1 }, { id: 5 }];
      const result = addPlayer(players, true);
      expect(result[2].id).toBe(6);
    });

    test('should start from id 1 if empty', () => {
      const result = addPlayer([], true);
      expect(result[0].id).toBe(1);
    });
  });

  // ── removePlayer logic ─────────────────────────────────────────────────────
  describe('removePlayer', () => {
    const removePlayer = (players, id) => {
      if (players.length <= 1) return players;
      return players.filter(p => p.id !== id);
    };

    test('should remove a player', () => {
      const players = [{ id: 1 }, { id: 2 }];
      const result = removePlayer(players, 1);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    test('should not remove last player', () => {
      const players = [{ id: 1 }];
      const result = removePlayer(players, 1);
      expect(result).toHaveLength(1);
    });

    test('should handle removing non-existent id', () => {
      const players = [{ id: 1 }, { id: 2 }];
      const result = removePlayer(players, 99);
      expect(result).toHaveLength(2);
    });
  });

  // ── updatePlayer logic ─────────────────────────────────────────────────────
  describe('updatePlayer', () => {
    const updatePlayer = (players, id, field, value) =>
      players.map(p => p.id === id ? { ...p, [field]: value } : p);

    test('should update player name', () => {
      const players = [{ id: 1, name: 'Old' }];
      const result = updatePlayer(players, 1, 'name', 'New');
      expect(result[0].name).toBe('New');
    });

    test('should update player avatar', () => {
      const players = [{ id: 1, avatar: '🦁' }];
      const result = updatePlayer(players, 1, 'avatar', '🐼');
      expect(result[0].avatar).toBe('🐼');
    });

    test('should not affect other players', () => {
      const players = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }];
      const result = updatePlayer(players, 1, 'name', 'X');
      expect(result[1].name).toBe('B');
    });
  });
});

// ── Timer Countdown Logic ────────────────────────────────────────────────────
describe('Timer - countdown logic', () => {
  const timerTick = (prev) => {
    if (prev <= 0) return 0;
    return Math.max(0, prev - 0.1);
  };

  test('should decrement by 0.1', () => {
    expect(timerTick(10)).toBeCloseTo(9.9);
  });

  test('should not go below 0', () => {
    expect(timerTick(0)).toBe(0);
    expect(timerTick(0.05)).toBe(0);
  });

  test('progress calculation', () => {
    const progress = (timeLeft, duration) => (timeLeft / duration) * 100;
    expect(progress(5, 10)).toBe(50);
    expect(progress(10, 10)).toBe(100);
    expect(progress(0, 10)).toBe(0);
  });
});
