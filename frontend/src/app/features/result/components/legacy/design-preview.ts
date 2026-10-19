// TEMPORARY: options to compare result page designs while the facelift is
// being reviewed. Remove together with the design preview panel.
import type { RematchStatus } from '../../../../core/contracts/game.contract';

/** How the rematch message adapts when it gets narrow (phones). */
export type ResultNarrowStyle =
  'wrap' | 'stacked' | 'stacked-left' | 'short' | 'small';

export interface DesignOption<T extends string> {
  value: T;
  label: string;
}

export const NARROW_STYLES: DesignOption<ResultNarrowStyle>[] = [
  { value: 'wrap', label: 'Umbrechen: wie breit, Text auf 2 Zeilen' },
  { value: 'stacked', label: 'Gestapelt mittig: Zeit ans Balkenende' },
  { value: 'stacked-left', label: 'Gestapelt links: Zeit ans Balkenende' },
  { value: 'short', label: 'Kurztext: ohne Namen, eine Zeile' },
  { value: 'small', label: 'Kleiner: Text etwas kleiner' },
];

export const PREVIEW_STATES: DesignOption<RematchStatus | ''>[] = [
  { value: '', label: 'Echter Zustand' },
  { value: 'open', label: 'Revanche möglich' },
  { value: 'requested', label: 'Anfrage gesendet' },
  { value: 'offered', label: 'Gegner fragt an' },
  { value: 'paused', label: 'Verbindung unterbrochen' },
  { value: 'opponent-left', label: 'Gegner hat verlassen' },
  { value: 'unanswered', label: 'Nicht rechtzeitig reagiert' },
  { value: 'expired', label: 'Zeit abgelaufen' },
];
