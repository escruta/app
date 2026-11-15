import { useEffect, useMemo, useState } from "react";
import {
  CloseIcon,
  DeleteIcon,
  DotsVerticalIcon,
  EditIcon,
  InfoIcon,
  RestartIcon,
  SlidersIcon,
  StarsIcon,
} from "@/components/icons";
import {
  Button,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Modal,
  Spinner,
  TextField,
  Tooltip,
  ViewerFrame,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import type {
  FlashcardsResponse,
  GenerationOptions,
  JobType,
  MindMapResponse,
  QuestionnaireResponse,
  StudyGuideResponse,
} from "@/interfaces";
import {
  FlashcardsViewer,
  MindMapViewer,
  QuestionnaireViewer,
  StudyGuideViewer,
} from "@/components/tools";
import { TOOL_DEFINITIONS, getToolMetricBadges } from "@/components/tools/toolConfig";

interface ToolResultViewerProps {
  title: string;
  type: JobType;
  content: string;
  options?: GenerationOptions | null;
  viewerKey?: string;
  isLoading?: boolean;
  isFailed?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onRetry?: () => void;
  onCustomize?: () => void;
  onGenerateAnother?: () => void;
  onRename?: (newTitle: string) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  className?: string;
}

type ParsedContent =
  | { type: "FLASHCARDS"; data: FlashcardsResponse }
  | { type: "QUESTIONNAIRE"; data: QuestionnaireResponse }
  | { type: "STUDY_GUIDE"; data: StudyGuideResponse }
  | { type: "MIND_MAP"; data: MindMapResponse }
  | { type: "error"; error: string }
  | null;

function parseContent(content: string, type: JobType): ParsedContent {
  if (!content) return null;

  try {
    const data = JSON.parse(content);
    return { type, data } as ParsedContent;
  } catch {
    return { type: "error", error: "We couldn't read this content" };
  }
}

export function ToolResultViewer({
  title,
  type,
  content,
  options,
  viewerKey,
  isLoading = false,
  isFailed = false,
  errorMessage,
  onClose,
  onRetry,
  onCustomize,
  onGenerateAnother,
  onRename,
  onDelete,
  className,
}: ToolResultViewerProps) {
  const parsedContent = useMemo(() => parseContent(content, type), [content, type]);
  const toolDef = TOOL_DEFINITIONS[type];
  const metricBadges = useMemo(() => getToolMetricBadges({ type, options }), [type, options]);

  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(title);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setNewTitle(title);
  }, [title]);

  const handleSaveRename = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed || trimmed === title || !onRename) {
      setIsRenameModalOpen(false);
      setNewTitle(title);
      return;
    }
    setIsSavingTitle(true);
    try {
      await onRename(trimmed);
      setIsRenameModalOpen(false);
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
      setIsDeleteModalOpen(false);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  function renderContent() {
    if (isLoading) {
      return (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-sm text-center">
            <Spinner size={32} className="mx-auto mb-4" />
            <p className="font-medium text-gray-700 dark:text-gray-200">
              Generating {toolDef.title.toLowerCase()}...
            </p>
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
              Analyzing your sources and applying configured metrics
            </p>
            {metricBadges.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
                {metricBadges.map((badge) => (
                  <Chip key={badge} size="sm">
                    {badge}
                  </Chip>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (isFailed) {
      return (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-sm text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xs border border-red-200 bg-red-50 text-red-500 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
              <CloseIcon className="size-6" />
            </div>
            <p className="font-semibold text-gray-800 dark:text-gray-100">Generation failed</p>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
              {errorMessage || "Something went wrong while generating this study tool."}
            </p>
            <div className="mt-5 flex items-center justify-center gap-2.5">
              {onCustomize && (
                <Button variant="secondary" size="sm" icon={<SlidersIcon />} onClick={onCustomize}>
                  Customize
                </Button>
              )}
              {onRetry && (
                <Button variant="primary" size="sm" icon={<RestartIcon />} onClick={onRetry}>
                  Retry
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (!parsedContent) {
      return (
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="text-gray-500 dark:text-gray-400">Nothing to show here yet.</p>
        </div>
      );
    }

    if (parsedContent.type === "error") {
      return (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center">
            <p className="mb-2 text-red-500 dark:text-red-400">{parsedContent.error}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              We couldn&apos;t display this content properly, try retrying it.
            </p>
            {onRetry && (
              <Button
                variant="secondary"
                size="sm"
                icon={<RestartIcon />}
                onClick={onRetry}
                className="mt-4"
              >
                Retry
              </Button>
            )}
          </div>
        </div>
      );
    }

    const contentKey = viewerKey ?? content.slice(0, 64);

    switch (parsedContent.type) {
      case "FLASHCARDS":
        return <FlashcardsViewer key={contentKey} data={parsedContent.data} />;
      case "QUESTIONNAIRE":
        return <QuestionnaireViewer key={contentKey} data={parsedContent.data} />;
      case "STUDY_GUIDE":
        return <StudyGuideViewer key={contentKey} data={parsedContent.data} />;
      case "MIND_MAP":
        return <MindMapViewer key={contentKey} data={parsedContent.data} />;
      default:
        return (
          <div className="flex flex-1 items-center justify-center p-6">
            <p className="text-gray-500 dark:text-gray-400">
              We don&apos;t recognize this content type.
            </p>
          </div>
        );
    }
  }

  const hasActions = Boolean(onCustomize || onGenerateAnother || onRetry || onRename || onDelete);

  return (
    <>
      <ViewerFrame className={className}>
        <div className="flex h-15 shrink-0 items-center gap-3 px-4 pt-4 pb-3">
          <h2 className="flex min-w-0 flex-1 items-baseline gap-1.5">
            <span className="shrink-0 text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
              {toolDef.title} /{" "}
            </span>
            <span className="truncate text-lg font-semibold select-text">{title}</span>
          </h2>

          <div className="hidden items-center gap-1.5 lg:flex">
            {metricBadges.slice(0, 4).map((badge) => (
              <span
                key={badge}
                className="rounded-xs border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600 select-none dark:border-gray-700 dark:bg-gray-800/70 dark:text-gray-300"
              >
                {badge}
              </span>
            ))}
            {options?.focusTopic && (
              <Tooltip text={`Focus: ${options.focusTopic}`} position="bottom">
                <span className="inline-flex items-center gap-1 rounded-xs border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600 select-none dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                  <InfoIcon className="size-3" />
                  Focused
                </span>
              </Tooltip>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {onCustomize && (
              <Tooltip text="Customize new variation" position="bottom">
                <IconButton
                  icon={<SlidersIcon />}
                  variant="ghost"
                  size="sm"
                  onClick={onCustomize}
                  ariaLabel="Customize new variation"
                />
              </Tooltip>
            )}

            {hasActions && (
              <Menu>
                <MenuTrigger>
                  <IconButton
                    icon={<DotsVerticalIcon />}
                    variant="ghost"
                    size="sm"
                    ariaLabel="More options"
                  />
                </MenuTrigger>
                <MenuContent align="right">
                  {onCustomize && (
                    <MenuItem
                      icon={<SlidersIcon className="size-4" />}
                      label="Customize variation..."
                      onClick={onCustomize}
                    />
                  )}
                  {onGenerateAnother && !isLoading && (
                    <MenuItem
                      icon={<StarsIcon className="size-4" />}
                      label="Generate another"
                      onClick={onGenerateAnother}
                    />
                  )}
                  {onRetry && !isLoading && (
                    <MenuItem
                      icon={<RestartIcon className="size-4" />}
                      label={isFailed ? "Retry generation" : "Regenerate in place"}
                      onClick={onRetry}
                    />
                  )}
                  {onRename && (
                    <MenuItem
                      icon={<EditIcon className="size-4" />}
                      label="Rename"
                      onClick={() => {
                        setNewTitle(title);
                        setIsRenameModalOpen(true);
                      }}
                    />
                  )}
                  {onDelete && (
                    <MenuItem
                      icon={<DeleteIcon className="size-4" />}
                      label="Delete"
                      variant="danger"
                      onClick={() => setIsDeleteModalOpen(true)}
                    />
                  )}
                </MenuContent>
              </Menu>
            )}
          </div>
        </div>

        <Divider className="my-0" />

        <div
          className={cn("mx-auto flex w-full flex-1 flex-col", {
            "overflow-y-auto": !(
              ["MIND_MAP", "FLASHCARDS", "QUESTIONNAIRE"] satisfies JobType[] as readonly JobType[]
            ).includes(type),
            "overflow-hidden": (
              ["MIND_MAP", "FLASHCARDS", "QUESTIONNAIRE"] satisfies JobType[] as readonly JobType[]
            ).includes(type),
          })}
        >
          {renderContent()}
        </div>
      </ViewerFrame>

      {onRename && (
        <Modal
          isOpen={isRenameModalOpen}
          onClose={() => {
            setIsRenameModalOpen(false);
            setNewTitle(title);
          }}
          title={`Rename ${toolDef.title.toLowerCase()}`}
          onSubmit={() => {
            if (newTitle.trim() && !isSavingTitle) handleSaveRename();
          }}
          actions={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsRenameModalOpen(false);
                  setNewTitle(title);
                }}
                disabled={isSavingTitle}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveRename}
                disabled={!newTitle.trim() || isSavingTitle || newTitle.trim() === title}
                icon={isSavingTitle ? <Spinner className="size-4" /> : undefined}
              >
                {isSavingTitle ? "Saving..." : "Save"}
              </Button>
            </>
          }
        >
          <TextField
            id="tool-viewer-rename"
            label="Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Enter a title..."
            autoFocus
          />
        </Modal>
      )}

      {onDelete && isDeleteModalOpen && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title={`Delete ${toolDef.title.toLowerCase()}`}
          actions={
            <>
              <Button
                variant="secondary"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                icon={isDeleting ? <Spinner className="size-4" /> : undefined}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </>
          }
        >
          <p className="text-gray-600 dark:text-gray-300">
            You&apos;re about to delete <span className="font-semibold">{title}</span>. This
            can&apos;t be undone.
          </p>
        </Modal>
      )}
    </>
  );
}
