import { Injectable, signal } from '@angular/core';
import { localStore } from '../platform/safe-storage';

export type LogoVariant = 1 | 2 | 3 | 4;
export type HeaderVariant = 1 | 2 | 3 | 4;

export const LOGO_NAMES: Record<LogoVariant, string> = {
  1: 'Formenkreis',
  2: 'Duell-Formen',
  3: 'pd-Monogramm',
  4: 'Quiz-Rad',
};

export const HEADER_NAMES: Record<HeaderVariant, string> = {
  1: 'Karte mit Wortmarke',
  2: 'Zentriert gestapelt',
  3: 'App-Leiste',
  4: 'Minimal',
};

const LOGO_KEY = 'playduelio.preview.logo';
const HEADER_KEY = 'playduelio.preview.header';

/** Currently shown logo and header design (switchable while choosing a design). */
@Injectable({ providedIn: 'root' })
export class BrandingStore {
  readonly logo = signal<LogoVariant>(read(LOGO_KEY, 1));
  readonly header = signal<HeaderVariant>(read(HEADER_KEY, 1));

  setLogo(variant: LogoVariant): void {
    this.logo.set(variant);
    localStore.set(LOGO_KEY, String(variant));
  }

  setHeader(variant: HeaderVariant): void {
    this.header.set(variant);
    localStore.set(HEADER_KEY, String(variant));
  }
}

function read<T extends number>(key: string, fallback: T): T {
  const value = Number(localStore.get(key));
  return (value >= 1 && value <= 4 ? value : fallback) as T;
}
