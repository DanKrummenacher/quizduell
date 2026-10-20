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
  | 'x-mirror'
  | 'x-share'
  | 'x-shimmer'
  | 'x-story'
  | 'x-card'
  | 'x-big'
  | 'x-tap'
  | 'x-dark'
  | 'x-time';

export const WAITING_LAYOUTS: DesignOption<WaitingLayout>[] = [
  { value: 'facelift', label: 'Facelift (aktuell)' },
  { value: 'x-mirror', label: 'X1 · Gegenstück zu «Code eingeben»' },
  { value: 'x-share', label: 'X2 · X1 mit Kopieren und Teilen' },
  { value: 'x-shimmer', label: 'X3 · X1, ein Licht läuft durch' },
  { value: 'x-story', label: 'X4 · Dein Platz, sein Platz, dann der Code' },
  { value: 'x-card', label: 'X5 · Code als Karte, Tippen kopiert' },
  { value: 'x-big', label: 'X6 · Nur der grosse Code, eine Aktion' },
  { value: 'x-tap', label: 'X7 · Tippen auf den Code kopiert' },
  { value: 'x-dark', label: 'X8 · Code auf dunkler Fläche' },
  { value: 'x-time', label: 'X9 · X1 mit Wartezeit' },
];

export const PREVIEW_SCREENS: DesignOption<LobbyState | ''>[] = [
  { value: '', label: 'Echter Ablauf' },
  { value: 'CHOOSE_MODE', label: '1 · Modus wählen' },
  { value: 'CHOOSE_ACTION', label: '2 · Freund: erstellen/beitreten' },
  { value: 'SEARCHING', label: '3 · Schnellspiel: Suche' },
  { value: 'WAITING', label: '4 · Code teilen' },
  { value: 'FOUND', label: '5 · Start-Countdown' },
];
