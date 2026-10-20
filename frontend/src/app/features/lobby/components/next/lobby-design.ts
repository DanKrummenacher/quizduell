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
  'facelift' | 'q-card' | 'q-dark' | 'q-hero' | 'q-players' | 'q-stub' | 'q-steps';

export const WAITING_LAYOUTS: DesignOption<WaitingLayout>[] = [
  { value: 'facelift', label: 'Facelift (aktuell)' },
  { value: 'q-card', label: 'Q1 · Code-Karte' },
  { value: 'q-dark', label: 'Q2 · Dunkle Code-Karte' },
  { value: 'q-hero', label: 'Q3 · Der Code als Überschrift' },
  { value: 'q-players', label: 'Q4 · Code-Karte mit den Spielern' },
  { value: 'q-stub', label: 'Q5 · Code-Karte als Ticket' },
  { value: 'q-steps', label: 'Q6 · Code-Karte mit Ablauf' },
];

export const PREVIEW_SCREENS: DesignOption<LobbyState | ''>[] = [
  { value: '', label: 'Echter Ablauf' },
  { value: 'CHOOSE_MODE', label: '1 · Modus wählen' },
  { value: 'CHOOSE_ACTION', label: '2 · Freund: erstellen/beitreten' },
  { value: 'SEARCHING', label: '3 · Schnellspiel: Suche' },
  { value: 'WAITING', label: '4 · Code teilen' },
  { value: 'FOUND', label: '5 · Start-Countdown' },
];
