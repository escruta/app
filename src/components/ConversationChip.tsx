import { cn } from "@/lib/utils";
import { useFetch, useShortcut } from "@/hooks";
import type { Conversation } from "@/interfaces";
import { DeleteIcon, DotsVerticalIcon, EditIcon } from "@/components/icons";
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
import { useEffect, useState } from "react";

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "long" });
  } else {
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }
}

interface ConversationChipProps {
  conversation: Conversation;
  notebookId: string;
  isActive?: boolean;
  className?: string;
  onSelect?: (conversation: Conversation) => void;
  onRename?: (conversation: Conversation) => void;
  onDelete?: (conversation: Conversation) => void;
}

export function ConversationChip({
  conversation,
  notebookId,
  isActive = false,
  className,
  onSelect,
  onRename,
  onDelete,
}: ConversationChipProps) {
  const isGenerating = conversation.status === "GENERATING";
  const isFailed = conversation.status === "FAILED";
  const hasUnseen = conversation.hasUnseenReply && !isGenerating && !isActive;

  const [isRenameModalOpen, setIsRenameModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [displayTitle, setDisplayTitle] = useState<string>(conversation.title);
  const [newTitle, setNewTitle] = useState<string>(conversation.title);

  useEffect(() => {
    setDisplayTitle(conversation.title);
  }, [conversation.title]);

  const { loading: isRenaming, refetch: renameConversation } = useFetch<Conversation>(
    `notebooks/${notebookId}/conversations/${conversation.id}`,
    {
      method: "PATCH",
      data: {
        title: newTitle.trim(),
      },
      onSuccess: (updatedConversation) => {
        const updatedTitle = updatedConversation?.title?.trim() || newTitle.trim();
        useFetch.clearCache(`notebooks/${notebookId}/conversations`);
        setDisplayTitle(updatedTitle);
        setNewTitle(updatedTitle);
        setIsRenameModalOpen(false);
        onRename?.({ ...conversation, ...updatedConversation, title: updatedTitle });
      },
      onError: (error) => {
        console.error("Error renaming conversation:", error.message);
      },
    },
    false,
  );

  const { loading: isDeleting, refetch: deleteConversation } = useFetch<void>(
    `notebooks/${notebookId}/conversations/${conversation.id}`,
    {
      method: "DELETE",
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        onDelete?.(conversation);
      },
      onError: (error) => {
        console.error("Error deleting conversation:", error.message);
      },
    },
    false,
  );

  const handleSelectKeyDown = useShortcut("dialog-activate", () => onSelect?.(conversation), {
    enabled: Boolean(onSelect),
  });

  function handleOpenRenameModal() {
    setNewTitle(displayTitle);
    setIsRenameModalOpen(true);
  }

  async function handleRenameConversation() {
    if (!newTitle.trim() || newTitle.trim() === displayTitle) {
      setIsRenameModalOpen(false);
      setNewTitle(displayTitle);
      return;
    }
    await renameConversation();
  }

  return (
    <>
      <div
        className={cn(
          "group flex items-center justify-between rounded-xs border p-2.5 transition-colors cursor-pointer",
          {
            "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700": isActive,
            "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-100/65 dark:hover:bg-gray-800":
              !isActive,
          },
          className,
        )}
        onClick={() => onSelect?.(conversation)}
        onKeyDown={handleSelectKeyDown}
        role="button"
        tabIndex={0}
      >
        <div className="mr-2 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 dark:text-white">
              {displayTitle}
            </p>
            {isGenerating ? (
              <Spinner
                size={14}
                className="shrink-0 text-blue-500 dark:text-blue-400"
                aria-label="Generating response"
              />
            ) : hasUnseen ? (
              <span
                className="relative flex size-2 shrink-0 items-center justify-center"
                aria-label="New response ready"
              >
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-blue-400 opacity-75 dark:bg-blue-500" />
                <span className="relative inline-flex size-2 rounded-full bg-blue-500 dark:bg-blue-400" />
              </span>
            ) : isFailed ? (
              <span
                className="inline-flex size-2 shrink-0 rounded-full bg-red-500 dark:bg-red-400"
                aria-label="Generation failed"
              />
            ) : null}
          </div>
          <p
            className={cn("text-xs", {
              "text-blue-600 dark:text-blue-400": isGenerating || hasUnseen,
              "text-red-600 dark:text-red-400": isFailed && !isGenerating,
              "text-gray-500 dark:text-gray-400": !isGenerating && !hasUnseen && !isFailed,
            })}
          >
            {isGenerating
              ? "Generating..."
              : hasUnseen
                ? "Response ready"
                : isFailed
                  ? "Couldn't generate"
                  : formatDate(conversation.updatedAt)}
          </p>
        </div>
        <div
          className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
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
              <MenuItem
                icon={<EditIcon className="size-4" />}
                label="Rename conversation"
                onClick={handleOpenRenameModal}
              />
              <MenuItem
                icon={<DeleteIcon className="size-4" />}
                label="Delete conversation"
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
          setNewTitle(displayTitle);
        }}
        title="Rename conversation"
        onSubmit={() => {
          if (newTitle.trim() && !isRenaming) handleRenameConversation();
        }}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsRenameModalOpen(false);
                setNewTitle(displayTitle);
              }}
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRenameConversation}
              disabled={!newTitle.trim() || isRenaming || newTitle.trim() === displayTitle}
              icon={isRenaming ? <Spinner className="size-4" /> : undefined}
            >
              {isRenaming ? "Saving..." : "Save"}
            </Button>
          </>
        }
      >
        <TextField
          id={`conversation-rename-${conversation.id}`}
          label="Name your conversation"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Give your conversation a title..."
          autoFocus
        />
      </Modal>

      {isDeleteModalOpen && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete conversation"
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
                onClick={() => deleteConversation()}
                disabled={isDeleting}
                icon={isDeleting ? <Spinner className="size-4" /> : undefined}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </>
          }
        >
          <p className="text-gray-600 dark:text-gray-300">
            You&apos;re about to delete <span className="font-semibold">{displayTitle}</span>. This
            can&apos;t be undone.
          </p>
        </Modal>
      )}
    </>
  );
}
