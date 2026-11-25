import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from "react";
import { motion } from "motion/react";
import { Markdown } from "../Markdown";
import { useFetch, useRealtimeEvent, useAccessibility, useCookie } from "@/hooks";
import {
  Alert,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
  Spinner,
  CopyButton,
  SidePanel,
  PanelList,
  PanelListItem,
} from "@/components/ui";
import { RestartIcon, StarsIcon, StudyIcon } from "@/components/icons";
import { getHttpErrorMessage } from "@/lib/utils";
import { panelSwitchTransition } from "@/lib/motion";
import { AI_AUTO_OVERVIEW_COOKIE_KEY, DEFAULT_AI_SETTINGS } from "@/components/settings/lib/ai";
import type { GenerationJob, Source } from "@/interfaces";
import { LearningMemoryModal } from "./LearningMemoryModal";

interface OverviewPanelProps {
  notebookId: string;
  readySourcesCount: number;
  sources?: Source[];
  selectedSourceIds?: string[];
  onReviewWithTutor?: (concepts: string[]) => void;
  onOpenToolJob?: (job: GenerationJob) => void;
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2 text-xs font-bold tracking-widest text-gray-500 uppercase select-none dark:text-gray-400">
      {children}
    </div>
  );
}

export function OverviewPanel({
  notebookId,
  readySourcesCount,
  sources = [],
  selectedSourceIds = [],
  onReviewWithTutor,
  onOpenToolJob,
}: OverviewPanelProps) {
  const { effectiveReducedMotion } = useAccessibility();
  const { value: autoGenerateOverview } = useCookie<boolean>(
    AI_AUTO_OVERVIEW_COOKIE_KEY,
    DEFAULT_AI_SETTINGS.autoGenerateOverview,
  );
  const [summaryGenerateError, setSummaryGenerateError] = useState<FetchError | null>(null);
  const [isSummaryGenerating, setIsSummaryGenerating] = useState(false);
  const [isAutoRegenerating, setIsAutoRegenerating] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);

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
  } = useFetch<{ summary: string; topics: string[] }>(
    `notebooks/${notebookId}/summary`,
    summaryOptions,
  );

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

    if (!autoGenerateOverview) {
      prevReadySourcesCountRef.current = currentCount;
      return;
    }

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
  }, [readySourcesCount, notebookId, regenerateSummary, autoGenerateOverview]);

  const notebookSummary = notebookSummaryData?.summary;
  const isLoading =
    isSummaryLoading || isSummaryRegenerating || isSummaryGenerating || isAutoRegenerating;

  const keyTopics = notebookSummaryData?.topics ?? [];

  return (
    <>
      <SidePanel
        title="Overview"
        actions={
          <>
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
                    ariaLabel={
                      isSummaryRegenerating ? "Regenerating summary" : "Regenerate summary"
                    }
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
            <Tooltip text="Learning memory" position="bottom">
              <IconButton
                icon={<StudyIcon />}
                variant="ghost"
                size="sm"
                onClick={() => setIsMemoryModalOpen(true)}
                ariaLabel="Learning memory"
              />
            </Tooltip>
          </>
        }
        contentClassName="space-y-6 px-4 py-4"
      >
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
          initial={effectiveReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={effectiveReducedMotion ? { duration: 0 } : panelSwitchTransition}
          className="max-w-none"
        >
          {isLoading ? (
            <Skeleton lines={6} className="w-full" />
          ) : summaryGenerateError ? (
            <div className="flex flex-col gap-3">
              <Alert variant="danger" message={getHttpErrorMessage(summaryGenerateError?.status)} />
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
            <div className="flex flex-col gap-1.5">
              <SectionLabel>Summary</SectionLabel>
              <div className="text-sm leading-relaxed select-text">
                <Markdown text={notebookSummary} />
              </div>
            </div>
          ) : (
            <div className="flex size-full flex-col items-center justify-start pt-24 text-center">
              <div className="mb-5 flex size-20 items-center justify-center rounded-xs border border-blue-300 bg-blue-50 shadow-sm dark:border-blue-700 dark:bg-blue-950/30">
                <div className="size-10 text-blue-500 dark:text-blue-400">
                  <StarsIcon />
                </div>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                No overview yet
              </h3>
              <p className="max-w-xs text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                Summarize all the information gathered from your sources into one clear overview.
              </p>
              {readySourcesCount > 0 && (
                <Button
                  className="mt-5"
                  onClick={() => regenerateSummary()}
                  disabled={isSummaryRegenerating}
                >
                  Generate summary
                </Button>
              )}
            </div>
          )}
        </motion.div>

        {!isLoading && !summaryGenerateError && keyTopics.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <SectionLabel>Key concepts</SectionLabel>
            <PanelList className="flex flex-wrap gap-1.5">
              {keyTopics.map((topic) => (
                <PanelListItem key={topic}>
                  <Chip size="sm" title={topic} className="select-text">
                    {topic}
                  </Chip>
                </PanelListItem>
              ))}
            </PanelList>
          </div>
        )}
      </SidePanel>

      <LearningMemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        notebookId={notebookId}
        sources={sources}
        selectedSourceIds={selectedSourceIds}
        onReviewWithTutor={onReviewWithTutor}
        onOpenToolJob={onOpenToolJob}
      />
    </>
  );
}
