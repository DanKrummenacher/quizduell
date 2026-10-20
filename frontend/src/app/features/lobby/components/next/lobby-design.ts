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
  | 'w-bar'
  | 'w-time'
  | 'w-ring'
  | 'w-friend'
  | 'w-chip'
  | 'w-boxes'
  | 'w-wave';

/** The same code and copy button; only the way of waiting differs. */
export const WAITING_LAYOUTS: DesignOption<WaitingLayout>[] = [
  { value: 'facelift', label: 'Heute (Facelift)' },
  { value: 'w-bar', label: 'W1 · Lichtbalken' },
  { value: 'w-time', label: 'W2 · Zeitbalken mit Wartezeit' },
  { value: 'w-ring', label: 'W3 · Kleiner Ring wie die Suche' },
  { value: 'w-friend', label: 'W4 · Du und dein Freund' },
  { value: 'w-chip', label: 'W5 · Live-Badge mit Zeit' },
  { value: 'w-boxes', label: 'W6 · Licht läuft durch die Kästchen' },
  { value: 'w-wave', label: 'W7 · Zeichen hüpfen als Welle' },
];

export const PREVIEW_SCREENS: DesignOption<LobbyState | ''>[] = [
  { value: '', label: 'Echter Ablauf' },
  { value: 'CHOOSE_MODE', label: '1 · Modus wählen' },
  { value: 'CHOOSE_ACTION', label: '2 · Freund: erstellen/beitreten' },
  { value: 'SEARCHING', label: '3 · Schnellspiel: Suche' },
  { value: 'WAITING', label: '4 · Code teilen' },
  { value: 'FOUND', label: '5 · Start-Countdown' },
];
