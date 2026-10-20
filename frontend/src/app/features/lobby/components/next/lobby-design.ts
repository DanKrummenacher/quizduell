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

/** Proposals for the search screen, on top of the facelift. */
export type SearchLayout =
  | 'facelift'
  | 'radar'
  | 'duo'
  | 'band'
  | 'tips'
  | 'bar'
  | 'orbit'
  | 'stage'
  | 'seats'
  | 'steps'
  | 'sheet'
  | 'slot'
  | 'warmup'
  | 'logo'
  | 'split'
  | 'pulse'
  | 'ticket'
  | 'type'
  | 'chat';

export const SEARCH_LAYOUTS: DesignOption<SearchLayout>[] = [
  { value: 'facelift', label: 'Facelift (aktuell)' },
  { value: 'radar', label: '1 · Radar' },
  { value: 'duo', label: '2 · Du gegen ?' },
  { value: 'band', label: '3 · Duell-Band' },
  { value: 'tips', label: '4 · Tipps beim Warten' },
  { value: 'bar', label: '5 · Ruhig mit Ladebalken' },
  { value: 'orbit', label: '6 · Umlaufbahn' },
  { value: 'stage', label: '7 · Bühne (Vollbild)' },
  { value: 'seats', label: '8 · Zwei Plätze' },
  { value: 'steps', label: '9 · Ablauf in Schritten' },
  { value: 'sheet', label: '10 · Blatt über der Auswahl' },
  { value: 'slot', label: '11 · Gegner wird ausgelost' },
  { value: 'warmup', label: '12 · Aufwärmrunde' },
  { value: 'logo', label: '13 · Logo als Lader' },
  { value: 'split', label: '14 · Geteilter Bildschirm' },
  { value: 'pulse', label: '15 · Puls mit Zeitring' },
  { value: 'ticket', label: '16 · Duell-Ticket' },
  { value: 'type', label: '17 · Grosse Schrift' },
  { value: 'chat', label: '18 · Chat' },
];

export const PREVIEW_SCREENS: DesignOption<LobbyState | ''>[] = [
  { value: '', label: 'Echter Ablauf' },
  { value: 'CHOOSE_MODE', label: '1 · Modus wählen' },
  { value: 'CHOOSE_ACTION', label: '2 · Freund: erstellen/beitreten' },
  { value: 'SEARCHING', label: '3 · Schnellspiel: Suche' },
  { value: 'WAITING', label: '4 · Code teilen' },
  { value: 'FOUND', label: '5 · Start-Countdown' },
];

/** Search proposals with their own, new page structure. */
export const SEARCH_CONCEPTS: readonly SearchLayout[] = [
  'stage',
  'seats',
  'steps',
  'sheet',
  'slot',
  'warmup',
  'logo',
  'split',
  'pulse',
  'ticket',
  'type',
  'chat',
];

/** Search proposals that use the whole screen (no greeting, no back link). */
export const FULLSCREEN_SEARCH: readonly SearchLayout[] = [
  'stage',
  'warmup',
  'split',
  'type',
  'chat',
];

/** Search proposals in the third concept component. */
export const SEARCH_MORE: readonly SearchLayout[] = [
  'pulse',
  'ticket',
  'type',
  'chat',
];
