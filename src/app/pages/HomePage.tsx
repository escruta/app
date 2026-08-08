import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth, useCookie, useFetch, useGreeting, useMediaQuery } from "@/hooks";
import { BREAKPOINTS } from "@/hooks/useBreakpoint";
import { Button, IconButton, Modal, Spinner, TextField, Tooltip } from "@/components/ui";
import { FolderCard, NotebookCard, TopBar } from "@/components";
import { GaussianBlurGradientBackground } from "@/components/backgrounds/GaussianBlurGradientBackground";
import {
  AddIcon,
  FireIcon,
  FolderAddIcon,
  FolderIcon,
  NotebookIcon,
  SearchIcon,
  SettingsIcon,
} from "@/components/icons";
import { motion } from "motion/react";
import type { Folder, Notebook } from "@/interfaces";
import {
  getSortedItems,
  type SortOption,
  type ViewMode,
  VIEW_MODE_COOKIE_KEYS,
} from "@/components/settings";

export default function HomePage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const {
    data: notebooks,
    loading: notebooksLoading,
    error: notebooksError,
    refetch: refetchNotebooks,
  } = useFetch<Notebook[]>("/notebooks");
  const { data: folders, refetch: refetchFolders } = useFetch<Folder[]>("/folders");
  const { greeting, subtitle } = useGreeting();

  const [globalSort] = useCookie<SortOption>("globalSortPreference", "Newest");
  const [globalFolderViewMode] = useCookie<ViewMode>(VIEW_MODE_COOKIE_KEYS.folder, "grid");
  const [globalNotebookViewMode] = useCookie<ViewMode>(VIEW_MODE_COOKIE_KEYS.notebook, "grid");

  const [isCreateNotebookOpen, setIsCreateNotebookOpen] = useState(false);
  const [newNotebookTitle, setNewNotebookTitle] = useState("");

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderTitle, setFolderTitle] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);

  const {
    loading: creatingNotebook,
    error: createNotebookError,
    refetch: createNotebook,
  } = useFetch<Notebook>(
    "/notebooks",
    {
      method: "POST",
      data: { title: newNotebookTitle },
      onSuccess: (notebook) => {
        useFetch.clearCache("/notebooks");
        navigate(`/notebook/${notebook.id}`);
      },
      onError: (error) => {
        console.error("Error creating notebook:", error.message);
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
        refetchNotebooks(true, false);
        setFolderToDelete(null);
      },
    },
    false,
  );

  const folderViewMode = globalFolderViewMode || "grid";
  const notebookViewMode = globalNotebookViewMode || "grid";

  const isBelowSm = useMediaQuery(BREAKPOINTS.mobile - 1);
  const isBelowMd = useMediaQuery(BREAKPOINTS.tablet - 1);
  const gridColumns = isBelowSm ? 2 : isBelowMd ? 3 : 4;
  const MAX_NOTEBOOK_ITEMS = notebookViewMode === "grid" ? gridColumns * 2 : 5;

  const folderItems = folders ?? [];

  const unfiledNotebooks = (notebooks ?? []).filter((nb) => !nb.folderId);

  const sortBy = globalSort || "Newest";
  const sortedUnfiledNotebooks = getSortedItems(unfiledNotebooks, sortBy);

  const displayNotebooks = sortedUnfiledNotebooks.slice(0, MAX_NOTEBOOK_ITEMS);
  const hasMoreNotebooks = sortedUnfiledNotebooks.length > MAX_NOTEBOOK_ITEMS;

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

  const handleCloseFolderModal = () => {
    setIsFolderModalOpen(false);
    setEditingFolderId(null);
    setFolderTitle("");
  };

  const hasNotebookContent = !!unfiledNotebooks.length;
  const hasFolders = !!folders?.length;

  return (
    <div className="flex h-screen max-h-full w-full flex-col">
      <title>Home - Escruta</title>
      <TopBar />
      <div className="relative overflow-auto">
        <GaussianBlurGradientBackground />

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-start justify-between gap-4"
          >
            <div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                {greeting}, {currentUser?.name?.split(" ")[0] || "User"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>
            </div>
            <Tooltip text="Settings" position="bottom">
              <IconButton
                icon={<SettingsIcon className="size-5" />}
                onClick={() => navigate("/settings")}
                variant="ghost"
                size="sm"
                ariaLabel="Settings"
              />
            </Tooltip>
          </motion.div>

          {/* Folders section */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <h3 className="mb-3 flex items-center justify-between gap-2 text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              <span className="flex items-center gap-1.5">
                <FolderIcon className="size-3.5 text-blue-500 dark:text-blue-400" />
                Folders
              </span>
              <div className="flex items-center gap-1">
                <Button
                  icon={<FolderAddIcon className="size-4" />}
                  variant="primary"
                  size="sm"
                  onClick={handleCreateFolder}
                >
                  New folder
                </Button>
              </div>
            </h3>

            {hasFolders ? (
              <div
                className={
                  folderViewMode === "grid"
                    ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4"
                    : "flex flex-col gap-3"
                }
              >
                {folderItems.map((folder) => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    onEditFolder={() => handleEditFolder(folder)}
                    onDeleteFolder={() => setFolderToDelete(folder)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex w-full flex-col items-center justify-center gap-1 rounded-xs border-2 border-dashed border-blue-400/60 bg-gray-50/60 px-6 py-8 text-center dark:border-blue-600/60 dark:bg-gray-900/30">
                <h3 className="text-foreground text-lg font-semibold">No folders yet</h3>
                <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  Folders are a handy way to keep related notebooks together. Create your first one
                  to start organizing.
                </p>
              </div>
            )}
          </motion.section>

          {/* Notebooks section */}
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
              <div className="flex items-center gap-1">
                {(hasNotebookContent || hasMoreNotebooks) && (
                  <Button
                    icon={<SearchIcon className="size-4" />}
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate("/notebooks")}
                  >
                    View all notebooks
                  </Button>
                )}
                <Button
                  icon={<AddIcon className="size-4" />}
                  size="sm"
                  onClick={() => setIsCreateNotebookOpen(true)}
                >
                  New notebook
                </Button>
              </div>
            </h3>

            {notebooksLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner />
              </div>
            ) : notebooksError ? (
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
                    <h4 className="mb-2 text-lg font-medium text-red-600 dark:text-red-400">
                      We couldn't load your notebooks
                    </h4>
                    <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                      {notebooksError.message}
                    </p>
                  </div>
                </motion.div>
              </div>
            ) : (
              <>
                {notebooks && notebooks.length > 0 ? (
                  sortedUnfiledNotebooks.length > 0 ? (
                    <>
                      <div
                        className={
                          notebookViewMode === "grid"
                            ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4"
                            : "flex flex-col gap-3"
                        }
                      >
                        {displayNotebooks.map((notebook) => (
                          <NotebookCard
                            key={notebook.id}
                            notebook={notebook}
                            viewMode={notebookViewMode}
                            folders={folders ?? undefined}
                            onChange={() => refetchNotebooks(true, false)}
                          />
                        ))}
                      </div>
                      {hasMoreNotebooks && (
                        <button
                          className="mt-3 w-full rounded-xs border border-dashed border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-medium text-blue-600 transition-colors hover:border-blue-300 hover:bg-blue-50/70 dark:border-gray-700 dark:bg-gray-800/30 dark:text-blue-400 dark:hover:border-blue-800 dark:hover:bg-blue-900/30"
                          onClick={() => navigate("/notebooks")}
                        >
                          View all {sortedUnfiledNotebooks.length} notebooks
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex w-full flex-col items-center justify-center gap-1 rounded-xs border-2 border-dashed border-gray-400/30 bg-gray-50/60 px-6 py-8 text-center dark:border-gray-600/30 dark:bg-gray-900/30">
                      <h3 className="text-foreground text-md font-semibold">
                        All your notebooks are tucked into folders.
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                        Open a folder above to find them, or create a new notebook to start fresh.
                      </p>
                    </div>
                  )
                ) : (
                  <div className="flex w-full flex-col items-center justify-center gap-1 rounded-xs border-2 border-dashed border-blue-400/60 bg-gray-50/60 px-6 py-8 text-center dark:border-blue-600/60 dark:bg-gray-900/30">
                    <h3 className="text-foreground text-lg font-semibold">No notebooks yet</h3>
                    <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                      Notebooks bring your sources and AI-powered insights together in one place.
                      Create your first one to get started.
                    </p>
                  </div>
                )}
              </>
            )}
          </motion.section>
        </div>

        {/* Create Notebook Modal */}
        <Modal
          isOpen={isCreateNotebookOpen}
          onClose={() => setIsCreateNotebookOpen(false)}
          title="New notebook"
          onSubmit={() => {
            if (newNotebookTitle.trim() && !creatingNotebook) createNotebook();
          }}
          actions={
            <>
              <Button
                variant="secondary"
                onClick={() => setIsCreateNotebookOpen(false)}
                disabled={creatingNotebook}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={async () => await createNotebook()}
                disabled={!newNotebookTitle.trim() || creatingNotebook}
                icon={creatingNotebook ? <Spinner /> : <AddIcon />}
              >
                {creatingNotebook ? "Creating" : "Create"}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <TextField
              id="notebook-title"
              label="Name your notebook"
              type="text"
              value={newNotebookTitle}
              onChange={(e) => setNewNotebookTitle(e.target.value)}
              placeholder="e.g., Research on climate policy"
              autoFocus
            />
            {createNotebookError && (
              <div className="text-sm text-red-500">
                Something went wrong while creating the notebook: {createNotebookError.message}
              </div>
            )}
          </div>
        </Modal>

        {/* Folder Modal */}
        <Modal
          isOpen={isFolderModalOpen}
          onClose={handleCloseFolderModal}
          title={editingFolderId ? "Rename folder" : "New folder"}
          onSubmit={() => {
            if (folderTitle.trim() && !creatingFolder && !updatingFolder) handleSaveFolder();
          }}
          actions={
            <>
              <Button variant="secondary" onClick={handleCloseFolderModal}>
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
                  "Rename folder"
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
              label="Name your folder"
              value={folderTitle}
              onChange={(e) => setFolderTitle(e.target.value)}
              placeholder="e.g., Ideas, Thesis, Travel…"
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
            You're about to delete <span className="font-semibold">{folderToDelete?.title}</span>.
            This can't be undone, any notebooks inside will stay in your library, just moved out of
            the folder.
          </p>
        </Modal>
      </div>
    </div>
  );
}
