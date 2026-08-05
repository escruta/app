import { useGenerationJob } from "@/hooks";
import type { JobType } from "@/interfaces";
import { Button } from "@/components/ui";
import { RestartIcon } from "@/components/icons";
import { ToolResultViewer } from "./../ToolResultViewer";

interface ToolResultTabProps {
  notebookId: string;
  toolType: JobType;
  title: string;
  onClose: () => void;
  onNodeSelect?: (question: string) => void;
  onExpandedChange?: (expanded: boolean) => void;
}

export function ToolResultTab({
  notebookId,
  toolType,
  title,
  onClose,
  onNodeSelect,
  onExpandedChange,
}: ToolResultTabProps) {
  const { job, isLoading, result, startGeneration } = useGenerationJob(notebookId, toolType);

  if (!job) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="mb-5 flex size-20 items-center justify-center rounded-xs border border-blue-300 bg-blue-50 shadow-sm dark:border-blue-700 dark:bg-blue-950/30">
          <div className="size-10 text-blue-500 dark:text-blue-400">
            <RestartIcon />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
        <p className="max-w-xs text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          Generate this study tool from your notebook sources.
        </p>
        <Button
          icon={<RestartIcon />}
          variant="primary"
          onClick={() => startGeneration()}
          disabled={isLoading}
        >
          {isLoading ? "Starting..." : `Generate ${title}`}
        </Button>
      </div>
    );
  }

  return (
    <ToolResultViewer
      title={title}
      type={toolType}
      content={result ?? ""}
      isLoading={isLoading}
      onClose={onClose}
      onRegenerate={startGeneration}
      regenerateCloses={false}
      onNodeSelect={onNodeSelect}
      onExpandedChange={onExpandedChange}
      className="h-full"
    />
  );
}
