import {
  ADMIN_LIMITS,
  type QuestionInput,
} from '../../../core/contracts/admin.contract';
import { ANSWER_OPTION_COUNT } from '../../../core/contracts/game.contract';

/** Field-level problems of a question; mirrors the server's checks. */
export interface QuestionProblems {
  text?: string;
  options: (string | undefined)[];
  form?: string;
}

export function collapse(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function checkQuestion(input: QuestionInput): QuestionProblems {
  const problems: QuestionProblems = { options: [] };
  const text = collapse(input.text);
  if (!text) {
    problems.text = 'Die Frage fehlt.';
  } else if (text.length > ADMIN_LIMITS.questionText) {
    problems.text = `Höchstens ${ADMIN_LIMITS.questionText} Zeichen.`;
  }
  const options = input.options.map(collapse);
  const seen = new Map<string, number>();
  options.forEach((option, index) => {
    if (!option) {
      problems.options[index] = 'Die Antwort fehlt.';
      return;
    }
    if (option.length > ADMIN_LIMITS.optionText) {
      problems.options[index] = `Höchstens ${ADMIN_LIMITS.optionText} Zeichen.`;
      return;
    }
    const key = option.toLocaleLowerCase('de-CH');
    if (seen.has(key)) {
      problems.options[index] = 'Gleich wie eine andere Antwort.';
    }
    seen.set(key, index);
  });
  if (options.length !== ANSWER_OPTION_COUNT) {
    problems.form = `Es braucht genau ${ANSWER_OPTION_COUNT} Antworten.`;
  }
  if (
    !Number.isInteger(input.correctIndex) ||
    input.correctIndex < 0 ||
    input.correctIndex >= ANSWER_OPTION_COUNT
  ) {
    problems.form = 'Die richtige Antwort fehlt.';
  }
  if ((input.category ?? '').trim().length > ADMIN_LIMITS.category) {
    problems.form = `Die Kategorie hat höchstens ${ADMIN_LIMITS.category} Zeichen.`;
  }
  return problems;
}

export function hasProblems(problems: QuestionProblems): boolean {
  return (
    problems.text !== undefined ||
    problems.form !== undefined ||
    problems.options.some(Boolean)
  );
}

/** The first problem as one sentence, for import rows. */
export function firstProblem(problems: QuestionProblems): string | null {
  const option = problems.options.findIndex(Boolean);
  if (problems.text) {
    return `Frage: ${problems.text}`;
  }
  if (option >= 0) {
    return `Antwort ${'ABCD'[option]}: ${problems.options[option]}`;
  }
  return problems.form ?? null;
}
