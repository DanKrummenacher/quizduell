// TEMPORARY: proposal N «Schreibmodus», questions as plain text (development only).
//
//   # Schweiz                         category for the following questions
//   ? Wie viele Kantone hat die Schweiz?  @12   question, @id of an existing one
//   - 23                              wrong answer
//   + 26                              correct answer
//   ! pausiert                        optional: not in the game
import type { AdminQuestion } from '../../../core/contracts/admin.contract';
import { normalize } from '../pro';
import { ANSWER_OPTION_COUNT } from '../../../core/contracts/game.contract';
import {
  draftFrom,
  hasErrors,
  type QuestionDraft,
  validateDraft,
} from '../../questions/question-form';

export interface TextBlock {
  /** Line of the question in the text, from 1. */
  line: number;
  id: number | null;
  draft: QuestionDraft;
  errors: string[];
  state: 'new' | 'changed' | 'same' | 'error';
}

const ID = /\s+@(\d+)\s*$/;

/** Turns questions into the text format, grouped by category. */
export function toText(questions: AdminQuestion[]): string {
  const groups = new Map<string, AdminQuestion[]>();
  for (const q of questions) {
    groups.set(q.category ?? '', [...(groups.get(q.category ?? '') ?? []), q]);
  }
  const parts: string[] = [];
  for (const [category, list] of [...groups.entries()].sort(([a], [b]) =>
    a.localeCompare(b, 'de-CH'),
  )) {
    parts.push(`# ${category || 'Ohne Kategorie'}`, '');
    for (const q of list) {
      parts.push(`? ${q.text} @${q.id}`);
      q.options.forEach((option, i) =>
        parts.push(`${i === q.correctIndex ? '+' : '-'} ${option}`),
      );
      if (!q.active) {
        parts.push('! pausiert');
      }
      parts.push('');
    }
  }
  return parts.join('\n');
}

/** Reads the text into question blocks and checks each of them. */
export function parseText(text: string, existing: AdminQuestion[]): TextBlock[] {
  const byId = new Map(existing.map((q) => [q.id, q]));
  const byText = new Map(existing.map((q) => [normalize(q.text), q]));
  const blocks: TextBlock[] = [];
  let category = '';
  let current: {
    line: number;
    id: number | null;
    text: string;
    options: { text: string; correct: boolean }[];
    active: boolean;
  } | null = null;

  const finish = () => {
    if (!current) {
      return;
    }
    const errors: string[] = [];
    const correct = current.options.filter((o) => o.correct).length;
    if (current.options.length !== ANSWER_OPTION_COUNT) {
      errors.push(
        `Genau ${ANSWER_OPTION_COUNT} Antworten nötig, es sind ${current.options.length}.`,
      );
    }
    if (correct !== 1) {
      errors.push(
        correct === 0
          ? 'Eine Antwort mit «+» markieren.'
          : 'Nur eine Antwort darf «+» haben.',
      );
    }
    const options = Array.from(
      { length: ANSWER_OPTION_COUNT },
      (_, i) => current!.options[i]?.text ?? '',
    );
    const draft: QuestionDraft = {
      text: current.text,
      options,
      correctIndex: Math.max(
        0,
        current.options.findIndex((o) => o.correct),
      ),
      category: category === 'Ohne Kategorie' ? '' : category,
      active: current.active,
    };
    const validation = validateDraft(draft);
    if (hasErrors(validation)) {
      errors.push(
        ...[
          validation.text,
          validation.category,
          ...(validation.optionErrors ?? []).map((error, i) =>
            error ? `Antwort ${String.fromCharCode(65 + i)}: ${error}` : null,
          ),
        ].filter((e): e is string => !!e && !errors.includes(e)),
      );
    }
    const original = current.id === null ? undefined : byId.get(current.id);
    if (current.id !== null && !original) {
      errors.push(`Eine Frage @${current.id} gibt es nicht (mehr).`);
    }
    const twin = byText.get(normalize(current.text));
    if (current.id === null && twin) {
      errors.push(`Diese Frage gibt es schon (@${twin.id}).`);
    }
    const state: TextBlock['state'] = errors.length
      ? 'error'
      : !original
        ? 'new'
        : JSON.stringify(draftFrom(original)) === JSON.stringify(draft)
          ? 'same'
          : 'changed';
    blocks.push({
      line: current.line,
      id: current.id,
      draft,
      errors: [...new Set(errors)],
      state,
    });
    current = null;
  };

  text.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    if (line.startsWith('#')) {
      finish();
      category = line.slice(1).trim();
    } else if (line.startsWith('?')) {
      finish();
      let body = line.slice(1).trim();
      const match = ID.exec(body);
      const id = match ? Number(match[1]) : null;
      body = body.replace(ID, '').trim();
      current = { line: index + 1, id, text: body, options: [], active: true };
    } else if ((line.startsWith('+') || line.startsWith('-')) && current) {
      current.options.push({
        text: line.slice(1).trim(),
        correct: line.startsWith('+'),
      });
    } else if (/^!\s*pausiert/i.test(line) && current) {
      current.active = false;
    }
  });
  finish();
  return blocks;
}
