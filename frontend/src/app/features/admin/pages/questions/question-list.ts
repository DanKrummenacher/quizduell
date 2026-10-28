// How the questions page finds, sorts and judges its questions.
import type { AdminQuestion, Hint } from '../../../../core/contracts/admin.contract';
import { formatInt, share } from '../../core/format';
import {
  type Difficulty,
  difficultyOf,
  DIFFICULTY_LABELS,
  HINT_TYPE_LABELS,
} from '../../core/hint-texts';

export type StatusFilter = 'all' | 'active' | 'paused';
export type HealthFilter = 'all' | 'hints' | Difficulty;
export type Sort =
  'newest' | 'oldest' | 'rate-asc' | 'rate-desc' | 'answers' | 'text';

/** The value of the category filter that means «without category». */
export const NO_CATEGORY = '__none__';

export const SORTS: { id: Sort; label: string }[] = [
  { id: 'newest', label: 'Neueste zuerst' },
  { id: 'oldest', label: 'Älteste zuerst' },
  { id: 'rate-asc', label: 'Trefferquote aufsteigend' },
  { id: 'rate-desc', label: 'Trefferquote absteigend' },
  { id: 'answers', label: 'Am meisten gestellt' },
  { id: 'text', label: 'Frage A–Z' },
];

export interface Filters {
  search: string;
  status: StatusFilter;
  category: string;
  health: HealthFilter;
}

/** The questions that match the filters, in the given order. */
export function filterQuestions(
  all: readonly AdminQuestion[],
  filters: Filters,
  hints: ReadonlyMap<number, Hint[]>,
  sort: Sort,
): AdminQuestion[] {
  const words = filters.search
    .toLocaleLowerCase('de-CH')
    .split(/\s+/)
    .filter(Boolean);
  const { status, category, health } = filters;
  const result = all.filter((q) => {
    if ((status === 'active' && !q.active) || (status === 'paused' && q.active)) {
      return false;
    }
    if (
      category === NO_CATEGORY
        ? q.category !== null
        : category && q.category !== category
    ) {
      return false;
    }
    if (health === 'hints' && !hints.has(q.id)) {
      return false;
    }
    if (health !== 'all' && health !== 'hints' && difficultyOf(q) !== health) {
      return false;
    }
    if (words.length) {
      const haystack = [
        q.text,
        ...q.options,
        q.category ?? '',
        `f-${q.id}`,
        String(q.id),
      ]
        .join(' ')
        .toLocaleLowerCase('de-CH');
      return words.every((word) => haystack.includes(word));
    }
    return true;
  });
  return sortQuestions(result, sort);
}

export function sortQuestions(
  questions: AdminQuestion[],
  sort: Sort,
): AdminQuestion[] {
  const rate = (q: AdminQuestion) =>
    q.stats.answers > 0 ? q.stats.correct / q.stats.answers : null;
  const byRate = (direction: 1 | -1) => (a: AdminQuestion, b: AdminQuestion) => {
    const ra = rate(a);
    const rb = rate(b);
    // Questions without answers always go last.
    if (ra === null || rb === null) {
      return ra === null ? (rb === null ? 0 : 1) : -1;
    }
    return (ra - rb) * direction;
  };
  const sorted = [...questions];
  switch (sort) {
    case 'newest':
      return sorted.sort((a, b) => b.id - a.id);
    case 'oldest':
      return sorted.sort((a, b) => a.id - b.id);
    case 'rate-asc':
      return sorted.sort(byRate(1));
    case 'rate-desc':
      return sorted.sort(byRate(-1));
    case 'answers':
      return sorted.sort((a, b) => b.stats.answers - a.stats.answers);
    case 'text':
      return sorted.sort((a, b) => a.text.localeCompare(b.text, 'de-CH'));
  }
}

export interface QuestionRow {
  question: AdminQuestion;
  rate: number | null;
  /** Change of the rate against the 14 days before, with enough answers. */
  trend: number | null;
  difficulty: Difficulty;
  hints: string[];
}

/** One question as the table shows it. */
export function rowOf(question: AdminQuestion, hints: readonly Hint[]): QuestionRow {
  const { answers, correct, recent, previous } = question.stats;
  const recentRate = share(recent.correct, recent.answers);
  const previousRate = share(previous.correct, previous.answers);
  const trend =
    recentRate !== null &&
    previousRate !== null &&
    recent.answers >= 10 &&
    previous.answers >= 10
      ? recentRate - previousRate
      : null;
  return {
    question,
    rate: share(correct, answers),
    trend,
    difficulty: difficultyOf(question),
    hints: hints.map((hint) => HINT_TYPE_LABELS[hint.type]),
  };
}

/** Change in percentage points: «+5 Pkt.» */
export function trendText(trend: number): string {
  const points = Math.round(trend * 100);
  return `${points > 0 ? '+' : points < 0 ? '−' : '±'}${Math.abs(points)} Pkt.`;
}

export type QuickId = 'active' | 'paused' | 'hints' | 'hard' | 'new';

/** Quick filters as figures: each stands for the filters it sets. */
export function quickFiguresOf(
  all: readonly AdminQuestion[],
  hints: ReadonlyMap<number, Hint[]>,
): { id: QuickId; label: string; value: number; note: string }[] {
  const count = (test: (q: AdminQuestion) => boolean) => all.filter(test).length;
  return [
    {
      id: 'active',
      label: 'Im Spiel',
      value: count((q) => q.active),
      note: `von ${formatInt(all.length)} Fragen`,
    },
    {
      id: 'paused',
      label: 'Pausiert',
      value: count((q) => !q.active),
      note: 'kommen in keinem Duell vor',
    },
    {
      id: 'hints',
      label: 'Mit Hinweis',
      value: count((q) => hints.has(q.id)),
      note: 'auffällig im Spiel',
    },
    {
      id: 'hard',
      label: DIFFICULTY_LABELS.hard,
      value: count((q) => difficultyOf(q) === 'hard'),
      note: 'unter 45 % richtig',
    },
    {
      id: 'new',
      label: DIFFICULTY_LABELS.new,
      value: count((q) => difficultyOf(q) === 'new'),
      note: 'noch ohne verlässliche Quote',
    },
  ];
}

/** The open hints of every question, by question id. */
export function hintsByQuestion(hints: readonly Hint[]): Map<number, Hint[]> {
  const map = new Map<number, Hint[]>();
  for (const hint of hints) {
    if (hint.questionId !== null) {
      map.set(hint.questionId, [...(map.get(hint.questionId) ?? []), hint]);
    }
  }
  return map;
}

/** The set with the name added, or removed when it was in it. */
export function toggled(
  current: ReadonlySet<string>,
  name: string,
): ReadonlySet<string> {
  const next = new Set(current);
  if (next.has(name)) {
    next.delete(name);
  } else {
    next.add(name);
  }
  return next;
}
