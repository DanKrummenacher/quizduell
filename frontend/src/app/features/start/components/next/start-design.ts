// TEMPORARY: start page designs under review (development only).

/** The facelift (p-), rounds 1 (f-) to 5 (e-) and the landing pages (l-). */
export type StartLayout =
  | 'today'
  | 'p-pure'
  | 'p-combo'
  | 'p-combo-roll'
  | 'p-combo-flip'
  | 'p-combo-scramble'
  | 'p-combo-marker'
  | 'p-combo-line'
  | 'p-combo-sub'
  | 'p-combo-marker-duell'
  | 'p-combo-marker-sub'
  | 'p-combo-marker-line'
  | 'p-combo-marker-facts'
  | 'p-combo-reveal-fade'
  | 'p-combo-reveal-wipe'
  | 'p-combo-reveal-letters'
  | 'p-combo-reveal-type'
  | 'p-combo-reveal-block'
  | 'p-combo-reveal-cube'
  | 'p-combo-reveal-flap'
  | 'p-final-intro'
  | 'p-final-roll'
  | 'p-final-typer'
  | 'p-final-intro-roll'
  | 'p-final-intro-typer'
  | 'p-final-all'
  | 'p-intro'
  | 'p-logo'
  | 'p-live'
  | 'p-shapes'
  | 'p-aurora'
  | 'p-grid'
  | 'p-spotlight'
  | 'p-kinetic'
  | 'p-holo'
  | 'p-typewriter'
  | 'p-persona'
  | 'p-confetti'
  | 'p-parallax'
  | 'p-counter'
  | 'p-liquid'
  | 'p-wordswap'
  | 'p-focus'
  | 'p-path'
  | 'p-network'
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
  | 'e-sentence'
  | 'l-product'
  | 'l-kinetic'
  | 'l-arena'
  | 'l-world'
  | 'l-story'
  | 'l-bento'
  | 'l-aurora'
  | 'l-ring'
  | 'l-angled'
  | 'l-answers'
  | 'l-cover'
  | 'l-tv';

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
  { value: 'p-pure', label: 'Facelift (rein)' },
  { value: 'p-combo', label: 'Basis · Intro + Schreibmaschine (ohne Wort)' },
  {
    value: 'p-combo-marker-line',
    label: 'Einblenden 1 · Maske von unten (Marker D)',
  },
  { value: 'p-combo-reveal-fade', label: 'Einblenden 2 · weiche Überblendung' },
  { value: 'p-combo-reveal-wipe', label: 'Einblenden 3 · Wisch von links' },
  {
    value: 'p-combo-reveal-letters',
    label: 'Einblenden 4 · Buchstabe für Buchstabe',
  },
  { value: 'p-combo-reveal-type', label: 'Einblenden 5 · getippt' },
  { value: 'p-combo-reveal-block', label: 'Einblenden 6 · Farbblock' },
  { value: 'p-combo-reveal-cube', label: 'Einblenden 7 · drehender Würfel' },
  { value: 'p-combo-reveal-flap', label: 'Einblenden 8 · Klappe' },
  { value: 'p-combo-marker', label: 'Marker A · Wort im Titel' },
  { value: 'p-combo-marker-duell', label: 'Marker B · «Duell» markieren' },
  { value: 'p-combo-marker-sub', label: 'Marker C · durch die Beschreibung' },
  { value: 'p-combo-marker-facts', label: 'Marker E · unter den Fakten' },
  { value: 'p-combo-roll', label: 'Wort 1 · Maske (Wort im Titel)' },
  { value: 'p-combo-flip', label: 'Wort 2 · 3D-Würfel' },
  { value: 'p-combo-scramble', label: 'Wort 3 · Decode' },
  { value: 'p-combo-line', label: 'Wort 5 · Ganze Titelzeile' },
  { value: 'p-combo-sub', label: 'Wort 6 · Beschreibung wechselt' },
  { value: 'p-final-intro', label: 'Final · Intro' },
  { value: 'p-final-roll', label: 'Final · Wechselndes Wort' },
  { value: 'p-final-typer', label: 'Final · Schreibmaschine' },
  { value: 'p-final-intro-roll', label: 'Final · Intro + Wort' },
  { value: 'p-final-intro-typer', label: 'Final · Intro + Schreibmaschine' },
  { value: 'p-final-all', label: 'Final · Intro + Wort + Schreibmaschine' },
  { value: 'p-intro', label: 'Facelift + Intro-Animation' },
  { value: 'p-logo', label: 'Facelift + Logo-Animation' },
  { value: 'p-live', label: 'Facelift + lebendige Symbole' },
  { value: 'p-shapes', label: 'Facelift + schwebende Formen' },
  { value: 'p-aurora', label: 'Facelift + Aurora & Glas' },
  { value: 'p-grid', label: 'Facelift + Raster & Lichtstrahl' },
  { value: 'p-spotlight', label: 'Facelift + Spotlight & 3D' },
  { value: 'p-kinetic', label: 'Facelift + Kinetic Intro' },
  { value: 'p-holo', label: 'Facelift + Holo-Symbole' },
  { value: 'p-typewriter', label: 'Facelift + Schreibmaschine' },
  { value: 'p-persona', label: 'Facelift + persönlich' },
  { value: 'p-confetti', label: 'Facelift + Konfetti-Start' },
  { value: 'p-parallax', label: 'Facelift + Parallax-Tiefe' },
  { value: 'p-counter', label: 'Facelift + Zähler' },
  { value: 'p-liquid', label: 'Facelift + flüssige Symbole' },
  { value: 'p-wordswap', label: 'Facelift + wechselndes Wort' },
  { value: 'p-focus', label: 'Facelift + Fokus-Modus' },
  { value: 'p-path', label: 'Facelift + Verbindungslinie' },
  { value: 'p-network', label: 'Facelift + Partikel-Netz' },
  { value: 'l-product', label: 'Landing L1 · Produkt' },
  { value: 'l-kinetic', label: 'Landing L2 · Kinetic Type' },
  { value: 'l-arena', label: 'Landing L3 · Arena' },
  { value: 'l-world', label: 'Landing L4 · Markenwelt' },
  { value: 'l-story', label: 'Landing L5 · Scroll-Story' },
  { value: 'l-bento', label: 'Landing L6 · Bento Pro' },
  { value: 'l-aurora', label: 'Landing L7 · Aurora' },
  { value: 'l-ring', label: 'Landing L8 · Countdown-Ring' },
  { value: 'l-angled', label: 'Landing L9 · Schräger Verlauf' },
  { value: 'l-answers', label: 'Landing L10 · Antwort-Kacheln' },
  { value: 'l-cover', label: 'Landing L11 · Magazin-Cover' },
  { value: 'l-tv', label: 'Landing L12 · TV-Übertragung' },
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
