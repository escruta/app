import { useEffect, useState } from "react";
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
import { Markdown } from "@/components/Markdown";
import {
  cn,
  getSourceType,
  getYouTubeVideoId,
  getSourceTypeIcon,
  getHttpErrorMessage,
} from "@/lib/utils";

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
  const [summaryGenerateError, setSummaryGenerateError] =
    useState<FetchError | null>(null);
  const {
    data: fullSource,
    loading,
    error,
  } = useFetch<Source>(`notebooks/${notebookId}/sources/${source.id}`);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [currentSourceId, setCurrentSourceId] = useState<string>(source.id);

  const { showToast } = useToast();

  const sourceType = getSourceType(fullSource || source);
  const youtubeVideoId =
    sourceType === "YouTube Video"
      ? getYouTubeVideoId(fullSource?.link || source.link)
      : null;

  useEffect(() => {
    if (source.id !== currentSourceId) {
      setCurrentSourceId(source.id);
    }
  }, [source.id, currentSourceId]);

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

  const { loading: isRegeneratingSummary, refetch: regenerateSummary } =
    useFetch<string>(
      `notebooks/${notebookId}/sources/${source.id}/summary`,
      {
        method: "POST",
        onSuccess: () => {
          setSummaryGenerateError(null);
          refetchSummary(true);
        },
        onError: (error) => {
          console.error("Error regenerating source summary:", error.message);
          useFetch.clearCache(
            `notebooks/${notebookId}/sources/${source.id}/summary`,
          );
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
        className={cn("flex flex-col overflow-y-auto p-0", className)}
      >
        <div className="sticky h-20 top-0 z-10 ">
          <div className="bg-white dark:bg-gray-900 h-6 w-full flex-shrink-0" />
          <div className="bg-white dark:bg-gray-900 h-14 px-6">
            <div className="h-12 px-2 gap-3 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="text-gray-600 dark:text-gray-300 flex-shrink-0 w-5 h-5">
                  {getSourceTypeIcon(sourceType)}
                </div>
                <h2 className="truncate font-semibold">
                  {fullSource?.title || source.title || "Source viewer"}
                </h2>
                {(fullSource?.isConvertedByAi || source.isConvertedByAi) && (
                  <Tooltip text="Converted by AI" position="bottom">
                    <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-700 select-none">
                      <div className="w-3.5 h-3.5 flex-shrink-0">
                        <StarsIcon />
                      </div>
                      <span className="text-xs font-semibold">AI</span>
                    </div>
                  </Tooltip>
                )}
              </div>
              <div className="flex gap-2">
                <Tooltip
                  text={
                    sourceType === "YouTube Video"
                      ? "Copy video URL"
                      : "Copy source content"
                  }
                  position="bottom"
                >
                  <IconButton
                    icon={<CopyIcon />}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const textToCopy =
                        sourceType === "YouTube Video"
                          ? fullSource?.link || source.link
                          : fullSource?.content || "";
                      const message =
                        sourceType === "YouTube Video"
                          ? "Video URL copied to clipboard"
                          : "Source content copied to clipboard";
                      navigator.clipboard.writeText(textToCopy);
                      showToast(message, "success", { duration: 1500 });
                    }}
                  />
                </Tooltip>
                {sourceType === "Website" && (
                  <Tooltip text="Open source" position="bottom">
                    <IconButton
                      icon={<LinkIcon />}
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        window.open(
                          fullSource?.link,
                          "_blank",
                          "noopener noreferrer",
                        );
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
                <Tooltip
                  text={isExpanded ? "Restore size" : "Expand"}
                  position="bottom"
                >
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
            <Divider />
          </div>
        </div>
        {loading && (
          <div className="text-center text-gray-500 text-sm px-6">
            Loading source...
          </div>
        )}
        {error && (
          <div className="text-red-500 text-sm px-6">
            Error loading source: {error.message}
          </div>
        )}
        {fullSource && !loading && !error && (
          <div className="flex-1 flex flex-col w-full max-w-5xl mx-auto">
            <div className="px-6 pt-4">
              <Card className="bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
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
                          onClick={() => {
                            navigator.clipboard.writeText(sourceSummary);
                            showToast(
                              "Summary copied to clipboard",
                              "success",
                              {
                                duration: 1500,
                              },
                            );
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
                            isDeletingSummary ||
                            isSummaryLoading ||
                            isRegeneratingSummary
                          }
                        />
                      </Tooltip>
                    )}
                    {sourceSummary && (
                      <Tooltip text="Regenerate summary" position="bottom">
                        <IconButton
                          icon={
                            isRegeneratingSummary ? (
                              <Spinner />
                            ) : (
                              <RestartIcon />
                            )
                          }
                          variant="ghost"
                          size="sm"
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
                      <Skeleton lines={8} />
                    ) : summaryGenerateError ? (
                      <div className="flex flex-col gap-3">
                        <Alert
                          title="Error"
                          message={getHttpErrorMessage(
                            summaryGenerateError.status,
                          )}
                          variant="danger"
                        />
                        <Button
                          onClick={regenerateSummary}
                          disabled={isRegeneratingSummary}
                          variant="ghost"
                          size="sm"
                          icon={<RestartIcon className="w-4 h-4" />}
                        >
                          Regenerate summary
                        </Button>
                      </div>
                    ) : sourceSummary?.trim() ? (
                      <div className="max-w-none select-text">
                        <Markdown text={sourceSummary} />
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
              {sourceType === "YouTube Video" && youtubeVideoId ? (
                <div className="h-auto min-h-[80%] w-full px-6 py-8">
                  <div className="aspect-video w-full mb-6">
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                      title={fullSource.title || "YouTube Video"}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="size-full"
                    />
                  </div>
                  {fullSource.content && (
                    <div className="overflow-auto text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words select-text">
                      <div className="max-w-none text-base">
                        <Markdown text={fullSource.content} />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-auto min-h-[80%] w-full px-6 py-8 overflow-auto text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words select-text">
                  <div className="max-w-none text-base">
                    <Markdown text={fullSource.content || ""} />
                  </div>
                </div>
              )}
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
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
            >
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
            Are you sure you want to delete this source? This action cannot be
            undone.
          </p>
          {deleteError && (
            <div className="text-red-500 text-sm">
              Error: {deleteError.message}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
