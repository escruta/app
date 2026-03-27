import { motion, AnimatePresence } from "motion/react";
import { Markdown } from "../Markdown";
import { Alert, Button, IconButton, Tooltip, Skeleton, Spinner } from "@/components/ui";
import { RestartIcon } from "@/components/icons";
import { getHttpErrorMessage } from "@/lib/utils";

interface NotebookSummaryProps {
  notebookSummary?: string;
  isSummaryLoading: boolean;
  isAutoRegenerating: boolean;
  isSummaryRegenerating: boolean;
  summaryGenerateError: any;
  readySourcesCount: number;
  regenerateSummary: () => void;
}

export function NotebookSummary({
  notebookSummary,
  isSummaryLoading,
  isAutoRegenerating,
  isSummaryRegenerating,
  summaryGenerateError,
  readySourcesCount,
  regenerateSummary,
}: NotebookSummaryProps) {
  return (
    <div className="w-full px-4 py-8 pb-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xl font-semibold">Summary of the notebook</h3>
        {notebookSummary && !isSummaryLoading && !isAutoRegenerating && (
          <Tooltip
            text={isSummaryRegenerating ? "Regenerating summary" : "Regenerate summary"}
            position="bottom"
          >
            <IconButton
              icon={isSummaryRegenerating ? <Spinner /> : <RestartIcon />}
              variant="ghost"
              size="sm"
              onClick={regenerateSummary}
              disabled={isSummaryRegenerating}
            />
          </Tooltip>
        )}
        {isAutoRegenerating && (
          <Tooltip text="Auto-regenerating..." position="bottom">
            <div className="flex h-8 w-8 items-center justify-center">
              <Spinner />
            </div>
          </Tooltip>
        )}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={
            isSummaryLoading || isSummaryRegenerating || isAutoRegenerating
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
          className="mt-1 mb-1 max-w-none"
        >
          {isSummaryLoading || isSummaryRegenerating || isAutoRegenerating ? (
            <Skeleton lines={6} className="w-full" />
          ) : summaryGenerateError ? (
            <div className="flex flex-col gap-3">
              <Alert
                title="Error"
                message={getHttpErrorMessage(summaryGenerateError?.status)}
                variant="danger"
              />
              <Button
                onClick={regenerateSummary}
                disabled={isSummaryRegenerating}
                variant="ghost"
                size="sm"
                icon={<RestartIcon className="h-4 w-4" />}
              >
                Regenerate summary
              </Button>
            </div>
          ) : notebookSummary?.trim() ? (
            <div className="select-text">
              <Markdown text={notebookSummary} />
            </div>
          ) : (
            <Button
              onClick={regenerateSummary}
              disabled={isSummaryRegenerating || readySourcesCount === 0}
            >
              {readySourcesCount === 0 ? "Waiting for sources..." : "Generate summary"}
            </Button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
