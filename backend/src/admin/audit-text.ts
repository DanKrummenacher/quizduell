import type { AdminSettings } from '../contracts/admin.contract.js';

const LABELS: Record<keyof AdminSettings, string> = {
  questionsPerGame: 'Fragen pro Duell',
  questionDurationSec: 'Zeit pro Frage',
  revealDurationSec: 'Auflösung',
  speedBonusEnabled: 'Tempo-Bonus',
  rematchTimeoutSec: 'Zeit für Revanche',
  idleResetSec: 'Automatischer Neustart',
};

function format(key: keyof AdminSettings, value: number | boolean): string {
  if (typeof value === 'boolean') {
    return value ? 'an' : 'aus';
  }
  if (key === 'questionsPerGame') {
    return String(value);
  }
  if (key === 'idleResetSec' && value === 0) {
    return 'aus';
  }
  return `${value} s`;
}

/** «Zeit pro Frage 20 s → 15 s, Tempo-Bonus an → aus», or '' without change. */
export function describeSettingsChange(
  before: AdminSettings,
  after: AdminSettings,
): string {
  return (Object.keys(LABELS) as (keyof AdminSettings)[])
    .filter((key) => before[key] !== after[key])
    .map(
      (key) =>
        `${LABELS[key]} ${format(key, before[key])} → ${format(key, after[key])}`,
    )
    .join(', ');
}

export function shorten(text: string, length = 80): string {
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}
