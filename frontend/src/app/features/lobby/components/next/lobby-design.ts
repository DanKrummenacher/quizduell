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
  | 'h-cards'
  | 'h-focus'
  | 'h-profile'
  | 'h-dark';

export const MATCH_LAYOUTS: DesignOption<MatchLayout>[] = [
  { value: 'facelift', label: 'Facelift (aktuell)' },
  { value: 'ring', label: 'M2 · Ring (Favorit)' },
  { value: 'meet', label: 'M8 · Verbunden (Favorit)' },
  { value: 'h-cards', label: 'H1 · Spielerkarten mit Start-Uhr' },
  { value: 'h-focus', label: 'H2 · Gegner im Fokus' },
  { value: 'h-profile', label: 'H3 · Karte des Gegners' },
  { value: 'h-dark', label: 'H4 · Gegner im Fokus, dunkel (Vollbild)' },
];

/** Match proposals that use the whole screen. */
export const FULLSCREEN_MATCH: readonly MatchLayout[] = [
  'stage',
  'split',
  'flash',
  'h-dark',
];

/** High-fidelity proposals: clear hierarchy, cards and one calm motion. */
export const MATCH_HIFI: readonly MatchLayout[] = [
  'h-cards',
  'h-focus',
  'h-profile',
  'h-dark',
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
