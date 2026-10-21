// TEMPORARY: start page designs under review (development only).

export type StartLayout =
  | 'today'
  | 'f-clean'
  | 'f-inline'
  | 'f-stats'
  | 'f-steps'
  | 'f-card'
  | 'f-duel'
  | 'f-stage'
  | 'f-player'
  | 'f-teaser'
  | 'f-ask'
  | 'f-icon';

export interface StartOption {
  value: StartLayout;
  label: string;
}

/** From small refinements of today's page to new approaches. */
export const START_LAYOUTS: StartOption[] = [
  { value: 'today', label: 'Heute' },
  { value: 'f-clean', label: 'Klein 1 · Facelift' },
  { value: 'f-inline', label: 'Klein 2 · Fakten als Zeile' },
  { value: 'f-stats', label: 'Mittel 1 · Zahlen-Karte' },
  { value: 'f-steps', label: 'Mittel 2 · So geht’s' },
  { value: 'f-card', label: 'Mittel 3 · Formular als Karte' },
  { value: 'f-duel', label: 'Gross 1 · Du gegen ?' },
  { value: 'f-stage', label: 'Gross 2 · Dunkle Bühne' },
  { value: 'f-player', label: 'Gross 3 · Deine Spielerkarte' },
  { value: 'f-teaser', label: 'Gross 4 · Beispielfrage' },
  { value: 'f-ask', label: 'Gross 5 · Wie heisst du?' },
  { value: 'f-icon', label: 'Gross 6 · App-Icon' },
];
