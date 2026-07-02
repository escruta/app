import { useState } from "react";
import { useNavigate } from "react-router";
import type { Note, Notebook, Folder } from "@/interfaces";
import { useCookie, useFetch, useIsTablet } from "@/hooks";
import {
  Button,
  Dropdown,
  Modal,
  TextField,
  SegmentedButtons,
  Spinner,
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  MenuLabel,
  IconButton,
} from "@/components/ui";
import { CommonBar, NoteCard, SEOMetadata, TopBar } from "@/components";
import {
  AddIcon,
  GridIcon,
  ListIcon,
  FireIcon,
  NoteIcon,
  FolderIcon,
  DotsVerticalIcon,
  DeleteIcon,
  EditIcon,
  CheckIcon,
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

type ViewMode = "grid" | "list";

export default function NotesPage() {
  const isTablet = useIsTablet();
  const navigate = useNavigate();
  const {
    data: notes,
    loading: notesLoading,
    error: notesError,
    refetch: refetchNotes,
  } = useFetch<Note[]>("/notes");
  const { data: notebooks } = useFetch<Notebook[]>("/notebooks");
  const { data: folders, refetch: refetchFolders } = useFetch<Folder[]>("/folders");

  const [sortBy, setSortBy] = useCookie<SortOptions>("noteSortPreference", SortOptions.Newest);
  const [viewMode, setViewMode] = useCookie<ViewMode>("noteViewMode", "grid");

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderTitle, setFolderTitle] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);

  const { loading: addingNote, refetch: createNote } = useFetch<Note>(
    "/notes",
    {
      method: "POST",
      data: {
        title: "New note",
      },
      onSuccess: (newNote) => {
        useFetch.clearCache();
        navigate(`/note/${newNote.id}`);
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

  const { loading: deletingFolder, refetch: executeDeleteFolder } = useFetch(
    `/folders/${folderToDelete?.id}`,
    {
      method: "DELETE",
      onSuccess: () => {
        useFetch.clearCache();
        refetchFolders(true, false);
        refetchNotes(true, false);
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

  function getSortedNotes(notes: Note[]): Note[] {
    const sortedData = [...notes];
    switch (sortBy) {
      case SortOptions.Newest:
        return sortedData.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      case SortOptions.Oldest:
        return sortedData.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      case SortOptions.Alphabetical:
        return sortedData.sort((a, b) => a.title.localeCompare(b.title));
      case SortOptions.ReverseAlphabetical:
        return sortedData.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return sortedData;
    }
  }

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
          <div className="border-y border-gray-200 bg-gray-50 px-6 py-5 dark:border-gray-700 dark:bg-gray-950">
            <motion.div
              className="flex items-center justify-center py-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="max-w-md text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xs bg-red-50 dark:bg-red-950">
                  <div className="h-8 w-8 text-red-500">
                    <FireIcon />
                  </div>
                </div>
                <h1 className="mb-2 text-lg font-medium text-red-600 dark:text-red-400">
                  Error loading notes
                </h1>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {notesError.message}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  const hasContent = (notes && notes.length > 0) || (folders && folders.length > 0);

  const groups = [
    ...(folders?.map((folder) => ({
      id: folder.id as string,
      title: folder.title,
      notes: getSortedNotes((notes || []).filter((n) => n.folderId === folder.id)),
    })) || []),
    {
      id: null as string | null,
      title: "",
      notes: getSortedNotes((notes || []).filter((n) => !n.folderId)),
    },
  ].filter((group) => group.id !== null || group.notes.length > 0);

  const metadata = getRouteMetadata("/notes") || { title: "Notes - Escruta" };

  return (
    <div className="flex h-screen max-h-full w-full flex-col">
      <SEOMetadata title={metadata.title} description={metadata.description} />
      <TopBar title="Notes" />

      <div className="flex-1 overflow-auto p-3 md:p-4">
        <SimpleBackground />

        <div className="mx-auto max-w-5xl">
          <CommonBar className="sticky top-0 z-20 mb-4 flex items-center justify-between gap-4">
            <div className="flex w-full items-center gap-2 md:w-auto">
              <Button
                variant="primary"
                onClick={() => createNote()}
                disabled={addingNote}
                icon={addingNote ? <Spinner className="size-4" /> : <AddIcon className="size-4" />}
                className="w-full justify-center md:w-auto"
              >
                New note
              </Button>
              <Button
                variant="secondary"
                onClick={handleCreateFolder}
                icon={<FolderIcon className="size-4" />}
                className="w-full justify-center md:w-auto"
              >
                New folder
              </Button>
            </div>

            {hasContent && (
              <>
                {isTablet ? (
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
                        <MenuLabel>View Mode</MenuLabel>
                        <MenuItem
                          label="Grid"
                          onClick={() => setViewMode("grid")}
                          icon={
                            viewMode === "grid" ? (
                              <CheckIcon className="size-4 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <div className="size-4" />
                            )
                          }
                          className={cn(
                            viewMode === "grid" &&
                              "bg-blue-50 text-blue-700 dark:bg-gray-800 dark:text-blue-400",
                          )}
                        />
                        <MenuItem
                          label="List"
                          onClick={() => setViewMode("list")}
                          icon={
                            viewMode === "list" ? (
                              <CheckIcon className="size-4 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <div className="size-4" />
                            )
                          }
                          className={cn(
                            viewMode === "list" &&
                              "bg-blue-50 text-blue-700 dark:bg-gray-800 dark:text-blue-400",
                          )}
                        />
                        <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />
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
                ) : (
                  <div className="flex flex-wrap items-center justify-end gap-8">
                    <SegmentedButtons
                      options={[
                        {
                          value: "grid" as const,
                          icon: <GridIcon />,
                          ariaLabel: "Grid view",
                        },
                        {
                          value: "list" as const,
                          icon: <ListIcon />,
                          ariaLabel: "List view",
                        },
                      ]}
                      value={viewMode || "grid"}
                      onChange={setViewMode}
                      label="View:"
                    />

                    <Dropdown<SortOptions>
                      align="right"
                      options={Object.values(SortOptions)}
                      selectedOption={sortBy || SortOptions.Newest}
                      onSelect={(option) => setSortBy(option as SortOptions)}
                      label="Sort by:"
                    />
                  </div>
                )}
              </>
            )}
          </CommonBar>

          {hasContent ? (
            <div className="flex flex-col gap-6">
              {groups.map((group, index) => {
                const folder = folders?.find((f) => f.id === group.id);
                return (
                  <div key={group.id || index} className="flex flex-col gap-3">
                    {group.title && group.id && (
                      <div className="flex items-center gap-2">
                        <h2 className="flex items-center gap-1.5 text-base font-semibold tracking-tight text-gray-900 group-hover:text-blue-500 dark:text-gray-100">
                          <FolderIcon className="size-3.5 text-blue-500 dark:text-blue-400" />
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
                              onClick={() => folder && handleEditFolder(folder)}
                            />
                            <MenuItem
                              icon={<DeleteIcon className="size-4" />}
                              label="Delete folder"
                              variant="danger"
                              onClick={() => folder && setFolderToDelete(folder)}
                            />
                          </MenuContent>
                        </Menu>
                      </div>
                    )}

                    <div
                      className={
                        viewMode === "grid"
                          ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4"
                          : "flex flex-col gap-3"
                      }
                    >
                      {group.notes.map((note) => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          viewMode={viewMode}
                          notebookTitle={notebooks?.find((nb) => nb.id === note.notebookId)?.title}
                          onChange={() => refetchNotes(true, false)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
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
                Create your first note to start capturing your ideas and insights.
              </p>
            </div>
          )}
        </div>

        {/* Folder Modal */}
        <Modal
          isOpen={isFolderModalOpen}
          onClose={() => setIsFolderModalOpen(false)}
          title={editingFolderId ? "Edit folder" : "New folder"}
          actions={
            <>
              <Button variant="secondary" onClick={() => setIsFolderModalOpen(false)}>
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
        </Modal>

        {/* Delete Folder Modal */}
        <Modal
          isOpen={!!folderToDelete}
          onClose={() => setFolderToDelete(null)}
          title="Delete folder"
          actions={
            <>
              <Button variant="secondary" onClick={() => setFolderToDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => executeDeleteFolder()}
                disabled={deletingFolder}
              >
                {deletingFolder ? (
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
            Are you sure you want to delete the folder{" "}
            <span className="font-semibold">{folderToDelete?.title}</span>? This action cannot be
            undone. Notes inside this folder will remain but will be moved out of the folder.
          </p>
        </Modal>
      </div>
    </div>
  );
}
