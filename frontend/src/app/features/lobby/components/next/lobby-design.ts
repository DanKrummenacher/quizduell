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
  | 'b-base'
  | 'b-calm'
  | 'b-top'
  | 'b-comet'
  | 'b-short'
  | 'b-time'
  | 'b-code'
  | 'b-dots';

/** W1 refined: the same code and copy button, a running light. */
export const WAITING_LAYOUTS: DesignOption<WaitingLayout>[] = [
  { value: 'facelift', label: 'Heute (Facelift)' },
  { value: 'b-base', label: 'B1 · W1 wie bisher' },
  { value: 'b-calm', label: 'B2 · Mehr Luft, feineres Licht' },
  { value: 'b-top', label: 'B3 · Licht als Trennlinie' },
  { value: 'b-comet', label: 'B4 · Leuchtender Komet' },
  { value: 'b-short', label: 'B5 · Kurz, hin und her' },
  { value: 'b-time', label: 'B6 · Mit Wartezeit' },
  { value: 'b-code', label: 'B7 · Licht direkt unter dem Code' },
  { value: 'b-dots', label: 'B8 · Hüpfende Punkte' },
];

export const PREVIEW_SCREENS: DesignOption<LobbyState | ''>[] = [
  { value: '', label: 'Echter Ablauf' },
  { value: 'CHOOSE_MODE', label: '1 · Modus wählen' },
  { value: 'CHOOSE_ACTION', label: '2 · Freund: erstellen/beitreten' },
  { value: 'SEARCHING', label: '3 · Schnellspiel: Suche' },
  { value: 'WAITING', label: '4 · Code teilen' },
  { value: 'FOUND', label: '5 · Start-Countdown' },
];
