import type { Note, Notebook, Folder } from "@/interfaces";
import { useFetch } from "@/hooks";
import { SEOMetadata, NotesPageEditor, TopBar } from "@/components";
import { getRouteMetadata } from "@/lib/seo";
import { motion } from "motion/react";
import {
  IconButton,
  Tooltip,
  Spinner,
  CanvasModal,
  Divider,
  TextField,
  Button,
  ButtonGroup,
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
} from "@/components/ui";
import {
  AddIcon,
  EditIcon,
  FolderIcon,
  RestartIcon,
  ZoomIcon,
  DotsVerticalIcon,
  DeleteIcon,
} from "@/components/icons";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { Canvas, type CanvasHandle } from "@/components/canvas/Canvas";
import { CanvasNoteCard } from "@/components/canvas/CanvasNoteCard";

import { cn } from "@/lib/utils";

export default function NotesPage() {
  const {
    data: notes,
    loading: notesLoading,
    error: notesError,
    refetch: refetchNotes,
  } = useFetch<Note[]>("/notes");
  const { data: notebooks } = useFetch<Notebook[]>("/notebooks");
  const { data: folders, refetch: refetchFolders } = useFetch<Folder[]>("/folders");

  const location = useLocation();

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedNotebookId, setSelectedNotebookId] = useState<string>("");
  const canvasRef = useRef<CanvasHandle>(null);
  const initialNotebookSet = useRef(false);

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderTitle, setFolderTitle] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);

  useEffect(() => {
    if (location.state?.noteId && notes) {
      const note = notes.find((n) => n.id === location.state.noteId);
      if (note) setSelectedNote(note);
    }
  }, [location.state, notes]);

  useEffect(() => {
    if (notebooks && notebooks.length > 0 && !initialNotebookSet.current && !selectedNotebookId) {
      setSelectedNotebookId(notebooks[0].id);
      initialNotebookSet.current = true;
    }
  }, [notebooks, selectedNotebookId]);

  const { loading: addingNote, refetch: createNote } = useFetch<Note>(
    "/notes",
    {
      method: "POST",
      data: {
        title: "New note",
      },
      onSuccess: (newNote) => {
        useFetch.clearCache();
        refetchNotes(true, false);
        setSelectedNote(newNote);
      },
    },
    false,
  );

  const { loading: creatingFolder, refetch: createFolder } = useFetch<Folder>(
    "/folders",
    {
      method: "POST",
      data: { title: folderTitle },
      onSuccess: () => {
        useFetch.clearCache();
        refetchFolders(true, false);
        setIsFolderModalOpen(false);
        setFolderTitle("");
      },
    },
    false,
  );

  const { loading: updatingFolder, refetch: updateFolder } = useFetch<Folder>(
    `/folders/${editingFolderId}`,
    {
      method: "PATCH",
      data: { title: folderTitle },
      onSuccess: () => {
        useFetch.clearCache();
        refetchFolders(true, false);
        setIsFolderModalOpen(false);
        setFolderTitle("");
        setEditingFolderId(null);
      },
    },
    false,
  );

  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);
  const [moveTarget, setMoveTarget] = useState<{ noteId: string; folderId: string | null } | null>(
    null,
  );
  const [dragState, setDragState] = useState<{
    noteId: string;
    sourceFolderId: string | null;
  } | null>(null);
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);

  const { loading: movingNote, refetch: executeMoveNote } = useFetch(
    "/notes",
    {
      method: "PUT",
      data: {
        id: moveTarget?.noteId,
        folderId: moveTarget?.folderId || null,
        removeFolder: moveTarget?.folderId === null,
      },
      onSuccess: () => {
        useFetch.clearCache();
        refetchNotes(true, false);
        setMoveTarget(null);
      },
      onError: () => {
        setMoveTarget(null);
      },
    },
    false,
  );

  useEffect(() => {
    if (moveTarget) {
      executeMoveNote();
    }
  }, [moveTarget]);

  const { loading: deletingFolder, refetch: executeDeleteFolder } = useFetch(
    `/folders/${folderToDelete?.id}`,
    {
      method: "DELETE",
      onSuccess: () => {
        useFetch.clearCache();
        refetchFolders(true, false);
        setFolderToDelete(null);
      },
    },
    false,
  );

  const handleSaveFolder = () => {
    if (editingFolderId) {
      updateFolder();
    } else {
      createFolder();
    }
  };

  const handleCreateFolder = () => {
    setEditingFolderId(null);
    setFolderTitle("");
    setIsFolderModalOpen(true);
  };

  const handleEditFolder = (folder: Folder) => {
    setEditingFolderId(folder.id);
    setFolderTitle(folder.title);
    setIsFolderModalOpen(true);
  };

  if (notesLoading) {
    return (
      <div className="flex h-screen max-h-full w-full flex-col">
        <TopBar title="Notes" />
        <div className="flex w-full flex-1 items-center justify-center">
          <Spinner />
        </div>
      </div>
    );
  }

  if (notesError) {
    return (
      <div className="flex h-screen max-h-full w-full flex-col">
        <TopBar title="Notes" />
        <div className="flex w-full flex-1 flex-col justify-center">
          <motion.div
            className="flex items-center justify-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="max-w-md rounded-xs border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/30 dark:bg-red-950/20">
              <h1 className="mb-2 text-lg font-semibold text-red-600 dark:text-red-400">
                Workspace connection failed
              </h1>
              <p className="text-sm leading-relaxed text-red-500/80 dark:text-red-400/60">
                {notesError?.message}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const metadata = getRouteMetadata("/notes") || { title: "Notes - Escruta" };

  return (
    <div className="flex h-screen max-h-full w-full flex-col overflow-hidden">
      <SEOMetadata title={metadata.title} description={metadata.description} />
      <TopBar title="Notes" />

      <div className="flex min-h-0 flex-1">
        {/* Notes Canvas Area */}
        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-gray-50/20 dark:bg-gray-950/15">
          {/* Floating Bottom Bar */}
          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-xs border border-gray-200/80 bg-white/90 p-2 shadow-md dark:border-gray-800/80 dark:bg-gray-950/90">
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => createNote()}
                disabled={addingNote}
                icon={
                  addingNote ? <Spinner className="size-3.5" /> : <AddIcon className="size-3.5" />
                }
              >
                New note
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCreateFolder}
                icon={<FolderIcon className="size-3.5" />}
              >
                New folder
              </Button>
            </div>

            <Divider orientation="vertical" className="h-5" />

            <ButtonGroup>
              <Tooltip text="Zoom out" position="top">
                <IconButton
                  variant="secondary"
                  icon={<ZoomIcon type="out" className="size-4" />}
                  onClick={() => canvasRef.current?.zoomOut()}
                  ariaLabel="Zoom out"
                  size="sm"
                />
              </Tooltip>
              <Tooltip text="Reset zoom" position="top">
                <IconButton
                  variant="secondary"
                  icon={<RestartIcon className="size-4" />}
                  onClick={() => canvasRef.current?.reset()}
                  ariaLabel="Reset zoom"
                  size="sm"
                />
              </Tooltip>
              <Tooltip text="Zoom in" position="top">
                <IconButton
                  variant="secondary"
                  icon={<ZoomIcon type="in" className="size-4" />}
                  onClick={() => canvasRef.current?.zoomIn()}
                  ariaLabel="Zoom in"
                  size="sm"
                />
              </Tooltip>
            </ButtonGroup>
          </div>

          <div className="relative flex-1 overflow-hidden">
            <Canvas ref={canvasRef} initialX={0} initialY={0}>
              {(notes && notes.length > 0) || (folders && folders.length > 0) ? (
                (() => {
                  const sortedNotes = [...(notes || [])].sort((a, b) =>
                    a.title.localeCompare(b.title),
                  );

                  const groups = [
                    ...(folders?.map((folder) => ({
                      id: folder.id,
                      title: folder.title,
                      notes: sortedNotes.filter((n) => n.folderId === folder.id),
                    })) || []),
                    {
                      id: null,
                      title: "",
                      notes: sortedNotes.filter((n) => !n.folderId),
                    },
                  ].filter(
                    (group) =>
                      group.id !== null ||
                      group.notes.length > 0 ||
                      (hoveredGroupId === "root" && dragState),
                  );

                  return (
                    <div
                      className="flex h-full w-full items-center justify-center p-6"
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragState && hoveredGroupId !== "root") {
                          setHoveredGroupId("root");
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const noteId = e.dataTransfer.getData("noteId");
                        if (noteId && noteId !== "") {
                          const sourceFolderId = e.dataTransfer.getData("sourceFolderId");
                          if (sourceFolderId !== "") {
                            setMoveTarget({ noteId, folderId: null });
                          }
                        }
                        setDragState(null);
                        setHoveredGroupId(null);
                      }}
                    >
                      <div className="flex flex-col gap-6">
                        {groups.map((group, index) => {
                          const groupId = group.id || "root";
                          const isHovered = hoveredGroupId === groupId;
                          const showPlaceholder =
                            isHovered &&
                            dragState &&
                            dragState.sourceFolderId !== (group.id || null);

                          const notesWithPlaceholder = [...group.notes];
                          if (showPlaceholder) {
                            const draggedNote = notes?.find((n) => n.id === dragState.noteId);
                            if (draggedNote) {
                              const insertionIndex = group.notes.findIndex(
                                (n) => n.title.localeCompare(draggedNote.title) > 0,
                              );
                              const finalIndex =
                                insertionIndex === -1 ? group.notes.length : insertionIndex;
                              notesWithPlaceholder.splice(finalIndex, 0, {
                                id: "placeholder",
                                title: "placeholder",
                              } as Note);
                            }
                          }

                          const effectiveNotesCount =
                            group.notes.length + (showPlaceholder ? 1 : 0);

                          return (
                            <div
                              key={group.id || index}
                              className={cn(
                                "flex flex-col gap-3 rounded-xs transition-all duration-200",
                                isHovered && dragState && "ring ring-blue-500/50 p-4",
                              )}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (hoveredGroupId !== groupId) {
                                  setHoveredGroupId(groupId);
                                }
                              }}
                              onDragLeave={(e) => {
                                e.preventDefault();
                                const rect = e.currentTarget.getBoundingClientRect();
                                if (
                                  e.clientX < rect.left ||
                                  e.clientX >= rect.right ||
                                  e.clientY < rect.top ||
                                  e.clientY >= rect.bottom
                                ) {
                                  setHoveredGroupId(null);
                                }
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setHoveredGroupId(null);
                                setDragState(null);
                                const noteId = e.dataTransfer.getData("noteId");
                                if (noteId && noteId !== "") {
                                  const sourceFolderId = e.dataTransfer.getData("sourceFolderId");
                                  if (sourceFolderId !== (group.id || "")) {
                                    setMoveTarget({ noteId, folderId: group.id });
                                  }
                                }
                              }}
                            >
                              {group.title && group.id && (
                                <div className="flex items-center gap-2">
                                  <h2 className="flex items-center gap-1.5 text-base font-semibold tracking-tight text-gray-900 transition-colors group-hover:text-blue-500 dark:text-gray-100">
                                    <FolderIcon className="size-3 text-blue-500 dark:text-blue-400" />
                                    {group.title}
                                  </h2>
                                  <Menu>
                                    <MenuTrigger>
                                      <IconButton
                                        variant="ghost"
                                        icon={<DotsVerticalIcon className="size-3" />}
                                        size="xs"
                                        ariaLabel="Folder options"
                                      />
                                    </MenuTrigger>
                                    <MenuContent align="left">
                                      <MenuItem
                                        icon={<EditIcon className="size-4" />}
                                        label="Edit folder"
                                        onClick={() => {
                                          const f = folders?.find((f) => f.id === group.id);
                                          if (f) handleEditFolder(f);
                                        }}
                                      />
                                      <MenuItem
                                        icon={<DeleteIcon className="size-4" />}
                                        label="Delete folder"
                                        variant="danger"
                                        onClick={() => {
                                          const f = folders?.find((f) => f.id === group.id);
                                          if (f) setFolderToDelete(f);
                                        }}
                                      />
                                    </MenuContent>
                                  </Menu>
                                </div>
                              )}
                              <div
                                className={cn(
                                  "grid w-max gap-3 min-w-[12rem]",
                                  group.id &&
                                    "rounded-xs p-4 ring-1 ring-black/10 backdrop-blur-sm dark:ring-white/10",
                                  {
                                    "grid-cols-1": effectiveNotesCount <= 1,
                                    "grid-cols-2": effectiveNotesCount === 2,
                                    "grid-cols-3": effectiveNotesCount === 3,
                                    "grid-cols-4": effectiveNotesCount >= 4,
                                  },
                                  movingNote && "opacity-50 pointer-events-none",
                                )}
                              >
                                {effectiveNotesCount === 0 ? (
                                  <div className="flex h-24 w-48 flex-col items-center justify-center gap-2 rounded-xs border border-dashed border-gray-200 bg-white/50 text-center ring-1 ring-gray-500/5 dark:border-gray-800 dark:bg-gray-900/50 dark:ring-gray-500/10">
                                    <span className="text-sm font-medium text-gray-400">
                                      {group.id ? "Empty folder" : "No notes"}
                                    </span>
                                  </div>
                                ) : (
                                  notesWithPlaceholder.map((note) => {
                                    if (note.id === "placeholder") {
                                      return (
                                        <motion.div
                                          key="placeholder"
                                          layoutId="placeholder"
                                          initial={{ opacity: 0, scale: 0.8 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          className="placeholder-item h-[3.25rem] w-48 rounded-xs border-2 border-dashed border-blue-400 bg-blue-50/50 dark:border-blue-500/50 dark:bg-blue-900/20"
                                        />
                                      );
                                    }

                                    const notebook = notebooks?.find(
                                      (nb) => nb.id === note.notebookId,
                                    );
                                    return (
                                      <div
                                        key={note.id}
                                        draggable
                                        className="cursor-grab transition-all duration-200 active:cursor-grabbing"
                                        onDragStart={(e) => {
                                          setDragState({
                                            noteId: note.id,
                                            sourceFolderId: group.id || null,
                                          });
                                          e.dataTransfer.setData("noteId", note.id);
                                          e.dataTransfer.setData("sourceFolderId", group.id || "");
                                          e.dataTransfer.effectAllowed = "move";
                                          setTimeout(() => {
                                            if (e.target instanceof HTMLElement) {
                                              e.target.classList.add("opacity-30", "scale-95");
                                            }
                                          }, 0);
                                        }}
                                        onDragEnd={(e) => {
                                          setDragState(null);
                                          setHoveredGroupId(null);
                                          if (e.target instanceof HTMLElement) {
                                            e.target.classList.remove("opacity-30", "scale-95");
                                          }
                                        }}
                                      >
                                        <CanvasNoteCard
                                          key={note.id}
                                          note={note}
                                          notebookId={notebook?.id}
                                          notebookName={notebook?.title}
                                          className="!relative !top-0 !left-0 w-48 !transform-none"
                                          onSelect={(n) => setSelectedNote(n)}
                                        />
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="pointer-events-none text-sm text-gray-300 select-none dark:text-gray-700">
                    No notes yet
                  </p>
                </div>
              )}
            </Canvas>
          </div>

          {/* Folder Modals */}
          <CanvasModal
            isOpen={isFolderModalOpen}
            onClose={() => setIsFolderModalOpen(false)}
            width="sm"
            minHeight="min-h-fit"
            title={editingFolderId ? "Edit folder" : "New folder"}
            actions={
              <>
                <Button variant="ghost" onClick={() => setIsFolderModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleSaveFolder()}
                  disabled={creatingFolder || updatingFolder || !folderTitle.trim()}
                >
                  {creatingFolder || updatingFolder ? (
                    <div className="flex items-center gap-2">
                      <Spinner className="size-4" />
                      {editingFolderId ? "Saving..." : "Creating..."}
                    </div>
                  ) : editingFolderId ? (
                    "Save changes"
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
                label="Folder name"
                value={folderTitle}
                onChange={(e) => setFolderTitle(e.target.value)}
                placeholder="E.g., Ideas"
                autoFocus
              />
            </div>
          </CanvasModal>

          <CanvasModal
            isOpen={!!folderToDelete}
            onClose={() => setFolderToDelete(null)}
            width="sm"
            minHeight="min-h-fit"
            title="Delete folder"
            actions={
              <>
                <Button variant="ghost" onClick={() => setFolderToDelete(null)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={() => executeDeleteFolder()}
                  disabled={deletingFolder}
                >
                  {deletingFolder ? (
                    <div className="flex items-center gap-2">
                      <Spinner className="size-4 text-white" />
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
              Are you sure you want to delete the folder{" "}
              <span className="font-semibold">{folderToDelete?.title}</span>? This action cannot be
              undone. Notes inside this folder will remain but will be moved out of the folder.
            </p>
          </CanvasModal>

          {/* Note Editor Overlay */}
          {selectedNote && (
            <NotesPageEditor
              note={selectedNote}
              handleCloseNote={() => setSelectedNote(null)}
              onNoteDeleted={() => refetchNotes(true, false)}
              onNoteUpdated={() => refetchNotes(true, false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
