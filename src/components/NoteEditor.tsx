import { lazy } from "react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useFetch } from "@/hooks";
import type { Note } from "@/interfaces";
import { CloseIcon, CompressIcon, DeleteIcon, ExpandIcon } from "@/components/icons";
import { Button, Card, Divider, IconButton, Modal, Spinner, Tooltip } from "@/components/ui";
const Editor = lazy(() => import("./Editor").then((module) => ({ default: module.Editor })));

interface NoteEditorProps {
  note: Note;
  handleCloseNote: () => void;
  onNoteDeleted: () => void;
  onNoteUpdated?: (note: Note) => void;
  onExpandedChange?: (isExpanded: boolean) => void;
  className?: string;
}

export function NoteEditor({
  note,
  handleCloseNote,
  className,
  onNoteDeleted,
  onNoteUpdated,
  onExpandedChange,
}: NoteEditorProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    if (onExpandedChange) {
      onExpandedChange(isExpanded);
    }
  }, [isExpanded, onExpandedChange]);

  const {
    data: fullNote,
    loading,
    error,
    refetch: refetchNote,
  } = useFetch<Note>(`/notes/${note.id}`);

  const [newTitle, setNewTitle] = useState<string>(note.title);
  const [content, setContent] = useState<string>("");
  const [originalContent, setOriginalContent] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [currentNoteId, setCurrentNoteId] = useState<string>(note.id);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (note.id !== currentNoteId) {
      setContent("");
      setOriginalContent("");
      setCurrentNoteId(note.id);
    }
  }, [note.id, currentNoteId]);

  useEffect(() => {
    if (fullNote?.content !== undefined) {
      const noteContent = fullNote.content || "";
      setContent(noteContent);
      setOriginalContent(noteContent);
    }
  }, [fullNote?.content]);

  const { loading: updatingNote, refetch: updateNote } = useFetch<Note>(
    `/notes`,
    {
      method: "PUT",
      data: {
        id: note.id,
        title: newTitle,
        content: fullNote?.content || null,
      },
      onSuccess: (updatedNote) => {
        useFetch.clearCache();
        note.title = newTitle;
        setNewTitle(note.title);
        if (updatedNote && onNoteUpdated) onNoteUpdated(updatedNote);
      },
      onError: (error) => {
        console.error("Error updating note:", error.message);
      },
    },
    false,
  );

  const { refetch: saveNoteContent } = useFetch<Note>(
    `/notes`,
    {
      method: "PUT",
      data: {
        id: note.id,
        content: content,
      },
      onSuccess: () => {
        useFetch.clearCache();
        setIsSaving(false);
        setOriginalContent(content);
        refetchNote(true, false);
      },
      onError: (error) => {
        console.error("Error saving note content:", error.message);
        setIsSaving(false);
      },
    },
    false,
  );

  useEffect(() => {
    if (content === originalContent || !fullNote || isSaving) return;

    const timeoutId = setTimeout(() => {
      setIsSaving(true);
      saveNoteContent(false, false);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [content, originalContent, fullNote, isSaving, saveNoteContent]);

  const {
    loading: deletingNote,
    error: deleteError,
    refetch: deleteNote,
  } = useFetch<Note>(
    `/notes/${note.id}`,
    {
      method: "DELETE",
      onSuccess: () => {
        useFetch.clearCache();
        setIsDeleteModalOpen(false);
        onNoteDeleted();
        handleCloseNote();
      },
      onError: (error) => {
        console.error("Error deleting note:", error.message);
      },
    },
    false,
  );

  return (
    <>
      <Card
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        className={cn("flex flex-col overflow-hidden p-0", className)}
      >
        <div className="mb-2 flex shrink-0 flex-row items-center justify-between px-4 pt-4">
          <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
            <span className="hidden shrink-0 text-xs font-medium tracking-wide text-gray-500 uppercase md:block dark:text-gray-400">
              Note /{" "}
            </span>
            <input
              className={cn(
                "bg-transparent border-none focus:outline-none text-lg font-semibold w-full",
                "focus:ring-0 p-0 transition-colors duration-200 truncate",
                {
                  "text-blue-600 dark:text-blue-400": updatingNote,
                },
              )}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onBlur={() => {
                if (newTitle.trim() && newTitle !== note.title) {
                  updateNote();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                }
              }}
              disabled={updatingNote}
              placeholder="Give your note a title..."
            />
          </div>
          <div className="flex gap-2">
            {(isSaving || content !== originalContent) && (
              <Tooltip
                text="Saving..."
                position="bottom"
                className="flex items-center justify-center text-gray-600 dark:text-gray-400"
              >
                <Spinner />
              </Tooltip>
            )}
            <Tooltip text="Delete note" position="bottom">
              <IconButton
                icon={<DeleteIcon />}
                variant="ghost"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
              />
            </Tooltip>
            <Tooltip text={isExpanded ? "Restore size" : "Expand"} position="bottom">
              <IconButton
                icon={isExpanded ? <CompressIcon /> : <ExpandIcon />}
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded((s) => !s)}
              />
            </Tooltip>
            <Tooltip text="Close note" position="bottom">
              <IconButton
                icon={<CloseIcon />}
                variant="ghost"
                size="sm"
                onClick={handleCloseNote}
              />
            </Tooltip>
          </div>
        </div>

        <Divider className="mb-0" />

        {loading && (
          <div className="flex size-full items-center justify-center">
            <Spinner />
          </div>
        )}
        {error && (
          <div className="text-sm text-red-500">We couldn't load this note: {error.message}</div>
        )}
        {fullNote && !loading && !error && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <Editor
              initialContent={fullNote.content || ""}
              onContentChange={setContent}
              placeholder="Write your note content here..."
              autoFocus
            />
          </div>
        )}
      </Card>

      {/* Delete Note Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete note"
        actions={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={deletingNote}
              onClick={async () => {
                await deleteNote();
              }}
              icon={deletingNote ? <Spinner /> : <DeleteIcon />}
            >
              {deletingNote ? "Deleting" : "Delete"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This will permanently delete the note, and you won't be able to undo it.
          </p>
          {deleteError && (
            <div className="text-sm text-red-500">
              We couldn't delete this note: {deleteError.message}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
