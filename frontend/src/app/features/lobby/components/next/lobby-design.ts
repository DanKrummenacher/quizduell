// TEMPORARY: compare the lobby of today with the facelift. Remove together
// with the preview panel once decided.
import type { LobbyState } from '../../lobby.types';

export type LobbyDesign = 'today' | 'facelift';

export interface DesignOption<T extends string> {
  value: T;
  label: string;
}

export const LOBBY_DESIGNS: DesignOption<LobbyDesign>[] = [
  { value: 'today', label: 'Heute' },
  { value: 'facelift', label: 'Facelift' },
];

/** Proposals for the «Gegner gefunden» screen, on top of the facelift. */
export type MatchLayout =
  | 'facelift'
  | 'ring'
  | 'duo'
  | 'count'
  | 'card'
  | 'calm'
  | 'stage'
  | 'split'
  | 'meet'
  | 'lights'
  | 'flip'
  | 'board'
  | 'ticket'
  | 'band'
  | 'flash'
  | 'e-ring-roll'
  | 'e-ring-dark'
  | 'e-ring-name'
  | 'e-meet-dots'
  | 'e-meet-glow'
  | 'e-ring-to-meet'
  | 'x-venn'
  | 'x-inring'
  | 'x-chip'
  | 'x-inline';

export const MATCH_LAYOUTS: DesignOption<MatchLayout>[] = [
  { value: 'facelift', label: 'Facelift (aktuell)' },
  { value: 'x-venn', label: 'X1 · Zwei Ringe, die sich überlappen' },
  { value: 'x-inring', label: 'X2 · Verbunden im Ring' },
  { value: 'x-chip', label: 'X3 · Verbunden, Start-Chip mit Ring' },
  { value: 'x-inline', label: 'X4 · Ring, Spieler beim Namen' },
  { value: 'ring', label: 'M2 · Ring (Favorit)' },
  { value: 'meet', label: 'M8 · Verbunden (Favorit)' },
  { value: 'e-ring-roll', label: 'M2.1 · Ring, Zahl rollt, grüner Start' },
  { value: 'e-ring-dark', label: 'M2.2 · Ring als dunkle Scheibe' },
  { value: 'e-ring-name', label: 'M2.3 · Ring, Gegner als Überschrift' },
  { value: 'e-meet-dots', label: 'M8.1 · Verbunden mit 3 Punkten' },
  { value: 'e-meet-glow', label: 'M8.2 · Verbunden mit Leuchten' },
  { value: 'e-ring-to-meet', label: 'M2 → M8 · Ring wird zu Verbunden' },
];

/** Match proposals that use the whole screen. */
export const FULLSCREEN_MATCH: readonly MatchLayout[] = ['stage', 'split', 'flash'];

/** Combinations of M2.1 and M8.2. */
export const MATCH_BLEND: readonly MatchLayout[] = [
  'x-venn',
  'x-inring',
  'x-chip',
  'x-inline',
];

/** Proposals that build directly on the favourites M2 and M8. */
export const MATCH_EVOLVED: readonly MatchLayout[] = [
  'e-ring-roll',
  'e-ring-dark',
  'e-ring-name',
  'e-meet-dots',
  'e-meet-glow',
  'e-ring-to-meet',
];

/** Further match proposals in their own component. */
export const MATCH_MORE: readonly MatchLayout[] = [
  'meet',
  'lights',
  'flip',
  'board',
  'ticket',
  'band',
  'flash',
];

export const PREVIEW_SCREENS: DesignOption<LobbyState | ''>[] = [
  { value: '', label: 'Echter Ablauf' },
  { value: 'CHOOSE_MODE', label: '1 · Modus wählen' },
  { value: 'CHOOSE_ACTION', label: '2 · Freund: erstellen/beitreten' },
  { value: 'SEARCHING', label: '3 · Schnellspiel: Suche' },
  { value: 'WAITING', label: '4 · Code teilen' },
  { value: 'FOUND', label: '5 · Start-Countdown' },
];
