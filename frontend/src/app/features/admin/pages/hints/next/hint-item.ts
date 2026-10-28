import type {
  AdminQuestion,
  Hint,
  HintType,
} from '../../../../../core/contracts/admin.contract';
import { formatInt, formatPercent } from '../../../core/format';
import type { HintText } from '../../../core/hint-texts';

/** Temporary: a hint with its question, as the drafts get it. */
export interface HintItem {
  hint: Hint;
  question: AdminQuestion | null;
  text: HintText;
}

export interface CheckGroup {
  id: string;
  title: string;
  limit: string;
  types: HintType[];
}

/** The checks the admin runs, with the limit each one holds to. */
export const CHECK_GROUPS: CheckGroup[] = [
  {
    id: 'clear',
    title: 'Verständlichkeit',
    limit: 'Keine falsche Antwort öfter als die richtige',
    types: ['lure'],
  },
  {
    id: 'level',
    title: 'Schwierigkeit',
    limit: '30 bis 95 % richtige Antworten',
    types: ['hard', 'easy'],
  },
  {
    id: 'time',
    title: 'Zeit zum Antworten',
    limit: 'Unter 20 % ohne Antwort',
    types: ['timeouts'],
  },
  {
    id: 'pool',
    title: 'Fragenbestand',
    limit: 'Genug aktive Fragen für Abwechslung',
    types: ['pool-small', 'pool-empty'],
  },
];

/** The measured value, short. */
export function measured(item: HintItem): string {
  const { hint, question } = item;
  switch (hint.type) {
    case 'lure':
      return `${formatPercent(hint.value)} falsch`;
    case 'timeouts':
      return `${formatPercent(hint.value)} ohne Antwort`;
    case 'pool-small':
    case 'pool-empty':
      return `${formatInt(hint.value)} aktiv`;
    default:
      return `${formatPercent(question ? question.stats.correct / Math.max(1, question.stats.answers) : hint.value)} richtig`;
  }
}

/** The limit the value is held to, short. */
export function limitOf(item: HintItem): string {
  switch (item.hint.type) {
    case 'lure':
      return 'unter richtiger';
    case 'hard':
      return 'mind. 30 %';
    case 'easy':
      return 'unter 95 %';
    case 'timeouts':
      return 'unter 20 %';
    default:
      return `mind. ${formatInt(item.hint.sample)}`;
  }
}

/** What fixes it, as the label of a button. */
export function actionOf(item: HintItem): string {
  return {
    lure: 'Frage klarer stellen',
    hard: 'Frage vereinfachen',
    easy: 'Antworten verbessern',
    timeouts: 'Frage kürzen',
    'pool-small': 'Fragen erfassen',
    'pool-empty': 'Fragen erfassen',
  }[item.hint.type];
}
