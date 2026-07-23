import { useEffect, useMemo, useState } from "react";
import { useLoaderData, useNavigate } from "react-router";
import type { Folder, Notebook, Note } from "@/interfaces";
import { Button, CardSkeleton, Modal, Spinner, TextField } from "@/components/ui";
import { TopBar } from "@/components";
import { NotebookCard, NoteCard } from "@/components";
import { FireIcon, NotebookIcon, NoteIcon } from "@/components/icons";
import { SimpleBackground } from "@/components/backgrounds/SimpleBackground";
import { motion } from "motion/react";
import { useCookie, useFetch, useMediaQuery } from "@/hooks";
import { BREAKPOINTS } from "@/hooks/useBreakpoint";
import { getSortedItems, type SortOption } from "@/components/settings";

export default function FolderPage() {
  const folderId: string = useLoaderData();
  const navigate = useNavigate();

  const {
    data: folders,
    loading: foldersLoading,
    error: foldersError,
    refetch: refetchFolders,
  } = useFetch<Folder[]>("/folders");
  const {
    data: notebooks,
    loading: notebooksLoading,
    error: notebooksError,
    refetch: refetchNotebooks,
  } = useFetch<Notebook[]>("/notebooks");
  const {
    data: notes,
    loading: notesLoading,
    error: notesError,
    refetch: refetchNotes,
  } = useFetch<Note[]>("/notes");

  const folder = useMemo(() => folders?.find((f) => f.id === folderId), [folders, folderId]);

  const [globalViewMode] = useCookie<"grid" | "list">("globalViewMode", "grid");
  const [globalSort] = useCookie<SortOption>("globalSortPreference", "Newest");
  const viewMode = globalViewMode || "grid";
  const sortBy = globalSort || "Newest";

  const [editingTitle, setEditingTitle] = useState<string>("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (folder) setEditingTitle(folder.title);
  }, [folder?.title]);

  const isBelowSm = useMediaQuery(BREAKPOINTS.mobile - 1);
  const isBelowMd = useMediaQuery(BREAKPOINTS.tablet - 1);
  const gridColumns = isBelowSm ? 2 : isBelowMd ? 3 : 4;
  const MAX_ITEMS = viewMode === "grid" ? gridColumns * 2 : 5;

  const folderNotebooks = useMemo(
    () => (notebooks ?? []).filter((nb) => nb.folderId === folderId),
    [notebooks, folderId],
  );
  const folderNotes = useMemo(
    () => (notes ?? []).filter((n) => n.folderId === folderId),
    [notes, folderId],
  );

  const sortedNotebooks = getSortedItems(folderNotebooks, sortBy);
  const sortedNotes = getSortedItems(folderNotes, sortBy);
  const displayNotebooks = sortedNotebooks.slice(0, MAX_ITEMS);
  const hasMoreNotebooks = sortedNotebooks.length > MAX_ITEMS;
  const displayNotes = sortedNotes.slice(0, MAX_ITEMS);
  const hasMoreNotes = sortedNotes.length > MAX_ITEMS;

  const { loading: updatingFolder, refetch: updateFolder } = useFetch<Folder>(
    `/folders/${folderId}`,
    {
      method: "PATCH",
      data: { title: editingTitle },
      onSuccess: () => {
        useFetch.clearCache();
        refetchFolders(true, false);
      },
      onError: (err) => console.error("Error renaming folder:", err.message),
    },
    false,
  );

  const { loading: deletingFolder, refetch: deleteFolder } = useFetch(
    `/folders/${folderId}`,
    {
      method: "DELETE",
      onSuccess: () => {
        useFetch.clearCache();
        navigate("/", { replace: true });
      },
      onError: (err) => console.error("Error deleting folder:", err.message),
    },
    false,
  );

  function handleTitleBlur() {
    if (!folder) return;
    if (editingTitle.trim() && editingTitle !== folder.title && !updatingFolder) {
      updateFolder();
    } else {
      setEditingTitle(folder.title);
    }
  }

  async function handleRenameFromModal() {
    if (!editingTitle.trim() || editingTitle === folder?.title) {
      setIsRenameModalOpen(false);
      return;
    }
    await updateFolder();
    setIsRenameModalOpen(false);
  }

  const renderTopBarTitle = (subtitle: React.ReactNode) => (
    <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
      <span className="hidden shrink-0 text-xs font-medium tracking-wide text-gray-500 uppercase md:block dark:text-gray-400">
        Folder /{" "}
      </span>
      {subtitle}
    </div>
  );

  const loading = foldersLoading && !folder;
  const hasError = foldersError;

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

  if (hasError || !folder) {
    return (
      <div className="flex h-screen max-h-full w-full flex-col">
        <TopBar
          title={renderTopBarTitle(
            <span className="text-gray-400">We couldn't load your folder</span>,
          )}
        />
        <div className="relative flex flex-1 items-center justify-center overflow-hidden">
          <SimpleBackground />
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xs bg-red-50 dark:bg-red-950">
              <div className="h-8 w-8 text-red-500">
                <FireIcon />
              </div>
            </div>
            <h4 className="mb-2 text-lg font-medium text-red-600 dark:text-red-400">
              We couldn't load this folder
            </h4>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              {foldersError?.message ??
                "It may have been moved or deleted. Try going back to your library."}
            </p>
            <Button className="mt-4" variant="primary" onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = folderNotebooks.length === 0 && folderNotes.length === 0;

  const titleInput = (
    <input
      className="w-full truncate border-none bg-transparent p-0 text-lg font-semibold transition-colors duration-200 focus:ring-0 focus:outline-none"
      value={editingTitle}
      onChange={(e) => setEditingTitle(e.target.value)}
      onBlur={handleTitleBlur}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          (e.target as HTMLInputElement).blur();
        }
      }}
      disabled={updatingFolder}
    />
  );

  return (
    <div className="flex h-screen max-h-full w-full flex-col">
      <title>{`${folder.title} - Folder - Escruta`}</title>
      <TopBar title={renderTopBarTitle(titleInput)} />

      <div className="relative flex-1 overflow-y-scroll">
        <SimpleBackground />

        <div className="relative z-10 mx-auto flex size-full max-w-5xl flex-col space-y-8 p-6">
          {isEmpty ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xs border-2 border-dashed border-blue-400/60 bg-gray-50/60 px-6 py-12 text-center dark:border-blue-600/60 dark:bg-gray-900/30"
            >
              <h3 className="text-foreground text-lg font-semibold">This folder is empty</h3>
              <p className="max-w-md text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                Drop a notebook or note into this folder from the Home page to start organizing your
                library.
              </p>
            </motion.div>
          ) : (
            <>
              {/* Notebooks */}
              {displayNotebooks.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <h3 className="mb-3 flex items-center justify-between gap-2 text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                    <span className="flex items-center gap-1.5">
                      <NotebookIcon className="size-3.5 text-blue-500 dark:text-blue-400" />
                      Notebooks
                    </span>
                  </h3>

                  {notebooksLoading && !notebooks ? (
                    <div
                      className={
                        viewMode === "grid"
                          ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4"
                          : "flex flex-col gap-3"
                      }
                    >
                      {Array.from({ length: 4 }).map((_, i) => (
                        <CardSkeleton key={i} viewMode={viewMode} />
                      ))}
                    </div>
                  ) : notebooksError ? (
                    <p className="text-sm text-red-500">{notebooksError.message}</p>
                  ) : (
                    <>
                      <div
                        className={
                          viewMode === "grid"
                            ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4"
                            : "flex flex-col gap-3"
                        }
                      >
                        {displayNotebooks.map((notebook) => (
                          <NotebookCard
                            key={notebook.id}
                            notebook={notebook}
                            viewMode={viewMode}
                            folders={folders ?? undefined}
                            onChange={() => refetchNotebooks(true, false)}
                          />
                        ))}
                      </div>
                      {hasMoreNotebooks && (
                        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                          Showing {displayNotebooks.length} of {sortedNotebooks.length} notebooks in
                          this folder.
                        </p>
                      )}
                    </>
                  )}
                </motion.section>
              )}

              {/* Notes */}
              {displayNotes.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <h3 className="mb-3 flex items-center justify-between gap-2 text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                    <span className="flex items-center gap-1.5">
                      <NoteIcon className="size-3.5 text-blue-500 dark:text-blue-400" />
                      Notes
                    </span>
                  </h3>

                  {notesLoading && !notes ? (
                    <div
                      className={
                        viewMode === "grid"
                          ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4"
                          : "flex flex-col gap-3"
                      }
                    >
                      {Array.from({ length: 4 }).map((_, i) => (
                        <CardSkeleton key={i} viewMode={viewMode} />
                      ))}
                    </div>
                  ) : notesError ? (
                    <p className="text-sm text-red-500">{notesError.message}</p>
                  ) : (
                    <>
                      <div
                        className={
                          viewMode === "grid"
                            ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4"
                            : "flex flex-col gap-3"
                        }
                      >
                        {displayNotes.map((note) => (
                          <NoteCard
                            key={note.id}
                            note={note}
                            viewMode={viewMode}
                            folders={folders ?? undefined}
                            onChange={() => refetchNotes(true, false)}
                          />
                        ))}
                      </div>
                      {hasMoreNotes && (
                        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                          Showing {displayNotes.length} of {sortedNotes.length} notes in this
                          folder.
                        </p>
                      )}
                    </>
                  )}
                </motion.section>
              )}
            </>
          )}
        </div>
      </div>

      {/* Rename Folder Modal */}
      <Modal
        isOpen={isRenameModalOpen}
        onClose={() => {
          setIsRenameModalOpen(false);
          setEditingTitle(folder.title);
        }}
        title="Rename folder"
        onSubmit={() => {
          if (editingTitle.trim() && !updatingFolder) handleRenameFromModal();
        }}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsRenameModalOpen(false);
                setEditingTitle(folder.title);
              }}
              disabled={updatingFolder}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRenameFromModal}
              disabled={!editingTitle.trim() || updatingFolder || editingTitle === folder.title}
              icon={updatingFolder ? <Spinner className="size-4" /> : undefined}
            >
              {updatingFolder ? "Saving..." : "Save"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextField
            id="folder-rename-input"
            label="Name your folder"
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            placeholder="e.g., Ideas, Thesis, Travel…"
            autoFocus
          />
        </div>
      </Modal>

      {/* Delete Folder Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete folder"
        actions={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteFolder()}
              disabled={deletingFolder}
              icon={deletingFolder ? <Spinner className="size-4" /> : undefined}
            >
              {deletingFolder ? "Deleting..." : "Delete"}
            </Button>
          </>
        }
      >
        <p className="text-gray-600 dark:text-gray-300">
          You're about to delete <span className="font-semibold">{folder.title}</span>. This can't
          be undone—any notebooks and notes inside will stay in your library, just moved out of the
          folder.
        </p>
      </Modal>
    </div>
  );
}
