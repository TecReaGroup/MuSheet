import { log } from './logger';

/** localStorage can throw (private mode, quota, disabled storage); callers just get the fallback. */
export function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeStored(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    log('warn', 'Storage', 'Cannot write local storage', { key, message: String(error) });
  }
}
