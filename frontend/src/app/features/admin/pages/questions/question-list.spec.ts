import type { AdminQuestion, Hint } from '../../../../core/contracts/admin.contract';
import {
  filterQuestions,
  type Filters,
  hintsByQuestion,
  quickFiguresOf,
  rowOf,
  sortQuestions,
  toggled,
  trendText,
} from './question-list';

function question(
  id: number,
  overrides: Partial<Omit<AdminQuestion, 'stats'>> & {
    stats?: Partial<AdminQuestion['stats']>;
  } = {},
): AdminQuestion {
  const { stats, ...rest } = overrides;
  return {
    id,
    text: `Frage ${id}`,
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 0,
    category: 'Logik',
    active: true,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    ...rest,
    stats: {
      answers: 40,
      correct: 20,
      timeouts: 0,
      picks: [20, 10, 5, 5],
      avgAnswerMs: 5000,
      recent: { answers: 20, correct: 10 },
      previous: { answers: 20, correct: 8 },
      ...stats,
    },
  };
}

const hint = (questionId: number): Hint => ({
  key: `hard:${questionId}`,
  type: 'hard',
  severity: 'high',
  questionId,
  value: 0.2,
  sample: 40,
  ignored: false,
});

const ALL = [
  question(1, { text: 'Wie viele Kantone hat die Schweiz?', category: 'Schweiz' }),
  question(2, { active: false }),
  question(3, {
    category: null,
    stats: { answers: 0, correct: 0, picks: [0, 0, 0, 0] },
  }),
  question(4, { stats: { answers: 50, correct: 5 } }),
];
const NO_FILTERS: Filters = {
  search: '',
  status: 'all',
  category: '',
  health: 'all',
};

describe('filterQuestions', () => {
  it('matches every word of the search in text, options, category or id', () => {
    const hits = (search: string) =>
      filterQuestions(ALL, { ...NO_FILTERS, search }, new Map(), 'newest').map(
        (q) => q.id,
      );
    expect(hits('kantone schweiz')).toEqual([1]);
    expect(hits('F-3')).toEqual([3]);
    expect(hits('frage')).toEqual([4, 3, 2]);
  });

  it('filters by status, category and health', () => {
    const ids = (filters: Partial<Filters>) =>
      filterQuestions(
        ALL,
        { ...NO_FILTERS, ...filters },
        hintsByQuestion([hint(4)]),
        'oldest',
      ).map((q) => q.id);
    expect(ids({ status: 'paused' })).toEqual([2]);
    expect(ids({ category: '__none__' })).toEqual([3]);
    expect(ids({ category: 'Schweiz' })).toEqual([1]);
    expect(ids({ health: 'hints' })).toEqual([4]);
    expect(ids({ health: 'hard' })).toEqual([4]);
    expect(ids({ health: 'new' })).toEqual([3]);
  });
});

describe('sortQuestions', () => {
  it('puts questions without answers last when sorting by rate', () => {
    expect(sortQuestions(ALL, 'rate-asc').map((q) => q.id)).toEqual([4, 1, 2, 3]);
    expect(sortQuestions(ALL, 'rate-desc').map((q) => q.id)).toEqual([1, 2, 4, 3]);
    expect(sortQuestions(ALL, 'answers').map((q) => q.id)).toEqual([4, 1, 2, 3]);
  });
});

describe('rowOf', () => {
  it('shows the trend only with enough answers on both sides', () => {
    expect(rowOf(question(1), []).trend).toBeCloseTo(0.1);
    expect(
      rowOf(question(1, { stats: { recent: { answers: 5, correct: 5 } } }), [])
        .trend,
    ).toBeNull();
    expect(rowOf(question(1), [hint(1)]).hints).toEqual(['Sehr schwer']);
    expect(trendText(0.1)).toBe('+10 Pkt.');
    expect(trendText(-0.04)).toBe('−4 Pkt.');
    expect(trendText(0)).toBe('±0 Pkt.');
  });
});

describe('quickFiguresOf', () => {
  it('counts the questions behind each figure', () => {
    const figures = quickFiguresOf(ALL, hintsByQuestion([hint(4)]));
    expect(Object.fromEntries(figures.map((f) => [f.id, f.value]))).toEqual({
      active: 3,
      paused: 1,
      hints: 1,
      hard: 1,
      new: 1,
    });
  });
});

describe('toggled', () => {
  it('adds a missing name and removes a present one', () => {
    const once = toggled(new Set(), 'Logik');
    expect([...once]).toEqual(['Logik']);
    expect([...toggled(once, 'Logik')]).toEqual([]);
  });
});
