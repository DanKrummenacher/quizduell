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
  | 'flash';

export const MATCH_LAYOUTS: DesignOption<MatchLayout>[] = [
  { value: 'facelift', label: 'Facelift (aktuell)' },
  { value: 'calm', label: 'M1 · Ruhig mit Balken' },
  { value: 'ring', label: 'M2 · Ring wie bei der Suche' },
  { value: 'duo', label: 'M3 · Du gegen Gegner' },
  { value: 'count', label: 'M4 · Grosse Zahl' },
  { value: 'card', label: 'M5 · Duell-Karte' },
  { value: 'stage', label: 'M6 · Bühne (Vollbild)' },
  { value: 'split', label: 'M7 · Geteilter Bildschirm (Vollbild)' },
  { value: 'meet', label: 'M8 · Verbunden' },
  { value: 'lights', label: 'M9 · Startampel' },
  { value: 'flip', label: 'M10 · Gegner aufdecken' },
  { value: 'board', label: 'M11 · Anzeigetafel 0 : 0' },
  { value: 'ticket', label: 'M12 · Ticket gestempelt' },
  { value: 'band', label: 'M13 · Duell-Band' },
  { value: 'flash', label: 'M14 · Farbflash (Vollbild)' },
];

/** Match proposals that use the whole screen. */
export const FULLSCREEN_MATCH: readonly MatchLayout[] = ['stage', 'split', 'flash'];

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
