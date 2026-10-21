// TEMPORARY: start page designs under review (development only).

/** Round 1 (f-), 2 (n-), 3 (c-), 4 (d-) and 5 (e-). */
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
  | 'f-icon'
  | 'n-facelift'
  | 'n-logo'
  | 'n-versus'
  | 'n-marquee'
  | 'n-timer'
  | 'n-score'
  | 'n-cards'
  | 'n-sheet'
  | 'n-chat'
  | 'n-poster'
  | 'c-product'
  | 'c-race'
  | 'c-editorial'
  | 'c-mesh'
  | 'c-arena'
  | 'c-wall'
  | 'c-minimal'
  | 'd-flap'
  | 'd-bento'
  | 'd-spotlight'
  | 'd-pass'
  | 'e-attract'
  | 'e-question'
  | 'e-slides'
  | 'e-button'
  | 'e-sentence';

/** The visuals of round 3. */
export type StartVisual = 'product' | 'race' | 'wall';

/** The visuals of round 2. */
export type StartVisualB = 'logo' | 'versus' | 'timer' | 'score' | 'cards';

export interface StartOption {
  value: StartLayout;
  label: string;
}

/** All rounds side by side; the newest first. */
export const START_LAYOUTS: StartOption[] = [
  { value: 'today', label: 'Heute' },
  { value: 'e-attract', label: 'R5 · E1 Attract-Modus' },
  { value: 'e-question', label: 'R5 · E2 Frage 0: Wie heisst du?' },
  { value: 'e-slides', label: 'R5 · E3 Onboarding-Slides' },
  { value: 'e-button', label: 'R5 · E4 Grosser Startknopf' },
  { value: 'e-sentence', label: 'R5 · E5 Satz-Formular' },
  { value: 'd-flap', label: 'R4 · K8 Fallblatt-Anzeige' },
  { value: 'd-bento', label: 'R4 · K9 Bento-Raster' },
  { value: 'd-spotlight', label: 'R4 · K10 Bühne frei für dich' },
  { value: 'd-pass', label: 'R4 · K11 Spielerpass (3D)' },
  { value: 'c-product', label: 'R3 · K1 Produkt-Hero' },
  { value: 'c-race', label: 'R3 · K2 Live-Duell' },
  { value: 'c-editorial', label: 'R3 · K3 Editorial' },
  { value: 'c-mesh', label: 'R3 · K4 Dunkler Verlauf' },
  { value: 'c-arena', label: 'R3 · K5 Arena' },
  { value: 'c-wall', label: 'R3 · K6 Fragen-Wand' },
  { value: 'c-minimal', label: 'R3 · K7 Minimal' },
  { value: 'n-facelift', label: 'R2 · N1 Facelift, neu gedacht' },
  { value: 'n-logo', label: 'R2 · N2 Logo-Intro' },
  { value: 'n-versus', label: 'R2 · N3 Versus-Poster' },
  { value: 'n-marquee', label: 'R2 · N4 Laufende Fragen' },
  { value: 'n-timer', label: 'R2 · N5 20-Sekunden-Ring' },
  { value: 'n-score', label: 'R2 · N6 Anzeigetafel' },
  { value: 'n-cards', label: 'R2 · N7 Fragen-Stapel' },
  { value: 'n-sheet', label: 'R2 · N8 Dunkel mit Sheet' },
  { value: 'n-chat', label: 'R2 · N9 Chat-Begrüssung' },
  { value: 'n-poster', label: 'R2 · N10 Typo-Poster' },
  { value: 'f-clean', label: 'R1 · Klein 1 Facelift' },
  { value: 'f-inline', label: 'R1 · Klein 2 Fakten als Zeile' },
  { value: 'f-stats', label: 'R1 · Mittel 1 Zahlen-Karte' },
  { value: 'f-steps', label: 'R1 · Mittel 2 So geht’s' },
  { value: 'f-card', label: 'R1 · Mittel 3 Formular als Karte' },
  { value: 'f-duel', label: 'R1 · Gross 1 Du gegen ?' },
  { value: 'f-stage', label: 'R1 · Gross 2 Dunkle Bühne' },
  { value: 'f-player', label: 'R1 · Gross 3 Spielerkarte' },
  { value: 'f-teaser', label: 'R1 · Gross 4 Beispielfrage' },
  { value: 'f-ask', label: 'R1 · Gross 5 Wie heisst du?' },
  { value: 'f-icon', label: 'R1 · Gross 6 App-Icon' },
];
