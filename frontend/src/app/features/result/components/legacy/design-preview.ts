// TEMPORARY: options to compare result page designs while the facelift is
// being reviewed. Remove together with the design preview panel.
import type { RematchStatus } from '../../../../core/contracts/game.contract';

/** How the remaining time of a rematch request is shown. */
export type ResultTimerStyle = 'bar-time' | 'text-time' | 'chip' | 'ring';

export interface DesignOption<T extends string> {
  value: T;
  label: string;
}

export const TIMER_STYLES: DesignOption<ResultTimerStyle>[] = [
  { value: 'bar-time', label: 'Balken, Zeit rechts daneben' },
  { value: 'text-time', label: 'Zeit im Text, Balken darunter' },
  { value: 'chip', label: 'Zeit als Marke, Balken darunter' },
  { value: 'ring', label: 'Kreis mit Sekunden' },
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
