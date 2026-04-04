import type { Notebook } from "@/interfaces";
import {
  Alert,
  Button,
  Menu,
  Modal,
  IconButton,
  Spinner,
  TextField,
  MenuTrigger,
  MenuContent,
  MenuItem,
} from "@/components/ui";
import { NotebookIcon, DotsVerticalIcon, EditIcon, DeleteIcon } from "@/components/icons";
import { useState } from "react";
import { useFetch } from "@/hooks";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import { RenameNotebookModal } from "@/app/pages/notebook/RenameNotebookModal";

interface NotebookCardProps {
  notebook: Notebook;
  viewMode?: "grid" | "list";
  onChange?: () => void;
}

export function NotebookCard({ notebook, viewMode = "grid", onChange }: NotebookCardProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string>("");
  const [isDeleted, setIsDeleted] = useState<boolean>(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>(notebook.title);
  const navigate = useNavigate();

  const {
    loading: deletingNotebook,
    error: deleteError,
    refetch: deleteNotebook,
  } = useFetch<Notebook>(
    "/notebooks",
    {
      method: "DELETE",
      data: {
        id: notebook.id,
      },
      onSuccess: () => {
        useFetch.clearCache(`/notebooks/${notebook.id}`);
        useFetch.clearCache(`/notebooks`);
        useFetch.clearCache(`/notes`);
      },
    },
    false,
  );

  const {
    loading: renamingNotebook,
    error: renameError,
    refetch: renameNotebook,
  } = useFetch<Notebook>(
    "/notebooks",
    {
      method: "PUT",
      data: {
        id: notebook.id,
        title: newTitle,
      },
      onSuccess: () => {
        useFetch.clearCache(`/notebooks/${notebook.id}`);
        useFetch.clearCache(`/notebooks`);
        useFetch.clearCache(`/notes`);
      },
    },
    false,
  );

  async function handleRenameNotebook() {
    try {
      await renameNotebook();
      setIsRenameModalOpen(false);
      useFetch.clearCache(`/notebooks`);
      useFetch.clearCache(`/notebooks/${notebook.id}`);
      onChange?.();
    } catch (error) {
      console.error("Error renaming notebook:", error);
    }
  }

  async function handleDeleteNotebook() {
    try {
      await deleteNotebook();
      setIsDeleted(true);
      setIsDeleteModalOpen(false);
      setDeleteConfirmation("");
      useFetch.clearCache("/notebooks");
      onChange?.();
    } catch (error) {
      console.error("Error deleting notebook:", error);
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
    "z-10 rounded-xs border cursor-pointer bg-white hover:bg-blue-50/50 dark:bg-gray-900 dark:hover:bg-gray-800/80 border-gray-200 dark:border-gray-700 transition-all duration-200 ease-out",
  );

  const gridClasses = cn("h-40 w-full p-4 flex flex-col justify-between");
  const listClasses = cn("h-20 w-full p-4 flex flex-row items-center justify-between");

  const handleCardClick = () => {
    navigate(`/notebook/${notebook.id}`);
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
          <MenuItem icon={<EditIcon />} label="Rename" onClick={() => setIsRenameModalOpen(true)} />
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
          "md:min-w-44 md:max-w-52": viewMode === "grid",
        })}
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
      >
        {viewMode === "grid" ? (
          <>
            <div className="flex items-start justify-between">
              <div className="bg-blue-25 rounded-xs p-2 text-blue-500 dark:bg-blue-900/30 dark:text-blue-300">
                <NotebookIcon className="h-5 w-5" />
              </div>
              {renderMenu()}
            </div>

            <div>
              <h2 className="mb-1 line-clamp-2 text-lg font-semibold text-gray-900 dark:text-white">
                {notebook.title}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(notebook.updatedAt)}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="bg-blue-25 rounded-xs p-2 text-blue-500 dark:bg-blue-900/30 dark:text-blue-300">
                <div className="flex h-6 w-6 items-center justify-center [&>svg]:h-full [&>svg]:w-full">
                  <NotebookIcon />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
                  {notebook.title}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(notebook.updatedAt)}
                </p>
              </div>
            </div>

            {renderMenu()}
          </>
        )}
      </div>

      <RenameNotebookModal
        isOpen={isRenameModalOpen}
        onClose={() => {
          setIsRenameModalOpen(false);
          setNewTitle(notebook.title);
        }}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        handleRenameNotebook={handleRenameNotebook}
        renamingNotebook={renamingNotebook}
        renameError={renameError}
      />

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteConfirmation("");
        }}
        title={`Delete notebook "${notebook.title}"`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteNotebook}
              disabled={
                deleteConfirmation.toLowerCase() !== "delete this notebook" || deletingNotebook
              }
              icon={deletingNotebook ? <Spinner /> : undefined}
            >
              {deletingNotebook ? "Deleting" : "Delete"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Alert
            variant="danger"
            title="Warning: This action cannot be undone"
            message={`Are you sure you want to delete "${notebook.title}"? All notes and data associated with this notebook will be permanently deleted.`}
          />

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Please type <span className="font-bold">delete this notebook</span> to confirm.
          </p>

          <TextField
            id="delete-confirmation"
            label="Confirmation"
            type="text"
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            placeholder="Type 'delete this notebook' to confirm"
            autoFocus
          />

          {deleteError && <div className="text-sm text-red-500">Error: {deleteError.message}</div>}
        </div>
      </Modal>
    </>
  );
}
