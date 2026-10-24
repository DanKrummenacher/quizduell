import type { AdminQuestion } from '../../../core/contracts/admin.contract';
import { parseCsv, previewImport, questionsToCsv } from './csv';

function question(overrides: Partial<AdminQuestion> = {}): AdminQuestion {
  return {
    id: 1,
    text: 'Wie viele Kantone hat die Schweiz?',
    options: ['26', '23', '20', '24'],
    correctIndex: 0,
    category: 'Schweiz',
    active: true,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    stats: {
      answers: 0,
      correct: 0,
      timeouts: 0,
      picks: [0, 0, 0, 0],
      avgAnswerMs: null,
      recent: { answers: 0, correct: 0 },
      previous: { answers: 0, correct: 0 },
    },
    ...overrides,
  };
}

describe('CSV', () => {
  it('parses semicolons, quotes and line breaks inside quotes', () => {
    const rows = parseCsv('﻿a;"b;c";"d ""e"""\r\n"x\ny";z;\n');
    expect(rows).toEqual([
      ['a', 'b;c', 'd "e"'],
      ['x\ny', 'z', ''],
    ]);
  });

  it('detects commas and tabs as delimiters', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
    expect(parseCsv('a\tb\n1\t2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('exports what it imports', () => {
    const original = question({ text: 'Mit «Anführung»; und Semikolon?' });
    const preview = previewImport(questionsToCsv([original]), []);
    expect(preview.error).toBeNull();
    expect(preview.rows).toHaveLength(1);
    expect(preview.rows[0]).toMatchObject({
      line: 2,
      problem: null,
      duplicate: false,
      question: {
        text: original.text,
        options: original.options,
        correctIndex: 0,
        category: 'Schweiz',
        active: true,
      },
    });
  });

  it('checks every row and marks duplicates', () => {
    const csv = [
      'Frage;Antwort A;Antwort B;Antwort C;Antwort D;Richtig;Kategorie;Aktiv',
      'Wie viele Kantone hat die Schweiz?;26;23;20;24;A;;ja',
      'Neue Frage?;a;b;c;d;C;Logik;nein',
      'Doppelte Antwort?;a;a;b;c;A;;',
      'Falsche Lösung?;a;b;c;d;E;;',
      'Neue Frage?;a;b;c;d;2;;',
    ].join('\n');
    const rows = previewImport(csv, [question()]).rows;
    expect(rows.map((row) => [row.duplicate, row.problem])).toEqual([
      [true, null],
      [false, null],
      [false, 'Antwort B: Gleich wie eine andere Antwort.'],
      [false, 'Richtig: A, B, C oder D angeben.'],
      [true, null],
    ]);
    expect(rows[1]!.question).toMatchObject({ correctIndex: 2, active: false });
    expect(rows[4]!.question.correctIndex).toBe(1);
  });

  it('explains a file without the needed columns', () => {
    expect(previewImport('Name;Wert\nA;1', []).error).toMatch(/Frage/);
    expect(previewImport('', []).error).toMatch(/keine Fragen/);
  });
});
