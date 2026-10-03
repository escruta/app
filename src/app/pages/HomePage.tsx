import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth, useCookie, useFetch, useGreeting, useMediaQuery, useSettings } from "@/hooks";
import { BREAKPOINTS } from "@/hooks/useBreakpoint";
import {
  Button,
  CardSkeleton,
  IconButton,
  Modal,
  Spinner,
  TextField,
  Tooltip,
} from "@/components/ui";
import { FolderCard, NotebookCard, TopBar } from "@/components";
import {
  AddIcon,
  FireIcon,
  FolderAddIcon,
  FolderIcon,
  NotebookIcon,
  SearchIcon,
  SettingsIcon,
} from "@/components/icons";
import { AnimatePresence, motion } from "motion/react";
import type { Folder, Notebook, NotebooksPageResponse } from "@/interfaces";
import {
  getSortedItems,
  type SortOption,
  type ViewMode,
  VIEW_MODE_COOKIE_KEYS,
} from "@/components/settings";

const SEARCH_PAGE_SIZE = 20;

export default function HomePage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const {
    data: notebooks,
    loading: notebooksLoading,
    error: notebooksError,
    refetch: refetchNotebooks,
  } = useFetch<Notebook[]>("/notebooks");
  const {
    data: folders,
    loading: foldersLoading,
    refetch: refetchFolders,
  } = useFetch<Folder[]>("/folders");
  const { greeting, subtitle } = useGreeting();

  const [globalSort] = useCookie<SortOption>("globalSortPreference", "Newest");
  const [globalFolderViewMode] = useCookie<ViewMode>(VIEW_MODE_COOKIE_KEYS.folder, "grid");
  const [globalNotebookViewMode] = useCookie<ViewMode>(VIEW_MODE_COOKIE_KEYS.notebook, "grid");

  const [isCreateNotebookOpen, setIsCreateNotebookOpen] = useState(false);
  const [newNotebookTitle, setNewNotebookTitle] = useState("");

  const { openSettings } = useSettings();

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderTitle, setFolderTitle] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);

  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());
  const [showAllNotebooks, setShowAllNotebooks] = useState(false);

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
        if (folderToDelete) {
          const deletedFolderId = folderToDelete.id;
          setExpandedFolderIds((prev) => {
            if (!prev.has(deletedFolderId)) return prev;
            const next = new Set(prev);
            next.delete(deletedFolderId);
            return next;
          });
        }
        setFolderToDelete(null);
      },
    },
    false,
  );

  const folderViewMode = globalFolderViewMode || "grid";
  const notebookViewMode = globalNotebookViewMode || "grid";
  const sortBy = globalSort || "Newest";

  const isBelowSm = useMediaQuery(BREAKPOINTS.mobile - 1);
  const isBelowMd = useMediaQuery(BREAKPOINTS.tablet - 1);
  const gridColumns = isBelowSm ? 2 : isBelowMd ? 3 : 4;
  const MAX_NOTEBOOK_ITEMS = notebookViewMode === "grid" ? gridColumns * 2 : 5;

  const folderItems = folders ?? [];

  const unfiledNotebooks = (notebooks ?? []).filter((nb) => !nb.folderId);
  const sortedUnfiledNotebooks = getSortedItems(unfiledNotebooks, sortBy);
  const displayedNotebooks = showAllNotebooks
    ? sortedUnfiledNotebooks
    : sortedUnfiledNotebooks.slice(0, MAX_NOTEBOOK_ITEMS);
  const hasMoreNotebooks = sortedUnfiledNotebooks.length > MAX_NOTEBOOK_ITEMS;

  const notebooksByFolder = useMemo(() => {
    const map = new Map<string, Notebook[]>();
    for (const notebook of notebooks ?? []) {
      if (!notebook.folderId) continue;
      const list = map.get(notebook.folderId) ?? [];
      list.push(notebook);
      map.set(notebook.folderId, list);
    }
    return map;
  }, [notebooks]);

  const folderGroups = useMemo(() => {
    const groups: Folder[][] = [];
    if (folderViewMode === "grid") {
      for (let i = 0; i < folderItems.length; i += gridColumns) {
        groups.push(folderItems.slice(i, i + gridColumns));
      }
    } else {
      for (const folder of folderItems) groups.push([folder]);
    }
    return groups;
  }, [folderItems, folderViewMode, gridColumns]);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchPage, setSearchPage] = useState(0);
  const [searchItems, setSearchItems] = useState<Notebook[]>([]);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchHasMoreRef = useRef(true);
  const searchLoadingRef = useRef(false);

  const searchOnSuccessRef = useRef<(data: NotebooksPageResponse) => void>(undefined);
  searchOnSuccessRef.current = (data) => {
    setIsSearching(false);
    setSearchHasMore(data.hasMore);
    searchHasMoreRef.current = data.hasMore;
    setSearchItems((prev) => (searchPage === 0 ? data.notebooks : [...prev, ...data.notebooks]));
  };

  const searchParams = useMemo(() => {
    const params: Record<string, string> = {
      limit: String(SEARCH_PAGE_SIZE),
      offset: String(searchPage * SEARCH_PAGE_SIZE),
      sort: sortBy,
    };
    if (debouncedQuery) params.search = debouncedQuery;
    return params;
  }, [searchPage, sortBy, debouncedQuery]);

  const { loading: searchLoading, error: searchError } = useFetch<NotebooksPageResponse>(
    "/notebooks/page",
    {
      params: searchParams,
      skipCache: true,
      onSuccess: (data) => searchOnSuccessRef.current?.(data),
    },
    Boolean(debouncedQuery),
  );

  searchLoadingRef.current = searchLoading;

  const isSearchActive = query.trim().length > 0;

  const handleSearch = useCallback((newQuery: string) => {
    setQuery(newQuery);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (!newQuery.trim()) {
      setIsSearching(false);
      setDebouncedQuery("");
      setSearchPage(0);
      setSearchItems([]);
      searchHasMoreRef.current = true;
      return;
    }

    setIsSearching(true);
    searchDebounceRef.current = setTimeout(() => {
      setSearchPage(0);
      setSearchItems([]);
      searchHasMoreRef.current = true;
      setDebouncedQuery(newQuery);
    }, 300);
  }, []);

  const searchSentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && searchHasMoreRef.current && !searchLoadingRef.current) {
          setSearchPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px 400px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const handleToggleFolder = (folder: Folder) => {
    setShowAllNotebooks(false);
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folder.id)) {
        next.delete(folder.id);
      } else {
        next.add(folder.id);
      }
      return next;
    });
  };

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

  const hasFolders = !!folders?.length;

  const notebookGridClassName =
    notebookViewMode === "grid"
      ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4"
      : "flex flex-col gap-3";

  const renderFolderContents = (folder: Folder) => {
    const folderNotebooks = getSortedItems(notebooksByFolder.get(folder.id) ?? [], sortBy);

    return (
      <div className="mt-3 mb-4 rounded-xs border border-blue-200/70 bg-blue-50/40 p-4 dark:border-blue-800/50 dark:bg-blue-950/20">
        {folderNotebooks.length > 0 ? (
          <div className={notebookGridClassName}>
            {folderNotebooks.map((notebook) => (
              <NotebookCard
                key={notebook.id}
                notebook={notebook}
                viewMode={notebookViewMode}
                folders={folders ?? undefined}
                onChange={() => refetchNotebooks(true, false)}
              />
            ))}
          </div>
        ) : (
          <div className="flex w-full flex-col items-center justify-center gap-1 rounded-xs border-2 border-dashed border-blue-400/40 bg-white/50 px-6 py-6 text-center dark:border-blue-600/40 dark:bg-gray-900/30">
            <h4 className="text-foreground text-sm font-semibold">This folder is empty</h4>
            <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              Move a notebook into it from its card menu to start organizing.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen max-h-full w-full flex-col">
      <title>Home - Escruta</title>
      <TopBar />
      <div className="relative size-full overflow-auto overflow-y-scroll">
        <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8 md:py-12">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                {greeting}, {currentUser?.name?.split(" ")[0] || "User"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>
            </div>
            <Tooltip text="Settings" position="bottom">
              <IconButton
                icon={<SettingsIcon className="size-5" />}
                onClick={openSettings}
                variant="ghost"
                size="sm"
                ariaLabel="Settings"
              />
            </Tooltip>
          </div>

          <div className="sticky top-0 z-20 bg-white/95 py-1 backdrop-blur-sm dark:bg-gray-950/95">
            <TextField
              id="home-search"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onClear={() => handleSearch("")}
              placeholder="Search all notebooks..."
              search
            />
          </div>

          {isSearchActive ? (
            <section>
              <h3 className="mb-3 flex items-center justify-between gap-2 text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                <span className="flex items-center gap-1.5">
                  <SearchIcon className="size-3.5 text-blue-500 dark:text-blue-400" />
                  Search results
                </span>
                {!isSearching && !searchLoading && searchItems.length > 0 && (
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                    {searchItems.length}
                    {searchHasMore ? "+" : ""} found
                  </span>
                )}
              </h3>

              {isSearching || (searchLoading && searchItems.length === 0) ? (
                <div className={notebookGridClassName}>
                  {Array.from({ length: gridColumns * 2 }).map((_, i) => (
                    <CardSkeleton key={i} viewMode={notebookViewMode} />
                  ))}
                </div>
              ) : searchError ? (
                <div className="flex w-full flex-col items-center justify-center gap-1 rounded-xs border-2 border-dashed border-red-300 bg-red-50/60 px-6 py-8 text-center dark:border-red-800/50 dark:bg-red-950/20">
                  <h3 className="text-foreground text-lg font-semibold">
                    We couldn't search your notebooks
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                    {searchError.message}
                  </p>
                </div>
              ) : searchItems.length > 0 ? (
                <>
                  <div className={notebookGridClassName}>
                    {searchItems.map((notebook) => (
                      <NotebookCard
                        key={notebook.id}
                        notebook={notebook}
                        viewMode={notebookViewMode}
                        folders={folders ?? undefined}
                        onChange={() => refetchNotebooks(true, false)}
                      />
                    ))}
                  </div>
                  {searchLoading && (
                    <div className={`${notebookGridClassName} mt-3`}>
                      {Array.from({ length: gridColumns }).map((_, i) => (
                        <CardSkeleton key={`more-${i}`} viewMode={notebookViewMode} />
                      ))}
                    </div>
                  )}
                  <div ref={searchSentinelRef} className="h-px" />
                </>
              ) : (
                <div className="flex w-full flex-col items-center justify-center gap-1 rounded-xs border-2 border-dashed border-gray-400/30 bg-gray-50/60 px-6 py-8 text-center dark:border-gray-600/30 dark:bg-gray-900/30">
                  <h3 className="text-foreground text-lg font-semibold">No matches found</h3>
                  <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                    No notebooks match "{query.trim()}". Try a different search term.
                  </p>
                </div>
              )}
            </section>
          ) : (
            <>
              <section>
                <h3 className="mb-3 flex items-center justify-between gap-2 text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                  <span className="flex items-center gap-1.5">
                    <FolderIcon className="size-3.5 text-blue-500 dark:text-blue-400" />
                    Folders
                  </span>
                  <Button
                    icon={<FolderAddIcon className="size-4" />}
                    variant="primary"
                    size="sm"
                    onClick={handleCreateFolder}
                  >
                    New folder
                  </Button>
                </h3>

                {foldersLoading && !folders ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-12.5 w-full animate-pulse rounded-xs border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
                      />
                    ))}
                  </div>
                ) : hasFolders ? (
                  <div className="flex flex-col gap-3">
                    {folderGroups.map((group) => (
                      <div key={group[0]?.id}>
                        <div
                          className={
                            folderViewMode === "grid"
                              ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4"
                              : "flex flex-col gap-3"
                          }
                        >
                          {group.map((folder) => (
                            <FolderCard
                              key={folder.id}
                              folder={folder}
                              isExpanded={expandedFolderIds.has(folder.id)}
                              notebookCount={(notebooksByFolder.get(folder.id) ?? []).length}
                              onToggle={() => handleToggleFolder(folder)}
                              onEditFolder={() => handleEditFolder(folder)}
                              onDeleteFolder={() => setFolderToDelete(folder)}
                            />
                          ))}
                        </div>

                        <AnimatePresence initial={false}>
                          {group
                            .filter((folder) => expandedFolderIds.has(folder.id))
                            .map((folder) => (
                              <motion.div
                                key={folder.id}
                                initial={{ height: 0 }}
                                animate={{ height: "auto" }}
                                exit={{ height: 0 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className="overflow-hidden"
                              >
                                {renderFolderContents(folder)}
                              </motion.div>
                            ))}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex w-full flex-col items-center justify-center gap-1 rounded-xs border-2 border-dashed border-blue-400/60 bg-gray-50/60 px-6 py-8 text-center dark:border-blue-600/60 dark:bg-gray-900/30">
                    <h3 className="text-foreground text-lg font-semibold">No folders yet</h3>
                    <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                      Folders are a handy way to keep related notebooks together. Create your first
                      one to start organizing.
                    </p>
                  </div>
                )}
              </section>

              <section>
                <h3 className="mb-3 flex items-center justify-between gap-2 text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                  <span className="flex items-center gap-1.5">
                    <NotebookIcon className="size-3.5 text-blue-500 dark:text-blue-400" />
                    Notebooks
                  </span>
                  <Button
                    icon={<AddIcon className="size-4" />}
                    size="sm"
                    onClick={() => setIsCreateNotebookOpen(true)}
                  >
                    New notebook
                  </Button>
                </h3>

                {notebooksLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner />
                  </div>
                ) : notebooksError ? (
                  <div className="border-y border-gray-200 bg-gray-50 px-6 py-5 dark:border-gray-700 dark:bg-gray-950">
                    <div className="flex items-center justify-center py-12">
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
                    </div>
                  </div>
                ) : (
                  <>
                    {notebooks && notebooks.length > 0 ? (
                      sortedUnfiledNotebooks.length > 0 ? (
                        <>
                          <div className={notebookGridClassName}>
                            {displayedNotebooks.map((notebook) => (
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
                              onClick={() => setShowAllNotebooks((prev) => !prev)}
                            >
                              {showAllNotebooks
                                ? "Show less"
                                : `Show all ${sortedUnfiledNotebooks.length} notebooks`}
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="flex w-full flex-col items-center justify-center gap-1 rounded-xs border-2 border-dashed border-gray-400/30 bg-gray-50/60 px-6 py-8 text-center dark:border-gray-600/30 dark:bg-gray-900/30">
                          <h3 className="text-foreground text-md font-semibold">
                            All your notebooks are tucked into folders.
                          </h3>
                          <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                            Open a folder above to find them, or create a new notebook to start
                            fresh.
                          </p>
                        </div>
                      )
                    ) : (
                      <div className="flex w-full flex-col items-center justify-center gap-1 rounded-xs border-2 border-dashed border-blue-400/60 bg-gray-50/60 px-6 py-8 text-center dark:border-blue-600/60 dark:bg-gray-900/30">
                        <h3 className="text-foreground text-lg font-semibold">No notebooks yet</h3>
                        <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                          Notebooks bring your sources and AI-powered insights together in one
                          place. Create your first one to get started.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </section>
            </>
          )}
        </div>

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
