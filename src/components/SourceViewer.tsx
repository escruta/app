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
  const [contentToRender, setContentToRender] = useState<string | null>(null);
  const [_, startTransition] = useTransition();

  const { showToast } = useToast();

  const youtubeVideoId =
    source.type === "YouTube Video" ? getYouTubeVideoId(fullSource?.link || source.link) : null;

  useEffect(() => {
    if (source.id !== currentSourceId) {
      setCurrentSourceId(source.id);
      setContentToRender(null);
    }
  }, [source.id, currentSourceId]);

  useEffect(() => {
    if (fullSource?.content !== undefined) {
      const timer = setTimeout(() => {
        startTransition(() => {
          setContentToRender(fullSource.content || "");
        });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [fullSource?.content]);

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
    data: sourceSummary,
    loading: isSummaryLoading,
    refetch: refetchSummary,
  } = useFetch<string>(
    `notebooks/${notebookId}/sources/${source.id}/summary`,
    {
      method: "GET",
      onError: (error) => {
        console.error("Error fetching source summary:", error.message);
      },
    },
    false,
  );

  const { loading: isRegeneratingSummary, refetch: regenerateSummary } = useFetch<string>(
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
              <Tooltip
                text={source.type === "YouTube Video" ? "Copy video URL" : "Copy source content"}
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
                <Card className="border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                      Summary of this source
                    </h3>
                    <div className="flex gap-2">
                      {sourceSummary && (
                        <Tooltip text="Copy summary" position="bottom">
                          <IconButton
                            icon={<CopyIcon />}
                            disabled={isSummaryLoading || isRegeneratingSummary}
                            variant="ghost"
                            size="sm"
                            className="border-blue-300 text-blue-600 hover:border-blue-500 hover:bg-blue-100/50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-800/30"
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
                            className="border-blue-300 text-blue-600 hover:border-blue-500 hover:bg-blue-100/50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-800/30"
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
                            className="border-blue-300 text-blue-600 hover:border-blue-500 hover:bg-blue-100/50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-800/30"
                            onClick={regenerateSummary}
                            disabled={isRegeneratingSummary}
                          />
                        </Tooltip>
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
                        <Skeleton
                          lines={6}
                          className="[&>div]:!bg-blue-200/80 [&>div]:dark:!bg-blue-800/80"
                        />
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
                        <div className="max-w-none leading-relaxed text-blue-800 select-text dark:text-blue-50">
                          <Suspense
                            fallback={
                              <Skeleton
                                lines={4}
                                className="[&>div]:!bg-blue-200/80 [&>div]:dark:!bg-blue-800/80"
                              />
                            }
                          >
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
                          {contentToRender !== null ? (
                            <Suspense
                              fallback={
                                <Skeleton
                                  lines={10}
                                  className="[&>div]:!bg-gray-200 dark:[&>div]:!bg-gray-800"
                                />
                              }
                            >
                              <Markdown
                                text={contentToRender}
                                baseUrl={fullSource?.link || source.link}
                              />
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
                      {contentToRender !== null ? (
                        <Suspense
                          fallback={
                            <Skeleton
                              lines={10}
                              className="[&>div]:!bg-gray-200 dark:[&>div]:!bg-gray-800"
                            />
                          }
                        >
                          <Markdown
                            text={contentToRender}
                            baseUrl={fullSource?.link || source.link}
                          />
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
