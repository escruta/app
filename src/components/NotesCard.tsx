import type { Note } from "@/interfaces";
import { AddIcon, EditIcon } from "@/components/icons";
import { NoteChip } from "./NoteChip";
import {
  Card,
  Button,
  Divider,
  Modal,
  TextField,
  Tooltip,
  Spinner,
} from "@/components/ui";
import { useFetch } from "@/hooks";
import { useState, useEffect } from "react";

interface NotesCardProps {
  notebookId: string;
  onNoteSelect?: (note: Note) => void;
  refreshTrigger?: number;
}

export function NotesCard({
  notebookId,
  onNoteSelect,
  refreshTrigger,
}: NotesCardProps) {
  const {
    data: notes,
    loading,
    error,
    refetch: refetchNotes,
  } = useFetch<Note[]>(`notebooks/${notebookId}/notes`);

  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState<boolean>(false);
  const [newNoteTitle, setNewNoteTitle] = useState<string>("");

  useEffect(() => {
    if (refreshTrigger !== undefined) {
      refetchNotes(true);
    }
  }, [refreshTrigger]);

  const {
    loading: addingNote,
    error: addingNoteError,
    refetch: addNote,
  } = useFetch<Note>(
    `notebooks/${notebookId}/notes`,
    {
      method: "POST",
      data: {
        title: newNoteTitle,
      },
      onSuccess: () => {
        setNewNoteTitle("");
        setIsAddNoteModalOpen(false);
        refetchNotes(true);
      },
      onError: (error) => {
        console.error("Error adding note:", error.message);
      },
    },
    false,
  );

  return (
    <>
      <Card className="h-full overflow-y-auto">
        <div className="flex flex-row justify-between items-center mb-2 flex-shrink-0 h-8">
          <h2 className="text-lg font-sans font-semibold">Notes</h2>
          <Tooltip text="Add a new note" position="bottom">
            <Button
              icon={<AddIcon />}
              variant="primary"
              size="sm"
              className="flex-shrink-0"
              onClick={() => setIsAddNoteModalOpen(true)}
            >
              Add note
            </Button>
          </Tooltip>
        </div>
        <Divider className="my-4" />
        {(() => {
          if (loading) {
            return (
              <div className="text-center text-gray-500 text-sm">
                Loading notes...
              </div>
            );
          }
          if (error) {
            return (
              <div className="text-red-500 text-sm">
                Error loading notes: {error.message}
              </div>
            );
          }
          if (notes && notes.length > 0) {
            return (
              <div className="flex flex-col gap-2">
                {notes
                  .sort((a, b) => a.title.localeCompare(b.title))
                  .map((note) => (
                    <NoteChip
                      key={note.id}
                      note={note}
                      onSelect={onNoteSelect}
                    />
                  ))}
              </div>
            );
          }
          return (
            <div className="flex flex-col items-center justify-center text-center py-10 px-4">
              <div className="size-20 bg-blue-50 dark:bg-blue-950/30 rounded-xs flex items-center justify-center mb-5 shadow-sm border border-blue-300 dark:border-blue-700">
                <div className="size-10 text-blue-500 dark:text-blue-400">
                  <EditIcon />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No notes yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
                Create your first note to start capturing ideas and insights
                from your sources.
              </p>
            </div>
          );
        })()}
      </Card>

      {/* Add Note Modal */}
      <Modal
        isOpen={isAddNoteModalOpen}
        onClose={() => setIsAddNoteModalOpen(false)}
        title="Add note"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsAddNoteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                await addNote();
              }}
              disabled={!newNoteTitle.trim() || addingNote}
              icon={addingNote ? <Spinner /> : <AddIcon />}
            >
              {addingNote ? "Adding" : "Add"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextField
            id="note-title"
            label="Note Title"
            type="text"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            placeholder="Enter new note title"
            autoFocus
          />
          {addingNoteError && (
            <div className="text-red-500 text-sm">
              Error: {addingNoteError.message}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
