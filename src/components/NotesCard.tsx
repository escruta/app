import type { Note } from "@/interfaces";
import { AddIcon, EditIcon } from "@/components/icons";
import { NoteChip } from "./NoteChip";
import { Card, Button, Divider, Modal, TextField, Spinner } from "@/components/ui";
import { useFetch } from "@/hooks";
import { useState, useEffect } from "react";

interface NotesCardProps {
  notebookId: string;
  onNoteSelect?: (note: Note) => void;
  refreshTrigger?: number;
}

export function NotesCard({ notebookId, onNoteSelect, refreshTrigger }: NotesCardProps) {
  const {
    data: notes,
    loading,
    error,
    refetch: refetchNotes,
  } = useFetch<Note[]>(`/notes?notebookId=${notebookId}`);

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
    `/notes`,
    {
      method: "POST",
      data: {
        title: newNoteTitle,
        notebookId: notebookId,
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
      <Card className="flex h-full flex-col overflow-hidden p-0">
        <div className="z-10 shrink-0 rounded-t-xs bg-white dark:bg-gray-900">
          <div className="flex flex-row items-center justify-between p-4">
            <h2 className="font-sans text-lg font-semibold">Notes</h2>
            <Button
              icon={<AddIcon />}
              variant="primary"
              size="sm"
              className="flex-shrink-0"
              onClick={() => setIsAddNoteModalOpen(true)}
            >
              Add note
            </Button>
          </div>
          <Divider className="my-0" />
        </div>
        <div className="w-full flex-1 overflow-y-auto px-4">
          {(() => {
            if (loading) {
              return <div className="text-center text-sm text-gray-500">Loading notes...</div>;
            }
            if (error) {
              return (
                <div className="text-sm text-red-500">Error loading notes: {error.message}</div>
              );
            }
            if (notes && notes.length > 0) {
              return (
                <div className="flex flex-col gap-2 py-4">
                  {notes
                    .sort((a, b) => a.title.localeCompare(b.title))
                    .map((note) => (
                      <NoteChip key={note.id} note={note} onSelect={onNoteSelect} />
                    ))}
                </div>
              );
            }
            return (
              <div className="flex size-full flex-col items-center justify-start pt-24 text-center">
                <div className="mb-5 flex size-20 items-center justify-center rounded-xs border border-blue-300 bg-blue-50 shadow-sm dark:border-blue-700 dark:bg-blue-950/30">
                  <div className="size-10 text-blue-500 dark:text-blue-400">
                    <EditIcon />
                  </div>
                </div>
                <h3 className="text-foreground mb-2 text-lg font-semibold">No notes yet</h3>
                <p className="max-w-xs text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  Create your first note to start capturing ideas and insights from your sources.
                </p>
              </div>
            );
          })()}
        </div>
      </Card>

      {/* Add Note Modal */}
      <Modal
        isOpen={isAddNoteModalOpen}
        onClose={() => setIsAddNoteModalOpen(false)}
        title="Add note"
        actions={
          <>
            <Button variant="secondary" onClick={() => setIsAddNoteModalOpen(false)}>
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
            label="Title of the note"
            type="text"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            placeholder="Enter new note title"
            autoFocus
          />
          {addingNoteError && (
            <div className="text-sm text-red-500">Error: {addingNoteError.message}</div>
          )}
        </div>
      </Modal>
    </>
  );
}
