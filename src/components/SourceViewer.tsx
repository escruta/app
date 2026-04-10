import { useEffect, useState, useTransition, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useFetch, useToast } from "@/hooks";
import type { Source } from "@/interfaces";
import {
  CloseIcon,
  DeleteIcon,
  LinkIcon,
  CopyIcon,
  RestartIcon,
  ExpandIcon,
  CompressIcon,
  StarsIcon,
  DotsVerticalIcon,
} from "@/components/icons";
import {
  Alert,
  Button,
  Card,
  IconButton,
  Modal,
  Tooltip,
  Divider,
  Spinner,
  Skeleton,
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
} from "@/components/ui";
import { cn, getYouTubeVideoId, getHttpErrorMessage } from "@/lib/utils";

const Markdown = lazy(() => import("./Markdown").then((module) => ({ default: module.Markdown })));

interface SourceViewerProps {
  notebookId: string;
  source: Source;
  handleCloseSource: () => void;
  onSourceDelete: () => void;
  className?: string;
}

export function SourceViewer({
  notebookId,
  source,
  handleCloseSource,
  onSourceDelete,
  className,
}: SourceViewerProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [summaryGenerateError, setSummaryGenerateError] = useState<FetchError | null>(null);
  const {
    data: fullSource,
    loading,
    error,
  } = useFetch<Source>(`notebooks/${notebookId}/sources/${source.id}`);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [currentSourceId, setCurrentSourceId] = useState<string>(source.id);
  const [contentChunks, setContentChunks] = useState<string[]>([]);
  const [visibleChunks, setVisibleChunks] = useState<number>(0);
  const [_, startTransition] = useTransition();

  const { showToast } = useToast();

  const youtubeVideoId =
    source.type === "YouTube Video" ? getYouTubeVideoId(fullSource?.link || source.link) : null;

  useEffect(() => {
    if (source.id !== currentSourceId) {
      setCurrentSourceId(source.id);
      setContentChunks([]);
      setVisibleChunks(0);
    }
  }, [source.id, currentSourceId]);

  useEffect(() => {
    if (fullSource?.content !== undefined) {
      const text = fullSource.content || "";
      const chunks: string[] = [];
      let currentChunk = "";
      let inCodeBlock = false;
      let inMathBlock = false;

      const lines = text.split("\n");
      for (const line of lines) {
        if (line.trim().startsWith("```")) {
          inCodeBlock = !inCodeBlock;
        }
        if (line.trim().startsWith("$$")) {
          inMathBlock = !inMathBlock;
        }
        currentChunk += line + "\n";

        if (!inCodeBlock && !inMathBlock && currentChunk.length > 4000 && line.trim() === "") {
          chunks.push(currentChunk);
          currentChunk = "";
        }
      }
      if (currentChunk) chunks.push(currentChunk);

      startTransition(() => {
        setContentChunks(chunks);
        setVisibleChunks(1);
      });
    }
  }, [fullSource?.content]);

  useEffect(() => {
    if (contentChunks.length > 0 && visibleChunks < contentChunks.length) {
      const timer = setTimeout(() => {
        startTransition(() => {
          setVisibleChunks((v) => v + 1);
        });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [contentChunks, visibleChunks]);

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

  const { loading: isRegeneratingSummary, refetch: regenerateSummary } = useFetch<{
    summary: string;
  }>(
    `notebooks/${notebookId}/sources/${source.id}/summary`,
    {
      method: "POST",
      onSuccess: () => {
        setSummaryGenerateError(null);
        refetchSummary(true);
      },
      onError: (error) => {
        console.error("Error regenerating source summary:", error.message);
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
      <Card
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        className={cn("flex flex-col overflow-hidden p-0", className)}
      >
        <div className="shrink-0 bg-white dark:bg-gray-900">
          <div className="flex shrink-0 items-center justify-between gap-3 p-4">
            <h2 className="flex min-w-0 flex-1 items-baseline gap-1.5 select-text">
              <span className="shrink-0 text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
                Source /{" "}
              </span>
              <span className="truncate font-semibold">
                {fullSource?.title || source.title || "Source viewer"}
              </span>
            </h2>
            <div className="flex gap-2">
              {!isExpanded ? (
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
                      label={
                        source.type === "YouTube Video" ? "Copy video URL" : "Copy source content"
                      }
                      onClick={() => {
                        const textToCopy =
                          source.type === "YouTube Video"
                            ? fullSource?.link || source.link
                            : fullSource?.content || "";
                        const message =
                          source.type === "YouTube Video"
                            ? "Video URL copied to clipboard"
                            : "Source content copied to clipboard";
                        navigator.clipboard.writeText(textToCopy);
                        showToast(message, "success", { duration: 1500 });
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
              ) : (
                <>
                  <Tooltip
                    text={
                      source.type === "YouTube Video" ? "Copy video URL" : "Copy source content"
                    }
                    position="bottom"
                  >
                    <IconButton
                      icon={<CopyIcon />}
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const textToCopy =
                          source.type === "YouTube Video"
                            ? fullSource?.link || source.link
                            : fullSource?.content || "";
                        const message =
                          source.type === "YouTube Video"
                            ? "Video URL copied to clipboard"
                            : "Source content copied to clipboard";
                        navigator.clipboard.writeText(textToCopy);
                        showToast(message, "success", { duration: 1500 });
                      }}
                    />
                  </Tooltip>
                  {source.type === "Website" && (
                    <Tooltip text="Open source" position="bottom">
                      <IconButton
                        icon={<LinkIcon />}
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          window.open(fullSource?.link, "_blank", "noopener noreferrer");
                        }}
                      />
                    </Tooltip>
                  )}
                  <Tooltip text="Delete source" position="bottom">
                    <IconButton
                      icon={<DeleteIcon />}
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsDeleteModalOpen(true)}
                    />
                  </Tooltip>
                </>
              )}
              <Tooltip text={isExpanded ? "Restore size" : "Expand"} position="bottom">
                <IconButton
                  icon={isExpanded ? <CompressIcon /> : <ExpandIcon />}
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded((s) => !s)}
                />
              </Tooltip>
              <Tooltip text="Close source" position="bottom">
                <IconButton
                  icon={<CloseIcon />}
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseSource}
                />
              </Tooltip>
            </div>
          </div>
          <Divider className="my-0" />
        </div>
        {loading && <div className="px-6 text-center text-sm text-gray-500">Loading source...</div>}
        {error && (
          <div className="px-6 text-sm text-red-500">Error loading source: {error.message}</div>
        )}
        {fullSource && !loading && !error && (
          <div className="w-full flex-1 overflow-y-auto">
            <div className="mx-auto flex w-full max-w-5xl flex-col">
              <div className="px-6 pt-4">
                <Card className="border-gray-200 bg-gray-50 shadow-sm ring-0 dark:border-gray-700 dark:bg-gray-800/60">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      Summary of this source
                    </h3>
                    <div className="flex gap-2">
                      {!isExpanded && sourceSummary ? (
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
                              onClick={() => {
                                navigator.clipboard.writeText(sourceSummary);
                                showToast("Summary copied to clipboard", "success", {
                                  duration: 1500,
                                });
                              }}
                              disabled={isSummaryLoading || isRegeneratingSummary}
                            />
                            <MenuItem
                              icon={isRegeneratingSummary ? <Spinner size={16} /> : <RestartIcon />}
                              label="Regenerate summary"
                              onClick={regenerateSummary}
                              disabled={isRegeneratingSummary}
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
                      ) : (
                        <>
                          {sourceSummary && (
                            <Tooltip text="Copy summary" position="bottom">
                              <IconButton
                                icon={<CopyIcon />}
                                disabled={isSummaryLoading || isRegeneratingSummary}
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(sourceSummary);
                                  showToast("Summary copied to clipboard", "success", {
                                    duration: 1500,
                                  });
                                }}
                              />
                            </Tooltip>
                          )}
                          {sourceSummary && (
                            <Tooltip text="Delete summary" position="bottom">
                              <IconButton
                                icon={<DeleteIcon />}
                                variant="ghost"
                                size="sm"
                                onClick={deleteSummary}
                                disabled={
                                  isDeletingSummary || isSummaryLoading || isRegeneratingSummary
                                }
                              />
                            </Tooltip>
                          )}
                          {sourceSummary && (
                            <Tooltip text="Regenerate summary" position="bottom">
                              <IconButton
                                icon={isRegeneratingSummary ? <Spinner /> : <RestartIcon />}
                                variant="ghost"
                                size="sm"
                                onClick={regenerateSummary}
                                disabled={isRegeneratingSummary}
                              />
                            </Tooltip>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={
                        isSummaryLoading || isRegeneratingSummary
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
                      {isSummaryLoading || isRegeneratingSummary ? (
                        <Skeleton lines={6} />
                      ) : summaryGenerateError ? (
                        <div className="flex flex-col gap-3">
                          <Alert
                            title="Error"
                            message={getHttpErrorMessage(summaryGenerateError.status)}
                            variant="danger"
                          />
                          <Button
                            onClick={regenerateSummary}
                            disabled={isRegeneratingSummary}
                            variant="ghost"
                            size="sm"
                            icon={<RestartIcon className="h-4 w-4" />}
                          >
                            Regenerate summary
                          </Button>
                        </div>
                      ) : sourceSummary?.trim() ? (
                        <div className="max-w-none text-base leading-relaxed font-medium text-gray-900 select-text dark:text-gray-100">
                          <Suspense fallback={<Skeleton lines={4} />}>
                            <Markdown
                              text={sourceSummary}
                              baseUrl={fullSource?.link || source.link}
                            />
                          </Suspense>
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
                      <div className="overflow-x-hidden break-words select-text">
                        <div className="max-w-none leading-relaxed">
                          {contentChunks.length > 0 ? (
                            <Suspense
                              fallback={
                                <Skeleton
                                  lines={10}
                                  className="[&>div]:!bg-gray-200 dark:[&>div]:!bg-gray-800"
                                />
                              }
                            >
                              {contentChunks.slice(0, visibleChunks).map((chunk, index) => (
                                <Markdown
                                  key={index}
                                  text={chunk}
                                  baseUrl={fullSource?.link || source.link}
                                />
                              ))}
                            </Suspense>
                          ) : (
                            <Skeleton
                              lines={10}
                              className="[&>div]:!bg-gray-200 dark:[&>div]:!bg-gray-800"
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-auto min-h-[80%] w-full overflow-x-hidden px-6 py-8 break-words select-text">
                    <div className="max-w-none leading-relaxed">
                      {contentChunks.length > 0 ? (
                        <Suspense
                          fallback={
                            <Skeleton
                              lines={10}
                              className="[&>div]:!bg-gray-200 dark:[&>div]:!bg-gray-800"
                            />
                          }
                        >
                          {contentChunks.slice(0, visibleChunks).map((chunk, index) => (
                            <Markdown
                              key={index}
                              text={chunk}
                              baseUrl={fullSource?.link || source.link}
                            />
                          ))}
                        </Suspense>
                      ) : (
                        <Skeleton
                          lines={10}
                          className="[&>div]:!bg-gray-200 dark:[&>div]:!bg-gray-800"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Source Modal */}
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
            Are you sure you want to delete this source? This action cannot be undone.
          </p>
          {deleteError && <div className="text-sm text-red-500">Error: {deleteError.message}</div>}
        </div>
      </Modal>
    </>
  );
}
