import { emptyDraft, hasErrors, toInput, validateDraft } from './question-form';

describe('question form', () => {
  const valid = {
    text: 'Wie viele Kantone hat die Schweiz?',
    options: ['23', '24', '26', '28'],
    correctIndex: 2,
    category: ' Schweiz ',
    active: true,
  };

  it('accepts a complete question', () => {
    expect(hasErrors(validateDraft(valid))).toBe(false);
  });

  it('requires a question text of at least 5 characters', () => {
    expect(validateDraft({ ...valid, text: ' Hm? ' }).text).toContain(
      'mindestens 5',
    );
  });

  it('requires all four answers', () => {
    const errors = validateDraft({ ...valid, options: ['a', '', 'c', ' '] });
    expect(errors.optionErrors).toEqual([
      null,
      'Bitte ausfüllen.',
      null,
      'Bitte ausfüllen.',
    ]);
    expect(hasErrors(errors)).toBe(true);
  });

  it('rejects duplicate answers regardless of case', () => {
    const errors = validateDraft({
      ...valid,
      options: ['Bern', 'bern ', 'Genf', 'Basel'],
    });
    expect(errors.optionErrors?.[1]).toBe('Diese Antwort gibt es schon.');
  });

  it('starts empty', () => {
    expect(hasErrors(validateDraft(emptyDraft()))).toBe(true);
  });

  it('trims values and turns an empty category into null', () => {
    expect(toInput({ ...valid, text: '  Frage?  ', category: '   ' })).toEqual({
      ...valid,
      text: 'Frage?',
      category: null,
    });
    expect(toInput(valid).category).toBe('Schweiz');
  });
});
