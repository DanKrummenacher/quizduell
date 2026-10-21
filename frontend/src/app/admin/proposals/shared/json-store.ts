// TEMPORARY: small JSON values in the local storage, for view preferences
// of the proposals (development only). Without storage the defaults apply.
import { localStore } from '../../../core/platform/safe-storage';

export function readJson<T>(key: string): T | null {
  const raw = localStore.get(key);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): void {
  localStore.set(key, JSON.stringify(value));
}
