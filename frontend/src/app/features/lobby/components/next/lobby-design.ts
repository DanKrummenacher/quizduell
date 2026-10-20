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
  'facelift' | 'w-boxes' | 'w-ring' | 'w-duo' | 'w-share' | 'w-blocks' | 'w-steps';

export const WAITING_LAYOUTS: DesignOption<WaitingLayout>[] = [
  { value: 'facelift', label: 'Facelift (aktuell)' },
  { value: 'w-boxes', label: '1 · Code in den Kästchen vom Beitreten' },
  { value: 'w-ring', label: '2 · Wie die Suche: Code im Ring' },
  { value: 'w-duo', label: '3 · Dein Platz, der Platz deines Freundes' },
  { value: 'w-share', label: '4 · Karte mit Kopieren und Teilen' },
  { value: 'w-blocks', label: '5 · Code als dunkle Blöcke' },
  { value: 'w-steps', label: '6 · Mit den drei Schritten' },
];

export const PREVIEW_SCREENS: DesignOption<LobbyState | ''>[] = [
  { value: '', label: 'Echter Ablauf' },
  { value: 'CHOOSE_MODE', label: '1 · Modus wählen' },
  { value: 'CHOOSE_ACTION', label: '2 · Freund: erstellen/beitreten' },
  { value: 'SEARCHING', label: '3 · Schnellspiel: Suche' },
  { value: 'WAITING', label: '4 · Code teilen' },
  { value: 'FOUND', label: '5 · Start-Countdown' },
];
