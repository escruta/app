import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Markdown } from "../Markdown";
import { useFetch, useRealtimeEvent } from "@/hooks";
import {
  Alert,
  Button,
  IconButton,
  Tooltip,
  Skeleton,
  Spinner,
  CopyButton,
  Divider,
} from "@/components/ui";
import { RestartIcon } from "@/components/icons";
import { getHttpErrorMessage } from "@/lib/utils";

interface OverviewPanelProps {
  notebookId: string;
  readySourcesCount: number;
}

export function OverviewPanel({ notebookId, readySourcesCount }: OverviewPanelProps) {
  const [summaryGenerateError, setSummaryGenerateError] = useState<FetchError | null>(null);
  const [isSummaryGenerating, setIsSummaryGenerating] = useState(false);
  const [isAutoRegenerating, setIsAutoRegenerating] = useState(false);

  const summaryOptions = useMemo(
    () => ({
      method: "GET" as const,
      onError: (error: FetchError) => {
        console.error("Error fetching summary:", error.message);
      },
    }),
    [],
  );

  const {
    data: notebookSummaryData,
    loading: isSummaryLoading,
    refetch: refetchSummary,
  } = useFetch<{ summary: string }>(`notebooks/${notebookId}/summary`, summaryOptions);

  const handleSummaryUpdated = useCallback(
    (event: { notebookId?: string; summary?: string }) => {
      if (event?.notebookId !== notebookId) return;
      setIsSummaryGenerating(false);
      setSummaryGenerateError(null);
      useFetch.clearCache(`notebooks/${notebookId}/summary`);
      refetchSummary(true);
    },
    [notebookId, refetchSummary],
  );

  useRealtimeEvent("summary.updated", handleSummaryUpdated);

  const regenerateSummaryOptions = useMemo(
    () => ({
      method: "POST" as const,
      onSuccess: () => {
        setSummaryGenerateError(null);
        setIsSummaryGenerating(true);
        useFetch.clearCache(`notebooks/${notebookId}/summary`);
      },
      onError: (error: FetchError) => {
        console.error("Error generating summary:", error.message);
        setIsSummaryGenerating(false);
        useFetch.clearCache(`notebooks/${notebookId}/summary`);
        refetchSummary(true);
        setSummaryGenerateError(error);
      },
    }),
    [refetchSummary, notebookId],
  );

  const { loading: isSummaryRegenerating, refetch: regenerateSummary } = useFetch<{
    summary: string;
  }>(`notebooks/${notebookId}/summary`, regenerateSummaryOptions, false);

  const prevReadySourcesCountRef = useRef<number>(readySourcesCount);

  useEffect(() => {
    const prevCount = prevReadySourcesCountRef.current;
    const currentCount = readySourcesCount;

    if (currentCount > 0 && prevCount !== currentCount) {
      setIsAutoRegenerating(true);
      setSummaryGenerateError(null);

      const timer = setTimeout(async () => {
        try {
          await regenerateSummary(true);
        } catch (error) {
          console.error("Error during auto-regeneration:", error);
        } finally {
          setIsAutoRegenerating(false);
        }
      }, 1000);

      return () => {
        clearTimeout(timer);
        setIsAutoRegenerating(false);
      };
    }

    prevReadySourcesCountRef.current = currentCount;
  }, [readySourcesCount, notebookId, regenerateSummary]);

  const notebookSummary = notebookSummaryData?.summary;
  const isLoading =
    isSummaryLoading || isSummaryRegenerating || isSummaryGenerating || isAutoRegenerating;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="z-10 shrink-0">
        <div className="flex h-15 items-center px-4 pt-4 pb-3">
          <h2 className="font-sans text-lg font-semibold">Overview</h2>
          <div className="flex flex-1 items-center justify-end gap-2">
            {notebookSummary && !isLoading && (
              <>
                <Tooltip text="Copy summary" position="bottom">
                  <CopyButton
                    textToCopy={notebookSummary}
                    tooltipText="Copy summary"
                    disabled={isLoading}
                  />
                </Tooltip>
                <Tooltip
                  text={isSummaryRegenerating ? "Regenerating summary" : "Regenerate summary"}
                  position="bottom"
                >
                  <IconButton
                    icon={isSummaryRegenerating ? <Spinner /> : <RestartIcon />}
                    variant="ghost"
                    size="sm"
                    onClick={() => regenerateSummary()}
                    disabled={isSummaryRegenerating}
                  />
                </Tooltip>
              </>
            )}
            {isAutoRegenerating && (
              <Tooltip text="Auto-regenerating..." position="bottom">
                <div className="flex h-8 w-8 items-center justify-center">
                  <Spinner />
                </div>
              </Tooltip>
            )}
          </div>
        </div>
        <Divider className="my-0" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={
              isLoading
                ? "loading"
                : summaryGenerateError
                  ? "error"
                  : notebookSummary?.trim()
                    ? "summary"
                    : "empty"
            }
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            className="max-w-none"
          >
            {isLoading ? (
              <Skeleton lines={6} className="w-full" />
            ) : summaryGenerateError ? (
              <div className="flex flex-col gap-3">
                <Alert
                  variant="danger"
                  message={getHttpErrorMessage(summaryGenerateError?.status)}
                />
                <Button
                  onClick={() => regenerateSummary()}
                  disabled={isSummaryRegenerating}
                  variant="ghost"
                  size="sm"
                  icon={<RestartIcon className="h-4 w-4" />}
                >
                  Regenerate summary
                </Button>
              </div>
            ) : notebookSummary?.trim() ? (
              <div className="text-sm leading-relaxed select-text">
                <Markdown text={notebookSummary} />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  Summarize all the information gathered from your sources into one clear overview.
                </p>
                <Button
                  onClick={() => regenerateSummary()}
                  disabled={isSummaryRegenerating || readySourcesCount === 0}
                >
                  {readySourcesCount === 0 ? "Waiting for sources..." : "Generate summary"}
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
