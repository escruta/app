import { memo, useEffect, useMemo, useRef, useState, useTransition, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useFetch, useRealtimeEvent } from "@/hooks";
import type { Source } from "@/interfaces";
import {
  DeleteIcon,
  LinkIcon,
  CopyIcon,
  RestartIcon,
  StarsIcon,
  DotsVerticalIcon,
} from "@/components/icons";
import {
  Alert,
  Button,
  Card,
  IconButton,
  Modal,
  Divider,
  Spinner,
  Skeleton,
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  ViewerFrame,
} from "@/components/ui";
import { getYouTubeVideoId, getHttpErrorMessage } from "@/lib/utils";
import { Markdown } from "./Markdown";

const TARGET_CHUNK_SIZE = 2200;
const HARD_MAX_CHUNK_SIZE = 4500;
const INITIAL_VISIBLE_CHUNKS = 3;
const IDLE_CHUNK_STEP = 2;
const SCROLL_CHUNK_STEP = 6;
const MAX_CACHED_SOURCES = 60;

const chunksCache = new Map<string, { raw: string; chunks: string[] }>();

function getOrSplitChunks(sourceId: string, text: string): string[] {
  if (!text) return [];
  const cached = chunksCache.get(sourceId);
  if (cached && cached.raw === text) {
    return cached.chunks;
  }

  const chunks: string[] = [];
  let currentChunk = "";
  let inCodeBlock = false;
  let inMathBlock = false;

  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
      inCodeBlock = !inCodeBlock;
    }
    if (trimmed.startsWith("$$")) {
      inMathBlock = !inMathBlock;
    }

    currentChunk += line + "\n";

    if (!inCodeBlock && !inMathBlock) {
      const nextLineTrimmed = i + 1 < lines.length ? lines[i + 1].trim() : "";
      const inTable = trimmed.startsWith("|") || nextLineTrimmed.startsWith("|");

      if (
        (currentChunk.length >= TARGET_CHUNK_SIZE && trimmed === "" && !inTable) ||
        (currentChunk.length >= HARD_MAX_CHUNK_SIZE && !inTable)
      ) {
        chunks.push(currentChunk);
        currentChunk = "";
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  if (chunksCache.size >= MAX_CACHED_SOURCES) {
    const oldestKey = chunksCache.keys().next().value;
    if (oldestKey !== undefined) chunksCache.delete(oldestKey);
  }
  chunksCache.set(sourceId, { raw: text, chunks });

  return chunks;
}

interface SourceViewerProps {
  notebookId: string;
  source: Source;
  handleCloseSource: () => void;
  onSourceDelete: () => void;
  isActive?: boolean;
  className?: string;
}

export const SourceViewer = memo(function SourceViewer({
  notebookId,
  source,
  handleCloseSource,
  onSourceDelete,
  isActive = true,
  className,
}: SourceViewerProps) {
  const [summaryGenerateError, setSummaryGenerateError] = useState<FetchError | null>(null);
  const [isSummaryGenerating, setIsSummaryGenerating] = useState(false);

  const {
    data: fullSource,
    loading,
    error,
    refetch: refetchSource,
  } = useFetch<Source>(`notebooks/${notebookId}/sources/${source.id}`);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [_, startTransition] = useTransition();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const youtubeVideoId =
    source.type === "YouTube Video" ? getYouTubeVideoId(fullSource?.link || source.link) : null;

  const contentChunks = useMemo(() => {
    if (!fullSource?.content) return [];
    return getOrSplitChunks(source.id, fullSource.content);
  }, [source.id, fullSource?.content]);

  const [visibleChunks, setVisibleChunks] = useState<number>(INITIAL_VISIBLE_CHUNKS);
  const prevSourceIdRef = useRef<string>(source.id);

  useEffect(() => {
    if (prevSourceIdRef.current !== source.id) {
      prevSourceIdRef.current = source.id;
      setVisibleChunks(INITIAL_VISIBLE_CHUNKS);
    }
  }, [source.id]);

  useEffect(() => {
    if (!isActive || contentChunks.length === 0 || visibleChunks >= contentChunks.length) {
      return;
    }

    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    const advance = () => {
      startTransition(() => {
        setVisibleChunks((v) => Math.min(contentChunks.length, v + IDLE_CHUNK_STEP));
      });
    };

    if (typeof win.requestIdleCallback === "function") {
      const id = win.requestIdleCallback(advance, { timeout: 120 });
      return () => win.cancelIdleCallback?.(id);
    }

    const timer = window.setTimeout(advance, 40);
    return () => window.clearTimeout(timer);
  }, [isActive, contentChunks.length, visibleChunks]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = scrollContainerRef.current;
    if (!isActive || !sentinel || !root || visibleChunks >= contentChunks.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          startTransition(() => {
            setVisibleChunks((v) => Math.min(contentChunks.length, v + SCROLL_CHUNK_STEP));
          });
        }
      },
      {
        root,
        rootMargin: "1600px 0px",
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isActive, contentChunks.length, visibleChunks]);

  const {
    loading: deletingSource,
    error: deleteError,
    refetch: deleteSource,
  } = useFetch<Source>(
    `notebooks/${notebookId}/sources/${source.id}`,
    {
      method: "DELETE",
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        onSourceDelete();
        handleCloseSource();
      },
      onError: (error) => {
        console.error("Error deleting source:", error.message);
      },
    },
    false,
  );

  const {
    data: sourceSummaryData,
    loading: isSummaryLoading,
    refetch: refetchSummary,
  } = useFetch<{ summary: string }>(
    `notebooks/${notebookId}/sources/${source.id}/summary`,
    {
      method: "GET",
      onError: (error) => {
        console.error("Error fetching source summary:", error.message);
      },
    },
    false,
  );

  const sourceSummary = sourceSummaryData?.summary;

  const handleSourceUpdated = useCallback(
    (event: { notebookId?: string; sourceId?: string; status?: string }) => {
      if (event?.sourceId !== source.id) return;
      setIsSummaryGenerating(false);
      setSummaryGenerateError(null);
      useFetch.clearCache(`notebooks/${notebookId}/sources/${source.id}/summary`);
      refetchSummary(true);
      refetchSource(true);
    },
    [source.id, notebookId, refetchSummary, refetchSource],
  );

  useRealtimeEvent("source.updated", handleSourceUpdated);

  const { loading: isRegeneratingSummary, refetch: regenerateSummary } = useFetch<{
    summary: string;
  }>(
    `notebooks/${notebookId}/sources/${source.id}/summary`,
    {
      method: "POST",
      onSuccess: () => {
        setSummaryGenerateError(null);
        setIsSummaryGenerating(true);
        useFetch.clearCache(`notebooks/${notebookId}/sources/${source.id}/summary`);
      },
      onError: (error) => {
        console.error("Error regenerating source summary:", error.message);
        setIsSummaryGenerating(false);
        useFetch.clearCache(`notebooks/${notebookId}/sources/${source.id}/summary`);
        refetchSummary(true);
        setSummaryGenerateError(error);
      },
    },
    false,
  );

  const { loading: isDeletingSummary, refetch: deleteSummary } = useFetch<void>(
    `notebooks/${notebookId}/sources/${source.id}/summary`,
    {
      method: "DELETE",
      onSuccess: () => {
        refetchSummary(true);
      },
      onError: (error) => {
        console.error("Error deleting source summary:", error.message);
      },
    },
    false,
  );

  useEffect(() => {
    refetchSummary(true);
  }, [source.id]);

  return (
    <>
      <ViewerFrame className={className}>
        <div className="flex h-15 shrink-0 items-center px-4 pt-4 pb-3">
          <h2 className="flex min-w-0 flex-1 items-baseline gap-1.5 select-text">
            <span className="shrink-0 text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
              Source /{" "}
            </span>
            <span className="truncate text-lg font-semibold select-text">
              {fullSource?.title || source.title || "Viewing source"}
            </span>
          </h2>
          <div className="flex items-center gap-1">
            <Menu>
              <MenuTrigger>
                <IconButton
                  icon={<DotsVerticalIcon />}
                  variant="ghost"
                  size="sm"
                  ariaLabel="More options"
                />
              </MenuTrigger>
              <MenuContent>
                <MenuItem
                  icon={<CopyIcon />}
                  label={source.type === "YouTube Video" ? "Copy video URL" : "Copy source content"}
                  onClick={() => {
                    const textToCopy =
                      source.type === "YouTube Video"
                        ? fullSource?.link || source.link
                        : fullSource?.content || "";
                    navigator.clipboard.writeText(textToCopy);
                  }}
                />
                {source.type === "Website" && (
                  <MenuItem
                    icon={<LinkIcon />}
                    label="Open source"
                    onClick={() => {
                      window.open(fullSource?.link, "_blank", "noopener noreferrer");
                    }}
                  />
                )}
                <MenuItem
                  icon={<DeleteIcon />}
                  label="Delete source"
                  variant="danger"
                  onClick={() => setIsDeleteModalOpen(true)}
                />
              </MenuContent>
            </Menu>
          </div>
        </div>
        <Divider className="my-0" />
        {loading && (
          <div className="flex size-full items-center justify-center">
            <Spinner />
          </div>
        )}
        {error && (
          <div className="px-6 text-sm text-red-500">
            We couldn't load this source: {error.message}
          </div>
        )}
        {fullSource && !loading && !error && (
          <div ref={scrollContainerRef} className="w-full flex-1 overflow-y-auto">
            <div className="mx-auto flex w-full max-w-3xl flex-col">
              <div className="px-6 pt-4">
                <Card className="border-gray-200 bg-gray-50 shadow-sm ring-0 dark:border-gray-700 dark:bg-gray-800/60">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      Summary of this source
                    </h3>
                    <div className="flex gap-2">
                      {sourceSummary && (
                        <Menu>
                          <MenuTrigger>
                            <IconButton
                              icon={<DotsVerticalIcon />}
                              variant="ghost"
                              size="sm"
                              aria-label="More options"
                            />
                          </MenuTrigger>
                          <MenuContent>
                            <MenuItem
                              icon={<CopyIcon />}
                              label="Copy summary"
                              onClick={() => navigator.clipboard.writeText(sourceSummary)}
                              disabled={
                                isSummaryLoading || isRegeneratingSummary || isSummaryGenerating
                              }
                            />
                            <MenuItem
                              icon={
                                isRegeneratingSummary || isSummaryGenerating ? (
                                  <Spinner size={16} />
                                ) : (
                                  <RestartIcon />
                                )
                              }
                              label="Regenerate summary"
                              onClick={regenerateSummary}
                              disabled={isRegeneratingSummary || isSummaryGenerating}
                            />
                            <MenuItem
                              icon={<DeleteIcon />}
                              label="Delete summary"
                              variant="danger"
                              onClick={deleteSummary}
                              disabled={
                                isDeletingSummary || isSummaryLoading || isRegeneratingSummary
                              }
                            />
                          </MenuContent>
                        </Menu>
                      )}
                    </div>
                  </div>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={
                        isSummaryLoading || isRegeneratingSummary || isSummaryGenerating
                          ? "loading"
                          : summaryGenerateError
                            ? "generateError"
                            : sourceSummary?.trim()
                              ? "summary"
                              : "empty"
                      }
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15, ease: "easeInOut" }}
                    >
                      {isSummaryLoading || isRegeneratingSummary || isSummaryGenerating ? (
                        <Skeleton lines={6} />
                      ) : summaryGenerateError ? (
                        <div className="flex flex-col gap-3">
                          <Alert
                            message={getHttpErrorMessage(summaryGenerateError.status)}
                            variant="danger"
                          />
                          <Button
                            onClick={regenerateSummary}
                            disabled={isRegeneratingSummary || isSummaryGenerating}
                            variant="ghost"
                            size="sm"
                            icon={<RestartIcon className="h-4 w-4" />}
                          >
                            Regenerate summary
                          </Button>
                        </div>
                      ) : sourceSummary?.trim() ? (
                        <div className="max-w-none text-base leading-relaxed font-medium text-gray-900 select-text dark:text-gray-100">
                          <Markdown
                            text={sourceSummary}
                            baseUrl={fullSource?.link || source.link}
                          />
                        </div>
                      ) : (
                        <Button onClick={regenerateSummary} icon={<StarsIcon />}>
                          Generate summary
                        </Button>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </Card>
              </div>
              <div className="flex-1">
                {source.type === "YouTube Video" && youtubeVideoId ? (
                  <div className="h-auto min-h-[80%] w-full px-6 py-8">
                    <div className="mb-6 aspect-video w-full">
                      <iframe
                        src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                        title={fullSource.title || "YouTube Video"}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="size-full"
                      />
                    </div>
                    {fullSource.content && (
                      <div className="overflow-x-hidden wrap-break-word select-text">
                        <div className="max-w-none leading-relaxed">
                          {contentChunks.length > 0 ? (
                            <>
                              {contentChunks.slice(0, visibleChunks).map((chunk, index) => (
                                <div key={index} className="source-chunk">
                                  <Markdown
                                    text={chunk}
                                    baseUrl={fullSource?.link || source.link}
                                  />
                                </div>
                              ))}
                              {visibleChunks < contentChunks.length && (
                                <div ref={sentinelRef} className="h-4 w-full" aria-hidden="true" />
                              )}
                            </>
                          ) : (
                            <Skeleton
                              lines={10}
                              className="[&>div]:bg-gray-200! dark:[&>div]:bg-gray-800!"
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-auto min-h-[80%] w-full overflow-x-hidden px-6 py-8 wrap-break-word select-text">
                    <div className="max-w-none leading-relaxed">
                      {contentChunks.length > 0 ? (
                        <>
                          {contentChunks.slice(0, visibleChunks).map((chunk, index) => (
                            <div key={index} className="source-chunk">
                              <Markdown text={chunk} baseUrl={fullSource?.link || source.link} />
                            </div>
                          ))}
                          {visibleChunks < contentChunks.length && (
                            <div ref={sentinelRef} className="h-4 w-full" aria-hidden="true" />
                          )}
                        </>
                      ) : (
                        <Skeleton
                          lines={10}
                          className="[&>div]:bg-gray-200! dark:[&>div]:bg-gray-800!"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </ViewerFrame>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete source"
        actions={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={deletingSource}
              onClick={async () => {
                await deleteSource();
              }}
              icon={deletingSource ? <Spinner /> : <DeleteIcon />}
            >
              {deletingSource ? "Deleting" : "Delete"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This will permanently delete the source, and you won't be able to undo it.
          </p>
          {deleteError && (
            <div className="text-sm text-red-500">
              We couldn't delete this source: {deleteError.message}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
});
