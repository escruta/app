import { TextField, Button, Modal, Spinner } from "@/components/ui";
import { EditIcon } from "@/components/icons";

interface RenameNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  newTitle: string;
  setNewTitle: (title: string) => void;
  handleRenameNotebook: () => void;
  renamingNotebook: boolean;
  renameError: any;
}

export function RenameNotebookModal({
  isOpen,
  onClose,
  newTitle,
  setNewTitle,
  handleRenameNotebook,
  renamingNotebook,
  renameError,
}: RenameNotebookModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rename notebook"
      onSubmit={() => {
        if (newTitle.trim() && !renamingNotebook) handleRenameNotebook();
      }}
      actions={
        <>
          <Button variant="secondary" onClick={onClose} disabled={renamingNotebook}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleRenameNotebook}
            disabled={!newTitle.trim() || renamingNotebook}
            icon={renamingNotebook ? <Spinner /> : <EditIcon />}
          >
            {renamingNotebook ? "Renaming" : "Rename"}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <TextField
          id="notebook-title"
          label="Name your notebook"
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Give your notebook a title..."
          autoFocus
        />
        {renameError && (
          <div className="rounded-xs border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-500 dark:border-red-800 dark:bg-red-950">
            We couldn't rename the notebook: {renameError.message}
          </div>
        )}
      </div>
    </Modal>
  );
}
