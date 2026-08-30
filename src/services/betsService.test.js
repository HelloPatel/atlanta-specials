import { describe, it, expect, vi } from 'vitest';

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  onSnapshot: vi.fn(),
  collection: vi.fn(),
  addDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  serverTimestamp: vi.fn(),
}));
vi.mock('../../firebase', () => ({ db: {} }));
vi.mock('../../config/constants', () => ({
  COLLECTIONS: { WEDDINGS: 'weddings', BETS: 'bets' },
}));

import { validateGuestName, calculateLeaderboard, POINTS_PER_QUESTION } from './betsService';

describe('betsService', () => {
  describe('validateGuestName', () => {
    it('accepts valid names', () => {
      expect(validateGuestName('Rushi Patel')).toBe('');
      expect(validateGuestName("O'Brien")).toBe('');
      expect(validateGuestName('Mary-Jane')).toBe('');
    });

    it('rejects too short names', () => {
      expect(validateGuestName('R')).toContain('full name');
      expect(validateGuestName(' ')).toContain('full name');
    });

    it('rejects too long names', () => {
      const longName = 'A'.repeat(41);
      expect(validateGuestName(longName)).toContain('too long');
    });

    it('rejects names with special chars', () => {
      expect(validateGuestName('Rushi@123')).toContain('letters only');
      expect(validateGuestName('Guest123')).toContain('letters only');
    });

    it('rejects bad words', () => {
      // Clean names — including ones that naive substring matching would wrongly flag
      expect(validateGuestName('Priya Sharma')).toBe('');
      expect(validateGuestName('Harshit Shah')).toBe(''); // contains "shit" as a substring
      expect(validateGuestName('Cassandra')).toBe(''); // contains "ass" as a substring
      expect(validateGuestName('Dickson')).toBe(''); // contains "dick" as a substring
      // Actual profanity as a standalone word is rejected
      expect(validateGuestName('Fuck You')).toContain('clean name');
      expect(validateGuestName('Bitch')).toContain('clean name');
      // Spaced / punctuated obfuscation is still caught
      expect(validateGuestName('f u c k')).toContain('clean name');
      expect(validateGuestName("s-h-i-t")).toContain('clean name');
    });

    it('trims whitespace before validating', () => {
      expect(validateGuestName('  Rushi Patel  ')).toBe('');
    });
  });

  describe('calculateLeaderboard', () => {
    const questions = [
      { id: 'q1', text: 'Who cries first?', options: ['Bride', 'Groom'] },
      { id: 'q2', text: 'First dance?', options: ['Bride', 'Groom', 'Both'] },
      { id: 'q3', text: 'Cake smash?', options: ['Yes', 'No'] },
    ];

    const correctAnswers = { q1: 'Groom', q2: 'Both' };

    const votes = [
      { id: 'v1', guestName: 'Alice', answers: { q1: 'Groom', q2: 'Both' } },
      { id: 'v2', guestName: 'Bob', answers: { q1: 'Bride', q2: 'Both' } },
      { id: 'v3', guestName: 'Charlie', answers: { q1: 'Bride', q2: 'Bride' } },
    ];

    it('calculates correct scores', () => {
      const board = calculateLeaderboard(questions, correctAnswers, votes);
      expect(board[0].guestName).toBe('Alice');
      expect(board[0].score).toBe(2 * POINTS_PER_QUESTION); // 2 correct
      expect(board[1].guestName).toBe('Bob');
      expect(board[1].score).toBe(1 * POINTS_PER_QUESTION); // 1 correct
      expect(board[2].guestName).toBe('Charlie');
      expect(board[2].score).toBe(0);
    });

    it('sorts by score descending', () => {
      const board = calculateLeaderboard(questions, correctAnswers, votes);
      for (let i = 0; i < board.length - 1; i++) {
        expect(board[i].score).toBeGreaterThanOrEqual(board[i + 1].score);
      }
    });

    it('breaks ties alphabetically', () => {
      const tiedVotes = [
        { id: 'v1', guestName: 'Zara', answers: { q1: 'Groom' } },
        { id: 'v2', guestName: 'Alice', answers: { q1: 'Groom' } },
      ];
      const board = calculateLeaderboard(questions, correctAnswers, tiedVotes);
      expect(board[0].guestName).toBe('Alice');
      expect(board[1].guestName).toBe('Zara');
    });

    it('handles empty votes', () => {
      const board = calculateLeaderboard(questions, correctAnswers, []);
      expect(board).toEqual([]);
    });

    it('handles no correct answers set', () => {
      const board = calculateLeaderboard(questions, {}, votes);
      expect(board.every((entry) => entry.score === 0)).toBe(true);
    });

    it('handles null inputs gracefully', () => {
      expect(calculateLeaderboard(null, null, null)).toEqual([]);
      expect(calculateLeaderboard([], {}, null)).toEqual([]);
    });

    it('only counts questions that have correct answers', () => {
      const board = calculateLeaderboard(questions, correctAnswers, votes);
      expect(board[0].totalAnswered).toBe(2); // q1 and q2 answered, not q3
    });
  });
});
