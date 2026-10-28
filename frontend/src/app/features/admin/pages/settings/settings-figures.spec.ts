import type { AdminSettings } from '../../../../core/contracts/admin.contract';
import { SETTINGS_META } from '../../core/settings-meta';
import {
  effectsOf,
  impactOf,
  lastChangeOf,
  optionNoteOf,
  presetsOf,
} from './settings-figures';

const DEFAULTS: AdminSettings = {
  questionsPerGame: 7,
  questionDurationSec: 20,
  revealDurationSec: 4,
  speedBonusEnabled: true,
  rematchTimeoutSec: 45,
  idleResetSec: 120,
};

describe('impactOf', () => {
  it('sums up a duel and warns when the rules cannot be played', () => {
    const impact = impactOf(DEFAULTS, 32, 7000);
    expect(impact.typical).toBe('1:20 Min.');
    expect(impact.max).toBe('2:51 Min.');
    expect(impact.maxPoints).toBe("1'400");
    expect(impact.duelsWithoutRepeat).toBe(4);
    expect(impact.warnings).toEqual([]);

    const starved = impactOf({ ...DEFAULTS, questionDurationSec: 5 }, 3, 9000);
    expect(starved.warnings).toHaveLength(2);
    expect(starved.warnings[0]).toContain('Nur 3 aktive Fragen');
    expect(starved.warnings[1]).toContain('läuft die Zeit oft ab');
  });
});

describe('effectsOf', () => {
  it('puts the difference of each figure into words', () => {
    const effects = effectsOf(
      { ...DEFAULTS, questionsPerGame: 5, speedBonusEnabled: false },
      DEFAULTS,
      32,
      7000,
    );
    expect(effects.map((e) => e.label)).toEqual([
      'Ein Duell dauert',
      'Höchstpunktzahl',
      'Ohne Wiederholung',
    ]);
    expect(effects[0]).toMatchObject({ changed: true, words: '22 s kürzer' });
    expect(effects[1]).toMatchObject({
      before: "1'400",
      after: '500',
      words: '900 weniger',
    });
    expect(effects[2]).toMatchObject({
      before: '4 Duelle',
      after: '6 Duelle',
      words: '2 mehr',
    });
  });
});

describe('presetsOf', () => {
  it('offers short, default and long with their length', () => {
    const presets = presetsOf(DEFAULTS, DEFAULTS, 7000);
    expect(presets.map((p) => p.id)).toEqual(['short', 'default', 'long']);
    expect(presets[1]?.values).toEqual({
      questionsPerGame: 7,
      questionDurationSec: 20,
      revealDurationSec: 4,
    });
    expect(presets[0]?.length).toBe('53 s');
  });
});

describe('lastChangeOf', () => {
  const now = new Date('2026-10-28T15:00:00+01:00').getTime();

  it('says when nothing was ever saved', () => {
    expect(lastChangeOf(undefined, null, now)).toEqual({
      value: 'Noch nie',
      note: 'Es gelten die Standardregeln',
    });
  });

  it('counts the changed rules of the last save', () => {
    const entry = {
      id: 1,
      at: new Date(now - 5 * 60_000).toISOString(),
      action: 'settings.update' as const,
      summary: '',
      before: DEFAULTS,
      after: { ...DEFAULTS, questionsPerGame: 5, revealDurationSec: 3 },
    };
    const change = lastChangeOf(entry, null, now);
    expect(change.value).toBe('vor 5 Min.');
    expect(change.note).toMatch(/^um \d\d:\d\d · 2 Regeln$/);
  });

  it('names yesterday and a restore', () => {
    const entry = {
      id: 2,
      at: new Date(now - 24 * 60 * 60_000).toISOString(),
      action: 'settings.restore' as const,
      summary: '',
    };
    const change = lastChangeOf(entry, null, now);
    expect(change.value).toBe('Gestern');
    expect(change.note).toContain('wiederhergestellt');
  });
});

describe('optionNoteOf', () => {
  const meta = (key: keyof AdminSettings) =>
    SETTINGS_META.find((m) => m.key === key)!;

  it('explains what a value in the menu would mean', () => {
    expect(optionNoteOf(meta('questionDurationSec'), 5, DEFAULTS, 9000)).toBe(
      'Zeit läuft oft ab',
    );
    expect(optionNoteOf(meta('questionDurationSec'), 30, DEFAULTS, null)).toMatch(
      /^Duell bis /,
    );
    expect(optionNoteOf(meta('questionsPerGame'), 10, DEFAULTS, 7000)).toMatch(
      /^Duell ≈ /,
    );
    expect(optionNoteOf(meta('idleResetSec'), 0, DEFAULTS, null)).toBe(
      'Geräte bleiben stehen',
    );
    expect(optionNoteOf(meta('rematchTimeoutSec'), 60, DEFAULTS, null)).toBe(
      'zum Einigen',
    );
  });
});
