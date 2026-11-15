import { useState, useEffect, useCallback, useRef } from "react";
import { useFetch, useAuth, useCookie, useRealtimeEvent } from "@/hooks";
import { AUTH_TOKEN_KEY, BACKEND_BASE_URL } from "@/config";
import { appFetch } from "@/lib/http";
import type {
  GenerationJob,
  GenerationOptions,
  GenerationRequestPayload,
  JobStatus,
  JobType,
  Token,
} from "@/interfaces";
import { TOOL_DEFINITIONS, isLegacyToolTabRef } from "@/components/tools/toolConfig";

interface JobStartedResponse {
  jobId: string;
  message: string;
  job?: GenerationJob | null;
}

export interface ToolUpdatedEvent {
  notebookId?: string;
  jobId?: string;
  type?: JobType;
  title?: string;
  status?: JobStatus;
  options?: GenerationOptions | null;
  result?: string | null;
  errorMessage?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  completedAt?: string | null;
}

export interface ToolDeletedEvent {
  notebookId?: string;
  jobId?: string;
  type?: JobType;
}

async function callToolsApi<T>(
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

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("Content-Type");
  if (contentType?.includes("application/json")) {
    return (await response.json()) as T;
  }
  return (await response.text()) as T;
}

function mergeJobFromEvent(
  existing: GenerationJob | null,
  event: ToolUpdatedEvent,
  fallbackNotebookId: string,
): GenerationJob | null {
  if (!event.jobId) return existing;
  const type = event.type ?? existing?.type ?? "STUDY_GUIDE";
  return {
    id: event.jobId,
    notebookId: event.notebookId ?? existing?.notebookId ?? fallbackNotebookId,
    type,
    title: event.title || existing?.title || TOOL_DEFINITIONS[type].title,
    status: event.status ?? existing?.status ?? "PENDING",
    options: event.options !== undefined ? event.options : (existing?.options ?? null),
    result:
      event.result !== undefined && event.result !== ""
        ? event.result
        : event.status === "PENDING" || event.status === "PROCESSING"
          ? null
          : (existing?.result ?? null),
    errorMessage:
      event.errorMessage !== undefined && event.errorMessage !== ""
        ? event.errorMessage
        : event.status === "FAILED"
          ? "Generation failed"
          : null,
    createdAt: event.createdAt ?? existing?.createdAt ?? new Date().toISOString(),
    updatedAt: event.updatedAt ?? existing?.updatedAt ?? new Date().toISOString(),
    completedAt: event.completedAt ?? existing?.completedAt ?? null,
  };
}

export function useToolGenerations(notebookId: string) {
  const { token } = useAuth();
  const { value: cookieToken } = useCookie<Token>(AUTH_TOKEN_KEY);
  const bearerToken = cookieToken?.token ?? token ?? undefined;

  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [startingTypes, setStartingTypes] = useState<Partial<Record<JobType, boolean>>>({});
  const [error, setError] = useState<string | null>(null);

  const {
    data: fetchedJobs,
    loading: isFetching,
    refetch: refetchJobs,
  } = useFetch<GenerationJob[]>(
    `/notebooks/${notebookId}/tools/jobs`,
    {
      skipCache: true,
      params: { limit: "100", offset: "0" },
    },
    Boolean(notebookId),
  );

  useEffect(() => {
    if (fetchedJobs) {
      setJobs(fetchedJobs);
    }
  }, [fetchedJobs]);

  const upsertJob = useCallback((incoming: GenerationJob) => {
    setJobs((prev) => {
      const idx = prev.findIndex((item) => item.id === incoming.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...prev[idx],
          ...incoming,
          result: incoming.result ?? prev[idx].result,
          options: incoming.options ?? prev[idx].options,
        };
        return next;
      }
      return [incoming, ...prev];
    });
  }, []);

  const handleToolUpdated = useCallback(
    (event: ToolUpdatedEvent) => {
      if (event?.notebookId !== notebookId || !event.jobId) return;

      setJobs((prev) => {
        const existing = prev.find((j) => j.id === event.jobId) ?? null;
        const merged = mergeJobFromEvent(existing, event, notebookId);
        if (!merged) return prev;
        if (existing) {
          return prev.map((j) => (j.id === merged.id ? merged : j));
        }
        return [merged, ...prev];
      });
    },
    [notebookId],
  );

  const handleToolDeleted = useCallback(
    (event: ToolDeletedEvent) => {
      if (event?.notebookId !== notebookId || !event.jobId) return;
      setJobs((prev) => prev.filter((j) => j.id !== event.jobId));
    },
    [notebookId],
  );

  useRealtimeEvent("tool.updated", handleToolUpdated);
  useRealtimeEvent("tool.deleted", handleToolDeleted);

  const startGeneration = useCallback(
    async (payload: GenerationRequestPayload): Promise<GenerationJob | null> => {
      if (!bearerToken) {
        setError("Not authenticated");
        return null;
      }

      setError(null);
      setStartingTypes((prev) => ({ ...prev, [payload.type]: true }));

      try {
        const data = await callToolsApi<JobStartedResponse>(
          `/notebooks/${notebookId}/tools/generate`,
          bearerToken,
          {
            method: "POST",
            body: payload,
          },
        );

        const created: GenerationJob = data.job ?? {
          id: data.jobId,
          notebookId,
          type: payload.type,
          title: payload.title?.trim() || TOOL_DEFINITIONS[payload.type].title,
          status: "PENDING",
          options: payload.options ?? null,
          result: null,
          errorMessage: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: null,
        };

        upsertJob(created);
        return created;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to start generation";
        setError(message);
        throw err;
      } finally {
        setStartingTypes((prev) => ({ ...prev, [payload.type]: false }));
      }
    },
    [bearerToken, notebookId, upsertJob],
  );

  const retryGeneration = useCallback(
    async (jobId: string, options?: GenerationOptions | null): Promise<GenerationJob | null> => {
      if (!bearerToken) {
        setError("Not authenticated");
        return null;
      }

      setError(null);
      const updated = await callToolsApi<GenerationJob>(
        `/notebooks/${notebookId}/tools/jobs/${jobId}/retry`,
        bearerToken,
        {
          method: "POST",
          body: options ?? undefined,
        },
      );
      upsertJob(updated);
      return updated;
    },
    [bearerToken, notebookId, upsertJob],
  );

  const renameGeneration = useCallback(
    async (jobId: string, title: string): Promise<GenerationJob | null> => {
      if (!bearerToken) return null;
      const updated = await callToolsApi<GenerationJob>(
        `/notebooks/${notebookId}/tools/jobs/${jobId}`,
        bearerToken,
        {
          method: "PATCH",
          body: { title: title.trim() },
        },
      );
      upsertJob(updated);
      return updated;
    },
    [bearerToken, notebookId, upsertJob],
  );

  const deleteGeneration = useCallback(
    async (jobId: string): Promise<boolean> => {
      if (!bearerToken) return false;
      await callToolsApi<void>(`/notebooks/${notebookId}/tools/jobs/${jobId}`, bearerToken, {
        method: "DELETE",
      });
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      return true;
    },
    [bearerToken, notebookId],
  );

  return {
    jobs,
    isLoading: isFetching && jobs.length === 0,
    startingTypes,
    error,
    clearError: () => setError(null),
    startGeneration,
    retryGeneration,
    renameGeneration,
    deleteGeneration,
    refetch: () => refetchJobs(true, false),
  };
}

interface UseGenerationJobOptions {
  onCompleted?: (job: GenerationJob) => void;
  onFailed?: (job: GenerationJob) => void;
  onUpdated?: (job: GenerationJob) => void;
  onDeleted?: (jobId: string) => void;
}

export function useGenerationJob(
  notebookId: string,
  jobIdOrType: string,
  options: UseGenerationJobOptions = {},
) {
  const { token } = useAuth();
  const { value: cookieToken } = useCookie<Token>(AUTH_TOKEN_KEY);
  const bearerToken = cookieToken?.token ?? token ?? undefined;

  const callbacksRef = useRef(options);
  callbacksRef.current = options;

  const isLegacy = isLegacyToolTabRef(jobIdOrType);
  const endpoint = isLegacy
    ? `/notebooks/${notebookId}/tools/jobs/latest/${jobIdOrType}`
    : `/notebooks/${notebookId}/tools/jobs/${jobIdOrType}`;

  const [job, setJob] = useState<GenerationJob | null>(null);
  const [isDeleted, setIsDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const {
    data: fetchedJob,
    loading: isCheckingJob,
    refetch: refetchJob,
  } = useFetch<GenerationJob>(endpoint, { skipCache: true }, Boolean(notebookId && jobIdOrType));

  useEffect(() => {
    if (fetchedJob) {
      setJob(fetchedJob);
      setIsDeleted(false);
    }
  }, [fetchedJob]);

  const activeJobId = job?.id ?? (!isLegacy ? jobIdOrType : undefined);

  const handleToolUpdated = useCallback(
    (event: ToolUpdatedEvent) => {
      if (event?.notebookId !== notebookId || !event.jobId) return;
      if (activeJobId && event.jobId !== activeJobId) return;
      if (isLegacy && event.type && event.type !== jobIdOrType) return;

      setJob((prev) => {
        const merged = mergeJobFromEvent(prev, event, notebookId);
        if (merged) {
          callbacksRef.current.onUpdated?.(merged);
          if (merged.status === "COMPLETED") {
            callbacksRef.current.onCompleted?.(merged);
          } else if (merged.status === "FAILED") {
            setError(merged.errorMessage || "Generation failed");
            callbacksRef.current.onFailed?.(merged);
          }
        }
        return merged;
      });

      if (event.status === "COMPLETED" && !event.result) {
        refetchJob(true, false);
      }
    },
    [notebookId, activeJobId, isLegacy, jobIdOrType, refetchJob],
  );

  const handleToolDeleted = useCallback(
    (event: ToolDeletedEvent) => {
      if (event?.notebookId !== notebookId || !event.jobId) return;
      if (activeJobId && event.jobId === activeJobId) {
        setIsDeleted(true);
        callbacksRef.current.onDeleted?.(event.jobId);
      }
    },
    [notebookId, activeJobId],
  );

  useRealtimeEvent("tool.updated", handleToolUpdated);
  useRealtimeEvent("tool.deleted", handleToolDeleted);

  const retryGeneration = useCallback(
    async (overrideOptions?: GenerationOptions | null): Promise<GenerationJob | null> => {
      if (!bearerToken || !activeJobId) return null;
      setIsMutating(true);
      setError(null);
      try {
        const updated = await callToolsApi<GenerationJob>(
          `/notebooks/${notebookId}/tools/jobs/${activeJobId}/retry`,
          bearerToken,
          {
            method: "POST",
            body: overrideOptions ?? undefined,
          },
        );
        setJob(updated);
        callbacksRef.current.onUpdated?.(updated);
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to retry generation";
        setError(message);
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [bearerToken, notebookId, activeJobId],
  );

  const createNewGeneration = useCallback(
    async (payload: GenerationRequestPayload): Promise<GenerationJob | null> => {
      if (!bearerToken) return null;
      setIsMutating(true);
      setError(null);
      try {
        const started = await callToolsApi<JobStartedResponse>(
          `/notebooks/${notebookId}/tools/generate`,
          bearerToken,
          {
            method: "POST",
            body: payload,
          },
        );
        const created: GenerationJob = started.job ?? {
          id: started.jobId,
          notebookId,
          type: payload.type,
          title: payload.title?.trim() || TOOL_DEFINITIONS[payload.type].title,
          status: "PENDING",
          options: payload.options ?? null,
          result: null,
          errorMessage: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: null,
        };
        if (isLegacy) {
          setJob(created);
        }
        return created;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to start generation";
        setError(message);
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [bearerToken, notebookId, isLegacy],
  );

  const renameGeneration = useCallback(
    async (title: string): Promise<GenerationJob | null> => {
      if (!bearerToken || !activeJobId) return null;
      setIsMutating(true);
      try {
        const updated = await callToolsApi<GenerationJob>(
          `/notebooks/${notebookId}/tools/jobs/${activeJobId}`,
          bearerToken,
          {
            method: "PATCH",
            body: { title: title.trim() },
          },
        );
        setJob(updated);
        callbacksRef.current.onUpdated?.(updated);
        return updated;
      } finally {
        setIsMutating(false);
      }
    },
    [bearerToken, notebookId, activeJobId],
  );

  const deleteGeneration = useCallback(async (): Promise<boolean> => {
    if (!bearerToken || !activeJobId) return false;
    setIsMutating(true);
    try {
      await callToolsApi<void>(`/notebooks/${notebookId}/tools/jobs/${activeJobId}`, bearerToken, {
        method: "DELETE",
      });
      setIsDeleted(true);
      callbacksRef.current.onDeleted?.(activeJobId);
      return true;
    } finally {
      setIsMutating(false);
    }
  }, [bearerToken, notebookId, activeJobId]);

  const isLoading =
    isMutating || (job !== null && (job.status === "PENDING" || job.status === "PROCESSING"));
  const isCompleted = job?.status === "COMPLETED";
  const isFailed = job?.status === "FAILED";

  return {
    job,
    isDeleted,
    isChecking: isCheckingJob && !job,
    isLoading,
    isMutating,
    isCompleted,
    isFailed,
    error,
    result: job?.result ?? null,
    retryGeneration,
    createNewGeneration,
    renameGeneration,
    deleteGeneration,
    refetch: () => refetchJob(true, false),
  };
}
