import type {
  AdminQuestion,
  QuestionInput,
} from '../../../core/contracts/admin.contract';
import { checkQuestion, collapse, firstProblem } from './question-rules';

/**
 * CSV in the shape Excel opens directly in Switzerland: semicolons, UTF-8 with
 * byte order mark. Import accepts semicolons, commas or tabs and recognises
 * the columns by their names.
 */
export const CSV_COLUMNS = [
  'Frage',
  'Antwort A',
  'Antwort B',
  'Antwort C',
  'Antwort D',
  'Richtig',
  'Kategorie',
  'Aktiv',
] as const;

export function questionsToCsv(questions: readonly AdminQuestion[]): string {
  const rows = questions.map((q) => [
    q.text,
    ...q.options,
    'ABCD'[q.correctIndex] ?? '',
    q.category ?? '',
    q.active ? 'ja' : 'nein',
  ]);
  return '\uFEFF' + [[...CSV_COLUMNS], ...rows].map(toLine).join('\r\n') + '\r\n';
}

function toLine(cells: readonly string[]): string {
  return cells
    .map((cell) => (/[";\r\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell))
    .join(';');
}

/** Splits CSV text into rows of cells, honouring quotes. */
export function parseCsv(source: string): string[][] {
  const text = source.replace(/^\uFEFF/, '');
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const delimiter = [';', '\t', ','].reduce((best, candidate) =>
    firstLine.split(candidate).length > firstLine.split(best).length
      ? candidate
      : best,
  );
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i]!;
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"' && cell === '') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') {
        i++;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((value) => value.trim() !== ''));
}

export interface ImportRow {
  /** Line in the file, counting the header as line 1. */
  line: number;
  question: QuestionInput;
  problem: string | null;
  duplicate: boolean;
}

export interface ImportPreview {
  rows: ImportRow[];
  /** Set when the file itself cannot be read. */
  error: string | null;
}

const HEADER_ALIASES: Record<string, string[]> = {
  text: ['frage', 'question', 'text'],
  a: ['antwort a', 'a', 'antwort 1', 'option a', 'richtige antwort'],
  b: ['antwort b', 'b', 'antwort 2', 'option b', 'falsch 1'],
  c: ['antwort c', 'c', 'antwort 3', 'option c', 'falsch 2'],
  d: ['antwort d', 'd', 'antwort 4', 'option d', 'falsch 3'],
  correct: ['richtig', 'korrekt', 'lösung', 'correct'],
  category: ['kategorie', 'category', 'thema'],
  active: ['aktiv', 'active', 'status'],
};

export function previewImport(
  source: string,
  existing: readonly AdminQuestion[],
): ImportPreview {
  const rows = parseCsv(source);
  if (rows.length < 2) {
    return { rows: [], error: 'Die Datei enthält keine Fragen.' };
  }
  const header = rows[0]!.map((cell) => collapse(cell).toLocaleLowerCase('de-CH'));
  const column = (key: string) =>
    header.findIndex((name) => HEADER_ALIASES[key]!.includes(name));
  const columns = {
    text: column('text'),
    options: [column('a'), column('b'), column('c'), column('d')],
    correct: column('correct'),
    category: column('category'),
    active: column('active'),
  };
  if (columns.text < 0 || columns.options.some((index) => index < 0)) {
    return {
      rows: [],
      error:
        'Die Spalten «Frage» und «Antwort A» bis «Antwort D» fehlen. Am einfachsten die Vorlage herunterladen und ausfüllen.',
    };
  }
  // Without a «Richtig» column, the first answer is the correct one.
  const known = new Set(existing.map((q) => q.text.toLocaleLowerCase('de-CH')));
  return {
    error: null,
    rows: rows.slice(1).map((cells, index) => {
      const value = (i: number) => (i >= 0 ? (cells[i] ?? '') : '');
      const correct = parseCorrect(value(columns.correct));
      const question: QuestionInput = {
        text: collapse(value(columns.text)),
        options: columns.options.map((i) => collapse(value(i))),
        correctIndex: columns.correct < 0 ? 0 : (correct ?? -1),
        category: collapse(value(columns.category)) || null,
        active: !/^(nein|no|false|0|pausiert|inaktiv)$/i.test(
          value(columns.active).trim(),
        ),
      };
      const problem =
        columns.correct >= 0 && correct === null
          ? 'Richtig: A, B, C oder D angeben.'
          : firstProblem(checkQuestion(question));
      const key = question.text.toLocaleLowerCase('de-CH');
      const duplicate = known.has(key);
      known.add(key);
      return { line: index + 2, question, problem, duplicate };
    }),
  };
}

function parseCorrect(value: string): number | null {
  const normalized = value.trim().toUpperCase();
  const letter = 'ABCD'.indexOf(normalized);
  if (normalized.length === 1 && letter >= 0) {
    return letter;
  }
  const number = Number(normalized);
  return Number.isInteger(number) && number >= 1 && number <= 4 ? number - 1 : null;
}

/** Offers a text file for download. */
export function download(
  filename: string,
  content: string,
  type = 'text/csv',
): void {
  const url = URL.createObjectURL(
    new Blob([content], { type: `${type};charset=utf-8` }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
