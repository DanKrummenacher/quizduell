// Where a question stands among all judged questions, for the hints of the
// editor: a scale of 0–100 with the target range, the question and the gap.
import type {
  AdminQuestion,
  HintType,
} from '../../../../core/contracts/admin.contract';
import { formatInt, formatPercent, share } from '../../core/format';

/** Bars of the distribution along the scale. */
const BARS = 20;

/** Where a question stands among the pool, on a scale of 0–100. */
export interface Place {
  own: number;
  ownLabel: string;
  max: string;
  zone: { left: number; width: number };
  zoneLabel: string;
  /** The stretch between the target range and the question. */
  gap: { left: number; width: number; text: string } | null;
  /** The question against all questions judged so far, in words. */
  place: string;
  bars: { height: number; zone: boolean; own: boolean }[];
}

const MEASURES: Partial<
  Record<HintType, (question: AdminQuestion) => number | null>
> = {
  hard: ({ stats }) => share(stats.correct, stats.answers),
  easy: ({ stats }) => share(stats.correct, stats.answers),
  timeouts: ({ stats }) => share(stats.timeouts, stats.answers + stats.timeouts),
  lure: ({ stats, correctIndex }) =>
    share(
      Math.max(0, ...stats.picks.filter((_, i) => i !== correctIndex)),
      stats.picks.reduce((sum, n) => sum + n, 0),
    ),
};

export function placeOf(
  type: HintType,
  question: AdminQuestion,
  pool: AdminQuestion[],
): Place | null {
  const measure = MEASURES[type];
  const own = measure?.(question) ?? null;
  const values = measure
    ? pool.map(measure).filter((value): value is number => value !== null)
    : [];
  if (own === null || values.length < 5) {
    return null;
  }
  const { picks } = question.stats;
  const zone =
    type === 'timeouts'
      ? { from: 0, to: 0.2 }
      : type === 'lure'
        ? {
            from: 0,
            to:
              share(
                picks[question.correctIndex] ?? 0,
                picks.reduce((sum, n) => sum + n, 0),
              ) ?? 0,
          }
        : { from: 0.3, to: 0.95 };
  const max = type === 'timeouts' ? Math.max(0.4, ...values, own) : 1;
  const at = (value: number) => Math.min(100, (value / max) * 100);
  const below = own < zone.from;
  const above = own > zone.to;
  const points = Math.round(Math.abs((below ? zone.from : zone.to) - own) * 100);
  const beyond = values.filter((value) =>
    type === 'hard' ? value > own : value < own,
  ).length;
  const counted = `${formatPercent(beyond / values.length)} der ${formatInt(values.length)} bewerteten Fragen`;
  const counts = Array<number>(BARS).fill(0);
  for (const value of values) {
    counts[Math.min(BARS - 1, Math.floor((at(value) / 100) * BARS))]! += 1;
  }
  const top = Math.max(1, ...counts);
  const ownBar = Math.min(BARS - 1, Math.floor((at(own) / 100) * BARS));
  return {
    own: at(own),
    ownLabel: formatPercent(own),
    max: formatPercent(max),
    zone: { left: at(zone.from), width: at(zone.to) - at(zone.from) },
    zoneLabel:
      type === 'lure'
        ? `Zielbereich unter der richtigen (${formatPercent(zone.to)})`
        : type === 'timeouts'
          ? `Zielbereich unter ${formatPercent(zone.to)} ohne Antwort`
          : `Zielbereich ${Math.round(zone.from * 100)}–${formatPercent(zone.to)} richtig`,
    gap:
      below || above
        ? {
            left: at(below ? own : zone.to),
            width: below ? at(zone.from) - at(own) : at(own) - at(zone.to),
            text: `${points} Punkte ${below ? 'unter' : 'über'} ${type === 'lure' ? 'der richtigen' : 'dem Zielbereich'}`,
          }
        : null,
    place:
      type === 'hard'
        ? `Schwerer als ${counted}`
        : type === 'easy'
          ? `Leichter als ${counted}`
          : type === 'timeouts'
            ? `Öfter ohne Antwort als ${counted}`
            : `Lockt stärker als bei ${counted}`,
    bars: counts.map((count, i) => {
      const mid = ((i + 0.5) / BARS) * 100;
      return {
        height:
          i === ownBar ? Math.max(18, (count / top) * 100) : (count / top) * 100,
        zone: mid >= at(zone.from) && mid <= at(zone.to),
        own: i === ownBar,
      };
    }),
  };
}
