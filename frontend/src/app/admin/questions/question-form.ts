import {
  type AdminQuestion,
  QUESTION_LIMITS,
  type QuestionInput,
} from '../../core/contracts/admin.contract';
import { ANSWER_OPTION_COUNT } from '../../core/contracts/game.contract';

export interface QuestionDraft {
  text: string;
  options: string[];
  correctIndex: number;
  category: string;
  active: boolean;
}

export type QuestionErrors = Partial<
  Record<'text' | 'options' | 'category', string>
> & {
  optionErrors?: (string | null)[];
};

export function emptyDraft(): QuestionDraft {
  return {
    text: '',
    options: Array.from({ length: ANSWER_OPTION_COUNT }, () => ''),
    correctIndex: 0,
    category: '',
    active: true,
  };
}

export function draftFrom(question: AdminQuestion): QuestionDraft {
  return {
    text: question.text,
    options: [...question.options],
    correctIndex: question.correctIndex,
    category: question.category ?? '',
    active: question.active,
  };
}

/** Mirrors the backend validation so mistakes are shown before saving. */
export function validateDraft(draft: QuestionDraft): QuestionErrors {
  const errors: QuestionErrors = {};
  const text = draft.text.trim();
  const limits = QUESTION_LIMITS;
  if (text.length < limits.text.min) {
    errors.text = `Die Frage braucht mindestens ${limits.text.min} Zeichen.`;
  } else if (text.length > limits.text.max) {
    errors.text = `Die Frage darf höchstens ${limits.text.max} Zeichen lang sein.`;
  }

  const seen = new Set<string>();
  const optionErrors = draft.options.map((option) => {
    const value = option.trim();
    if (!value) {
      return 'Bitte ausfüllen.';
    }
    if (value.length > limits.option.max) {
      return `Höchstens ${limits.option.max} Zeichen.`;
    }
    const key = value.toLowerCase();
    if (seen.has(key)) {
      return 'Diese Antwort gibt es schon.';
    }
    seen.add(key);
    return null;
  });
  if (optionErrors.some(Boolean)) {
    errors.optionErrors = optionErrors;
    errors.options = 'Bitte prüfe die Antworten.';
  }

  if (draft.category.trim().length > limits.category.max) {
    errors.category = `Die Kategorie darf höchstens ${limits.category.max} Zeichen lang sein.`;
  }
  return errors;
}

export function hasErrors(errors: QuestionErrors): boolean {
  return [errors.text, errors.options, errors.category].some(Boolean);
}

export function toInput(draft: QuestionDraft): QuestionInput {
  return {
    text: draft.text.trim(),
    options: draft.options.map((option) => option.trim()),
    correctIndex: draft.correctIndex,
    category: draft.category.trim() || null,
    active: draft.active,
  };
}
