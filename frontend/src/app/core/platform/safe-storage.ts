/**
 * Storage access that never throws (private mode, blocked cookies, quota).
 * Everything stored here is a convenience; the app works without it.
 */
class SafeStorage {
  constructor(private readonly kind: 'local' | 'session') {}

  get(key: string): string | null {
    try {
      return this.storage()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  set(key: string, value: string): void {
    try {
      this.storage()?.setItem(key, value);
    } catch {
      // Ignore: storage is optional.
    }
  }

  remove(key: string): void {
    try {
      this.storage()?.removeItem(key);
    } catch {
      // Ignore: storage is optional.
    }
  }

  private storage(): Storage | undefined {
    if (typeof window === 'undefined') {
      return undefined;
    }
    return this.kind === 'local' ? window.localStorage : window.sessionStorage;
  }
}

export const localStore = new SafeStorage('local');
export const sessionStore = new SafeStorage('session');
