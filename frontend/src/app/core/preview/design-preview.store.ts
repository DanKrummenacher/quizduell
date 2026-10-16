import { DOCUMENT, effect, inject, Injectable, signal } from '@angular/core';
import { localStore } from '../platform/safe-storage';

export type HeaderVariant = 'start' | 'everywhere' | 'navigation' | 'slim';
export type LargeScreenOption = 'cohesive' | 'sides' | 'surface' | 'cap';

export const HEADER_VARIANTS: { id: HeaderVariant; name: string; idea: string }[] = [
  {
    id: 'start',
    name: 'H0 · Nur Startseite (heute)',
    idea: 'Header nur auf der Startseite.',
  },
  {
    id: 'everywhere',
    name: 'H1 · Überall gleich',
    idea: 'Derselbe Header auf Lobby, Quiz und Resultat.',
  },
  {
    id: 'navigation',
    name: 'H2 · Mit Navigation',
    idea: '«Zurück» und «Frage 3 von 7» wandern in den Header.',
  },
  {
    id: 'slim',
    name: 'H3 · Schlank im Duell',
    idea: 'Überall Header, im Quiz eine schmale Version für mehr Platz.',
  },
];

export const LARGE_SCREEN_OPTIONS: {
  id: LargeScreenOption;
  name: string;
  idea: string;
}[] = [
  {
    id: 'cohesive',
    name: 'G1 · Inhalt zusammenhalten',
    idea: 'Frage und Knöpfe bleiben beieinander statt weit auseinander.',
  },
  {
    id: 'sides',
    name: 'G2 · Seitenflächen gestalten',
    idea: 'Dezente Markenfarben und Punktraster links und rechts.',
  },
  {
    id: 'surface',
    name: 'G3 · Spalte als Fläche',
    idea: 'Die Spielspalte hebt sich als helle Fläche vom Rand ab.',
  },
  {
    id: 'cap',
    name: 'G4 · Grössenlimit',
    idea: 'Wächst höchstens auf 20 px statt 24 px (Ultrawide).',
  },
];

const HEADER_KEY = 'playduelio.preview.header';
const LARGE_KEY = 'playduelio.preview.large';

/**
 * Temporary: header and large-screen variants being compared. Sets
 * `data-header` and `data-large` on <html>; the variants live in CSS.
 */
@Injectable({ providedIn: 'root' })
export class DesignPreviewStore {
  readonly header = signal<HeaderVariant>(readHeader());
  readonly large = signal<LargeScreenOption[]>(readLarge());

  constructor() {
    const root = inject(DOCUMENT).documentElement;
    effect(() => {
      const header = this.header();
      if (header === 'start') {
        delete root.dataset['header'];
      } else {
        root.dataset['header'] = header;
      }
      const large = this.large();
      if (large.length === 0) {
        delete root.dataset['large'];
      } else {
        root.dataset['large'] = large.join(' ');
      }
    });
  }

  setHeader(variant: HeaderVariant): void {
    this.header.set(variant);
    localStore.set(HEADER_KEY, variant);
  }

  toggleLarge(option: LargeScreenOption): void {
    const current = this.large();
    const next = current.includes(option)
      ? current.filter((o) => o !== option)
      : [...current, option];
    this.large.set(next);
    localStore.set(LARGE_KEY, next.join(' '));
  }
}

function readHeader(): HeaderVariant {
  const stored = localStore.get(HEADER_KEY);
  return HEADER_VARIANTS.find((v) => v.id === stored)?.id ?? 'start';
}

function readLarge(): LargeScreenOption[] {
  const stored = (localStore.get(LARGE_KEY) ?? '').split(' ');
  return LARGE_SCREEN_OPTIONS.filter((o) => stored.includes(o.id)).map((o) => o.id);
}
