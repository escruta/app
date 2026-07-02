import { lazy, useEffect, useState } from "react";
import { useLoaderData, useNavigate } from "react-router";
import { useFetch } from "@/hooks";
import type { Note } from "@/interfaces";
import { Button, IconButton, Modal, Spinner, Tooltip } from "@/components/ui";
import { DeleteIcon } from "@/components/icons";
import { SEOMetadata, TopBar } from "@/components";
import { SimpleBackground } from "@/components/backgrounds/SimpleBackground";
import { cn } from "@/lib/utils";

const Editor = lazy(() =>
  import("@/components/Editor").then((module) => ({ default: module.Editor })),
);

export default function NotePage() {
  const noteId: string = useLoaderData();
  const navigate = useNavigate();

  const { data: note, loading, error, refetch: refetchNote } = useFetch<Note>(`/notes/${noteId}`);

  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [originalContent, setOriginalContent] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
    }
  }, [note?.title]);

  useEffect(() => {
    if (note?.content !== undefined) {
      const noteContent = note.content || "";
      setContent(noteContent);
      setOriginalContent(noteContent);
    }
  }, [note?.content]);

  const { loading: updatingNote, refetch: updateNote } = useFetch<Note>(
    `/notes`,
    {
      method: "PUT",
      data: {
        id: noteId,
        title: title,
        content: note?.content || null,
      },
      onError: (err) => {
        console.error("Error updating note:", err.message);
      },
    },
    false,
  );

  const { refetch: saveNoteContent } = useFetch<Note>(
    `/notes`,
    {
      method: "PUT",
      data: {
        id: noteId,
        content: content,
      },
      onSuccess: () => {
        useFetch.clearCache();
        setIsSaving(false);
        setOriginalContent(content);
        refetchNote(true, false);
      },
      onError: (err) => {
        console.error("Error saving note content:", err.message);
        setIsSaving(false);
      },
    },
    false,
  );

  useEffect(() => {
    if (content === originalContent || !note || isSaving) return;

    const timeoutId = setTimeout(() => {
      setIsSaving(true);
      saveNoteContent(false, false);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [content, originalContent, note, isSaving, saveNoteContent]);

  const {
    loading: deletingNote,
    error: deleteError,
    refetch: deleteNote,
  } = useFetch<Note>(
    `/notes/${noteId}`,
    {
      method: "DELETE",
      onSuccess: () => {
        useFetch.clearCache();
        navigate("/notes", { replace: true });
      },
      onError: (err) => {
        console.error("Error deleting note:", err.message);
      },
    },
    false,
  );

  const renderTopBarTitle = (subtitle: React.ReactNode) => (
    <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
      <span className="hidden shrink-0 text-xs font-medium tracking-wide text-gray-500 uppercase md:block dark:text-gray-400">
        Note /{" "}
      </span>
      {subtitle}
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-screen max-h-full w-full flex-col">
        <TopBar title={renderTopBarTitle(<span className="opacity-0">Loading</span>)} />
        <div className="relative flex flex-1 items-center justify-center overflow-hidden">
          <SimpleBackground />
          <Spinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen max-h-full w-full flex-col">
        <TopBar
          title={renderTopBarTitle(<span className="text-gray-400">Error loading note</span>)}
        />
        <div className="relative flex flex-1 items-center justify-center overflow-hidden">
          <SimpleBackground />
          <div className="text-sm text-red-500">Error loading note: {error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen max-h-full w-full flex-col">
      <SEOMetadata
        title={`${note?.title || "Note"} - Escruta`}
        description="View and edit your note."
      />
      <TopBar
        title={renderTopBarTitle(
          <input
            className={cn(
              "w-full truncate bg-transparent p-0 text-lg font-semibold transition-colors duration-200 focus:outline-none focus:ring-0 border-none",
              {
                "text-blue-600 dark:text-blue-400": updatingNote,
              },
            )}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              if (title.trim() && title !== note?.title) {
                updateNote();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              }
            }}
            disabled={updatingNote}
            placeholder="Enter note title"
          />,
        )}
        actions={
          <>
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
          </>
        }
      />

      <div className="relative flex-1 overflow-y-auto p-3 md:p-4">
        <SimpleBackground />
        <div className="mx-auto flex min-h-full max-w-4xl flex-col">
          {note && !loading && !error && (
            <Editor
              initialContent={note.content || ""}
              onContentChange={setContent}
              placeholder="Write your note content here..."
              autoFocus
              scrollable={false}
            />
          )}
        </div>
      </div>

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
            Are you sure you want to delete this note? This action cannot be undone.
          </p>
          {deleteError && <div className="text-sm text-red-500">Error: {deleteError.message}</div>}
        </div>
      </Modal>
    </div>
  );
}
