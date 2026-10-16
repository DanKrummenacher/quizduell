import { DOCUMENT, effect, inject, Injectable, signal } from '@angular/core';
import { localStore } from '../platform/safe-storage';

export type LayoutConcept = 'steps' | 'fluid' | 'stage' | 'adaptive' | 'split';

export const LAYOUT_CONCEPTS: { id: LayoutConcept; name: string; idea: string }[] = [
  {
    id: 'steps',
    name: 'A · Spalte, stufenweise (heute)',
    idea: 'Mobile-Spalte in der Mitte, wächst in festen Stufen mit dem Bildschirm.',
  },
  {
    id: 'fluid',
    name: 'B · Spalte, fliessend',
    idea: 'Gleiche Spalte, wächst stufenlos mit (clamp + round), ohne Sprünge.',
  },
  {
    id: 'stage',
    name: 'C · Bühne',
    idea: 'Die App als Karte auf einer Fläche in Markenfarben – wie ein Spielgerät.',
  },
  {
    id: 'adaptive',
    name: 'D · Adaptiv',
    idea: 'Nutzt die Breite: Antworten 2×2, Karten nebeneinander (Container Queries).',
  },
  {
    id: 'split',
    name: 'E · Geteilt',
    idea: 'Links Markenbereich mit Spielregeln, rechts das Spiel.',
  },
];

const STORAGE_KEY = 'playduelio.preview.layout';

/**
 * Temporary: the large-screen layout concept being compared. Sets
 * `data-layout` on <html>; the concepts live in CSS (styles.scss and the
 * feature styles). `steps` is today's layout and sets no attribute.
 */
@Injectable({ providedIn: 'root' })
export class LayoutConceptStore {
  readonly concept = signal<LayoutConcept>(readConcept());

  constructor() {
    const root = inject(DOCUMENT).documentElement;
    effect(() => {
      const concept = this.concept();
      if (concept === 'steps') {
        delete root.dataset['layout'];
      } else {
        root.dataset['layout'] = concept;
      }
    });
  }

  set(concept: LayoutConcept): void {
    this.concept.set(concept);
    localStore.set(STORAGE_KEY, concept);
  }
}

function readConcept(): LayoutConcept {
  const stored = localStore.get(STORAGE_KEY);
  return LAYOUT_CONCEPTS.find((c) => c.id === stored)?.id ?? 'steps';
}
