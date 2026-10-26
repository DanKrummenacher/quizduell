/**
 * Temporary: the building blocks of the rules area, to combine in the browser,
 * and whole proposals made of them. Removed again once one is chosen.
 */
export interface Parts {
  preset: string;
  layout: string;
  control: string;
  changed: string;
  save: string;
  text: string;
}

export const PART_DIMS: {
  id: keyof Parts;
  label: string;
  options: { id: string; label: string }[];
}[] = [
  {
    id: 'preset',
    label: 'Vorlagen',
    options: [
      { id: 'cards', label: 'Karten' },
      { id: 'bars', label: 'Karten mit Dauer' },
      { id: 'rows', label: 'Liste' },
      { id: 'seg', label: 'Umschalter + Text' },
      { id: 'menu', label: 'Auswahlmenü' },
      { id: 'chips', label: 'Chips' },
      { id: 'inside', label: 'Im Kapitel Ablauf' },
    ],
  },
  {
    id: 'layout',
    label: 'Aufbau',
    options: [
      { id: 'acc', label: 'Aufklappbar' },
      { id: 'open', label: 'Alle offen' },
      { id: 'one', label: 'Eine Karte' },
      { id: 'tabs', label: 'Reiter' },
      { id: 'nav', label: 'Mit Navigation' },
      { id: 'grid', label: 'Regelkarten' },
      { id: 'dense', label: 'Kompakte Liste' },
    ],
  },
  {
    id: 'control',
    label: 'Wert ändern',
    options: [
      { id: 'seg', label: 'Leiste' },
      { id: 'menu', label: 'Auswahlmenü' },
      { id: 'chips', label: 'Stepper + Werte' },
      { id: 'slider', label: 'Regler' },
      { id: 'pop', label: 'Popover' },
      { id: 'tiles', label: 'Kacheln' },
      { id: 'field', label: 'Zahlenfeld' },
    ],
  },
  {
    id: 'changed',
    label: 'Geändert',
    options: [
      { id: 'dot', label: 'Punkt + Rückgängig' },
      { id: 'badge', label: 'Vorher → nachher' },
      { id: 'strip', label: 'Akzentstreifen' },
      { id: 'strike', label: 'Durchgestrichen' },
      { id: 'tag', label: 'Marke «Geändert»' },
      { id: 'tint', label: 'Wert hervorgehoben' },
    ],
  },
  {
    id: 'save',
    label: 'Speichern',
    options: [
      { id: 'bar', label: 'Leiste unten' },
      { id: 'navy', label: 'Navy-Pille' },
      { id: 'top', label: 'Leiste oben' },
      { id: 'foot', label: 'Fusszeile' },
      { id: 'review', label: 'Prüfen-Dialog' },
      { id: 'pill', label: 'Status unten rechts' },
      { id: 'head', label: 'Im Seitenkopf' },
    ],
  },
  {
    id: 'text',
    label: 'Texte',
    options: [
      { id: 'desc', label: 'Beschreibung' },
      { id: 'info', label: 'Info-Knopf' },
      { id: 'effect', label: 'Mit Wirkung' },
      { id: 'none', label: 'Nur Titel' },
    ],
  },
];

/** Whole proposals: one combination of the blocks each. */
export const PROPOSALS: Record<string, Parts> = {
  q1: {
    preset: 'cards',
    layout: 'acc',
    control: 'seg',
    changed: 'dot',
    save: 'bar',
    text: 'desc',
  },
  q2: {
    preset: 'rows',
    layout: 'open',
    control: 'menu',
    changed: 'badge',
    save: 'top',
    text: 'desc',
  },
  q3: {
    preset: 'bars',
    layout: 'one',
    control: 'chips',
    changed: 'strip',
    save: 'foot',
    text: 'effect',
  },
  q4: {
    preset: 'seg',
    layout: 'tabs',
    control: 'tiles',
    changed: 'strike',
    save: 'review',
    text: 'desc',
  },
  q5: {
    preset: 'menu',
    layout: 'nav',
    control: 'menu',
    changed: 'badge',
    save: 'pill',
    text: 'info',
  },
  q6: {
    preset: 'inside',
    layout: 'open',
    control: 'slider',
    changed: 'strip',
    save: 'review',
    text: 'effect',
  },
  r1: {
    preset: 'bars',
    layout: 'grid',
    control: 'seg',
    changed: 'tint',
    save: 'pill',
    text: 'desc',
  },
  r2: {
    preset: 'inside',
    layout: 'dense',
    control: 'field',
    changed: 'tag',
    save: 'head',
    text: 'none',
  },
  r3: {
    preset: 'rows',
    layout: 'acc',
    control: 'menu',
    changed: 'tint',
    save: 'review',
    text: 'effect',
  },
  r4: {
    preset: 'chips',
    layout: 'one',
    control: 'pop',
    changed: 'tag',
    save: 'top',
    text: 'info',
  },
};

/** Runde 11: the blocks around the popover, the rest is decided. */
export interface PopParts {
  last?: string;
  open?: string;
  shape?: string;
  pstyle?: string;
  kpi?: string;
  phead?: string;
  rhead?: string;
  pill?: string;
  thead?: string;
  pos?: string;
  shut?: string;
  review?: string;
  figs?: string;
  own?: string;
  std?: string;
  list?: string;
  bar?: string;
  pop: string;
  trigger: string;
  changed: string;
  save: string;
}

export const POP_DIMS: {
  id: keyof PopParts;
  label: string;
  options: { id: string; label: string }[];
}[] = [
  {
    id: 'pop',
    label: 'Popover',
    options: [
      { id: 'compact', label: 'Kompakt' },
      { id: 'list', label: 'Werteliste' },
      { id: 'compare', label: 'Mit Vergleich' },
      { id: 'slider', label: 'Regler' },
      { id: 'tiles', label: 'Kacheln' },
    ],
  },
  {
    id: 'trigger',
    label: 'Auslöser',
    options: [
      { id: 'chip', label: 'Wert-Chip' },
      { id: 'select', label: 'Auswahlfeld' },
      { id: 'link', label: 'Wert + «Ändern»' },
    ],
  },
  {
    id: 'changed',
    label: 'Geändert',
    options: [
      { id: 'dot', label: 'Punkt + Bisher' },
      { id: 'badge', label: 'Vorher → nachher' },
      { id: 'accent', label: 'Seitenlinie' },
      { id: 'inval', label: 'Im Wert' },
      { id: 'tag', label: 'Marke' },
      { id: 'icon', label: 'Rückgängig-Symbol' },
    ],
  },
  {
    id: 'save',
    label: 'Speichern',
    options: [
      { id: 'dock', label: 'Fix unten, immer' },
      { id: 'dockin', label: 'Fix unten, bei Änderungen' },
      { id: 'bar', label: 'Schwebende Leiste' },
      { id: 'snack', label: 'Dunkle Leiste' },
      { id: 'pill', label: 'Status unten rechts' },
      { id: 'top', label: 'Leiste oben' },
      { id: 'review', label: 'Prüfen-Dialog' },
      { id: 'head', label: 'Im Seitenkopf' },
    ],
  },
];

export const POP_PROPOSALS: Record<string, PopParts> = {
  t1: { pop: 'compact', trigger: 'chip', changed: 'inval', save: 'dock' },
  t2: { pop: 'list', trigger: 'select', changed: 'badge', save: 'dockin' },
  t3: { pop: 'compare', trigger: 'link', changed: 'accent', save: 'review' },
  t4: { pop: 'tiles', trigger: 'chip', changed: 'tag', save: 'pill' },
  t5: { pop: 'slider', trigger: 'select', changed: 'icon', save: 'snack' },
};

/** Runde 12: the value list and the floating bar, the rest is decided. */
export const LIST_DIMS: {
  id: keyof PopParts;
  label: string;
  options: { id: string; label: string }[];
}[] = [
  {
    id: 'list',
    label: 'Werteliste',
    options: [
      { id: 'clear', label: 'Klar' },
      { id: 'bars', label: 'Mit Dauerbalken' },
      { id: 'preview', label: 'Mit Vorschau' },
      { id: 'input', label: 'Eingabe oben' },
      { id: 'marks', label: 'Markiert + Tastatur' },
    ],
  },
  {
    id: 'bar',
    label: 'Leiste',
    options: [
      { id: 'full', label: 'Mit Liste' },
      { id: 'effect', label: 'Mit Auswirkung' },
      { id: 'expand', label: 'Aufklappbar' },
      { id: 'chips', label: 'Chips zum Zurücknehmen' },
      { id: 'minimal', label: 'Schlank' },
    ],
  },
  POP_DIMS[2]!,
];

export const LIST_PROPOSALS: Record<string, PopParts> = {
  u1: {
    pop: 'list',
    trigger: 'chip',
    save: 'bar',
    changed: 'inval',
    list: 'clear',
    bar: 'full',
  },
  u2: {
    pop: 'list',
    trigger: 'chip',
    save: 'bar',
    changed: 'dot',
    list: 'bars',
    bar: 'effect',
  },
  u3: {
    pop: 'list',
    trigger: 'chip',
    save: 'bar',
    changed: 'inval',
    list: 'preview',
    bar: 'expand',
  },
  u4: {
    pop: 'list',
    trigger: 'chip',
    save: 'bar',
    changed: 'icon',
    list: 'input',
    bar: 'chips',
  },
  u5: {
    pop: 'list',
    trigger: 'chip',
    save: 'bar',
    changed: 'tag',
    list: 'marks',
    bar: 'minimal',
  },
};

/** Runde 13: the own value, «Auf Standard» and the bar. */
export const V_DIMS: {
  id: keyof PopParts;
  label: string;
  options: { id: string; label: string }[];
}[] = [
  {
    id: 'own',
    label: 'Eigener Wert',
    options: [
      { id: 'row', label: 'Als Listenzeile' },
      { id: 'group', label: 'Feld + Übernehmen' },
      { id: 'stepper', label: 'Stepper' },
      { id: 'plain', label: 'Kompaktes Feld' },
      { id: 'reveal', label: 'Auf Klick' },
    ],
  },
  {
    id: 'std',
    label: 'Auf Standard',
    options: [
      { id: 'link', label: 'Link im Fuss' },
      { id: 'buttons', label: 'Knopf im Fuss' },
      { id: 'item', label: 'Eintrag in der Liste' },
      { id: 'head', label: 'Im Kopf' },
      { id: 'none', label: 'Nur Marke' },
    ],
  },
  {
    id: 'bar',
    label: 'Leiste',
    options: [
      { id: 'klar', label: 'Klar' },
      { id: 'popup', label: 'Änderungen auf Klick' },
      { id: 'split', label: 'Mit Auswirkung' },
      { id: 'navy', label: 'Navy' },
      { id: 'content', label: 'Bündig am Inhalt' },
    ],
  },
  POP_DIMS[2]!,
];

const V_BASE = { pop: 'list', trigger: 'chip', save: 'bar', list: 'clear' };

export const V_PROPOSALS: Record<string, PopParts> = {
  v1: { ...V_BASE, own: 'row', std: 'item', bar: 'klar', changed: 'inval' },
  v2: { ...V_BASE, own: 'group', std: 'buttons', bar: 'popup', changed: 'inval' },
  v3: { ...V_BASE, own: 'stepper', std: 'link', bar: 'split', changed: 'dot' },
  v4: { ...V_BASE, own: 'plain', std: 'head', bar: 'navy', changed: 'inval' },
  v5: { ...V_BASE, own: 'reveal', std: 'none', bar: 'content', changed: 'icon' },
};

/** Runde 14: everything decided but the bar. */
export const W_DIMS: {
  id: keyof PopParts;
  label: string;
  options: { id: string; label: string }[];
}[] = [
  {
    id: 'bar',
    label: 'Leiste',
    options: [
      { id: 'klar', label: 'Klar' },
      { id: 'kapsel', label: 'Kapsel' },
      { id: 'status', label: 'Mit Status' },
      { id: 'sheet', label: 'Prüfen zum Aufklappen' },
      { id: 'side', label: 'Karte rechts' },
      { id: 'hint', label: 'Mit Hinweisen' },
    ],
  },
  POP_DIMS[2]!,
];

const W_BASE = { ...V_BASE, own: 'plain', std: 'buttons', changed: 'inval' };

export const W_PROPOSALS: Record<string, PopParts> = {
  w1: { ...W_BASE, bar: 'klar' },
  w2: { ...W_BASE, bar: 'kapsel' },
  w3: { ...W_BASE, bar: 'status' },
  w4: { ...W_BASE, bar: 'sheet' },
  w5: { ...W_BASE, bar: 'side' },
  w6: { ...W_BASE, bar: 'hint' },
};

/** Runde 15: the review bar, closed and open. */
export const H_DIMS: {
  id: keyof PopParts;
  label: string;
  options: { id: string; label: string }[];
}[] = [
  {
    id: 'shut',
    label: 'Zugeklappt',
    options: [
      { id: 'line', label: 'Mit Änderungen' },
      { id: 'effect', label: 'Mit Auswirkung' },
      { id: 'chips', label: 'Mit Chips' },
      { id: 'count', label: 'Mit Zähler' },
      { id: 'compact', label: 'Eine Zeile' },
    ],
  },
  {
    id: 'review',
    label: 'Prüfen',
    options: [
      { id: 'secondary', label: 'Knopf mit Symbol' },
      { id: 'link', label: 'Link «Ansehen»' },
      { id: 'area', label: 'Ganze Zeile klickbar' },
      { id: 'icon', label: 'Nur Pfeil' },
      { id: 'count', label: 'Zähler-Knopf' },
    ],
  },
  {
    id: 'figs',
    label: 'Kacheln',
    options: [
      { id: 'highlight', label: 'Geändert hervorgehoben' },
      { id: 'delta', label: 'Mit Pfeil-Marke' },
      { id: 'beforeafter', label: 'Bisher → neu' },
      { id: 'bars', label: 'Mit Balken' },
      { id: 'rows', label: 'Als Zeilen' },
    ],
  },
  POP_DIMS[2]!,
];

const H_BASE = { ...W_BASE, bar: 'sheet' };

export const H_PROPOSALS: Record<string, PopParts> = {
  h1: { ...H_BASE, shut: 'line', review: 'secondary', figs: 'highlight' },
  h2: { ...H_BASE, shut: 'effect', review: 'link', figs: 'delta' },
  h3: { ...H_BASE, shut: 'chips', review: 'area', figs: 'beforeafter' },
  h4: { ...H_BASE, shut: 'count', review: 'count', figs: 'bars' },
  h5: { ...H_BASE, shut: 'compact', review: 'icon', figs: 'rows' },
};

/** Runde 16: «Prüfen» done well, the figures kept and only edged. */
export const G_DIMS: {
  id: keyof PopParts;
  label: string;
  options: { id: string; label: string }[];
}[] = [
  {
    id: 'review',
    label: 'Prüfen',
    options: [
      { id: 'ghost', label: 'Textknopf wie Verwerfen' },
      { id: 'outline', label: 'Knopf in voller Höhe' },
      { id: 'pair', label: 'Paar mit Trennlinie' },
      { id: 'inline', label: 'Link in der Zeile' },
      { id: 'handle', label: 'Griff oben' },
    ],
  },
  {
    id: 'shut',
    label: 'Zugeklappt',
    options: [
      { id: 'line', label: 'Mit Änderungen' },
      { id: 'summary', label: 'Mit Regelnamen' },
      { id: 'effect', label: 'Mit Auswirkung' },
      { id: 'quiet', label: 'Ruhig' },
    ],
  },
  {
    id: 'figs',
    label: 'Kacheln',
    options: [
      { id: 'plain', label: 'Wie bisher' },
      { id: 'border', label: 'Mit Rand' },
      { id: 'borderchg', label: 'Rand bei Änderung' },
      { id: 'soft', label: 'Grau mit Rand' },
      { id: 'divider', label: 'Mit Trennlinien' },
    ],
  },
  POP_DIMS[2]!,
];

export const G_PROPOSALS: Record<string, PopParts> = {
  g1: { ...H_BASE, shut: 'line', review: 'ghost', figs: 'border' },
  g2: { ...H_BASE, shut: 'summary', review: 'outline', figs: 'plain' },
  g3: { ...H_BASE, shut: 'quiet', review: 'handle', figs: 'soft' },
  g4: { ...H_BASE, shut: 'effect', review: 'inline', figs: 'divider' },
  g5: { ...H_BASE, shut: 'line', review: 'pair', figs: 'borderchg' },
};

/** Runde 17: the figures decided, more for the closed bar and «Prüfen». */
export const J_DIMS: {
  id: keyof PopParts;
  label: string;
  options: { id: string; label: string }[];
}[] = [
  {
    id: 'shut',
    label: 'Zugeklappt',
    options: [
      { id: 'line', label: 'Mit Änderungen' },
      { id: 'smart', label: 'Zusammengefasst' },
      { id: 'lead', label: 'Titel mit Zähler' },
      { id: 'since', label: 'Mit «seit»' },
      { id: 'icon', label: 'Mit Symbol' },
      { id: 'labels', label: 'Regeln als Marken' },
    ],
  },
  {
    id: 'review',
    label: 'Prüfen',
    options: [
      { id: 'ghost', label: 'Textknopf' },
      { id: 'icontext', label: 'Symbol + Text' },
      { id: 'disclosure', label: 'Pfeil vorne' },
      { id: 'group', label: 'Knopfgruppe' },
      { id: 'split', label: 'Am Speichern-Knopf' },
      { id: 'badge', label: 'Mit Zahl' },
    ],
  },
  POP_DIMS[2]!,
];

const J_BASE = { ...H_BASE, figs: 'soft' };

export const J_PROPOSALS: Record<string, PopParts> = {
  j1: { ...J_BASE, shut: 'smart', review: 'icontext' },
  j2: { ...J_BASE, shut: 'lead', review: 'group' },
  j3: { ...J_BASE, shut: 'since', review: 'disclosure' },
  j4: { ...J_BASE, shut: 'icon', review: 'split' },
  j5: { ...J_BASE, shut: 'labels', review: 'badge' },
};

/** Runde 18: only «Prüfen» is open. */
export const L_DIMS: {
  id: keyof PopParts;
  label: string;
  options: { id: string; label: string }[];
}[] = [
  {
    id: 'review',
    label: 'Prüfen',
    options: [
      { id: 'outlinecount', label: 'Knopf mit Zahl' },
      { id: 'iconbox', label: 'Symbol ist der Knopf' },
      { id: 'titlelink', label: 'Im Titel' },
      { id: 'sublink', label: 'In der Unterzeile' },
      { id: 'iconsq', label: 'Symbolknopf' },
      { id: 'edge', label: 'Pfeil am Rand' },
      { id: 'split', label: 'Am Speichern-Knopf' },
      { id: 'group', label: 'Knopfgruppe' },
    ],
  },
  POP_DIMS[2]!,
];

const L_BASE = { ...J_BASE, shut: 'icon' };
const L_ORDER = [
  'outlinecount',
  'iconbox',
  'titlelink',
  'sublink',
  'iconsq',
  'edge',
  'split',
  'group',
];

export const L_PROPOSALS: Record<string, PopParts> = Object.fromEntries(
  L_ORDER.map((review, i) => [`l${i + 1}`, { ...L_BASE, review }]),
);

/** Runde 19: new takes on «Prüfen». */
export const B_DIMS: {
  id: keyof PopParts;
  label: string;
  options: { id: string; label: string }[];
}[] = [
  {
    id: 'review',
    label: 'Prüfen',
    options: [
      { id: 'confirm', label: 'Prüfen und speichern' },
      { id: 'acc', label: 'Wie die Kapitel' },
      { id: 'hover', label: 'Vorschau beim Überfahren' },
      { id: 'tab', label: 'Lasche oben' },
      { id: 'muted', label: 'Details, zurückhaltend' },
      { id: 'kbd', label: 'Mit Taste P' },
      { id: 'iconbox', label: 'Symbol ist der Knopf' },
      { id: 'outlinecount', label: 'Knopf mit Zahl' },
    ],
  },
  POP_DIMS[2]!,
];

const B_ORDER = ['confirm', 'acc', 'hover', 'tab', 'muted', 'kbd'];

export const B_PROPOSALS: Record<string, PopParts> = Object.fromEntries(
  B_ORDER.map((review, i) => [`b${i + 1}`, { ...L_BASE, review }]),
);

/** Runde 20: «Prüfen und speichern» decided, now how a changed rule looks. */
export const C_DIMS: {
  id: keyof PopParts;
  label: string;
  options: { id: string; label: string }[];
}[] = [
  {
    id: 'changed',
    label: 'Geändert',
    options: [
      { id: 'chipundo', label: 'Chip + Rückgängig-Symbol' },
      { id: 'arrow', label: 'Vorher → neu im Chip' },
      { id: 'under', label: 'Hinweis unter dem Text' },
      { id: 'tooltip', label: 'Bisher beim Überfahren' },
      { id: 'line', label: 'Linie links' },
      { id: 'tint', label: 'Zeile getönt' },
      { id: 'quiet', label: 'Nur der Chip' },
      { id: 'tagnew', label: 'Marke am Titel' },
      { id: 'inval', label: 'Bisher (durchgestrichen)' },
    ],
  },
];

const C_BASE = { ...L_BASE, review: 'confirm' };
const C_ORDER = [
  'chipundo',
  'arrow',
  'under',
  'tooltip',
  'line',
  'tint',
  'quiet',
  'tagnew',
];

export const C_PROPOSALS: Record<string, PopParts> = Object.fromEntries(
  C_ORDER.map((changed, i) => [`c${i + 1}`, { ...C_BASE, changed }]),
);

/** Runde 21: where «Standard» and «Bisher» stand, and how a change shows. */
export const D_DIMS: {
  id: keyof PopParts;
  label: string;
  options: { id: string; label: string }[];
}[] = [
  {
    id: 'pos',
    label: 'Standard / Bisher',
    options: [
      { id: 'beside', label: 'Neben dem Wert' },
      { id: 'minimal', label: 'Nur wenn nötig' },
      { id: 'label', label: 'Am Titel' },
      { id: 'hover', label: 'Beim Überfahren' },
      { id: 'below', label: 'Unter dem Wert (bisher)' },
    ],
  },
  {
    id: 'changed',
    label: 'Geändert',
    options: [
      { id: 'chip', label: 'Blauer Chip' },
      { id: 'chipdot', label: 'Chip mit Punkt' },
      { id: 'outline', label: 'Chip umrandet' },
      { id: 'undoin', label: 'Rückgängig am Chip' },
      { id: 'arrow', label: 'Vorher → neu' },
      { id: 'label', label: 'Titel markiert' },
    ],
  },
];

const D_BASE = { ...C_BASE };

export const D_PROPOSALS: Record<string, PopParts> = {
  d1: { ...D_BASE, pos: 'beside', changed: 'chip' },
  d2: { ...D_BASE, pos: 'minimal', changed: 'undoin' },
  d3: { ...D_BASE, pos: 'label', changed: 'label' },
  d4: { ...D_BASE, pos: 'hover', changed: 'chipdot' },
  d5: { ...D_BASE, pos: 'minimal', changed: 'arrow' },
  d6: { ...D_BASE, pos: 'beside', changed: 'outline' },
};

/** Runde 22: more places for Standard / Bisher, and colour for a change. */
export const E_DIMS: {
  id: keyof PopParts;
  label: string;
  options: { id: string; label: string }[];
}[] = [
  {
    id: 'pos',
    label: 'Standard / Bisher',
    options: [
      { id: 'inchip', label: 'Im Chip' },
      { id: 'iconbtn', label: 'Nur Symbol' },
      { id: 'pill', label: 'Als Marke' },
      { id: 'after', label: 'Rechts vom Wert' },
      { id: 'desc', label: 'In der Beschreibung' },
      { id: 'minimal', label: 'Nur wenn nötig' },
      { id: 'beside', label: 'Neben dem Wert' },
    ],
  },
  {
    id: 'changed',
    label: 'Geändert',
    options: [
      { id: 'rowtint', label: 'Zeile hellblau' },
      { id: 'rowbar', label: 'Zeile mit Kante' },
      { id: 'rowstrong', label: 'Zeile kräftig' },
      { id: 'textpart', label: 'Textteil gefärbt' },
      { id: 'chipsolid', label: 'Chip blau gefüllt' },
      { id: 'glow', label: 'Chip mit Schein' },
      { id: 'chip', label: 'Blauer Chip' },
      { id: 'undoin', label: 'Rückgängig am Chip' },
    ],
  },
];

export const E_PROPOSALS: Record<string, PopParts> = {
  e1: { ...D_BASE, pos: 'inchip', changed: 'rowtint' },
  e2: { ...D_BASE, pos: 'iconbtn', changed: 'rowbar' },
  e3: { ...D_BASE, pos: 'pill', changed: 'rowstrong' },
  e4: { ...D_BASE, pos: 'after', changed: 'textpart' },
  e5: { ...D_BASE, pos: 'desc', changed: 'chipsolid' },
  e6: { ...D_BASE, pos: 'minimal', changed: 'glow' },
};

/** Runde 23: further takes on Standard / Bisher and on a change. */
export const F_DIMS: {
  id: keyof PopParts;
  label: string;
  options: { id: string; label: string }[];
}[] = [
  {
    id: 'pos',
    label: 'Standard / Bisher',
    options: [
      { id: 'column', label: 'Als Spalte' },
      { id: 'hovercard', label: 'Karte beim Überfahren' },
      { id: 'segment', label: 'Segment am Chip' },
      { id: 'dot', label: 'Punkt mit Hinweis' },
      { id: 'none', label: 'Nur im Popover' },
      { id: 'pill', label: 'Als Marke' },
    ],
  },
  {
    id: 'changed',
    label: 'Geändert',
    options: [
      { id: 'dashed', label: 'Chip gestrichelt' },
      { id: 'numbered', label: 'Nummeriert' },
      { id: 'raised', label: 'Zeile angehoben' },
      { id: 'valuepanel', label: 'Wertseite gefärbt' },
      { id: 'fade', label: 'Verlauf von links' },
      { id: 'underline', label: 'Titel unterstrichen' },
      { id: 'rowstrong', label: 'Zeile kräftig' },
    ],
  },
];

export const F_PROPOSALS: Record<string, PopParts> = {
  f1: { ...D_BASE, pos: 'column', changed: 'dashed' },
  f2: { ...D_BASE, pos: 'hovercard', changed: 'numbered' },
  f3: { ...D_BASE, pos: 'segment', changed: 'raised' },
  f4: { ...D_BASE, pos: 'dot', changed: 'valuepanel' },
  f5: { ...D_BASE, pos: 'none', changed: 'fade' },
  f6: { ...D_BASE, pos: 'column', changed: 'underline' },
};

/** Runde 24: «Zeile hellblau» as the measure, six different ideas for a change. */
export const I_DIMS: {
  id: keyof PopParts;
  label: string;
  options: { id: string; label: string }[];
}[] = [
  {
    id: 'changed',
    label: 'Geändert',
    options: [
      { id: 'rowtint', label: 'Zeile hellblau (Massstab)' },
      { id: 'diffline', label: 'Diff-Zeile' },
      { id: 'impact', label: 'Mit Wirkung' },
      { id: 'ghost', label: 'Alter Wert als Chip' },
      { id: 'delta', label: 'Differenz als Zahl' },
      { id: 'chapter', label: 'Kapitel färbt sich' },
      { id: 'flash', label: 'Leuchtet kurz auf' },
    ],
  },
  {
    id: 'pos',
    label: 'Standard / Bisher',
    options: [
      { id: 'minimal', label: 'Nur wenn nötig' },
      { id: 'beside', label: 'Neben dem Wert' },
      { id: 'pill', label: 'Als Marke' },
      { id: 'column', label: 'Als Spalte' },
      { id: 'none', label: 'Nur im Popover' },
    ],
  },
];

const I_ORDER = [
  'rowtint',
  'diffline',
  'impact',
  'ghost',
  'delta',
  'chapter',
  'flash',
];

export const I_PROPOSALS: Record<string, PopParts> = Object.fromEntries(
  I_ORDER.map((changed, i) => [
    `i${i + 1}`,
    {
      ...D_BASE,
      // Those that show the old value themselves need no «Bisher» beside it.
      pos: ['diffline', 'impact', 'ghost', 'delta'].includes(changed)
        ? 'none'
        : 'minimal',
      changed,
    },
  ]),
);

/** Runde 25: «Zeile hellblau» decided, new takes on Standard / Bisher. */
export const S_DIMS: {
  id: keyof PopParts;
  label: string;
  options: { id: string; label: string }[];
}[] = [
  {
    id: 'pos',
    label: 'Standard / Bisher',
    options: [
      { id: 'table', label: 'Tabelle mit Spaltenkopf' },
      { id: 'chapterhead', label: 'Im Kapitelkopf' },
      { id: 'chapterfoot', label: 'Fusszeile je Kapitel' },
      { id: 'check', label: 'Häkchen im Wert' },
      { id: 'filter', label: 'Übersicht + Hervorheben' },
      { id: 'minimal', label: 'Nur wenn nötig' },
    ],
  },
];

const S_ORDER = ['table', 'chapterhead', 'chapterfoot', 'check', 'filter'];

export const S_PROPOSALS: Record<string, PopParts> = Object.fromEntries(
  S_ORDER.map((pos, i) => [`s${i + 1}`, { ...D_BASE, changed: 'rowtint', pos }]),
);

/** Runde 26: the tag clickable as a whole, and the table aligned. */
export const A_DIMS: {
  id: keyof PopParts;
  label: string;
  options: { id: string; label: string }[];
}[] = [
  {
    id: 'pos',
    label: 'Standard / Bisher',
    options: [
      { id: 'pill', label: 'Als Marke' },
      { id: 'table', label: 'Tabelle' },
    ],
  },
  {
    id: 'pill',
    label: 'Marke',
    options: [
      { id: 'whole', label: 'Ganze Marke klickbar' },
      { id: 'swap', label: 'Wird zu «Zurücksetzen»' },
      { id: 'split', label: 'Zweiteilig' },
      { id: 'strike', label: 'Alter Wert gestrichen' },
      { id: 'words', label: 'In Worten' },
    ],
  },
  {
    id: 'thead',
    label: 'Tabelle',
    options: [
      { id: 'left', label: 'Linksbündig' },
      { id: 'zebra', label: 'Mit Streifen' },
      { id: 'lines', label: 'Mit Spaltenlinien' },
      { id: 'strong', label: 'Kräftiger Kopf' },
    ],
  },
];

const A_BASE = { ...D_BASE, changed: 'rowtint' };

export const A_PROPOSALS: Record<string, PopParts> = {
  a1: { ...A_BASE, pos: 'pill', pill: 'whole', thead: 'left' },
  a2: { ...A_BASE, pos: 'pill', pill: 'swap', thead: 'left' },
  a3: { ...A_BASE, pos: 'pill', pill: 'split', thead: 'left' },
  a4: { ...A_BASE, pos: 'pill', pill: 'strike', thead: 'left' },
  a5: { ...A_BASE, pos: 'pill', pill: 'words', thead: 'left' },
  a6: { ...A_BASE, pos: 'table', pill: 'whole', thead: 'left' },
  a7: { ...A_BASE, pos: 'table', pill: 'whole', thead: 'zebra' },
  a8: { ...A_BASE, pos: 'table', pill: 'whole', thead: 'lines' },
  a9: { ...A_BASE, pos: 'table', pill: 'whole', thead: 'strong' },
};

/** Runde 27: the whole page, its head, the presets' title and the rules' title. */
export const P_DIMS: {
  id: keyof PopParts;
  label: string;
  options: { id: string; label: string }[];
}[] = [
  {
    id: 'kpi',
    label: 'Kennzahlen',
    options: [
      { id: 'tiles', label: 'Vier Kacheln' },
      { id: 'strip', label: 'Eine Zeile' },
      { id: 'none', label: 'Keine' },
    ],
  },
  {
    id: 'phead',
    label: 'Vorlagen-Titel',
    options: [
      { id: 'schnell', label: 'Schnellvarianten (bisher)' },
      { id: 'vorlagen', label: 'Vorlagen' },
      { id: 'start', label: 'Ausgangspunkt wählen' },
      { id: 'section', label: 'Als Abschnitt' },
    ],
  },
  {
    id: 'rhead',
    label: 'Regeln-Titel',
    options: [
      { id: 'none', label: 'Keiner' },
      { id: 'title', label: 'Abschnitt «Regeln»' },
    ],
  },
];

const P_BASE = { ...A_BASE, pos: 'table', thead: 'left', pill: 'whole' };

export const P_PROPOSALS: Record<string, PopParts> = {
  P1: { ...P_BASE, kpi: 'tiles', phead: 'schnell', rhead: 'none' },
  P2: { ...P_BASE, kpi: 'tiles', phead: 'vorlagen', rhead: 'title' },
  P3: { ...P_BASE, kpi: 'strip', phead: 'start', rhead: 'title' },
  P4: { ...P_BASE, kpi: 'strip', phead: 'section', rhead: 'none' },
  P5: { ...P_BASE, kpi: 'none', phead: 'vorlagen', rhead: 'title' },
};

/** Runde 28: whole pages, each built differently. */
export const Q_DIMS: {
  id: keyof PopParts;
  label: string;
  options: { id: string; label: string }[];
}[] = [
  {
    id: 'shape',
    label: 'Aufbau',
    options: [
      { id: 'stack', label: 'Untereinander' },
      { id: 'side', label: 'Mit Seitenspalte' },
      { id: 'nav', label: 'Mit Navigation' },
    ],
  },
  {
    id: 'kpi',
    label: 'Kennzahlen',
    options: [
      { id: 'tiles', label: 'Vier Kacheln' },
      { id: 'strip', label: 'Eine Zeile' },
      { id: 'none', label: 'Keine' },
    ],
  },
  {
    id: 'pstyle',
    label: 'Vorlagen',
    options: [
      { id: 'cards', label: 'Karten' },
      { id: 'seg', label: 'Leiste mit Text' },
      { id: 'inhead', label: 'Im Kopf der Regeln' },
    ],
  },
  {
    id: 'phead',
    label: 'Vorlagen-Titel',
    options: [
      { id: 'vorlagen', label: 'Vorlagen' },
      { id: 'start', label: 'Ausgangspunkt wählen' },
      { id: 'section', label: 'Als Abschnitt' },
    ],
  },
];

const Q_BASE = { ...P_BASE, phead: 'vorlagen', rhead: 'title' };

export const Q_PROPOSALS: Record<string, PopParts> = {
  Q1: { ...Q_BASE, shape: 'side', kpi: 'none', pstyle: 'cards' },
  Q2: { ...Q_BASE, shape: 'stack', kpi: 'strip', pstyle: 'inhead' },
  Q3: { ...Q_BASE, shape: 'nav', kpi: 'strip', pstyle: 'cards' },
  Q4: { ...Q_BASE, shape: 'stack', kpi: 'none', pstyle: 'seg' },
  Q5: { ...Q_BASE, shape: 'stack', kpi: 'tiles', pstyle: 'seg' },
};

/** Runde 29: the page as decided, only titles, texts and open chapters vary. */
export const X_DIMS: {
  id: keyof PopParts;
  label: string;
  options: { id: string; label: string }[];
}[] = [
  {
    id: 'phead',
    label: 'Vorlagen-Titel',
    options: [
      { id: 'schnell', label: 'Schnellvarianten (bisher)' },
      { id: 'vorlagen', label: 'Vorlagen' },
      { id: 'start', label: 'Ausgangspunkt wählen' },
      { id: 'section', label: 'Als Abschnitt' },
      { id: 'step', label: 'Schritt 1' },
      { id: 'active', label: 'Mit aktiver Vorlage' },
      { id: 'inline', label: 'Titel + Text in einer Zeile' },
      { id: 'ablauf', label: '«Ablauf eines Duells»' },
    ],
  },
  {
    id: 'rhead',
    label: 'Regeln-Titel',
    options: [
      { id: 'none', label: 'Keiner' },
      { id: 'title', label: 'Abschnitt «Regeln»' },
      { id: 'plain', label: 'Wie die Vorlagen' },
      { id: 'count', label: 'Mit Anzahl' },
      { id: 'status', label: 'Mit Standard-Stand' },
      { id: 'step', label: 'Schritt 2' },
    ],
  },
  {
    id: 'open',
    label: 'Kapitel beim Öffnen',
    options: [
      { id: 'first', label: 'Erstes offen' },
      { id: 'all', label: 'Alle offen' },
    ],
  },
];

const X_BASE = { ...P_BASE, kpi: 'tiles' };

export const X_PROPOSALS: Record<string, PopParts> = {
  X1: { ...X_BASE, phead: 'schnell', rhead: 'none', open: 'first' },
  X2: { ...X_BASE, phead: 'vorlagen', rhead: 'none', open: 'first' },
  X3: { ...X_BASE, phead: 'vorlagen', rhead: 'title', open: 'first' },
  X4: { ...X_BASE, phead: 'section', rhead: 'title', open: 'first' },
  X5: { ...X_BASE, phead: 'vorlagen', rhead: 'title', open: 'all' },
  X6: { ...X_BASE, phead: 'vorlagen', rhead: 'plain', open: 'first' },
  X7: { ...X_BASE, phead: 'step', rhead: 'step', open: 'first' },
  X8: { ...X_BASE, phead: 'active', rhead: 'count', open: 'first' },
  X9: { ...X_BASE, phead: 'inline', rhead: 'status', open: 'first' },
};

/** The two finalists, shown without the draft panel. */
export const Y_PROPOSALS: Record<string, PopParts> = {
  Y1: { ...X_BASE, phead: 'vorlagen', rhead: 'count', open: 'first' },
  Y2: { ...X_BASE, phead: 'step', rhead: 'step', open: 'first' },
  Y7: { ...X_BASE, phead: 'step', rhead: 'step', open: 'first', last: 'big' },
  Y8: { ...X_BASE, phead: 'step', rhead: 'step', open: 'first', last: 'chip' },
  Y9: { ...X_BASE, phead: 'step', rhead: 'step', open: 'first', last: 'foot' },
  Y10: { ...X_BASE, phead: 'step', rhead: 'step', open: 'first', last: 'icon' },
  Y3: { ...X_BASE, phead: 'step', rhead: 'step', open: 'first', last: 'link' },
  Y4: { ...X_BASE, phead: 'step', rhead: 'step', open: 'first', last: 'action' },
  Y5: { ...X_BASE, phead: 'step', rhead: 'step', open: 'first', last: 'count' },
  Y6: { ...X_BASE, phead: 'step', rhead: 'step', open: 'first', last: 'list' },
};
