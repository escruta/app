import { useEffect, useState } from "react";
import { useGenerationJob } from "@/hooks";
import type { GenerationJob, GenerationRequestPayload, JobType, Source } from "@/interfaces";
import { Button, Spinner } from "@/components/ui";
import { SlidersIcon } from "@/components/icons";
import { ToolResultViewer } from "../ToolResultViewer";
import { CustomizeToolModal } from "./CustomizeToolModal";
import { TOOL_DEFINITIONS, getDefaultGenerationOptions } from "./toolConfig";

interface ToolResultTabProps {
  notebookId: string;
  jobId: string;
  toolType: JobType;
  title: string;
  sources?: Source[];
  selectedSourceIds?: string[];
  onClose: () => void;
  onTitleChange?: (title: string) => void;
  onOpenNewJob?: (job: GenerationJob) => void;
}

export function ToolResultTab({
  notebookId,
  jobId,
  toolType,
  title,
  sources = [],
  selectedSourceIds = [],
  onClose,
  onTitleChange,
  onOpenNewJob,
}: ToolResultTabProps) {
  const {
    job,
    isChecking,
    isLoading,
    isFailed,
    result,
    error,
    retryGeneration,
    createNewGeneration,
    renameGeneration,
    deleteGeneration,
  } = useGenerationJob(notebookId, jobId, {
    onUpdated: (updated) => {
      if (updated.title) {
        onTitleChange?.(updated.title);
      }
    },
    onDeleted: () => {
      onClose();
    },
  });

  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);

  const effectiveType = job?.type ?? toolType;
  const effectiveTitle = job?.title || title || TOOL_DEFINITIONS[effectiveType].title;
  const readySources = sources.filter((s) => s.status === "READY");

  useEffect(() => {
    if (job?.title && job.title !== title) {
      onTitleChange?.(job.title);
    }
  }, [job?.title, title, onTitleChange]);

  const handleCustomizeSubmit = async (payload: GenerationRequestPayload) => {
    setIsSubmittingCustom(true);
    try {
      const created = await createNewGeneration(payload);
      setIsCustomizeOpen(false);
      if (created) {
        onOpenNewJob?.(created);
      }
    } finally {
      setIsSubmittingCustom(false);
    }
  };

  const handleGenerateAnother = async () => {
    const created = await createNewGeneration({
      type: effectiveType,
      options:
        job?.options ??
        getDefaultGenerationOptions(effectiveType, selectedSourceIds, readySources.length),
    });
    if (created) {
      onOpenNewJob?.(created);
    }
  };

  if (isChecking) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Spinner size={28} />
      </div>
    );
  }

  if (!job) {
    const toolDef = TOOL_DEFINITIONS[effectiveType];
    return (
      <>
        <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="mb-3 flex size-20 items-center justify-center rounded-xs border border-blue-300 bg-blue-50 shadow-sm dark:border-blue-700 dark:bg-blue-950/30">
            <div className="size-10 text-blue-500 dark:text-blue-400">{toolDef.icon}</div>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {toolDef.title}
          </h3>
          <p className="max-w-xs text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            {toolDef.description}
          </p>
          <Button
            icon={<SlidersIcon />}
            variant="primary"
            onClick={() => setIsCustomizeOpen(true)}
            disabled={isLoading || readySources.length === 0}
          >
            Configure &amp; generate {toolDef.title}
          </Button>
        </div>

        <CustomizeToolModal
          isOpen={isCustomizeOpen}
          toolType={effectiveType}
          sources={sources}
          defaultSelectedSourceIds={selectedSourceIds}
          isSubmitting={isSubmittingCustom}
          onClose={() => setIsCustomizeOpen(false)}
          onGenerate={handleCustomizeSubmit}
        />
      </>
    );
  }

  return (
    <>
      <ToolResultViewer
        title={effectiveTitle}
        type={effectiveType}
        content={result ?? ""}
        options={job.options}
        viewerKey={`${job.id}:${job.completedAt ?? job.updatedAt ?? ""}`}
        isLoading={isLoading}
        isFailed={isFailed}
        errorMessage={job.errorMessage ?? error}
        onClose={onClose}
        onRetry={() => retryGeneration()}
        onCustomize={() => setIsCustomizeOpen(true)}
        onGenerateAnother={handleGenerateAnother}
        onRename={async (nextTitle) => {
          const updated = await renameGeneration(nextTitle);
          if (updated?.title) {
            onTitleChange?.(updated.title);
          }
        }}
        onDelete={async () => {
          await deleteGeneration();
        }}
        className="h-full"
      />

      <CustomizeToolModal
        isOpen={isCustomizeOpen}
        toolType={effectiveType}
        sources={sources}
        defaultSelectedSourceIds={selectedSourceIds}
        initialOptions={job.options}
        isSubmitting={isSubmittingCustom}
        onClose={() => setIsCustomizeOpen(false)}
        onGenerate={handleCustomizeSubmit}
      />
    </>
  );
}
