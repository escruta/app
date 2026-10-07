import type { Note } from "@/interfaces";
import { AddIcon, EditIcon } from "@/components/icons";
import { NoteChip } from "./NoteChip";
import { IconButton, Spinner, Tooltip, SidePanel, PanelList, PanelListItem } from "@/components/ui";
import { useFetch } from "@/hooks";
import { useEffect } from "react";

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

  useEffect(() => {
    if (refreshTrigger !== undefined) {
      refetchNotes(true);
    }
  }, [refreshTrigger]);

  const { loading: addingNote, refetch: createNote } = useFetch<Note>(
    `/notes`,
    {
      method: "POST",
      data: {
        title: "New Note",
        notebookId: notebookId,
      },
      onSuccess: (newNote) => {
        useFetch.clearCache();
        refetchNotes(true);
        if (onNoteSelect) onNoteSelect(newNote);
      },
      onError: (error) => {
        console.error("Error adding note:", error.message);
      },
    },
    false,
  );

  return (
    <SidePanel
      title="Notes"
      actions={
        <Tooltip text={addingNote ? "Adding note..." : "Add note"} position="bottom">
          <IconButton
            icon={addingNote ? <Spinner /> : <AddIcon />}
            variant="primary"
            size="sm"
            onClick={() => createNote()}
            disabled={addingNote}
          />
        </Tooltip>
      }
      contentClassName="px-4"
    >
      {loading ? (
        <div className="flex size-full items-center justify-center">
          <Spinner />
        </div>
      ) : error ? (
        <div className="text-sm text-red-500">We couldn't load your notes: {error.message}</div>
      ) : notes && notes.length > 0 ? (
        <PanelList className="flex flex-col gap-2 py-4">
          {[...notes]
            .sort((a, b) => a.title.localeCompare(b.title))
            .map((note) => (
              <PanelListItem key={note.id}>
                <NoteChip note={note} onSelect={onNoteSelect} />
              </PanelListItem>
            ))}
        </PanelList>
      ) : (
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
      )}
    </SidePanel>
  );
}
