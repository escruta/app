import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useShortcut } from "@/hooks";
import type { GenerationJob } from "@/interfaces";
import {
  CloseIcon,
  DeleteIcon,
  DotsVerticalIcon,
  EditIcon,
  RestartIcon,
  SlidersIcon,
  StarsIcon,
} from "@/components/icons";
import {
  Button,
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Modal,
  Spinner,
  TextField,
  Tooltip,
} from "@/components/ui";
import { TOOL_DEFINITIONS } from "./toolConfig";

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (diffDays === 1) {
    return "Yesterday";
  }
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "long" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

interface ToolGenerationChipProps {
  job: GenerationJob;
  isActive?: boolean;
  onSelect: (job: GenerationJob) => void;
  onCustomizeVariation: (job: GenerationJob) => void;
  onGenerateAnother: (job: GenerationJob) => Promise<void> | void;
  onRetry: (job: GenerationJob) => Promise<void> | void;
  onRename: (jobId: string, title: string) => Promise<GenerationJob | null>;
  onDelete: (jobId: string) => Promise<boolean>;
}

export function ToolGenerationChip({
  job,
  isActive = false,
  onSelect,
  onCustomizeVariation,
  onGenerateAnother,
  onRetry,
  onRename,
  onDelete,
}: ToolGenerationChipProps) {
  const isGenerating = job.status === "PENDING" || job.status === "PROCESSING";
  const isFailed = job.status === "FAILED";
  const toolDef = TOOL_DEFINITIONS[job.type];

  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(job.title);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setNewTitle(job.title);
  }, [job.title]);

  const handleActivate = () => {
    onSelect(job);
  };

  const handleSelectKeyDown = useShortcut("dialog-activate", handleActivate);

  const handleSaveRename = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed || trimmed === job.title) {
      setIsRenameModalOpen(false);
      setNewTitle(job.title);
      return;
    }
    setIsRenaming(true);
    try {
      await onRename(job.id, trimmed);
      setIsRenameModalOpen(false);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(job.id);
      setIsDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const formattedDate = formatDate(job.completedAt ?? job.createdAt);
  const subtitleText = isGenerating
    ? `${toolDef.title} · Generating...`
    : isFailed
      ? `${toolDef.title} · Couldn't generate`
      : [toolDef.title, formattedDate].filter(Boolean).join(" · ");

  return (
    <>
      <div
        className={cn(
          "group flex cursor-pointer items-center gap-2.5 rounded-xs border p-2.5 transition-colors duration-150 select-none",
          "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none focus-visible:ring-inset dark:focus-visible:ring-blue-400",
          isActive
            ? "border-blue-300 bg-blue-50/70 dark:border-blue-700 dark:bg-blue-950/40"
            : isFailed
              ? "border-red-300 bg-red-50/40 hover:bg-red-50/70 dark:border-red-800/70 dark:bg-red-950/20 dark:hover:bg-red-950/30"
              : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/60 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-600 dark:hover:bg-gray-800",
        )}
        onClick={handleActivate}
        onKeyDown={handleSelectKeyDown}
        role="button"
        tabIndex={0}
      >
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-xs transition-colors duration-150",
            isGenerating
              ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
              : isFailed
                ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                : isActive
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300"
                  : "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
          )}
        >
          {isGenerating ? (
            <Spinner size={15} className="text-blue-600 dark:text-blue-400" />
          ) : isFailed ? (
            <CloseIcon className="size-4" />
          ) : (
            <span className="size-4 [&>svg]:size-4">{toolDef.icon}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
            {job.title || toolDef.title}
          </p>
          <p
            className={cn("truncate text-xs", {
              "text-blue-600 dark:text-blue-400": isGenerating,
              "text-red-600 dark:text-red-400": isFailed,
              "text-gray-500 dark:text-gray-400": !isGenerating && !isFailed,
            })}
            title={subtitleText}
          >
            {subtitleText}
          </p>
        </div>

        <div
          className="shrink-0 opacity-100 transition-opacity duration-150 has-aria-expanded:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <Menu>
            <Tooltip text="More options" position="top">
              <MenuTrigger>
                <IconButton
                  icon={<DotsVerticalIcon className="size-3.5" />}
                  variant="ghost"
                  size="sm"
                  ariaLabel="More options"
                />
              </MenuTrigger>
            </Tooltip>
            <MenuContent align="right">
              {isFailed && (
                <MenuItem
                  icon={<RestartIcon className="size-4" />}
                  label="Retry generation"
                  onClick={() => onRetry(job)}
                />
              )}
              <MenuItem
                icon={<SlidersIcon className="size-4" />}
                label="Customize variation..."
                onClick={() => onCustomizeVariation(job)}
              />
              {!isGenerating && !isFailed && (
                <MenuItem
                  icon={<StarsIcon className="size-4" />}
                  label="Generate another"
                  onClick={() => onGenerateAnother(job)}
                />
              )}
              <MenuItem
                icon={<EditIcon className="size-4" />}
                label="Rename"
                onClick={() => {
                  setNewTitle(job.title);
                  setIsRenameModalOpen(true);
                }}
              />
              <MenuItem
                icon={<DeleteIcon className="size-4" />}
                label="Delete"
                variant="danger"
                onClick={() => setIsDeleteModalOpen(true)}
              />
            </MenuContent>
          </Menu>
        </div>
      </div>

      <Modal
        isOpen={isRenameModalOpen}
        onClose={() => {
          setIsRenameModalOpen(false);
          setNewTitle(job.title);
        }}
        title={`Rename ${toolDef.title.toLowerCase()}`}
        onSubmit={() => {
          if (newTitle.trim() && !isRenaming) handleSaveRename();
        }}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsRenameModalOpen(false);
                setNewTitle(job.title);
              }}
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveRename}
              disabled={!newTitle.trim() || isRenaming || newTitle.trim() === job.title}
              icon={isRenaming ? <Spinner className="size-4" /> : undefined}
            >
              {isRenaming ? "Saving..." : "Save"}
            </Button>
          </>
        }
      >
        <TextField
          id={`tool-rename-${job.id}`}
          label="Title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Enter a title..."
          autoFocus
        />
      </Modal>

      {isDeleteModalOpen && (
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
            You&apos;re about to delete <span className="font-semibold">{job.title}</span>. This
            can&apos;t be undone.
          </p>
        </Modal>
      )}
    </>
  );
}
