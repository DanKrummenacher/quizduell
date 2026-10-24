import type {
  AdminSettings,
  NumericSettingKey,
} from '../../../core/contracts/admin.contract';

export interface SettingMeta {
  key: keyof AdminSettings;
  label: string;
  description: string;
  unit?: string;
  /** Text for the value 0, e.g. «aus». */
  zero?: string;
  step?: number;
}

/** Labels and explanations of the game rules, in the order of the page. */
export const SETTINGS_META: readonly SettingMeta[] = [
  {
    key: 'questionsPerGame',
    label: 'Fragen pro Duell',
    description: 'So viele Fragen beantworten beide Spielenden in einem Duell.',
  },
  {
    key: 'questionDurationSec',
    label: 'Zeit pro Frage',
    description: 'Danach wird die Frage aufgelöst, auch ohne Antwort.',
    unit: 's',
  },
  {
    key: 'revealDurationSec',
    label: 'Auflösung',
    description:
      'So lange bleibt die richtige Antwort sichtbar, bevor die nächste Frage kommt.',
    unit: 's',
  },
  {
    key: 'speedBonusEnabled',
    label: 'Tempo-Bonus',
    description:
      'Richtige Antworten geben 100 Punkte. Mit Tempo-Bonus kommen bis zu 100 Punkte dazu, je schneller die Antwort.',
  },
  {
    key: 'rematchTimeoutSec',
    label: 'Zeit für Revanche',
    description:
      'So lange können sich beide nach dem Duell auf eine Revanche einigen.',
    unit: 's',
    step: 5,
  },
  {
    key: 'idleResetSec',
    label: 'Automatischer Neustart',
    description:
      'Geräte ohne Bedienung kehren nach dieser Zeit zur Startseite zurück, damit die nächste Person neu beginnt. Nie während eines Duells.',
    unit: 's',
    zero: 'aus',
    step: 10,
  },
];

export const NUMERIC_SETTINGS = SETTINGS_META.filter(
  (meta): meta is SettingMeta & { key: NumericSettingKey } =>
    meta.key !== 'speedBonusEnabled',
);

export function settingLabel(key: keyof AdminSettings): string {
  return SETTINGS_META.find((meta) => meta.key === key)?.label ?? key;
}

export function formatSetting(
  key: keyof AdminSettings,
  value: number | boolean,
): string {
  if (typeof value === 'boolean') {
    return value ? 'an' : 'aus';
  }
  const meta = SETTINGS_META.find((m) => m.key === key);
  if (value === 0 && meta?.zero) {
    return meta.zero;
  }
  return meta?.unit ? `${value} ${meta.unit}` : String(value);
}

/** How long a duel takes at most and typically with these rules, in ms. */
export function duelLength(settings: AdminSettings, typicalAnswerMs = 7000) {
  const countdown = 3000;
  const reveal = settings.revealDurationSec * 1000;
  const question = settings.questionDurationSec * 1000;
  const typicalQuestion = Math.min(question, typicalAnswerMs);
  return {
    max: countdown + settings.questionsPerGame * (question + reveal),
    typical: countdown + settings.questionsPerGame * (typicalQuestion + reveal),
  };
}
