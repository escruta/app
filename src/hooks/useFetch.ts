import { useState, useEffect, useCallback, useRef } from "react";
import useCookie from "./useCookie";
import { AUTH_TOKEN_KEY, BACKEND_BASE_URL } from "@/config";
import type { Token } from "@/interfaces";
import { cacheInstance, generateCacheKey } from "@/utils/lruCache";

interface UseFetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseFetchOptions<T> extends RequestConfig {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  cacheTime?: number;
  skipCache?: boolean;
  retry?: number;
  retryDelay?: number;
}

interface UseFetchReturn<T> extends UseFetchState<T> {
  refetch: (forcedUpdate?: boolean) => Promise<void>;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function useFetch<T = unknown>(
  endpoint: string,
  options?: UseFetchOptions<T>,
  immediate: boolean = true,
): UseFetchReturn<T> {
  const [token] = useCookie<Token>(AUTH_TOKEN_KEY);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const cacheTime = options?.cacheTime ?? 5 * 60 * 1000;
  const retry = options?.retry ?? 0;
  const retryDelay = options?.retryDelay ?? 1000;
  const baseURL = options?.baseURL ?? BACKEND_BASE_URL;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const cacheKey = generateCacheKey(endpoint, options);

  const [state, setState] = useState<UseFetchState<T>>(() => {
    const cached = cacheInstance.get<T>(cacheKey);
    const isValid =
      cached &&
      Date.now() - cached.timestamp < cacheTime &&
      !options?.skipCache &&
      cacheTime > 0;

    return {
      data: isValid ? cached.data : null,
      loading: immediate && !isValid,
      error: null,
    };
  });

  const fetchData = useCallback(
    async (forcedUpdate = false) => {
      const currentOptions = optionsRef.current;
      const skipCache =
        forcedUpdate || currentOptions?.skipCache || cacheTime <= 0;
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

      let lastError: Error | null = null;
      const maxAttempts = retry + 1;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const url = new URL(endpoint, baseURL);
          if (currentOptions?.params) {
            Object.entries(currentOptions.params).forEach(([key, value]) => {
              url.searchParams.append(key, value);
            });
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
              Authorization: `Bearer ${token?.token}`,
              ...(isFormData ? {} : { "Content-Type": "application/json" }),
              ...currentOptions?.headers,
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const contentType = response.headers.get("Content-Type");
          let data: T;

          if (contentType?.includes("application/json")) {
            data = await response.json();
          } else {
            data = (await response.text()) as unknown as T;
          }

          if (cacheTime > 0) {
            cacheInstance.set(cacheKey, { data, timestamp: now });
          }

          if (mountedRef.current) {
            setState({ data, loading: false, error: null });
            currentOptions?.onSuccess?.(data);
          }
          return;
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            return;
          }

          lastError =
            error instanceof Error
              ? error
              : new Error(`Unexpected error: ${error}`);

          if (attempt < maxAttempts - 1) {
            await sleep(retryDelay * (attempt + 1));
          }
        }
      }

      if (mountedRef.current && lastError) {
        setState({ data: null, loading: false, error: lastError });
        currentOptions?.onError?.(lastError);
      }
    },
    [endpoint, token, cacheTime, cacheKey, retry, retryDelay, baseURL],
  );

  useEffect(() => {
    mountedRef.current = true;

    if (immediate && !cacheInstance.has(cacheKey)) {
      fetchData(false);
    }

    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [immediate, cacheKey, fetchData]);

  return { ...state, refetch: fetchData };
}

useFetch.clearCache = (cacheKey?: string) => {
  if (cacheKey) {
    cacheInstance.delete(cacheKey);
  } else {
    cacheInstance.clear();
  }
};
