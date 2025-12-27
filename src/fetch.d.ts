declare interface RequestConfig extends RequestInit {
  data?: Record<string, unknown> | FormData;
  params?: Record<string, string>;
  baseURL?: string;
}
