import Cookies from "js-cookie";
import { isDesktop } from "@/lib/desktop";

// WebKit (Linux/macOS) rejects Secure cookies on localhost and custom protocols,
// so the desktop app persists values in localStorage instead.
export type PersistedOptions = Cookies.CookieAttributes;

const DEFAULT_COOKIE_OPTIONS: PersistedOptions = {
  expires: 30,
  secure: typeof window !== "undefined" && window.location.protocol === "https:",
};

export function readStoredValue(key: string): string | null {
  if (isDesktop) {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) return stored;

      const legacy = Cookies.get(key);
      if (legacy !== undefined) {
        window.localStorage.setItem(key, legacy);
        try {
          Cookies.remove(key);
        } catch {}
        return legacy;
      }
    } catch {
      return null;
    }

    return null;
  }

  return Cookies.get(key) ?? null;
}

export function writeStoredValue(
  key: string,
  value: string,
  options: PersistedOptions = DEFAULT_COOKIE_OPTIONS,
): void {
  if (isDesktop) {
    try {
      window.localStorage.setItem(key, value);
    } catch {}
    return;
  }

  Cookies.set(key, value, options);
}

export function clearStoredValue(key: string): void {
  if (isDesktop) {
    try {
      window.localStorage.removeItem(key);
    } catch {}
    return;
  }

  Cookies.remove(key);
}
