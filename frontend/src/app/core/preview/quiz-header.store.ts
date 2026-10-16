import { Injectable, signal } from '@angular/core';
import { localStore } from '../platform/safe-storage';

/** Header variants of the quiz screen being compared. */
export type QuizHeaderVariant = 'cards' | 'faceoff';

const STORAGE_KEY = 'playduelio.preview.quizHeader';

/**
 * Temporary: which quiz header is shown while the two variants are compared
 * («Duell-Karten» and «Gegenüber»). Only switchable in development.
 */
@Injectable({ providedIn: 'root' })
export class QuizHeaderStore {
  readonly variant = signal<QuizHeaderVariant>(
    localStore.get(STORAGE_KEY) === 'faceoff' ? 'faceoff' : 'cards',
  );

  set(variant: QuizHeaderVariant): void {
    this.variant.set(variant);
    localStore.set(STORAGE_KEY, variant);
  }
}
