import { useState, useEffect, useCallback, useRef } from "react";
import { useFetch, useCookie } from "@/hooks";
import { AUTH_TOKEN_KEY, BACKEND_BASE_URL } from "@/config";
import type { GenerationJob, JobType, Token } from "@/interfaces";

interface UseGenerationJobOptions {
  pollingInterval?: number;
  onCompleted?: (job: GenerationJob) => void;
  onFailed?: (job: GenerationJob) => void;
}

interface JobStartedResponse {
  jobId: string;
  message: string;
}

export default function useGenerationJob(
  notebookId: string,
  toolType: JobType,
  options: UseGenerationJobOptions = {},
) {
  const { pollingInterval = 2000, onCompleted, onFailed } = options;

  const [token] = useCookie<Token>(AUTH_TOKEN_KEY);
  const [job, setJob] = useState<GenerationJob | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const { data: existingJob, refetch: checkExistingJob } =
    useFetch<GenerationJob>(
      `/notebooks/${notebookId}/tools/jobs/latest/${toolType}`,
      { skipCache: true },
      true,
    );

  useEffect(() => {
    if (existingJob) {
      setJob(existingJob);
    }
  }, [existingJob]);

  const pollJobStatus = useCallback(
    async (jobId: string) => {
      if (!mountedRef.current || !token?.token) return;

      try {
        const response = await fetch(
          `${BACKEND_BASE_URL}/notebooks/${notebookId}/tools/jobs/${jobId}`,
          {
            headers: {
              Authorization: `Bearer ${token.token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch job status");
        }

        const updatedJob: GenerationJob = await response.json();

        if (!mountedRef.current) return;

        setJob(updatedJob);

        if (updatedJob.status === "COMPLETED") {
          stopPolling();
          onCompleted?.(updatedJob);
        } else if (updatedJob.status === "FAILED") {
          stopPolling();
          setError(updatedJob.errorMessage || "Generation failed");
          onFailed?.(updatedJob);
        }
      } catch (err) {
        console.error("Error polling job status:", err);
      }
    },
    [notebookId, token?.token, onCompleted, onFailed],
  );

  const startPolling = useCallback(
    (jobId: string) => {
      stopPolling();
      pollingRef.current = setInterval(() => {
        pollJobStatus(jobId);
      }, pollingInterval);
    },
    [pollJobStatus, pollingInterval],
  );

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startGeneration = useCallback(async () => {
    if (!token?.token) {
      setError("Not authenticated");
      return;
    }

    setIsStarting(true);
    setError(null);

    try {
      const response = await fetch(
        `${BACKEND_BASE_URL}/notebooks/${notebookId}/tools/generate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ type: toolType }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to start generation");
      }

      const data: JobStartedResponse = await response.json();

      const initialJob: GenerationJob = {
        id: data.jobId,
        notebookId,
        type: toolType,
        status: "PENDING",
        result: null,
        errorMessage: null,
        createdAt: new Date().toISOString(),
        completedAt: null,
      };

      setJob(initialJob);
      startPolling(data.jobId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setIsStarting(false);
    }
  }, [notebookId, toolType, token?.token, startPolling]);

  useEffect(() => {
    if (
      job &&
      (job.status === "PENDING" || job.status === "PROCESSING") &&
      !pollingRef.current
    ) {
      startPolling(job.id);
    }

    return () => {
      stopPolling();
    };
  }, [job?.id, job?.status, startPolling, stopPolling]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [stopPolling]);

  const isLoading =
    isStarting ||
    (job !== null && (job.status === "PENDING" || job.status === "PROCESSING"));

  const isCompleted = job?.status === "COMPLETED";
  const isFailed = job?.status === "FAILED";

  const reset = useCallback(() => {
    stopPolling();
    setJob(null);
    setError(null);
  }, [stopPolling]);

  return {
    job,
    isLoading,
    isStarting,
    isCompleted,
    isFailed,
    error,
    result: job?.result ?? null,
    startGeneration,
    reset,
    refetch: checkExistingJob,
  };
}
