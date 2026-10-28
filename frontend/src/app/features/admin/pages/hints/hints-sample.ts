import type { AdminQuestion, Hint } from '../../../../core/contracts/admin.contract';

/** Temporary: sample hints to judge the drafts with data. */
function question(
  id: number,
  text: string,
  options: string[],
  correctIndex: number,
  category: string,
  picks: number[],
  timeouts: number,
  avgAnswerMs: number,
  /** How much worse the last 14 days are than the 14 before. */
  trend = 0,
): AdminQuestion {
  const answers = picks.reduce((sum, n) => sum + n, 0);
  const rate = answers ? (picks[correctIndex] ?? 0) / answers : 0;
  const recentAnswers = Math.round(answers * 0.6);
  const previousAnswers = answers - recentAnswers;
  return {
    id,
    text,
    options,
    correctIndex,
    category,
    active: true,
    createdAt: '2026-09-02T10:00:00Z',
    updatedAt: '2026-10-12T10:00:00Z',
    stats: {
      answers,
      correct: picks[correctIndex] ?? 0,
      timeouts,
      picks,
      avgAnswerMs,
      recent: {
        answers: recentAnswers,
        correct: Math.round(recentAnswers * (rate - trend * 0.4)),
      },
      previous: {
        answers: previousAnswers,
        correct: Math.round(previousAnswers * (rate + trend * 0.6)),
      },
    },
  };
}

export const SAMPLE_QUESTIONS: AdminQuestion[] = [
  question(
    41,
    'Welcher Planet ist der grösste im Sonnensystem?',
    ['Saturn', 'Jupiter', 'Neptun', 'Uranus'],
    1,
    'Wissenschaft',
    [58, 41, 9, 6],
    4,
    6200,
    0.14,
  ),
  question(
    42,
    'Wie viele Knochen hat ein neugeborenes Kind ungefähr?',
    ['206', 'rund 300', '150', '350'],
    1,
    'Wissenschaft',
    [25, 12, 25, 26],
    7,
    8100,
    0.1,
  ),
  question(
    43,
    'In welchem Jahr wurde der Gotthard-Basistunnel nach 17 Jahren Bauzeit für den fahrplanmässigen Verkehr eröffnet?',
    ['2014', '2016', '2018', '2020'],
    1,
    'Schweiz',
    [11, 19, 6, 4],
    25,
    13900,
    -0.12,
  ),
  question(
    44,
    'Welche Farbe entsteht aus Blau und Gelb?',
    ['Grün', 'Violett', 'Orange', 'Braun'],
    0,
    'Allgemeinwissen',
    [136, 2, 1, 1],
    0,
    2100,
  ),
  question(
    45,
    'Wie heisst die Hauptstadt von Australien?',
    ['Sydney', 'Melbourne', 'Canberra', 'Perth'],
    2,
    'Geografie',
    [33, 9, 24, 4],
    3,
    7400,
  ),
];

export const SAMPLE_HINTS: Hint[] = [
  {
    key: 'lure:41',
    type: 'lure',
    severity: 'high',
    questionId: 41,
    value: 0.51,
    sample: 114,
    optionIndex: 0,
    ignored: false,
  },
  {
    key: 'hard:42',
    type: 'hard',
    severity: 'high',
    questionId: 42,
    value: 0.14,
    sample: 88,
    ignored: false,
  },
  {
    key: 'timeouts:43',
    type: 'timeouts',
    severity: 'medium',
    questionId: 43,
    value: 0.38,
    sample: 65,
    ignored: false,
  },
  {
    key: 'pool-small',
    type: 'pool-small',
    severity: 'medium',
    questionId: null,
    value: 33,
    sample: 60,
    ignored: false,
  },
  {
    key: 'easy:44',
    type: 'easy',
    severity: 'medium',
    questionId: 44,
    value: 0.97,
    sample: 140,
    ignored: false,
  },
  {
    key: 'lure:45',
    type: 'lure',
    severity: 'high',
    questionId: 45,
    value: 0.47,
    sample: 70,
    optionIndex: 0,
    ignored: true,
  },
];

/** The same, when too few questions are active for a duel. */
export const SAMPLE_ALARM: Hint[] = [
  {
    key: 'pool-empty',
    type: 'pool-empty',
    severity: 'critical',
    questionId: null,
    value: 5,
    sample: 7,
    ignored: false,
  },
  ...SAMPLE_HINTS.filter((hint) => hint.type !== 'pool-small'),
];

const CATEGORIES = [
  'Wissenschaft',
  'Geografie',
  'Geschichte',
  'Sport',
  'Allgemeinwissen',
  'Schweiz',
];

/** Healthy questions next to the flagged ones, for the distribution. */
const RATES = [
  0.34, 0.38, 0.42, 0.45, 0.47, 0.5, 0.52, 0.55, 0.56, 0.58, 0.61, 0.62, 0.64, 0.66,
  0.67, 0.69, 0.71, 0.72, 0.74, 0.76, 0.78, 0.8, 0.82, 0.85, 0.88, 0.91, 0.6, 0.73,
];
export const SAMPLE_POOL: AdminQuestion[] = [
  ...SAMPLE_QUESTIONS,
  ...RATES.map((rate, index) => {
    const answers = 40 + ((index * 37) % 90);
    const right = Math.round(answers * rate);
    const rest = answers - right;
    return question(
      100 + index,
      `Beispielfrage ${index + 1}`,
      ['A', 'B', 'C', 'D'],
      0,
      CATEGORIES[index % CATEGORIES.length] ?? 'Allgemeinwissen',
      [
        right,
        Math.ceil(rest / 2),
        Math.floor(rest / 3),
        rest - Math.ceil(rest / 2) - Math.floor(rest / 3),
      ],
      2,
      6000,
    );
  }),
];
