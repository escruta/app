import type { Folder, Notebook } from "@/interfaces";
import {
  Alert,
  Button,
  Chip,
  Menu,
  MenuLabel,
  Modal,
  IconButton,
  SelectList,
  Spinner,
  TextField,
  Tooltip,
  MenuTrigger,
  MenuContent,
  MenuItem,
} from "@/components/ui";
import {
  NotebookIcon,
  DotsVerticalIcon,
  EditIcon,
  DeleteIcon,
  FolderIcon,
} from "@/components/icons";
import { useState } from "react";
import { useFetch } from "@/hooks";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import { RenameNotebookModal } from "@/app/pages/notebook/RenameNotebookModal";

interface NotebookCardProps {
  notebook: Notebook;
  viewMode?: "grid" | "list";
  folders?: Folder[];
  folderTitle?: string;
  onChange?: () => void;
}

export function NotebookCard({
  notebook,
  viewMode = "grid",
  folders,
  folderTitle,
  onChange,
}: NotebookCardProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string>("");
  const [isDeleted, setIsDeleted] = useState<boolean>(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>(notebook.title);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState<boolean>(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    notebook.folderId ?? null,
  );
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

  const { loading: movingNotebook, refetch: moveNotebook } = useFetch<Notebook>(
    "/notebooks",
    {
      method: "PUT",
      data: {
        id: notebook.id,
        folderId: selectedFolderId,
        removeFolder: selectedFolderId === null,
      },
      onSuccess: () => {
        useFetch.clearCache("/notebooks");
        setIsMoveModalOpen(false);
        onChange?.();
      },
    },
    false,
  );

  function handleOpenMoveModal() {
    setSelectedFolderId(notebook.folderId ?? null);
    setIsMoveModalOpen(true);
  }

  async function handleMoveNotebook() {
    if ((notebook.folderId ?? null) === selectedFolderId) {
      setIsMoveModalOpen(false);
      return;
    }
    await moveNotebook();
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
    "group z-10 rounded-xs border cursor-pointer transition-all duration-300 ease-out",
    "bg-white dark:bg-gray-900",
    "border-gray-200 dark:border-gray-700",
    "hover:bg-blue-50 dark:hover:bg-gray-800",
    "hover:border-blue-300 dark:hover:border-gray-500",
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
        <Tooltip text="More options" position="top">
          <MenuTrigger>
            <IconButton
              icon={<DotsVerticalIcon />}
              size="sm"
              ariaLabel="More options"
              variant="ghost"
            />
          </MenuTrigger>
        </Tooltip>
        <MenuContent>
          <MenuItem
            icon={<FolderIcon className="size-4" />}
            label="Move to folder"
            onClick={handleOpenMoveModal}
          />
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
        })}
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
      >
        {viewMode === "grid" ? (
          <>
            <div className="flex items-start justify-between">
              <div className="shrink-0 rounded-xs bg-blue-100 p-2 dark:bg-blue-900/50">
                <div className="flex size-4 items-center justify-center text-blue-600 dark:text-blue-400 [&>svg]:h-full [&>svg]:w-full">
                  <NotebookIcon />
                </div>
              </div>
              <div className="flex items-center gap-2">
                {notebook.folderId && folderTitle && (
                  <div
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tooltip text={folderTitle} position="top">
                      <Chip
                        size="sm"
                        icon={<FolderIcon className="size-2.5" />}
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
              <div className="shrink-0 rounded-xs bg-blue-100 p-2 dark:bg-blue-900/50">
                <div className="flex size-4 items-center justify-center text-blue-600 dark:text-blue-400 [&>svg]:h-full [&>svg]:w-full">
                  <NotebookIcon />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-semibold text-gray-900 transition-colors duration-300 group-hover:text-blue-900 dark:text-gray-100 dark:group-hover:text-blue-100">
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
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold">This action cannot be undone.</span> All notes and data
            associated with this notebook will be permanently deleted.
          </p>

          <TextField
            id="delete-confirmation"
            label="Type 'delete this notebook' to confirm"
            type="text"
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            autoFocus
          />

          {deleteError && <Alert variant="danger" title={deleteError.message} />}
        </div>
      </Modal>

      {/* Move to Folder Modal */}
      <Modal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        title={`Move "${notebook.title}"`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setIsMoveModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleMoveNotebook}
              disabled={movingNotebook}
              icon={movingNotebook ? <Spinner className="size-4" /> : undefined}
            >
              {movingNotebook ? "Moving" : "Move"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-2">
          <MenuLabel>Move to folder</MenuLabel>
          <SelectList
            options={(folders ?? []).map((folder) => ({
              id: folder.id,
              label: folder.title,
              icon: <FolderIcon />,
            }))}
            selectedId={selectedFolderId}
            onSelect={setSelectedFolderId}
            emptyText="No folders yet"
          />
          {selectedFolderId === null && (notebook.folderId ?? null) !== null && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This will remove the notebook from its current folder.
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
