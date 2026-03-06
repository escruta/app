import { useState, useEffect, useCallback, useRef } from "react";
import { useFetch, useCookie } from "@/hooks";
import { AUTH_TOKEN_KEY } from "@/config";
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

export function useGenerationJob(
  notebookId: string,
  toolType: JobType,
  options: UseGenerationJobOptions = {},
) {
  const { pollingInterval = 2000, onCompleted, onFailed } = options;

  const [token] = useCookie<Token>(AUTH_TOKEN_KEY);
  const [job, setJob] = useState<GenerationJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const { data: existingJob, refetch: checkExistingJob } = useFetch<GenerationJob>(
    `/notebooks/${notebookId}/tools/jobs/latest/${toolType}`,
    { skipCache: true },
    true,
  );

  useEffect(() => {
    if (existingJob) {
      setJob(existingJob);
    }
  }, [existingJob]);

  const { refetch: fetchJobStatus } = useFetch<GenerationJob>(
    `/notebooks/${notebookId}/tools/jobs/${job?.id}`,
    {
      skipCache: true,
      onSuccess: (updatedJob) => {
        setJob(updatedJob);

        if (updatedJob.status === "COMPLETED") {
          stopPolling();
          onCompleted?.(updatedJob);
        } else if (updatedJob.status === "FAILED") {
          stopPolling();
          setError(updatedJob.errorMessage || "Generation failed");
          onFailed?.(updatedJob);
        }
      },
      onError: (err) => {
        console.error("Error polling job status:", err);
      },
    },
    false,
  );

  const pollJobStatus = useCallback(() => {
    if (!mountedRef.current || !job?.id) return;
    fetchJobStatus();
  }, [fetchJobStatus, job?.id]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollingRef.current = setInterval(() => {
      pollJobStatus();
    }, pollingInterval);
  }, [pollJobStatus, pollingInterval, stopPolling]);

  const { loading: isStarting, refetch: callStartGeneration } = useFetch<JobStartedResponse>(
    `/notebooks/${notebookId}/tools/generate`,
    {
      method: "POST",
      data: { type: toolType },
      onSuccess: (data) => {
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
      },
      onError: (err) => {
        setError(err.message || "Failed to start generation");
      },
    },
    false,
  );

  const startGeneration = useCallback(async () => {
    if (!token?.token) {
      setError("Not authenticated");
      return;
    }

    setError(null);
    callStartGeneration();
  }, [token?.token, callStartGeneration]);

  useEffect(() => {
    if (job && (job.status === "PENDING" || job.status === "PROCESSING") && !pollingRef.current) {
      startPolling();
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
    isStarting || (job !== null && (job.status === "PENDING" || job.status === "PROCESSING"));

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
