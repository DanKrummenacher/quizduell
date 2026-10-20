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

/** Proposals for the «Spiel erstellt» screen. */
export type WaitingLayout =
  | 'facelift'
  | 'd-dark'
  | 'd-pingpong'
  | 'd-dual'
  | 'd-stripes'
  | 'd-blocks'
  | 'd-center'
  | 'd-dot'
  | 'd-time';

/** The spacing of before, the code in boxes, a dark blue bar. */
export const WAITING_LAYOUTS: DesignOption<WaitingLayout>[] = [
  { value: 'facelift', label: 'Heute (Facelift)' },
  { value: 'd-dark', label: 'D1 · Dunkelblaues Licht' },
  { value: 'd-pingpong', label: 'D2 · Pendel' },
  { value: 'd-dual', label: 'D3 · Zwei Lichter' },
  { value: 'd-stripes', label: 'D4 · Laufende Streifen' },
  { value: 'd-blocks', label: 'D5 · Blöcke' },
  { value: 'd-center', label: 'D6 · Aus der Mitte' },
  { value: 'd-dot', label: 'D7 · Punkt auf der Linie' },
  { value: 'd-time', label: 'D8 · Zeitbalken mit Wartezeit' },
];

export const PREVIEW_SCREENS: DesignOption<LobbyState | ''>[] = [
  { value: '', label: 'Echter Ablauf' },
  { value: 'CHOOSE_MODE', label: '1 · Modus wählen' },
  { value: 'CHOOSE_ACTION', label: '2 · Freund: erstellen/beitreten' },
  { value: 'SEARCHING', label: '3 · Schnellspiel: Suche' },
  { value: 'WAITING', label: '4 · Code teilen' },
  { value: 'FOUND', label: '5 · Start-Countdown' },
];
