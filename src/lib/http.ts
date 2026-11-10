import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { isDesktop } from "@/lib/desktop";

const browserFetch = window.fetch.bind(window);

// The desktop app sends requests through the Rust HTTP client so the local core
// does not need CORS. The web build keeps the regular browser fetch.
export const appFetch: typeof fetch = isDesktop
  ? async (input, init) => {
      const headers = new Headers(init?.headers);
      if (!headers.has("User-Agent")) {
        headers.set("User-Agent", navigator.userAgent);
      }

      return tauriFetch(input, { ...init, headers });
    }
  : browserFetch;
