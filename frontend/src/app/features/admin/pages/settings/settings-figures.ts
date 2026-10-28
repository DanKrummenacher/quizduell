// What the rules mean for players, as the settings page shows it: the length
// of a duel, the points, the warnings, the presets and the last change.
import type {
  AdminSettings,
  AuditEntry,
} from '../../../../core/contracts/admin.contract';
import { formatDuration, formatInt, formatSeconds } from '../../core/format';
import {
  duelLength,
  SETTINGS_META,
  type SettingMeta,
} from '../../core/settings-meta';

export interface Impact {
  typical: string;
  max: string;
  maxPoints: string;
  active: string;
  duelsWithoutRepeat: number;
  warnings: string[];
}

/** The rules in effect for players, with the measured answer time. */
export function impactOf(
  draft: AdminSettings,
  active: number,
  avgAnswerMs: number | null,
): Impact {
  const length = duelLength(draft, avgAnswerMs ?? undefined);
  const warnings: string[] = [];
  if (active < draft.questionsPerGame) {
    warnings.push(
      `Nur ${formatInt(active)} aktive Fragen – mit ${draft.questionsPerGame} Fragen pro Duell kann niemand spielen.`,
    );
  }
  if (avgAnswerMs !== null && draft.questionDurationSec * 1000 < avgAnswerMs * 1.4) {
    warnings.push(
      `Im Schnitt brauchen Spielende ${formatSeconds(avgAnswerMs)} pro Antwort. Mit ${draft.questionDurationSec} s läuft die Zeit oft ab.`,
    );
  }
  return {
    typical: formatDuration(length.typical),
    max: formatDuration(length.max),
    maxPoints: formatInt(maxPointsOf(draft)),
    active: formatInt(active),
    duelsWithoutRepeat: duelsWithoutRepeat(draft, active),
    warnings,
  };
}

export interface Effect {
  label: string;
  before: string;
  after: string;
  changed: boolean;
  words: string;
}

/** The same three figures saved and now, with the difference in words. */
export function effectsOf(
  draft: AdminSettings,
  saved: AdminSettings,
  active: number,
  avgAnswerMs: number | null,
): Effect[] {
  const avg = avgAnswerMs ?? undefined;
  const of = (s: AdminSettings) => [
    duelLength(s, avg).typical,
    maxPointsOf(s),
    duelsWithoutRepeat(s, active),
  ];
  const before = of(saved);
  const after = of(draft);
  const figures = [
    {
      label: 'Ein Duell dauert',
      show: (n: number) => formatDuration(n),
      words: (d: number) =>
        `${Math.round(Math.abs(d) / 1000)} s ${d < 0 ? 'kürzer' : 'länger'}`,
    },
    {
      label: 'Höchstpunktzahl',
      show: (n: number) => formatInt(n),
      words: (d: number) =>
        `${formatInt(Math.abs(d))} ${d < 0 ? 'weniger' : 'mehr'}`,
    },
    {
      label: 'Ohne Wiederholung',
      show: (n: number) => `${n} Duelle`,
      words: (d: number) => `${Math.abs(d)} ${d < 0 ? 'weniger' : 'mehr'}`,
    },
  ];
  return figures.map((figure, i) => {
    const b = before[i]!;
    const a = after[i]!;
    return {
      label: figure.label,
      before: figure.show(b),
      after: figure.show(a),
      changed: a !== b,
      words: figure.words(a - b),
    };
  });
}

export interface Preset {
  id: 'short' | 'default' | 'long';
  label: string;
  values: Partial<AdminSettings>;
  /** How long a duel takes with the preset, in words. */
  length: string;
}

/** Three presets for the flow of a duel; «Eigene» is any other mix. */
export function presetsOf(
  defaults: AdminSettings,
  draft: AdminSettings,
  avgAnswerMs: number | null,
): Preset[] {
  const list: Omit<Preset, 'length'>[] = [
    {
      id: 'short',
      label: 'Kurz',
      values: { questionsPerGame: 5, questionDurationSec: 15, revealDurationSec: 3 },
    },
    {
      id: 'default',
      label: 'Standard',
      values: {
        questionsPerGame: defaults.questionsPerGame,
        questionDurationSec: defaults.questionDurationSec,
        revealDurationSec: defaults.revealDurationSec,
      },
    },
    {
      id: 'long',
      label: 'Ausführlich',
      values: {
        questionsPerGame: 10,
        questionDurationSec: 25,
        revealDurationSec: 5,
      },
    },
  ];
  return list.map((preset) => ({
    ...preset,
    length: formatDuration(
      duelLength({ ...draft, ...preset.values }, avgAnswerMs ?? undefined).typical,
    ),
  }));
}

/** The last save of the rules as a short figure and a line below it. */
export function lastChangeOf(
  entry: AuditEntry | undefined,
  updatedAt: string | null,
  now: number,
): { value: string; note: string } {
  const at = entry?.at ?? updatedAt;
  if (!at) {
    return { value: 'Noch nie', note: 'Es gelten die Standardregeln' };
  }
  const date = new Date(at);
  const today = new Date(now);
  const minutes = Math.round((now - date.getTime()) / 60_000);
  const time = date.toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const yesterday = new Date(now - 86_400_000);
  const value =
    minutes < 1
      ? 'Gerade eben'
      : minutes < 60
        ? `vor ${minutes} Min.`
        : date.toDateString() === today.toDateString()
          ? 'Heute'
          : date.toDateString() === yesterday.toDateString()
            ? 'Gestern'
            : date.toLocaleDateString('de-CH', { day: 'numeric', month: 'short' });
  const count =
    entry?.before && entry.after
      ? SETTINGS_META.filter(
          (meta) => entry.before![meta.key] !== entry.after![meta.key],
        ).length
      : 0;
  const what =
    entry?.action === 'settings.restore'
      ? 'wiederhergestellt'
      : count === 1
        ? '1 Regel'
        : count > 1
          ? `${count} Regeln`
          : null;
  return { value, note: what ? `um ${time} · ${what}` : `um ${time}` };
}

/** What a value would mean, beside it in the menu of a rule. */
export function optionNoteOf(
  meta: SettingMeta,
  value: number,
  draft: AdminSettings,
  avgAnswerMs: number | null,
): string {
  if (meta.key === 'questionDurationSec') {
    if (avgAnswerMs !== null && value * 1000 < avgAnswerMs * 1.4) {
      return 'Zeit läuft oft ab';
    }
    return `Duell bis ${formatDuration(duelLength({ ...draft, [meta.key]: value }).max)}`;
  }
  if (meta.key === 'questionsPerGame' || meta.key === 'revealDurationSec') {
    const length = duelLength(
      { ...draft, [meta.key]: value },
      avgAnswerMs ?? undefined,
    );
    return `Duell ≈ ${formatDuration(length.typical)}`;
  }
  if (meta.key === 'idleResetSec') {
    return value === 0 ? 'Geräte bleiben stehen' : 'nach Ruhe zur Startseite';
  }
  return 'zum Einigen';
}

function maxPointsOf(settings: AdminSettings): number {
  return settings.questionsPerGame * (settings.speedBonusEnabled ? 200 : 100);
}

function duelsWithoutRepeat(settings: AdminSettings, active: number): number {
  return settings.questionsPerGame
    ? Math.max(0, Math.floor(active / settings.questionsPerGame))
    : 0;
}
