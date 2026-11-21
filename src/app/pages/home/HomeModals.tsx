import { Button, Modal, Spinner, TextField } from "@/components/ui";
import { AddIcon, FolderIcon } from "@/components/icons";
import type { Folder } from "@/interfaces";

interface CreateNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onTitleChange: (value: string) => void;
  activeFolder?: Folder;
  creating: boolean;
  error?: { message: string } | null;
  onCreate: () => void;
}

export function CreateNotebookModal({
  isOpen,
  onClose,
  title,
  onTitleChange,
  activeFolder,
  creating,
  error,
  onCreate,
}: CreateNotebookModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New notebook"
      onSubmit={() => {
        if (title.trim() && !creating) onCreate();
      }}
      actions={
        <>
          <Button variant="secondary" onClick={onClose} disabled={creating}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onCreate}
            disabled={!title.trim() || creating}
            icon={creating ? <Spinner /> : <AddIcon />}
          >
            {creating ? "Creating" : "Create"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextField
          id="notebook-title"
          label="Name your notebook"
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="e.g., Research on climate policy"
          autoFocus
        />
        {activeFolder && (
          <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <FolderIcon className="size-3.5 shrink-0 text-blue-500 dark:text-blue-400" />
            <span className="truncate">
              Will be created in{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {activeFolder.title}
              </span>
            </span>
          </p>
        )}
        {error && (
          <div className="text-sm text-red-500">
            Something went wrong while creating the notebook: {error.message}
          </div>
        )}
      </div>
    </Modal>
  );
}

interface FolderModalProps {
  isOpen: boolean;
  isEditing: boolean;
  title: string;
  onTitleChange: (value: string) => void;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function FolderModal({
  isOpen,
  isEditing,
  title,
  onTitleChange,
  saving,
  onClose,
  onSave,
}: FolderModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Rename folder" : "New folder"}
      onSubmit={() => {
        if (title.trim() && !saving) onSave();
      }}
      actions={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onSave} disabled={saving || !title.trim()}>
            {saving ? (
              <div className="flex items-center gap-2">
                <Spinner className="size-4" />
                {isEditing ? "Saving..." : "Creating..."}
              </div>
            ) : isEditing ? (
              "Rename folder"
            ) : (
              "Create folder"
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextField
          id="folder-name-input"
          label="Name your folder"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="e.g., Ideas, Thesis, Travel…"
          autoFocus
        />
      </div>
    </Modal>
  );
}

interface DeleteFolderModalProps {
  folder: Folder | null;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteFolderModal({
  folder,
  deleting,
  onClose,
  onConfirm,
}: DeleteFolderModalProps) {
  return (
    <Modal
      isOpen={Boolean(folder)}
      onClose={onClose}
      title="Delete folder"
      actions={
        <>
          <Button variant="secondary" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={deleting}>
            {deleting ? (
              <div className="flex items-center gap-2">
                <Spinner className="size-4" />
                Deleting...
              </div>
            ) : (
              "Delete"
            )}
          </Button>
        </>
      }
    >
      <p className="text-gray-600 dark:text-gray-300">
        You're about to delete <span className="font-semibold">{folder?.title}</span>. This can't be
        undone, any notebooks inside will stay in your library, just moved out of the folder.
      </p>
    </Modal>
  );
}
