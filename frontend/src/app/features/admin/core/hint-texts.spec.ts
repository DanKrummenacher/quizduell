import type { AdminQuestion, Hint } from '../../../core/contracts/admin.contract';
import { difficultyOf, hintText } from './hint-texts';

function question(overrides: Partial<AdminQuestion['stats']> = {}): AdminQuestion {
  return {
    id: 7,
    text: 'Welcher Planet ist der grösste?',
    options: ['Saturn', 'Jupiter', 'Neptun', 'Erde'],
    correctIndex: 1,
    category: null,
    active: true,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    stats: {
      answers: 100,
      correct: 22,
      timeouts: 10,
      picks: [30, 22, 24, 24],
      avgAnswerMs: 9900,
      recent: { answers: 50, correct: 11 },
      previous: { answers: 50, correct: 11 },
      ...overrides,
    },
  };
}

function hint(overrides: Partial<Hint>): Hint {
  return {
    key: 'hard:7',
    type: 'hard',
    severity: 'high',
    questionId: 7,
    value: 0.22,
    sample: 100,
    ignored: false,
    ...overrides,
  };
}

describe('hintText', () => {
  it('compares a hard question with blind guessing', () => {
    const text = hintText(hint({}), question());
    expect(text.title).toBe('Kaum jemand weiss die Antwort');
    expect(text.finding).toBe(
      'Nur 22 % antworten richtig (100 Antworten), weniger als durch blosses Raten (25 %).',
    );
  });

  it('says «kaum mehr» when the rate is at least the chance', () => {
    const text = hintText(hint({ value: 0.28 }), question());
    expect(text.finding).toContain('kaum mehr als durch blosses Raten (25 %)');
  });

  it('names the luring answer by its letter and text', () => {
    const text = hintText(
      hint({ key: 'lure:7', type: 'lure', value: 0.53, optionIndex: 2 }),
      question(),
    );
    expect(text.title).toBe('Antwort C lockt mehr als die richtige');
    expect(text.finding).toContain('53 % wählen «Neptun»');
  });

  it('describes the pool hints without a question', () => {
    const text = hintText(
      hint({
        key: 'pool-empty',
        type: 'pool-empty',
        questionId: null,
        value: 3,
        sample: 7,
      }),
      null,
    );
    expect(text.title).toBe('Duelle können nicht starten');
    expect(text.finding).toBe('Nur 3 aktive Fragen – ein Duell braucht 7.');
  });
});

describe('difficultyOf', () => {
  it('needs enough answers before it judges', () => {
    expect(difficultyOf(question({ answers: 19, correct: 2 }))).toBe('new');
    expect(difficultyOf(question({ answers: 20, correct: 2 }))).toBe('hard');
    expect(difficultyOf(question({ answers: 20, correct: 12 }))).toBe('medium');
    expect(difficultyOf(question({ answers: 20, correct: 18 }))).toBe('easy');
  });
});
