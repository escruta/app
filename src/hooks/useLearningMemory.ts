import { useCallback, useEffect, useMemo, useState } from "react";
import { AUTH_TOKEN_KEY, BACKEND_BASE_URL } from "@/config";
import type {
  LearningMemory,
  LearningMemoryUpdatePayload,
  LearningSignalPayload,
  Token,
} from "@/interfaces";
import { appFetch } from "@/lib/http";
import { useCookie } from "./useCookie";
import { useFetch } from "./useFetch";
import { useRealtimeEvent } from "./useRealtimeEvent";

async function callLearningMemoryApi<T>(
  endpoint: string,
  authToken: string | undefined,
  init: { method: string; body?: unknown },
): Promise<T> {
  const url = new URL(endpoint, BACKEND_BASE_URL);
  const response = await appFetch(url.toString(), {
    method: init.method,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    headers: {
      Authorization: authToken ? `Bearer ${authToken}` : "",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const responseText = await response.text();
    let message = responseText || `Request failed (${response.status})`;
    try {
      const parsed = JSON.parse(responseText) as { message?: string; detail?: string };
      message = parsed.message ?? parsed.detail ?? message;
    } catch {}
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export function useLearningSignal(notebookId?: string) {
  const { value: token } = useCookie<Token>(AUTH_TOKEN_KEY);

  const recordSignal = useCallback(
    async (payload: LearningSignalPayload): Promise<LearningMemory | null> => {
      if (!notebookId || !payload.topic.trim()) return null;
      try {
        const updated = await callLearningMemoryApi<LearningMemory>(
          `notebooks/${notebookId}/learning-memory/signals`,
          token?.token ?? undefined,
          { method: "POST", body: payload },
        );
        useFetch.clearCache(`notebooks/${notebookId}/learning-memory`);
        return updated;
      } catch (err) {
        console.error("Failed to record learning signal:", err);
        return null;
      }
    },
    [notebookId, token?.token],
  );

  return { recordSignal };
}

export function useLearningMemory(notebookId: string) {
  const { value: token } = useCookie<Token>(AUTH_TOKEN_KEY);
  const endpoint = `notebooks/${notebookId}/learning-memory`;
  const [memory, setMemory] = useState<LearningMemory | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const fetchOptions = useMemo(
    () => ({
      method: "GET" as const,
      onSuccess: (data: LearningMemory) => {
        setMemory(data);
      },
      onError: (err: FetchError) => {
        console.error("Failed to load learning memory:", err.message);
      },
    }),
    [],
  );

  const { data, loading, refetch } = useFetch<LearningMemory>(endpoint, fetchOptions);

  useEffect(() => {
    if (data) {
      setMemory(data);
    }
  }, [data]);

  const handleRealtimeUpdate = useCallback(
    (event: LearningMemory) => {
      if (event?.notebookId !== notebookId) return;
      setMemory(event);
      useFetch.clearCache(endpoint);
    },
    [notebookId, endpoint],
  );

  useRealtimeEvent("learningMemory.updated", handleRealtimeUpdate);

  const updateMemory = useCallback(
    async (payload: LearningMemoryUpdatePayload): Promise<LearningMemory | null> => {
      setIsSaving(true);
      setMutationError(null);
      try {
        const updated = await callLearningMemoryApi<LearningMemory>(
          endpoint,
          token?.token ?? undefined,
          {
            method: "PUT",
            body: payload,
          },
        );
        setMemory(updated);
        useFetch.clearCache(endpoint);
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not update learning memory";
        setMutationError(message);
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [endpoint, token?.token],
  );

  const resetMemory = useCallback(async (): Promise<LearningMemory | null> => {
    setIsSaving(true);
    setMutationError(null);
    try {
      const cleared = await callLearningMemoryApi<LearningMemory>(
        endpoint,
        token?.token ?? undefined,
        {
          method: "DELETE",
        },
      );
      setMemory(cleared);
      useFetch.clearCache(endpoint);
      return cleared;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not reset learning memory";
      setMutationError(message);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [endpoint, token?.token]);

  return {
    memory,
    isLoading: loading && !memory,
    isSaving,
    error: mutationError,
    clearError: () => setMutationError(null),
    refetch,
    updateMemory,
    resetMemory,
  };
}
