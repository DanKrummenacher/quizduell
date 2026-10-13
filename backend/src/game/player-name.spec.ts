import { checkPlayerName } from './player-name.js';

describe('checkPlayerName', () => {
  it('trims, collapses whitespace and keeps umlauts', () => {
    expect(checkPlayerName('  Jürg   Müller ')).toEqual({
      ok: true,
      name: 'Jürg Müller',
    });
  });

  it('limits the length to 20 characters', () => {
    const result = checkPlayerName('a'.repeat(50));
    expect(result).toEqual({ ok: true, name: 'a'.repeat(20) });
  });

  it('removes control and invisible characters', () => {
    expect(checkPlayerName('An​na\u0007')).toEqual({ ok: true, name: 'Anna' });
  });

  it.each([undefined, null, 42, '', '   ', '​'])('rejects %j', (value) => {
    expect(checkPlayerName(value)).toEqual({ ok: false, reason: 'invalid' });
  });

  it.each(['Arschloch', 'H1tler', 'xX_FUCK_Xx', 'Scheiss Typ'])(
    'blocks %s',
    (value) => {
      expect(checkPlayerName(value)).toEqual({ ok: false, reason: 'blocked' });
    },
  );

  it.each(['Benedikt', 'Hans-Peter', 'Lea 🦊', 'Joël'])('accepts %s', (value) => {
    expect(checkPlayerName(value).ok).toBe(true);
  });
});
