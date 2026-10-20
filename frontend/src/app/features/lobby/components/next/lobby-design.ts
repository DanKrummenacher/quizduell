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
  | 'l-alive'
  | 'l-duel'
  | 'l-progress'
  | 'm-center'
  | 'm-badge'
  | 'm-left'
  | 'm-icon'
  | 'm-eyebrow'
  | 'm-card'
  | 'm-paste'
  | 'm-duel'
  | 'm-progress'
  | 'n-calm'
  | 'n-duel'
  | 'n-form'
  | 'n-card'
  | 'n-focus'
  | 'o-quiet'
  | 'o-merged'
  | 'o-short'
  | 'o-airy'
  | 'o-question';

export const FRIEND_LAYOUTS: DesignOption<FriendLayout>[] = [
  { value: 'facelift', label: 'Facelift (aktuell)' },
  { value: 'm-center', label: 'M1 · Favorit zum Vergleich' },
  { value: 'o-quiet', label: 'O1 · Ohne Hinweis unten' },
  { value: 'o-merged', label: 'O2 · Hinweis als Untertitel' },
  { value: 'o-short', label: 'O3 · Ohne Untertitel, kurzer Hinweis' },
  { value: 'o-airy', label: 'O4 · Wie O1, mit mehr Luft' },
  { value: 'o-question', label: 'O5 · Als Frage formuliert' },
];

/** Final proposals for M1: the words and the spacing. */
export const FRIEND_M1: readonly FriendLayout[] = [
  'o-quiet',
  'o-merged',
  'o-short',
  'o-airy',
  'o-question',
];

/** Refinements of L1: «oder», a heading, then the code. */
export const FRIEND_OR: readonly FriendLayout[] = [
  'm-center',
  'm-badge',
  'm-left',
  'm-icon',
  'm-eyebrow',
  'm-card',
  'm-paste',
  'm-duel',
  'm-progress',
  'n-calm',
  'n-duel',
  'n-form',
  'n-card',
  'n-focus',
];

/** Variant 7 with the motion of the search and «Verbunden!». */
export const FRIEND_LIVE: readonly FriendLayout[] = [
  'l-alive',
  'l-duel',
  'l-progress',
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
