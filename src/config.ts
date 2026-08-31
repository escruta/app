export const BACKEND_BASE_URL = import.meta.env.VITE_ESCRUTA_CORE_URL || "http://localhost:8080";

export const AUTH_TOKEN_KEY = "authToken";

export const websiteUrl = "https://escruta.com";

export const AUTH_URL =
  import.meta.env.VITE_ESCRUTA_AUTH_URL ||
  (import.meta.env.DEV ? "http://localhost:3000" : "https://account.escruta.com");
