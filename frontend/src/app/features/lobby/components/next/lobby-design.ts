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
  | 'z-duo'
  | 'z-ring'
  | 'z-code'
  | 'z-share'
  | 'z-letters'
  | 'z-me-ring'
  | 'z-code-ring'
  | 'z-seat'
  | 'z-tap'
  | 'z-dark';

export const WAITING_LAYOUTS: DesignOption<WaitingLayout>[] = [
  { value: 'facelift', label: 'Facelift (aktuell)' },
  { value: 'z-duo', label: 'Z1 · Wie «Verbunden!»: dein Platz, sein Platz' },
  { value: 'z-ring', label: 'Z2 · Wie die Suche: Ring zählt die Wartezeit' },
  { value: 'z-code', label: 'Z3 · Der Code selbst ist das Bild' },
  { value: 'z-share', label: 'Z4 · Wie Z1, mit «Teilen» und «Kopieren»' },
  { value: 'z-letters', label: 'Z5 · Wie Z1, Code als grosse Buchstaben' },
  { value: 'z-me-ring', label: 'Z6 · Du im Ring der Suche' },
  { value: 'z-code-ring', label: 'Z7 · Der Code im Ring, «Code teilen»' },
  { value: 'z-seat', label: 'Z8 · Der freie Platz deines Freundes' },
  { value: 'z-tap', label: 'Z9 · Wie Z1, Tippen auf den Code kopiert' },
  { value: 'z-dark', label: 'Z10 · Wie Z2, als dunkle Uhr' },
];

export const PREVIEW_SCREENS: DesignOption<LobbyState | ''>[] = [
  { value: '', label: 'Echter Ablauf' },
  { value: 'CHOOSE_MODE', label: '1 · Modus wählen' },
  { value: 'CHOOSE_ACTION', label: '2 · Freund: erstellen/beitreten' },
  { value: 'SEARCHING', label: '3 · Schnellspiel: Suche' },
  { value: 'WAITING', label: '4 · Code teilen' },
  { value: 'FOUND', label: '5 · Start-Countdown' },
];
