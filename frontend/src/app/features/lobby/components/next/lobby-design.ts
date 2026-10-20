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
  | 'y-ring'
  | 'y-hero'
  | 'y-ticket'
  | 'y-message'
  | 'y-seats'
  | 'y-timeline';

export const WAITING_LAYOUTS: DesignOption<WaitingLayout>[] = [
  { value: 'facelift', label: 'Facelift (aktuell)' },
  { value: 'y-ring', label: 'Y1 · Ring der Suche mit dem Code' },
  { value: 'y-hero', label: 'Y2 · Der Code als Überschrift' },
  { value: 'y-ticket', label: 'Y3 · Einladungs-Ticket' },
  { value: 'y-message', label: 'Y4 · Die Nachricht an deinen Freund' },
  { value: 'y-seats', label: 'Y5 · Zwei Plätze und Code-Pille' },
  { value: 'y-timeline', label: 'Y6 · Ablauf von links nach rechts' },
];

export const PREVIEW_SCREENS: DesignOption<LobbyState | ''>[] = [
  { value: '', label: 'Echter Ablauf' },
  { value: 'CHOOSE_MODE', label: '1 · Modus wählen' },
  { value: 'CHOOSE_ACTION', label: '2 · Freund: erstellen/beitreten' },
  { value: 'SEARCHING', label: '3 · Schnellspiel: Suche' },
  { value: 'WAITING', label: '4 · Code teilen' },
  { value: 'FOUND', label: '5 · Start-Countdown' },
];
