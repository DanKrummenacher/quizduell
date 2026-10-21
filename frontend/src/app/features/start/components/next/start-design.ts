// TEMPORARY: start page designs under review (development only).

export type StartLayout =
  | 'today'
  | 'n-facelift'
  | 'n-logo'
  | 'n-versus'
  | 'n-marquee'
  | 'n-timer'
  | 'n-score'
  | 'n-cards'
  | 'n-sheet'
  | 'n-chat'
  | 'n-poster';

/** The visuals with their own component. */
export type StartVisual = 'logo' | 'versus' | 'timer' | 'score' | 'cards';

export interface StartOption {
  value: StartLayout;
  label: string;
}

/** From a refined facelift to whole new approaches. */
export const START_LAYOUTS: StartOption[] = [
  { value: 'today', label: 'Heute' },
  { value: 'n-facelift', label: 'N1 · Facelift, neu gedacht' },
  { value: 'n-logo', label: 'N2 · Logo-Intro (animiert)' },
  { value: 'n-versus', label: 'N3 · Versus-Poster' },
  { value: 'n-marquee', label: 'N4 · Laufende Fragen' },
  { value: 'n-timer', label: 'N5 · 20-Sekunden-Ring' },
  { value: 'n-score', label: 'N6 · Anzeigetafel' },
  { value: 'n-cards', label: 'N7 · Fragen-Stapel' },
  { value: 'n-sheet', label: 'N8 · Dunkel mit Bottom-Sheet' },
  { value: 'n-chat', label: 'N9 · Chat-Begrüssung' },
  { value: 'n-poster', label: 'N10 · Typo-Poster' },
];
