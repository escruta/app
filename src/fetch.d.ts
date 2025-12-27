interface RequestConfig extends RequestInit {
  data?: Record<string, unknown>;
  params?: Record<string, string>;
  baseURL?: string;
}
