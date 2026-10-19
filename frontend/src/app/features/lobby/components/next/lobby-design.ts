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

/** Proposals for the mode screen, on top of the facelift. */
export type ModeLayout =
  | 'facelift'
  | 'refined'
  | 'tiles'
  | 'focus'
  | 'info'
  | 'buttons'
  | 'band'
  | 'toggle';

export const MODE_LAYOUTS: DesignOption<ModeLayout>[] = [
  { value: 'facelift', label: 'Facelift (aktuell)' },
  { value: 'refined', label: '1 · Feinschliff' },
  { value: 'tiles', label: '2 · Zwei Kacheln' },
  { value: 'focus', label: '3 · Schnellspiel im Fokus' },
  { value: 'info', label: '4 · Mit Spielinfos' },
  { value: 'buttons', label: '5 · Zwei Knöpfe' },
  { value: 'band', label: '6 · Duell-Vorschau' },
  { value: 'toggle', label: '7 · Umschalter' },
];

export const PREVIEW_SCREENS: DesignOption<LobbyState | ''>[] = [
  { value: '', label: 'Echter Ablauf' },
  { value: 'CHOOSE_MODE', label: '1 · Modus wählen' },
  { value: 'CHOOSE_ACTION', label: '2 · Freund: erstellen/beitreten' },
  { value: 'SEARCHING', label: '3 · Schnellspiel: Suche' },
  { value: 'WAITING', label: '4 · Code teilen' },
  { value: 'FOUND', label: '5 · Start-Countdown' },
];
