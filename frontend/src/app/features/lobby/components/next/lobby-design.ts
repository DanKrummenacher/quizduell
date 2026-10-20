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

/** Proposals for the «Gegner gefunden» screen, on top of the facelift. */
export type MatchLayout =
  | 'facelift'
  | 'ring'
  | 'duo'
  | 'count'
  | 'card'
  | 'calm'
  | 'stage'
  | 'split'
  | 'meet'
  | 'lights'
  | 'flip'
  | 'board'
  | 'ticket'
  | 'band'
  | 'flash'
  | 'e-ring-roll'
  | 'e-ring-dark'
  | 'e-ring-name'
  | 'e-meet-dots'
  | 'e-meet-glow'
  | 'e-ring-to-meet'
  | 'x-venn'
  | 'x-inring'
  | 'x-chip'
  | 'x-inline'
  | 'y-halves'
  | 'y-join'
  | 'y-depth'
  | 'y-dark'
  | 'y-heartbeat'
  | 'z-num-below'
  | 'z-num-under'
  | 'z-ring-under'
  | 'z-behind'
  | 'z-halves'
  | 'z-join'
  | 'f-base'
  | 'f-label'
  | 'f-circle'
  | 'f-names'
  | 'f-found'
  | 'f-header';

export const MATCH_LAYOUTS: DesignOption<MatchLayout>[] = [
  { value: 'facelift', label: 'Facelift (aktuell)' },
  { value: 'f-base', label: 'F1 · Z1, Zahl wie der Button der Suche' },
  { value: 'f-label', label: 'F2 · Z1 mit «Start in» über der Zahl' },
  { value: 'f-circle', label: 'F3 · Z1, Zahl in einem feinen Kreis' },
  { value: 'f-names', label: 'F4 · Z1 mit beiden Namen' },
  { value: 'f-found', label: 'F5 · Z1 mit «Gegner gefunden!»' },
  { value: 'f-header', label: 'F6 · Z1, Begrüssung bleibt oben' },
  { value: 'z-num-below', label: 'Z1 · Zahl ganz unten' },
  { value: 'z-num-under', label: 'Z2 · Zahl unter den Profilen' },
  { value: 'z-ring-under', label: 'Z3 · Kleiner Ring unter den Profilen' },
  { value: 'z-behind', label: 'Z4 · Zahl dahinter (Y3 ohne Zeile)' },
  { value: 'z-halves', label: 'Z5 · Ringhälften (Y1 ohne Zeile)' },
  { value: 'z-join', label: 'Z6 · Gegner kommt dazu (Y2 ohne Zeile)' },
  { value: 'y-halves', label: 'Y1 · Zwei Ringhälften schliessen sich' },
  { value: 'y-join', label: 'Y2 · Dein Ring, der Gegner kommt dazu' },
  { value: 'y-depth', label: 'Y3 · Grosse Zahl hinter den Spielern' },
  { value: 'y-heartbeat', label: 'Y4 · Ring im Herzschlag' },
  { value: 'y-dark', label: 'Y5 · Zwei Ringe, dunkel (Vollbild)' },
  { value: 'x-venn', label: 'X1 · Zwei Ringe, die sich überlappen' },
  { value: 'x-inring', label: 'X2 · Verbunden im Ring' },
  { value: 'x-chip', label: 'X3 · Verbunden, Start-Chip mit Ring' },
  { value: 'x-inline', label: 'X4 · Ring, Spieler beim Namen' },
  { value: 'ring', label: 'M2 · Ring (Favorit)' },
  { value: 'meet', label: 'M8 · Verbunden (Favorit)' },
  { value: 'e-ring-roll', label: 'M2.1 · Ring, Zahl rollt, grüner Start' },
  { value: 'e-ring-dark', label: 'M2.2 · Ring als dunkle Scheibe' },
  { value: 'e-ring-name', label: 'M2.3 · Ring, Gegner als Überschrift' },
  { value: 'e-meet-dots', label: 'M8.1 · Verbunden mit 3 Punkten' },
  { value: 'e-meet-glow', label: 'M8.2 · Verbunden mit Leuchten' },
  { value: 'e-ring-to-meet', label: 'M2 → M8 · Ring wird zu Verbunden' },
];

/** Match proposals that use the whole screen. */
export const FULLSCREEN_MATCH: readonly MatchLayout[] = [
  'stage',
  'split',
  'flash',
  'y-dark',
];

/** Final refinements of Z1. */
export const MATCH_POLISH: readonly MatchLayout[] = [
  'f-base',
  'f-label',
  'f-circle',
  'f-names',
  'f-found',
  'f-header',
];

/** Proposals with exactly one countdown (no extra line below). */
export const MATCH_CLEAN: readonly MatchLayout[] = [
  'z-num-below',
  'z-num-under',
  'z-ring-under',
  'z-behind',
  'z-halves',
  'z-join',
];

/** Further combinations: a story or depth behind each one. */
export const MATCH_DUEL: readonly MatchLayout[] = [
  'y-halves',
  'y-join',
  'y-depth',
  'y-dark',
  'y-heartbeat',
];

/** Combinations of M2.1 and M8.2. */
export const MATCH_BLEND: readonly MatchLayout[] = [
  'x-venn',
  'x-inring',
  'x-chip',
  'x-inline',
];

/** Proposals that build directly on the favourites M2 and M8. */
export const MATCH_EVOLVED: readonly MatchLayout[] = [
  'e-ring-roll',
  'e-ring-dark',
  'e-ring-name',
  'e-meet-dots',
  'e-meet-glow',
  'e-ring-to-meet',
];

/** Further match proposals in their own component. */
export const MATCH_MORE: readonly MatchLayout[] = [
  'meet',
  'lights',
  'flip',
  'board',
  'ticket',
  'band',
  'flash',
  'y-dark',
];

export const PREVIEW_SCREENS: DesignOption<LobbyState | ''>[] = [
  { value: '', label: 'Echter Ablauf' },
  { value: 'CHOOSE_MODE', label: '1 · Modus wählen' },
  { value: 'CHOOSE_ACTION', label: '2 · Freund: erstellen/beitreten' },
  { value: 'SEARCHING', label: '3 · Schnellspiel: Suche' },
  { value: 'WAITING', label: '4 · Code teilen' },
  { value: 'FOUND', label: '5 · Start-Countdown' },
];
