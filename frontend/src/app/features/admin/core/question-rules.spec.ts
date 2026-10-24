import { checkQuestion, hasProblems } from './question-rules';

const valid = {
  text: 'Wie viele Kantone hat die Schweiz?',
  options: ['26', '23', '20', '24'],
  correctIndex: 0,
  category: null,
  active: true,
};

describe('checkQuestion', () => {
  it('accepts a complete question', () => {
    expect(hasProblems(checkQuestion(valid))).toBe(false);
  });

  it('finds empty, too long and equal answers', () => {
    const problems = checkQuestion({
      ...valid,
      text: '   ',
      options: ['26', ' 26 ', '', 'x'.repeat(81)],
    });
    expect(problems.text).toBe('Die Frage fehlt.');
    expect(problems.options).toEqual([
      undefined,
      'Gleich wie eine andere Antwort.',
      'Die Antwort fehlt.',
      'Höchstens 80 Zeichen.',
    ]);
  });

  it('needs a correct answer', () => {
    expect(checkQuestion({ ...valid, correctIndex: 4 }).form).toBe(
      'Die richtige Antwort fehlt.',
    );
  });
});
