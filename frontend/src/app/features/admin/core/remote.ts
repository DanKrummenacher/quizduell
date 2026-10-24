import { DestroyRef, inject, signal } from '@angular/core';
import { AdminApiError } from './admin-api.service';

/**
 * Data loaded from the server: the value stays while it reloads, so pages do
 * not flicker, and an error keeps the last good value visible.
 */
export function remote<T>(load: () => Promise<T>) {
  const value = signal<T | undefined>(undefined);
  const error = signal<string | null>(null);
  const loading = signal(false);
  let sequence = 0;

  async function reload(): Promise<void> {
    const id = ++sequence;
    loading.set(true);
    try {
      const next = await load();
      if (id === sequence) {
        value.set(next);
        error.set(null);
      }
    } catch (caught) {
      if (id === sequence) {
        error.set(
          caught instanceof AdminApiError
            ? caught.message
            : 'Die Daten konnten nicht geladen werden.',
        );
      }
    } finally {
      if (id === sequence) {
        loading.set(false);
      }
    }
  }

  void reload();
  return {
    value: value.asReadonly(),
    error: error.asReadonly(),
    loading: loading.asReadonly(),
    reload,
    /** Replaces the value after a change, without a round trip. */
    set: (next: T) => value.set(next),
    update: (change: (current: T) => T) => {
      const current = value();
      if (current !== undefined) {
        value.set(change(current));
      }
    },
  };
}

export type Remote<T> = ReturnType<typeof remote<T>>;

/**
 * Runs `tick` every `ms` while the page is visible and once more when it
 * becomes visible again. Stops with the calling component.
 */
export function every(ms: number, tick: () => void): void {
  let timer: ReturnType<typeof setInterval> | null = null;
  const start = () => {
    stop();
    timer = setInterval(tick, ms);
  };
  const stop = () => {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
  const onVisibility = () => {
    if (document.hidden) {
      stop();
    } else {
      tick();
      start();
    }
  };
  document.addEventListener('visibilitychange', onVisibility);
  if (!document.hidden) {
    start();
  }
  inject(DestroyRef).onDestroy(() => {
    stop();
    document.removeEventListener('visibilitychange', onVisibility);
  });
}
