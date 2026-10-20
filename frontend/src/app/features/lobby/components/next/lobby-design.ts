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
  | 'h-link'
  | 'h-card'
  | 'h-dark'
  | 'h-create-first';

export const FRIEND_LAYOUTS: DesignOption<FriendLayout>[] = [
  { value: 'facelift', label: 'Facelift (aktuell)' },
  { value: 'h-link', label: 'H1 · Nur der Code, Erstellen als Zeile' },
  { value: 'h-card', label: 'H2 · Code in einer Karte' },
  { value: 'h-dark', label: 'H3 · Dunkle Fläche für den Code' },
  { value: 'h-create-first', label: 'H4 · Erstellen oben, Code darunter' },
  { value: 'fr-auto', label: '7 · Ohne Button (Favorit)' },
  { value: 'fr-smart', label: '12 · Code zuerst (Favorit)' },
];

/** Friend proposals without a switch (from 7 and 12). */
export const FRIEND_CODE: readonly FriendLayout[] = [
  'h-link',
  'h-card',
  'h-dark',
  'h-create-first',
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
