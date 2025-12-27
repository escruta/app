declare interface RequestConfig extends RequestInit {
  data?: Record<string, unknown> | FormData;
  params?: Record<string, string>;
  baseURL?: string;
}

declare interface FetchError extends Error {
  status: number;
  message: string;
}
