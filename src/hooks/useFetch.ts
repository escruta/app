import { useState, useEffect, useCallback, useRef } from "react";
import useCookie from "./useCookie";
import { AUTH_TOKEN_KEY, BACKEND_BASE_URL } from "@/config";
import type { Token } from "@/interfaces";
import { cacheInstance, generateCacheKey } from "@/utils/lruCache";

interface UseFetchState<T> {
  data: T | null;
  loading: boolean;
  error: FetchError | null;
}

interface UseFetchOptions<T> extends RequestConfig {
  onSuccess?: (data: T) => void;
  onError?: (error: FetchError) => void;
  cacheTime?: number;
  skipCache?: boolean;
  retry?: number;
  retryDelay?: number;
}

export default function useFetch<T = unknown>(
  endpoint: string,
  options?: UseFetchOptions<T>,
  immediate = true,
) {
  const [token] = useCookie<Token>(AUTH_TOKEN_KEY);
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const optionsRef = useRef(options);
  const mountedRef = useRef(true);

  useEffect(() => {
    optionsRef.current = options;
  });

  const dependencyKey = JSON.stringify({
    endpoint,
    method: options?.method,
    params: options?.params,
    body: options?.body,
    cacheTime: options?.cacheTime,
  });

  const fetchData = useCallback(
    async (forcedUpdate = false) => {
      const currentOptions = optionsRef.current;
      const cacheTime = currentOptions?.cacheTime ?? 5 * 60 * 1000;
      const retryCount = currentOptions?.retry ?? 0;
      const retryDelay = currentOptions?.retryDelay ?? 1000;
      const baseURL = currentOptions?.baseURL ?? BACKEND_BASE_URL;
      const skipCache =
        forcedUpdate || currentOptions?.skipCache || cacheTime <= 0;

      const cacheKey = generateCacheKey(endpoint, currentOptions);
      const cached = cacheInstance.get<T>(cacheKey);
      const now = Date.now();

      if (!skipCache && cached && now - cached.timestamp < cacheTime) {
        if (mountedRef.current) {
          setState({ data: cached.data, loading: false, error: null });
          currentOptions?.onSuccess?.(cached.data);
        }
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      if (mountedRef.current) {
        setState((prev) => ({ ...prev, loading: true, error: null }));
      }

      let lastError: FetchError | null = null;

      for (let attempt = 0; attempt <= retryCount; attempt++) {
        try {
          const url = new URL(endpoint, baseURL);
          if (currentOptions?.params) {
            Object.entries(currentOptions.params).map(([key, val]) =>
              url.searchParams.append(key, String(val)),
            );
          }

          const isFormData = currentOptions?.data instanceof FormData;
          const body = isFormData
            ? (currentOptions.data as FormData)
            : currentOptions?.data
              ? JSON.stringify(currentOptions.data)
              : currentOptions?.body;

          const response = await fetch(url.toString(), {
            ...currentOptions,
            body,
            signal: abortControllerRef.current.signal,
            headers: {
              Authorization: token?.token ? `Bearer ${token.token}` : "",
              ...(isFormData ? {} : { "Content-Type": "application/json" }),
              ...currentOptions?.headers,
            },
          });

          if (!response.ok) {
            const errorMessage = await response.text();
            const fetchError = Object.assign(new Error(errorMessage), {
              status: response.status,
              message: errorMessage,
            }) as FetchError;
            throw fetchError;
          }

          const contentType = response.headers.get("Content-Type");
          const result = (
            contentType?.includes("application/json")
              ? await response.json()
              : await response.text()
          ) as T;

          if (cacheTime > 0) {
            cacheInstance.set(cacheKey, {
              data: result,
              timestamp: Date.now(),
            });
          }

          if (mountedRef.current) {
            setState({ data: result, loading: false, error: null });
            currentOptions?.onSuccess?.(result);
          }
          return;
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") return;

          if ((err as FetchError).status !== undefined) {
            lastError = err as FetchError;
          } else {
            const message =
              err instanceof Error ? err.message : "An unknown error occurred";
            lastError = Object.assign(new Error(message), {
              status: 0,
              message,
            }) as FetchError;
          }

          if (attempt < retryCount) {
            await new Promise((resolve) =>
              setTimeout(resolve, retryDelay * (attempt + 1)),
            );
          }
        }
      }

      if (mountedRef.current && lastError) {
        setState({ data: null, loading: false, error: lastError });
        currentOptions?.onError?.(lastError);
      }
    },
    [dependencyKey, token?.token],
  );

  useEffect(() => {
    mountedRef.current = true;
    if (immediate) {
      fetchData();
    }
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, [fetchData, immediate]);

  return { ...state, refetch: fetchData };
}

useFetch.clearCache = (key?: string) => {
  if (key) cacheInstance.delete(key);
  else cacheInstance.clear();
};
