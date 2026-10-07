import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Markdown } from "../Markdown";
import { useFetch, useRealtimeEvent } from "@/hooks";
import {
  Alert,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
  Spinner,
  CopyButton,
  Divider,
} from "@/components/ui";
import { NoteIcon, RestartIcon, StarsIcon } from "@/components/icons";
import { getHttpErrorMessage, getSourceIcon, timeAgo } from "@/lib/utils";
import type { Note, Source } from "@/interfaces";

interface OverviewPanelProps {
  notebookId: string;
  readySourcesCount: number;
  sources: Source[];
  notes: Note[];
  createdAt?: Date;
  onOpenSource: (source: Source) => void;
  onOpenNote: (note: Note) => void;
}

interface RecentItem {
  id: string;
  title: string;
  date: Date;
  icon: ReactNode;
  onOpen: () => void;
}

const MAX_RECENT_ITEMS = 4;

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
  sources,
  notes,
  onOpenSource,
  onOpenNote,
}: OverviewPanelProps) {
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

  const keyTopics = notebookSummaryData?.topics ?? [];
  const recentItems = useMemo<RecentItem[]>(() => {
    const items: RecentItem[] = [
      ...sources.map((source) => ({
        id: `source-${source.id}`,
        title: source.title,
        date: new Date(source.createdAt),
        icon: getSourceIcon(source.type),
        onOpen: () => onOpenSource(source),
      })),
      ...notes.map((note) => ({
        id: `note-${note.id}`,
        title: note.title,
        date: new Date(note.createdAt),
        icon: <NoteIcon />,
        onOpen: () => onOpenNote(note),
      })),
    ];

    return items.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, MAX_RECENT_ITEMS);
  }, [sources, notes, onOpenSource, onOpenNote]);

  const showActivity = recentItems.length > 0 && !isLoading && !summaryGenerateError;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
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
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4">
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
                <h3 className="text-foreground mb-2 text-lg font-semibold">No overview yet</h3>
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
        </AnimatePresence>

        {!isLoading && !summaryGenerateError && keyTopics.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <SectionLabel>Key concepts</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {keyTopics.map((topic) => (
                <Chip key={topic} size="sm" title={topic} className="select-text">
                  {topic}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {showActivity && (
          <div>
            <SectionLabel>Recently added</SectionLabel>
            <div className="flex flex-col">
              {recentItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onOpen}
                  title={item.title}
                  className="group flex w-full items-center gap-2 rounded-sm px-1 py-1.5 text-left transition-colors hover:bg-gray-100/70 dark:hover:bg-gray-800/50"
                >
                  <span className="flex size-3.5 shrink-0 items-center justify-center text-gray-400 transition-colors group-hover:text-blue-500 dark:text-gray-500 dark:group-hover:text-blue-400">
                    {item.icon}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-gray-600 transition-colors group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-gray-100">
                    {item.title}
                  </span>
                  <span className="shrink-0 text-[11px] text-gray-400 dark:text-gray-500">
                    {timeAgo(item.date)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
