// TEMPORARY: the lobby designs under review. Remove together with the
// preview panel once a design is chosen.
import type { LobbyState } from '../../lobby.types';

export type LobbyDesign = 'today' | 'facelift' | 'duel' | 'flow';

export interface DesignOption<T extends string> {
  value: T;
  label: string;
}

export const LOBBY_DESIGNS: DesignOption<LobbyDesign>[] = [
  { value: 'today', label: 'Heute' },
  { value: 'facelift', label: 'A · Facelift' },
  { value: 'duel', label: 'B · Facelift mit Duell-Elementen' },
  { value: 'flow', label: 'C · Neuer Ablauf (ein Schritt weniger)' },
];

export const PREVIEW_SCREENS: DesignOption<LobbyState | ''>[] = [
  { value: '', label: 'Echter Ablauf' },
  { value: 'CHOOSE_MODE', label: '1 · Modus wählen' },
  { value: 'CHOOSE_ACTION', label: '2 · Freund: erstellen/beitreten' },
  { value: 'SEARCHING', label: '3 · Schnellspiel: Suche' },
  { value: 'WAITING', label: '4 · Code teilen' },
  { value: 'FOUND', label: '5 · Start-Countdown' },
];
