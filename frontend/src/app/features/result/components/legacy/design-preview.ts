// TEMPORARY: options to compare result page designs while the facelift is
// being reviewed. Remove together with the design preview panel.
import type { RematchStatus } from '../../../../core/contracts/game.contract';

export type ResultIconStyle =
  'diamond' | 'diamond-soft' | 'square' | 'square-outline';
export type ResultNoticeStyle = 'line' | 'card' | 'center';

export interface DesignOption<T extends string> {
  value: T;
  label: string;
}

export const ICON_STYLES: DesignOption<ResultIconStyle>[] = [
  { value: 'diamond', label: 'Raute' },
  { value: 'diamond-soft', label: 'Raute, abgerundet' },
  { value: 'square', label: 'Viereck, gefüllt' },
  { value: 'square-outline', label: 'Viereck, Umriss (wie vorher)' },
];

export const NOTICE_STYLES: DesignOption<ResultNoticeStyle>[] = [
  { value: 'line', label: 'Zeile' },
  { value: 'card', label: 'Hinweiskarte' },
  { value: 'center', label: 'Zentriert' },
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
