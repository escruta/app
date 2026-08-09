import { useState, useEffect, useCallback } from "react";
import { useFetch, useAuth, useRealtimeEvent } from "@/hooks";
import type { GenerationJob, JobStatus, JobType } from "@/interfaces";

interface UseGenerationJobOptions {
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
  const { onCompleted, onFailed } = options;

  const { token } = useAuth();
  const [job, setJob] = useState<GenerationJob | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          onCompleted?.(updatedJob);
        } else if (updatedJob.status === "FAILED") {
          setError(updatedJob.errorMessage || "Generation failed");
          onFailed?.(updatedJob);
        }
      },
      onError: (err) => {
        console.error("Error fetching job status:", err);
      },
    },
    false,
  );

  const handleToolUpdated = useCallback(
    (event: {
      notebookId?: string;
      jobId?: string;
      type?: string;
      status?: string;
      result?: string | null;
      errorMessage?: string | null;
      createdAt?: string | null;
      completedAt?: string | null;
    }) => {
      if (event?.notebookId !== notebookId) return;
      if (event?.type && event.type !== toolType) return;
      if (event?.jobId && job?.id && event.jobId !== job.id) return;

      if (job?.id) {
        fetchJobStatus();
        return;
      }

      if (!event.jobId) return;

      const updatedJob: GenerationJob = {
        id: event.jobId,
        notebookId,
        type: toolType,
        status: (event.status as JobStatus) ?? "PENDING",
        result: event.result ?? null,
        errorMessage: event.errorMessage ?? null,
        createdAt: event.createdAt ?? new Date().toISOString(),
        completedAt: event.completedAt ?? null,
      };

      setJob(updatedJob);

      if (updatedJob.status === "COMPLETED") {
        onCompleted?.(updatedJob);
      } else if (updatedJob.status === "FAILED") {
        setError(updatedJob.errorMessage || "Generation failed");
        onFailed?.(updatedJob);
      }
    },
    [notebookId, toolType, job?.id, fetchJobStatus, onCompleted, onFailed],
  );

  useRealtimeEvent("tool.updated", handleToolUpdated);

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
    if (!token) {
      setError("Not authenticated");
      return;
    }

    setError(null);
    callStartGeneration();
  }, [token, callStartGeneration]);

  const isLoading =
    isStarting || (job !== null && (job.status === "PENDING" || job.status === "PROCESSING"));

  const isCompleted = job?.status === "COMPLETED";
  const isFailed = job?.status === "FAILED";

  const reset = useCallback(() => {
    setJob(null);
    setError(null);
  }, []);

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
