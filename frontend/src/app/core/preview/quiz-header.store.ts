import { Injectable, signal } from '@angular/core';
import { localStore } from '../platform/safe-storage';

/** What the diamond in the middle shows. */
export type FaceoffClock = 'seconds' | 'question' | 'ring' | 'none';
/** How wide the header reaches on screens wider than a phone. */
export type FaceoffWidth = 'bleed' | 'card' | 'column';
export type FaceoffLook = 'classic' | 'contrast' | 'gradient';

export interface FaceoffOptions {
  clock: FaceoffClock;
  width: FaceoffWidth;
  look: FaceoffLook;
  /** Points light up briefly when they increase. */
  pop: boolean;
}

/** Recommended setup; applies live and whenever nothing was switched locally. */
export const FACEOFF_DEFAULTS: FaceoffOptions = {
  clock: 'ring',
  width: 'bleed',
  look: 'gradient',
  pop: true,
};

const STORAGE_KEY = 'playduelio.preview.faceoff';

/**
 * Temporary: the options of the quiz header «Gegenüber» being compared.
 * Only switchable in development; everywhere else the defaults apply.
 */
@Injectable({ providedIn: 'root' })
export class QuizHeaderStore {
  readonly options = signal<FaceoffOptions>(readOptions());

  set<K extends keyof FaceoffOptions>(key: K, value: FaceoffOptions[K]): void {
    this.options.update((options) => ({ ...options, [key]: value }));
    localStore.set(STORAGE_KEY, JSON.stringify(this.options()));
  }
}

function readOptions(): FaceoffOptions {
  try {
    const stored = JSON.parse(
      localStore.get(STORAGE_KEY) ?? '{}',
    ) as Partial<FaceoffOptions>;
    return { ...FACEOFF_DEFAULTS, ...stored };
  } catch {
    return FACEOFF_DEFAULTS;
  }
}
