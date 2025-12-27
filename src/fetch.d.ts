interface RequestConfig extends RequestInit {
  data?: Record<string, any> | FormData;
  params?: Record<string, string>;
  baseURL?: string;
}
