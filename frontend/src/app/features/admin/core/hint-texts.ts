import type {
  AdminQuestion,
  Hint,
  HintSeverity,
  HintType,
} from '../../../core/contracts/admin.contract';
import { ANSWER_LETTERS } from '../../../core/game/answer-letters';
import { formatInt, formatPercent } from './format';

export const SEVERITY_LABELS: Record<HintSeverity, string> = {
  critical: 'Kritisch',
  high: 'Wichtig',
  medium: 'Prüfen',
};

export const HINT_TYPE_LABELS: Record<HintType, string> = {
  'pool-empty': 'Zu wenige Fragen',
  'pool-small': 'Kleiner Fragenbestand',
  lure: 'Falsche Antwort lockt',
  hard: 'Sehr schwer',
  easy: 'Sehr leicht',
  timeouts: 'Oft keine Antwort',
};

export interface HintText {
  title: string;
  /** What was measured. */
  finding: string;
  /** What to do about it. */
  advice: string;
}

/** The wording of a hint, from its measured values. */
export function hintText(hint: Hint, question: AdminQuestion | null): HintText {
  const value = formatPercent(hint.value);
  const sample = formatInt(hint.sample);
  switch (hint.type) {
    case 'pool-empty':
      return {
        title: 'Duelle können nicht starten',
        finding: `Nur ${formatInt(hint.value)} aktive Fragen – ein Duell braucht ${sample}.`,
        advice:
          'Fragen aktivieren oder neue erfassen. Bis dahin zeigt die Startseite einen Hinweis statt der Spielmodi.',
      };
    case 'pool-small':
      return {
        title: 'Fragen wiederholen sich bald',
        finding: `${formatInt(hint.value)} aktive Fragen. Ab ${sample} sehen Spielende in mehreren Duellen kaum dieselbe Frage.`,
        advice: 'Weitere Fragen erfassen oder importieren.',
      };
    case 'lure': {
      const letter = ANSWER_LETTERS[hint.optionIndex ?? 0] ?? '';
      const option = question?.options[hint.optionIndex ?? 0] ?? '';
      return {
        title: `Antwort ${letter} lockt mehr als die richtige`,
        finding: `${value} wählen «${option}» – öfter als die richtige Antwort (${sample} Antworten).`,
        advice:
          'Prüfen, ob die Frage eindeutig ist und die richtige Antwort stimmt. Oft hilft eine genauere Formulierung.',
      };
    }
    case 'hard': {
      // Blind guessing hits one answer in as many as there are.
      const chance = 1 / Math.max(1, question?.options.length ?? 4);
      return {
        title: 'Kaum jemand weiss die Antwort',
        finding: `Nur ${value} antworten richtig (${sample} Antworten), ${hint.value < chance ? 'weniger als' : 'kaum mehr als'} durch blosses Raten (${formatPercent(chance)}).`,
        advice:
          'Frage vereinfachen, einen Hinweis in die Frage nehmen oder pausieren.',
      };
    }
    case 'easy':
      return {
        title: 'Fast alle wissen die Antwort',
        finding: `${value} antworten richtig (${sample} Antworten).`,
        advice:
          'Die Frage entscheidet kein Duell. Falsche Antworten plausibler machen oder die Frage schwieriger stellen.',
      };
    case 'timeouts':
      return {
        title: 'Oft läuft die Zeit ab',
        finding: `Bei ${value} der Duelle kommt keine Antwort (${sample}-mal gestellt).`,
        advice:
          'Frage oder Antworten kürzen. Alternativ die Zeit pro Frage erhöhen.',
      };
  }
}

/** Questions are judged from this many answers on. */
export const MIN_SAMPLE = 20;

export type Difficulty = 'new' | 'hard' | 'medium' | 'easy';

export function difficultyOf(question: AdminQuestion): Difficulty {
  const { answers, correct } = question.stats;
  if (answers < MIN_SAMPLE) {
    return 'new';
  }
  const rate = correct / answers;
  return rate < 0.4 ? 'hard' : rate > 0.85 ? 'easy' : 'medium';
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  new: 'Zu wenig Daten',
  hard: 'Schwer',
  medium: 'Mittel',
  easy: 'Leicht',
};
