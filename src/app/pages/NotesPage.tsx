import { useState, useMemo } from "react";
import type { Note, Notebook } from "@/interfaces";
import { useFetch, useCookie } from "@/hooks";
import {
  Button,
  Modal,
  TextField,
  Spinner,
  Dropdown,
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  MenuLabel,
  IconButton,
} from "@/components/ui";
import { CommonBar, SEOMetadata, NoteChip, NoteEditor } from "@/components";
import {
  AddIcon,
  NoteIcon,
  NotebookIcon,
  ChevronIcon,
  CheckIcon,
  DotsVerticalIcon,
  CloseIcon,
} from "@/components/icons";
import { getRouteMetadata } from "@/lib/seo";
import { motion } from "motion/react";
import { SimpleBackground } from "@/components/backgrounds/SimpleBackground";
import { cn } from "@/lib/utils";

enum SortOptions {
  Newest = "Newest",
  Oldest = "Oldest",
  Alphabetical = "Alphabetical",
  ReverseAlphabetical = "Reverse Alphabetical",
}

export default function NotesPage() {
  const {
    data: notes,
    loading: notesLoading,
    error: notesError,
    refetch: refetchNotes,
  } = useFetch<Note[]>("/notes");
  const {
    data: notebooks,
    loading: notebooksLoading,
    error: notebooksError,
  } = useFetch<Notebook[]>("/notebooks");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);
  const [expandedNotebooks, setExpandedNotebooks] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useCookie<SortOptions>("noteSortPreference", SortOptions.Newest);

  const {
    loading: savingNote,
    error: saveError,
    refetch: createNote,
  } = useFetch<Note>(
    "/notes",
    {
      method: "POST",
      data: {
        title: noteTitle,
        notebookId: selectedNotebookId,
      },
      onSuccess: (newNote) => {
        useFetch.clearCache();
        closeModals();
        refetchNotes(true);
        if (newNote) setSelectedNote(newNote);
      },
    },
    false,
  );

  const closeModals = () => {
    setIsCreateModalOpen(false);
    setNoteTitle("");
    setSelectedNotebookId(null);
  };

  const openCreateModal = () => {
    setNoteTitle("");
    setSelectedNotebookId(null);
    setIsCreateModalOpen(true);
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
  };

  const toggleNotebook = (notebookId: string) => {
    setExpandedNotebooks((prev) => ({
      ...prev,
      [notebookId]: !prev[notebookId],
    }));
  };

  const { groupedNotes, unassignedNotes } = useMemo(() => {
    if (!notes) return { groupedNotes: {}, unassignedNotes: [] };

    const sortNotes = (notesArray: Note[]) => {
      const sortedArray = [...notesArray];
      switch (sortBy) {
        case SortOptions.Newest:
          return sortedArray.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
        case SortOptions.Oldest:
          return sortedArray.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
        case SortOptions.Alphabetical:
          return sortedArray.sort((a, b) => a.title.localeCompare(b.title));
        case SortOptions.ReverseAlphabetical:
          return sortedArray.sort((a, b) => b.title.localeCompare(a.title));
        default:
          return sortedArray;
      }
    };

    const result = notes.reduce(
      (acc, note) => {
        if (!note.notebookId) {
          acc.unassignedNotes.push(note);
        } else {
          if (!acc.groupedNotes[note.notebookId]) {
            acc.groupedNotes[note.notebookId] = [];
          }
          acc.groupedNotes[note.notebookId].push(note);
        }
        return acc;
      },
      { groupedNotes: {} as Record<string, Note[]>, unassignedNotes: [] as Note[] },
    );

    result.unassignedNotes = sortNotes(result.unassignedNotes);
    for (const notebookId in result.groupedNotes) {
      result.groupedNotes[notebookId] = sortNotes(result.groupedNotes[notebookId]);
    }

    return result;
  }, [notes, sortBy]);

  if (notesLoading || notebooksLoading) {
    return (
      <div className="flex h-screen w-full flex-col justify-center">
        <div className="border-y border-gray-200 bg-gray-50 px-6 py-5 dark:border-gray-700 dark:bg-gray-950">
          <div className="flex items-center justify-center py-12">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="mb-4 inline-block h-8 w-8 rounded-xs border-2 border-blue-500 border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
              <p className="font-medium text-gray-600 dark:text-gray-400">Loading notes...</p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  if (notesError || notebooksError) {
    return (
      <div className="flex h-screen w-full flex-col justify-center">
        <div className="border-y border-gray-200 bg-gray-50 px-6 py-5 dark:border-gray-700 dark:bg-gray-950">
          <motion.div
            className="flex items-center justify-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="max-w-md text-center">
              <h1 className="mb-2 text-lg font-medium text-red-600 dark:text-red-400">
                Error loading notes
              </h1>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {notesError?.message || notebooksError?.message}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const metadata = getRouteMetadata("/notes") || { title: "Notes - Escruta" };

  return (
    <div className="relative flex h-screen max-h-full w-full flex-col">
      <SEOMetadata title={metadata.title} description={metadata.description} />

      <div className="z-20 border-b border-gray-200 bg-white px-4 py-4 md:px-6 dark:border-gray-700 dark:bg-black">
        <div className="flex items-center justify-between gap-2">
          <h1 className="flex min-w-0 flex-1 items-center gap-1.5 text-gray-900 select-text *:leading-7 dark:text-white">
            <span className="truncate text-2xl font-bold">Notes</span>
          </h1>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col overflow-hidden md:flex-row">
        <SimpleBackground />

        <div
          className={cn(
            "relative z-10 overflow-auto p-3 md:p-4 transition-all duration-300",
            selectedNote ? "hidden md:block" : "block",
            "w-full border-r border-gray-200 md:w-1/3 dark:border-gray-800",
          )}
        >
          <CommonBar className="sticky top-0 z-20 mb-4 flex items-center justify-between gap-4">
            <Button onClick={openCreateModal} className="w-full justify-center">
              Create note
            </Button>
            {notes && notes.length > 0 && (
              <Menu>
                <MenuTrigger>
                  <IconButton
                    icon={<DotsVerticalIcon />}
                    size="sm"
                    ariaLabel="Options"
                    variant="ghost"
                  />
                </MenuTrigger>
                <MenuContent align="right" className="min-w-[12rem]">
                  <div className="flex flex-col gap-0.5 p-0.5">
                    <MenuLabel>Sort by</MenuLabel>
                    {Object.values(SortOptions).map((option) => (
                      <MenuItem
                        key={option}
                        label={option}
                        onClick={() => setSortBy(option as SortOptions)}
                        icon={
                          sortBy === option ? (
                            <CheckIcon className="size-4 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <div className="size-4" />
                          )
                        }
                        className={cn(
                          sortBy === option &&
                            "bg-blue-50 text-blue-700 dark:bg-gray-800 dark:text-blue-400",
                        )}
                      />
                    ))}
                  </div>
                </MenuContent>
              </Menu>
            )}
          </CommonBar>

          {notes && notes.length > 0 ? (
            <div className="mb-8 flex flex-col gap-2">
              {Object.entries(groupedNotes).map(([notebookId, notebookNotes]) => {
                const notebook = notebooks?.find((nb) => nb.id === notebookId);
                const isExpanded = !!expandedNotebooks[notebookId];
                const isCollapsed = !isExpanded;
                return (
                  <div key={notebookId} className="flex flex-col gap-2">
                    <button
                      onClick={() => toggleNotebook(notebookId)}
                      className={cn(
                        "group flex w-full items-center justify-between rounded-xs px-2 py-1.5 text-sm font-medium transition-colors text-gray-600 hover:bg-gray-100/60 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/50 dark:hover:text-gray-100",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <NotebookIcon className="size-4" />
                        <span>{notebook ? notebook.title : "Unknown Notebook"}</span>
                      </div>
                      <ChevronIcon
                        direction={isCollapsed ? "right" : "down"}
                        className="size-4 text-gray-400 transition-transform group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300"
                      />
                    </button>
                    {!isCollapsed && (
                      <div className="mb-4 flex flex-col gap-2">
                        {notebookNotes.map((note) => (
                          <NoteChip
                            key={note.id}
                            note={note}
                            onSelect={handleSelectNote}
                            className={
                              selectedNote?.id === note.id
                                ? "border-blue-500 ring-1 ring-blue-500 dark:border-blue-500 dark:ring-blue-500"
                                : ""
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {unassignedNotes.length > 0 && (
                <div className="mt-2 flex flex-col gap-2">
                  {Object.keys(groupedNotes).length > 0 && (
                    <p className="px-2 py-1 text-xs font-medium tracking-wider text-gray-400 uppercase dark:text-gray-500">
                      Unassigned
                    </p>
                  )}
                  {unassignedNotes.map((note) => (
                    <NoteChip
                      key={note.id}
                      note={note}
                      onSelect={handleSelectNote}
                      className={
                        selectedNote?.id === note.id
                          ? "border-blue-500 ring-1 ring-blue-500 dark:border-blue-500 dark:ring-blue-500"
                          : ""
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <div className="mb-5 flex size-20 items-center justify-center rounded-xs border border-blue-300 bg-blue-50 shadow-sm dark:border-blue-700 dark:bg-blue-950/30">
                <div className="size-10 text-blue-500 dark:text-blue-400">
                  <NoteIcon />
                </div>
              </div>
              <h3 className="text-foreground mb-3 text-xl font-semibold">No notes yet</h3>
              <p className="mb-6 max-w-md text-base leading-relaxed text-gray-500 dark:text-gray-400">
                Create your first note to start capturing ideas.
              </p>
            </div>
          )}
        </div>

        <div
          className={cn(
            "z-30 flex-1 bg-white p-3 md:w-2/3 md:bg-transparent md:p-4 dark:bg-black md:dark:bg-transparent",
            selectedNote
              ? "block w-full"
              : "hidden md:flex md:flex-col md:items-center md:justify-center",
          )}
        >
          {selectedNote ? (
            <NoteEditor
              key={selectedNote.id}
              note={selectedNote}
              handleCloseNote={() => setSelectedNote(null)}
              onNoteDeleted={() => {
                setSelectedNote(null);
                refetchNotes(true);
              }}
              onNoteUpdated={(updatedNote) => {
                setSelectedNote(updatedNote);
                refetchNotes(true);
              }}
              className="h-full w-full shadow-xl md:shadow-none"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center text-center">
              <div className="mb-5 flex size-20 items-center justify-center rounded-xs border border-blue-300 bg-blue-50 shadow-sm dark:border-blue-700 dark:bg-blue-950/30">
                <div className="size-10 text-blue-500 dark:text-blue-400">
                  <NoteIcon />
                </div>
              </div>
              <h3 className="text-foreground mb-2 text-lg font-semibold">No note selected</h3>
              <p className="max-w-xs text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                Select a note from the list on the left to view or edit its contents.
              </p>
            </div>
          )}
        </div>

        {/* Create Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={closeModals}
          title="Create new note"
          contentClassname="overflow-visible"
          actions={
            <>
              <Button variant="secondary" onClick={closeModals} disabled={savingNote}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={async () => await createNote()}
                disabled={!noteTitle.trim() || savingNote}
                icon={savingNote ? <Spinner /> : <AddIcon />}
              >
                {savingNote ? "Saving" : "Save"}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <TextField
              id="note-title"
              label="Note title"
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Enter note title"
              autoFocus
            />

            <div className="flex flex-col gap-1.5">
              <div className="flex w-full items-end gap-2">
                <Dropdown<string>
                  label="Notebook"
                  options={notebooks?.map((nb) => nb.id) || []}
                  selectedOption={selectedNotebookId || undefined}
                  onSelect={(val) => setSelectedNotebookId(val)}
                  renderOption={(opt) => {
                    const notebook: Notebook | undefined = notebooks?.find((n) => n.id === opt);
                    return notebook ? notebook.title : "Unknown";
                  }}
                  placeholder="Select a notebook (optional)"
                  className="min-w-0 flex-1 flex-col items-start gap-1.5"
                />
                {selectedNotebookId && (
                  <IconButton
                    icon={<CloseIcon />}
                    onClick={() => setSelectedNotebookId(null)}
                    variant="ghost"
                    ariaLabel="Clear notebook selection"
                  />
                )}
              </div>
            </div>

            {saveError && <div className="text-sm text-red-500">Error: {saveError.message}</div>}
          </div>
        </Modal>
      </div>
    </div>
  );
}
