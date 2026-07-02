import type { Note } from "@/interfaces";
import {
  Button,
  Chip,
  Modal,
  Menu,
  IconButton,
  Spinner,
  Tooltip,
  MenuTrigger,
  MenuContent,
  MenuItem,
} from "@/components/ui";
import { NoteIcon, DotsVerticalIcon, DeleteIcon, NotebookIcon } from "@/components/icons";
import { useState } from "react";
import { useFetch } from "@/hooks";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";

interface NoteCardProps {
  note: Note;
  viewMode?: "grid" | "list";
  notebookTitle?: string;
  onChange?: () => void;
}

export function NoteCard({ note, viewMode = "grid", notebookTitle, onChange }: NoteCardProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isDeleted, setIsDeleted] = useState<boolean>(false);
  const navigate = useNavigate();

  const {
    loading: deletingNote,
    error: deleteError,
    refetch: deleteNote,
  } = useFetch<Note>(
    `/notes/${note.id}`,
    {
      method: "DELETE",
      onSuccess: () => {
        useFetch.clearCache(`/notes`);
        useFetch.clearCache(`/notebooks/${note.notebookId}`);
      },
    },
    false,
  );

  async function handleDeleteNote() {
    try {
      await deleteNote();
      setIsDeleted(true);
      setIsDeleteModalOpen(false);
      useFetch.clearCache("/notes");
      onChange?.();
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date)
      .toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
      .replace(".", "");
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (isDeleted) {
    return null;
  }

  const baseClasses = cn(
    "group z-10 rounded-xs border cursor-pointer transition-all duration-300 ease-out",
    "bg-white dark:bg-gray-900",
    "border-gray-200 dark:border-gray-700",
    "hover:bg-blue-50 dark:hover:bg-gray-800",
    "hover:border-blue-300 dark:hover:border-gray-500",
  );

  const gridClasses = cn("h-40 w-full p-4 flex flex-col justify-between");
  const listClasses = cn("h-20 w-full p-4 flex flex-row items-center justify-between");

  const handleCardClick = () => {
    navigate(`/note/${note.id}`);
    window.scrollTo(0, 0);
  };

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  };

  const renderMenu = () => (
    <div
      role="button"
      tabIndex={0}
      onClick={handleMenuClick}
      onKeyDown={(e) => e.key === "Enter" && handleMenuClick(e as unknown as React.MouseEvent)}
    >
      <Menu>
        <MenuTrigger>
          <IconButton
            icon={<DotsVerticalIcon />}
            size="sm"
            ariaLabel="More options"
            variant="ghost"
          />
        </MenuTrigger>
        <MenuContent>
          <MenuItem
            icon={<DeleteIcon />}
            label="Delete"
            onClick={() => setIsDeleteModalOpen(true)}
            variant="danger"
          />
        </MenuContent>
      </Menu>
    </div>
  );

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        className={cn(baseClasses, {
          [gridClasses]: viewMode === "grid",
          [listClasses]: viewMode === "list",
        })}
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
      >
        {viewMode === "grid" ? (
          <>
            <div className="flex items-start justify-between">
              <div className="shrink-0 rounded-xs bg-blue-100 p-2 dark:bg-blue-900/50">
                <div className="flex size-4 items-center justify-center text-blue-600 dark:text-blue-400 [&>svg]:h-full [&>svg]:w-full">
                  <NoteIcon />
                </div>
              </div>
              <div className="flex items-center gap-2">
                {note.notebookId && notebookTitle && (
                  <div
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tooltip text={notebookTitle} position="top">
                      <Chip
                        size="sm"
                        icon={<NotebookIcon className="size-2.5" />}
                        onClick={() => navigate(`/notebook/${note.notebookId}`)}
                        className="border-none bg-gray-50/40 opacity-40 transition-opacity hover:opacity-100 dark:bg-gray-800/40"
                      />
                    </Tooltip>
                  </div>
                )}
                {renderMenu()}
              </div>
            </div>

            <div>
              <h2 className="mb-1 line-clamp-2 text-lg font-semibold text-gray-900 transition-colors duration-300 group-hover:text-blue-900 dark:text-gray-100 dark:group-hover:text-blue-100">
                {note.title}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(note.updatedAt)}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="shrink-0 rounded-xs bg-blue-100 p-2 dark:bg-blue-900/50">
                <div className="flex size-4 items-center justify-center text-blue-600 dark:text-blue-400 [&>svg]:h-full [&>svg]:w-full">
                  <NoteIcon />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-semibold text-gray-900 transition-colors duration-300 group-hover:text-blue-900 dark:text-gray-100 dark:group-hover:text-blue-100">
                  {note.title}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(note.updatedAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {note.notebookId && notebookTitle && (
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Tooltip text={notebookTitle} position="top">
                    <Chip
                      size="sm"
                      icon={<NotebookIcon className="size-2.5" />}
                      onClick={() => navigate(`/notebook/${note.notebookId}`)}
                      className="border-none bg-gray-50/40 opacity-40 transition-opacity hover:opacity-100 dark:bg-gray-800/40"
                    />
                  </Tooltip>
                </div>
              )}
              {renderMenu()}
            </div>
          </>
        )}
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={`Delete note "${note.title}"`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteNote}
              disabled={deletingNote}
              icon={deletingNote ? <Spinner /> : undefined}
            >
              {deletingNote ? "Deleting" : "Delete"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to delete this note? This action cannot be undone.
          </p>
          {deleteError && <div className="text-sm text-red-500">Error: {deleteError.message}</div>}
        </div>
      </Modal>
    </>
  );
}
