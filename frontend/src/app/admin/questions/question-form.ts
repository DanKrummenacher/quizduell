import type {
  AdminQuestion,
  QuestionInput,
} from '../../core/contracts/admin.contract';

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
    options: ['', '', '', ''],
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
  if (text.length < 5) {
    errors.text = 'Die Frage braucht mindestens 5 Zeichen.';
  } else if (text.length > 300) {
    errors.text = 'Die Frage darf höchstens 300 Zeichen lang sein.';
  }

  const seen = new Set<string>();
  const optionErrors = draft.options.map((option) => {
    const value = option.trim();
    if (!value) {
      return 'Bitte ausfüllen.';
    }
    if (value.length > 100) {
      return 'Höchstens 100 Zeichen.';
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

  if (draft.category.trim().length > 50) {
    errors.category = 'Die Kategorie darf höchstens 50 Zeichen lang sein.';
  }
  return errors;
}

export function hasErrors(errors: QuestionErrors): boolean {
  return Boolean(errors.text || errors.options || errors.category);
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
