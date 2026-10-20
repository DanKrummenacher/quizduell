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

/** Proposals for the «Freund herausfordern» screen. */
export type FriendLayout =
  | 'facelift'
  | 'fr-accordion'
  | 'fr-boxes'
  | 'fr-join-first'
  | 'fr-tabs'
  | 'fr-tiles'
  | 'fr-hero'
  | 'fr-auto'
  | 'fr-steps'
  | 'fr-sheet'
  | 'fr-explain'
  | 'fr-roles'
  | 'fr-smart'
  | 'fr-dock'
  | 'fr-stepper'
  | 'fr-columns'
  | 'fr-paste'
  | 'fr-live'
  | 'fr-flip'
  | 'fr-story'
  | 'fr-best'
  | 'fr-seats'
  | 'fr-message'
  | 'fr-halves'
  | 'fr-list'
  | 'fr-flow';

export const FRIEND_LAYOUTS: DesignOption<FriendLayout>[] = [
  { value: 'facelift', label: 'Facelift (aktuell)' },
  { value: 'fr-seats', label: '21 · Zwei Plätze' },
  { value: 'fr-message', label: '22 · Einladung als Nachricht' },
  { value: 'fr-halves', label: '23 · Zwei grosse Flächen' },
  { value: 'fr-list', label: '24 · Ruhige Liste' },
  { value: 'fr-flow', label: '25 · Ablauf als kleine Grafik' },
  {
    value: 'fr-best',
    label: '20 · Das Beste vereint (Schritte, Einfügen, Prüfung)',
  },
  { value: 'fr-story', label: '19 · Dein Platz, der Platz deines Freundes' },
  { value: 'fr-flip', label: '18 · Eine Karte, zwei Seiten' },
  { value: 'fr-live', label: '17 · Code mit Sofort-Prüfung' },
  { value: 'fr-paste', label: '16 · Code mit einem Tipp einfügen' },
  { value: 'fr-boxes', label: '1 · Code in vier Kästchen' },
  { value: 'fr-accordion', label: '2 · Zwei Karten, Beitreten klappt auf' },
  { value: 'fr-tabs', label: '3 · Umschalter Erstellen / Beitreten' },
  { value: 'fr-tiles', label: '4 · Zwei Kacheln nebeneinander' },
  { value: 'fr-hero', label: '6 · Erstellen als dunkle Hauptkarte' },
  { value: 'fr-auto', label: '7 · Beitreten ohne Button (automatisch)' },
  { value: 'fr-steps', label: '8 · Zwei Schritte: Wahl, dann Code' },
  { value: 'fr-sheet', label: '9 · Wie die Suche, Code im Blatt' },
  { value: 'fr-explain', label: '10 · In drei Schritten erklärt' },
  { value: 'fr-roles', label: '11 · Zwei Rollen mit den Spielern' },
  { value: 'fr-smart', label: '12 · Code zuerst, Erstellen weicht' },
  { value: 'fr-dock', label: '13 · Beitreten unten angedockt' },
  { value: 'fr-stepper', label: '14 · Schritte mit Fortschritt' },
  { value: 'fr-columns', label: '15 · Zwei Aktionskarten' },
  { value: 'fr-join-first', label: '5 · Beitreten zuerst, Erstellen als «oder»' },
];

/** Fifth round of friend proposals. */
export const FRIEND_FIVE: readonly FriendLayout[] = [
  'fr-seats',
  'fr-message',
  'fr-halves',
  'fr-list',
  'fr-flow',
];

/** Fourth round of friend proposals. */
export const FRIEND_PLUS: readonly FriendLayout[] = [
  'fr-paste',
  'fr-live',
  'fr-flip',
  'fr-story',
  'fr-best',
];

/** Third round of friend proposals. */
export const FRIEND_EXTRA: readonly FriendLayout[] = [
  'fr-roles',
  'fr-smart',
  'fr-dock',
  'fr-stepper',
  'fr-columns',
];

/** Further friend proposals in their own component. */
export const FRIEND_MORE: readonly FriendLayout[] = [
  'fr-hero',
  'fr-auto',
  'fr-steps',
  'fr-sheet',
  'fr-explain',
];

export const PREVIEW_SCREENS: DesignOption<LobbyState | ''>[] = [
  { value: '', label: 'Echter Ablauf' },
  { value: 'CHOOSE_MODE', label: '1 · Modus wählen' },
  { value: 'CHOOSE_ACTION', label: '2 · Freund: erstellen/beitreten' },
  { value: 'SEARCHING', label: '3 · Schnellspiel: Suche' },
  { value: 'WAITING', label: '4 · Code teilen' },
  { value: 'FOUND', label: '5 · Start-Countdown' },
];
