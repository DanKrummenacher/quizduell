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
  | 's-tidy'
  | 's-share'
  | 'x-mirror'
  | 'x-share'
  | 'x-shimmer'
  | 'x-story'
  | 'x-card'
  | 'x-big'
  | 'x-tap'
  | 'x-dark'
  | 'x-time'
  | 'y-ring'
  | 'y-hero'
  | 'y-ticket'
  | 'y-message'
  | 'y-seats'
  | 'y-timeline'
  | 'z-duo'
  | 'z-ring'
  | 'z-code'
  | 'z-share'
  | 'z-letters'
  | 'z-me-ring'
  | 'z-code-ring'
  | 'z-seat'
  | 'z-tap'
  | 'z-dark'
  | 'q-card'
  | 'q-dark'
  | 'q-hero'
  | 'q-players'
  | 'q-stub'
  | 'q-steps';

/** A gallery from small changes to whole new approaches. */
export const WAITING_LAYOUTS: DesignOption<WaitingLayout>[] = [
  { value: 'facelift', label: 'Heute (Facelift)' },
  { value: 's-tidy', label: 'Klein 1 · Heute, verfeinert' },
  { value: 's-share', label: 'Klein 2 · Heute, mit Teilen' },
  { value: 'x-mirror', label: 'Mittel 1 · Kästchen wie «Code eingeben»' },
  { value: 'x-tap', label: 'Mittel 2 · Tippen auf den Code kopiert' },
  { value: 'x-time', label: 'Mittel 3 · Kästchen mit Wartezeit' },
  { value: 'q-card', label: 'Mittel 4 · Code-Karte' },
  { value: 'q-dark', label: 'Mittel 5 · Dunkle Code-Karte' },
  { value: 'q-hero', label: 'Mittel 6 · Code als Überschrift' },
  { value: 'z-duo', label: 'Gross 1 · Wie «Verbunden!»' },
  { value: 'z-ring', label: 'Gross 2 · Wie die Suche (Ring)' },
  { value: 'z-code-ring', label: 'Gross 3 · Code im Ring' },
  { value: 'y-seats', label: 'Gross 4 · Zwei Plätze' },
  { value: 'y-message', label: 'Gross 5 · Die Nachricht an deinen Freund' },
  { value: 'y-ticket', label: 'Gross 6 · Einladungs-Ticket' },
  { value: 'q-stub', label: 'Gross 7 · Code-Karte als Ticket' },
  { value: 'y-timeline', label: 'Gross 8 · Ablauf von links nach rechts' },
];

export const PREVIEW_SCREENS: DesignOption<LobbyState | ''>[] = [
  { value: '', label: 'Echter Ablauf' },
  { value: 'CHOOSE_MODE', label: '1 · Modus wählen' },
  { value: 'CHOOSE_ACTION', label: '2 · Freund: erstellen/beitreten' },
  { value: 'SEARCHING', label: '3 · Schnellspiel: Suche' },
  { value: 'WAITING', label: '4 · Code teilen' },
  { value: 'FOUND', label: '5 · Start-Countdown' },
];
