import { Injectable, signal } from '@angular/core';
import { localStore } from '../platform/safe-storage';

export type HeaderVariant = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const HEADER_VARIANTS: { id: HeaderVariant; name: string; idea: string }[] = [
  {
    id: 1,
    name: 'Verlauf zentriert',
    idea: 'Verlaufsleiste, App-Icon und Name in der Mitte',
  },
  {
    id: 2,
    name: 'Verlauf mit Muster',
    idea: 'Die Formen aus dem Logo als dezentes Muster',
  },
  {
    id: 3,
    name: 'Dunkelblau mit Linie',
    idea: 'Ruhig und seriös, Verlauf als Akzentlinie',
  },
  {
    id: 4,
    name: 'Dunkelblau abgerundet',
    idea: 'Wie 3, mit runder Unterkante und Verlaufsrand',
  },
  { id: 5, name: 'Live-Zähler', idea: 'Zeigt live, wie viele gerade online sind' },
  {
    id: 6,
    name: 'Mit Spielregeln',
    idea: '«?»-Knopf öffnet die Regeln in drei Sätzen',
  },
  { id: 7, name: 'Zweizeilig', idea: 'Name gross, «Quizduell Challenge» darunter' },
  {
    id: 8,
    name: 'Glas fixiert',
    idea: 'Bleibt beim Scrollen oben, mit Milchglas-Effekt',
  },
];

const HEADER_KEY = 'playduelio.preview.header';

/** Currently shown header design (switchable while choosing a design). */
@Injectable({ providedIn: 'root' })
export class BrandingStore {
  readonly header = signal<HeaderVariant>(readVariant());

  setHeader(variant: HeaderVariant): void {
    this.header.set(variant);
    localStore.set(HEADER_KEY, String(variant));
  }
}

function readVariant(): HeaderVariant {
  const value = Number(localStore.get(HEADER_KEY));
  return (value >= 1 && value <= 8 ? value : 1) as HeaderVariant;
}
