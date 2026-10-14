import { Injectable, signal } from '@angular/core';
import { localStore } from '../platform/safe-storage';

export type HeaderVariant = 1 | 2 | 3 | 4 | 5 | 6;

export const HEADER_VARIANTS: { id: HeaderVariant; name: string; idea: string }[] = [
  {
    id: 1,
    name: 'Schwebende Pille',
    idea: 'Kompakt, freistehend, wie eine App-Insel',
  },
  { id: 2, name: 'Farbband', idea: 'Markenverlauf als Bühne, Logo in Weiss' },
  { id: 3, name: 'Live-Leiste', idea: 'App-Leiste mit pulsierendem Live-Status' },
  { id: 4, name: 'Verlaufsrahmen', idea: 'Weisse Karte mit feinem Verlaufsrand' },
  { id: 5, name: 'Editorial', idea: 'Linksbündig, Akzentlinie, viel Weissraum' },
  { id: 6, name: 'Signet gross', idea: 'Grosses Logo mit Leuchten, wie ein Splash' },
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
  return (value >= 1 && value <= 6 ? value : 1) as HeaderVariant;
}
