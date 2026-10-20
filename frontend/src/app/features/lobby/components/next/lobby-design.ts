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
  | 'n-focus';

export const FRIEND_LAYOUTS: DesignOption<FriendLayout>[] = [
  { value: 'facelift', label: 'Facelift (aktuell)' },
  { value: 'fr-auto', label: '7 · Original (Favorit)' },
  { value: 'n-calm', label: 'N1 · Final: ruhig, mit «Einfügen»' },
  { value: 'n-duel', label: 'N2 · Final: Duell-Bild und Symbol' },
  { value: 'n-form', label: 'N3 · Final: Formular mit Labels' },
  { value: 'n-card', label: 'N4 · Final: Code-Karte mit «Einfügen»' },
  { value: 'n-focus', label: 'N5 · Final: Karte macht beim Tippen Platz' },
  { value: 'l-alive', label: 'L1 · 7 lebendig (Basis)' },
  { value: 'm-center', label: 'M1 · «oder», dann «Code eingeben» mittig' },
  { value: 'm-badge', label: 'M2 · «oder» als runder Punkt' },
  { value: 'm-left', label: 'M3 · Überschrift linksbündig' },
  { value: 'm-icon', label: 'M4 · Überschrift mit Symbol' },
  { value: 'm-eyebrow', label: 'M5 · Ohne «oder», zwei kleine Labels' },
  { value: 'm-card', label: 'M6 · Code in einer weissen Karte' },
  { value: 'm-paste', label: 'M7 · Mit «Code einfügen»' },
  { value: 'm-duel', label: 'M8 · Mit Duell-Bild in der Karte' },
  { value: 'm-progress', label: 'M9 · Mit Fortschritt pro Zeichen' },
  { value: 'l-duel', label: 'L2 · L1 mit Duell-Bild' },
  { value: 'l-progress', label: 'L3 · L1 mit Fortschritt' },
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
