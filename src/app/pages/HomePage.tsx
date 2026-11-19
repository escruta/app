import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth, useCookie, useFetch, useGreeting, useMediaQuery, useSettings } from "@/hooks";
import { BREAKPOINTS } from "@/hooks/useBreakpoint";
import { cn } from "@/lib/utils";
import {
  Button,
  CardSkeleton,
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Modal,
  Select,
  SORT_SELECT_OPTIONS,
  Spinner,
  TextField,
  Tooltip,
} from "@/components/ui";
import { FolderCard, FolderCardSkeleton, NotebookCard, TopBar } from "@/components";
import {
  AddIcon,
  ChevronIcon,
  DeleteIcon,
  DotsVerticalIcon,
  EditIcon,
  FireIcon,
  FolderAddIcon,
  FolderIcon,
  NotebookIcon,
  SearchIcon,
  SettingsIcon,
} from "@/components/icons";
import type { Folder, Notebook, NotebooksPageResponse } from "@/interfaces";
import {
  getSortedItems,
  SORT_LABELS,
  type SortOption,
  type ViewMode,
  VIEW_MODE_COOKIE_KEY,
} from "@/components/settings";

const SEARCH_PAGE_SIZE = 20;
const NOTEBOOK_DRAG_THRESHOLD_PX = 6;

type NotebookDragState = {
  id: string;
  x: number;
  y: number;
  targetFolderId: string | null | undefined;
};

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

  const { value: globalSort, setValue: setGlobalSort } = useCookie<SortOption>(
    "globalSortPreference",
    "Newest",
  );
  const { value: globalNotebookViewMode } = useCookie<ViewMode>(VIEW_MODE_COOKIE_KEY, "grid");

  const [isCreateNotebookOpen, setIsCreateNotebookOpen] = useState(false);
  const [newNotebookTitle, setNewNotebookTitle] = useState("");

  const { openSettings } = useSettings();

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderTitle, setFolderTitle] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);

  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [showAllNotebooks, setShowAllNotebooks] = useState(false);

  const folderItems = folders ?? [];
  const allNotebooks = notebooks ?? [];

  const foldersById = useMemo(() => {
    const map = new Map<string, Folder>();
    for (const folder of folderItems) {
      map.set(folder.id, folder);
    }
    return map;
  }, [folderItems]);

  const activeFolder = activeFolderId ? foldersById.get(activeFolderId) : undefined;

  const {
    loading: creatingNotebook,
    error: createNotebookError,
    refetch: createNotebook,
  } = useFetch<Notebook>(
    "/notebooks",
    {
      method: "POST",
      data: activeFolder
        ? { title: newNotebookTitle, folderId: activeFolder.id }
        : { title: newNotebookTitle },
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
        if (folderToDelete && activeFolderId === folderToDelete.id) {
          setActiveFolderId(null);
        }
        setFolderToDelete(null);
      },
    },
    false,
  );

  const [notebookDrag, setNotebookDrag] = useState<NotebookDragState | null>(null);
  const notebookDragRef = useRef<NotebookDragState | null>(null);
  const notebookDragStartRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const [moveTarget, setMoveTarget] = useState<{
    notebookId: string;
    folderId: string | null;
  } | null>(null);
  const [pendingMoves, setPendingMoves] = useState<Record<string, string | null>>({});

  const { refetch: moveNotebook } = useFetch<Notebook>(
    "/notebooks",
    {
      method: "PUT",
      data: moveTarget
        ? {
            id: moveTarget.notebookId,
            folderId: moveTarget.folderId,
            removeFolder: moveTarget.folderId === null,
          }
        : undefined,
      onSuccess: () => {
        useFetch.clearCache("/notebooks");
        setMoveTarget(null);
        refetchNotebooks(true, false);
      },
      onError: (error) => {
        console.error("Error moving notebook:", error.message);
        const notebookId = moveTarget?.notebookId;
        if (notebookId) {
          setPendingMoves((prev) => {
            const next = { ...prev };
            delete next[notebookId];
            return next;
          });
        }
        setMoveTarget(null);
      },
    },
    false,
  );

  useEffect(() => {
    if (moveTarget) moveNotebook();
  }, [moveTarget, moveNotebook]);

  useEffect(() => {
    setPendingMoves((prev) => {
      const entries = Object.entries(prev);
      if (entries.length === 0) return prev;
      const next = { ...prev };
      let changed = false;
      for (const [id, folderId] of entries) {
        const notebook = (notebooks ?? []).find((n) => n.id === id);
        if (!notebook || (notebook.folderId ?? null) === folderId) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [notebooks]);

  const getEffectiveFolderId = useCallback(
    (notebook: Notebook): string | null =>
      Object.prototype.hasOwnProperty.call(pendingMoves, notebook.id)
        ? pendingMoves[notebook.id]
        : (notebook.folderId ?? null),
    [pendingMoves],
  );

  const notebookViewMode = globalNotebookViewMode || "grid";
  const sortBy = globalSort || "Newest";

  const isBelowSm = useMediaQuery(BREAKPOINTS.mobile - 1);
  const isBelowMd = useMediaQuery(BREAKPOINTS.tablet - 1);
  const gridColumns = isBelowSm ? 2 : isBelowMd ? 3 : 4;
  const MAX_NOTEBOOK_ITEMS = notebookViewMode === "grid" ? gridColumns * 2 : 5;

  const notebooksByFolder = useMemo(() => {
    const map = new Map<string, Notebook[]>();
    for (const notebook of allNotebooks) {
      const folderId = getEffectiveFolderId(notebook);
      if (!folderId) continue;
      const list = map.get(folderId) ?? [];
      list.push(notebook);
      map.set(folderId, list);
    }
    return map;
  }, [allNotebooks, getEffectiveFolderId]);

  const filteredNotebooks = useMemo(() => {
    if (!activeFolder) return getSortedItems(allNotebooks, sortBy);
    return getSortedItems(notebooksByFolder.get(activeFolder.id) ?? [], sortBy);
  }, [activeFolder, allNotebooks, notebooksByFolder, sortBy]);

  const displayedNotebooks = showAllNotebooks
    ? filteredNotebooks
    : filteredNotebooks.slice(0, MAX_NOTEBOOK_ITEMS);
  const hasMoreNotebooks = filteredNotebooks.length > MAX_NOTEBOOK_ITEMS;

  const allNotebooksRef = useRef(allNotebooks);
  allNotebooksRef.current = allNotebooks;
  const getEffectiveFolderIdRef = useRef(getEffectiveFolderId);
  getEffectiveFolderIdRef.current = getEffectiveFolderId;

  const handleNotebookPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, notebook: Notebook) => {
      if (e.button !== 0 || e.pointerType === "touch") return;
      if ((e.target as HTMLElement).closest("button")) return;
      notebookDragStartRef.current = { id: notebook.id, x: e.clientX, y: e.clientY };
    },
    [],
  );

  const endNotebookDrag = useCallback((commit: boolean) => {
    const current = notebookDragRef.current;
    notebookDragStartRef.current = null;
    if (!current) return;

    const suppressNextClick = (ev: MouseEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
    };
    window.addEventListener("click", suppressNextClick, { capture: true, once: true });
    window.setTimeout(() => {
      window.removeEventListener("click", suppressNextClick, { capture: true });
    }, 0);

    notebookDragRef.current = null;
    setNotebookDrag(null);
    document.body.classList.remove("dragging");

    if (commit && current.targetFolderId !== undefined) {
      const notebook = allNotebooksRef.current.find((n) => n.id === current.id);
      if (notebook && getEffectiveFolderIdRef.current(notebook) !== current.targetFolderId) {
        setPendingMoves((prev) => ({ ...prev, [current.id]: current.targetFolderId! }));
        setMoveTarget({ notebookId: current.id, folderId: current.targetFolderId });
      }
    }
  }, []);

  useEffect(() => {
    const getDropTarget = (x: number, y: number, notebookId: string): string | null | undefined => {
      const el = document.elementFromPoint(x, y);
      const folderEl = el?.closest<HTMLElement>("[data-drop-folder-id]");
      let target: string | null | undefined = undefined;
      if (folderEl?.dataset.dropFolderId) {
        target = folderEl.dataset.dropFolderId;
      } else if (el?.closest("[data-drop-folder-root]")) {
        target = null;
      }
      if (target === undefined) return undefined;
      const notebook = allNotebooksRef.current.find((n) => n.id === notebookId);
      if (!notebook || getEffectiveFolderIdRef.current(notebook) === target) return undefined;
      return target;
    };

    const handlePointerMove = (e: PointerEvent) => {
      const start = notebookDragStartRef.current;
      if (start && !notebookDragRef.current) {
        const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y);
        if (moved >= NOTEBOOK_DRAG_THRESHOLD_PX) {
          const targetFolderId = getDropTarget(e.clientX, e.clientY, start.id);
          notebookDragRef.current = {
            id: start.id,
            x: e.clientX,
            y: e.clientY,
            targetFolderId,
          };
          setNotebookDrag(notebookDragRef.current);
          document.body.classList.add("dragging");
        }
        return;
      }

      const current = notebookDragRef.current;
      if (current) {
        const targetFolderId = getDropTarget(e.clientX, e.clientY, current.id);
        if (
          targetFolderId !== current.targetFolderId ||
          e.clientX !== current.x ||
          e.clientY !== current.y
        ) {
          notebookDragRef.current = {
            ...current,
            x: e.clientX,
            y: e.clientY,
            targetFolderId,
          };
          setNotebookDrag(notebookDragRef.current);
        }
      }
    };

    const handlePointerUp = () => endNotebookDrag(true);
    const handleCancel = () => endNotebookDrag(false);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && notebookDragRef.current) {
        e.preventDefault();
        endNotebookDrag(false);
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handleCancel);
    window.addEventListener("blur", handleCancel);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handleCancel);
      window.removeEventListener("blur", handleCancel);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("dragging");
    };
  }, [endNotebookDrag]);

  const draggingNotebook = notebookDrag
    ? (allNotebooks.find((n) => n.id === notebookDrag.id) ?? null)
    : null;
  const dragGhost =
    notebookDrag && draggingNotebook ? (
      <div
        className={cn(
          "pointer-events-none fixed z-50 flex items-center gap-1.5 rounded-xs border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200",
          {
            "opacity-100": notebookDrag.targetFolderId !== undefined,
            "opacity-60": notebookDrag.targetFolderId === undefined,
          },
        )}
        style={{
          left: notebookDrag.x,
          top: notebookDrag.y,
          transform: "translate(-50%, calc(-100% - 8px))",
        }}
      >
        <span className="shrink-0 text-blue-600 dark:text-blue-400 [&>svg]:size-3.5 [&>svg]:shrink-0">
          <NotebookIcon />
        </span>
        <span className="max-w-44 min-w-0 truncate">{draggingNotebook.title}</span>
      </div>
    ) : null;

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

  const handleOpenFolder = (folderId: string) => {
    setShowAllNotebooks(false);
    setActiveFolderId(folderId);
  };

  const handleExitFolder = () => {
    setShowAllNotebooks(false);
    setActiveFolderId(null);
  };

  const handleSortChange = useCallback(
    (nextSort: SortOption) => {
      if (nextSort === sortBy) return;
      setGlobalSort(nextSort);
      if (debouncedQuery) {
        setSearchPage(0);
        setSearchItems([]);
        searchHasMoreRef.current = true;
      }
    },
    [sortBy, setGlobalSort, debouncedQuery],
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

  const handleCloseFolderModal = () => {
    setIsFolderModalOpen(false);
    setEditingFolderId(null);
    setFolderTitle("");
  };

  const hasFolders = folderItems.length > 0;
  const showFoldersSection = !activeFolder && ((foldersLoading && !folders) || hasFolders);

  const folderGridClassName = "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4";
  const notebookGridClassName =
    notebookViewMode === "grid" ? folderGridClassName : "flex flex-col gap-3";

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

          <TextField
            id="home-search"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onClear={() => handleSearch("")}
            placeholder="Search all notebooks..."
            search
          />

          {isSearchActive ? (
            <section>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-1.5 text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                  <SearchIcon className="size-3.5 text-blue-500 dark:text-blue-400" />
                  <span>Search results</span>
                </h3>
                <div className="flex items-center gap-2">
                  {!isSearching && !searchLoading && searchItems.length > 0 && (
                    <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                      {searchItems.length}
                      {searchHasMore ? "+" : ""} found
                    </span>
                  )}
                  <Select
                    variant="compact"
                    size="sm"
                    options={SORT_SELECT_OPTIONS}
                    value={sortBy}
                    onChange={handleSortChange}
                    heading="Sort by"
                    ariaLabel={`Sort notebooks: ${SORT_LABELS[sortBy]}`}
                    align="right"
                  />
                </div>
              </div>

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
                        folderTitle={
                          notebook.folderId ? foldersById.get(notebook.folderId)?.title : undefined
                        }
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
            <div className="flex flex-col gap-6">
              {showFoldersSection && (
                <section className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="flex items-center gap-1.5 text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                      <FolderIcon className="size-3.5 text-blue-500 dark:text-blue-400" />
                      <span>Folders</span>
                    </h3>
                    <Button
                      icon={<FolderAddIcon className="size-4" />}
                      variant="secondary"
                      size="sm"
                      onClick={handleCreateFolder}
                    >
                      New folder
                    </Button>
                  </div>

                  <div className={folderGridClassName}>
                    {foldersLoading && !folders
                      ? Array.from({ length: gridColumns }).map((_, i) => (
                          <FolderCardSkeleton key={i} />
                        ))
                      : folderItems.map((folder) => (
                          <FolderCard
                            key={folder.id}
                            folder={folder}
                            notebookCount={(notebooksByFolder.get(folder.id) ?? []).length}
                            isDropTarget={notebookDrag?.targetFolderId === folder.id}
                            onOpen={() => handleOpenFolder(folder.id)}
                            onEditFolder={() => handleEditFolder(folder)}
                            onDeleteFolder={() => setFolderToDelete(folder)}
                          />
                        ))}
                  </div>
                </section>
              )}

              <section className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {activeFolder ? (
                    <div className="flex min-w-0 items-center gap-1">
                      <nav
                        aria-label="Breadcrumb"
                        className="flex min-w-0 items-center gap-1.5 text-base font-semibold tracking-tight"
                      >
                        <button
                          type="button"
                          data-drop-folder-root="true"
                          onClick={handleExitFolder}
                          className={cn(
                            "inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xs px-1.5 py-0.5 -ml-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none",
                            notebookDrag?.targetFolderId === null
                              ? "bg-blue-50 text-blue-600 ring-1 ring-blue-400 dark:bg-blue-950/60 dark:text-blue-400 dark:ring-blue-500"
                              : "text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400",
                          )}
                        >
                          <NotebookIcon className="size-3.5" />
                          <span>Notebooks</span>
                        </button>
                        <ChevronIcon
                          direction="right"
                          className="size-4 shrink-0 text-gray-400 dark:text-gray-500"
                        />
                        <span className="flex min-w-0 items-center gap-1.5 text-gray-900 dark:text-gray-100">
                          <FolderIcon className="size-3.5 shrink-0 text-blue-500 dark:text-blue-400" />
                          <span className="truncate">{activeFolder.title}</span>
                        </span>
                      </nav>
                      <Menu>
                        <Tooltip text="Folder options" position="top">
                          <MenuTrigger>
                            <IconButton
                              icon={<DotsVerticalIcon />}
                              size="sm"
                              ariaLabel="Folder options"
                              variant="ghost"
                            />
                          </MenuTrigger>
                        </Tooltip>
                        <MenuContent align="left">
                          <MenuItem
                            icon={<EditIcon className="size-4" />}
                            label="Rename folder"
                            onClick={() => handleEditFolder(activeFolder)}
                          />
                          <MenuItem
                            icon={<DeleteIcon className="size-4" />}
                            label="Delete folder"
                            variant="danger"
                            onClick={() => setFolderToDelete(activeFolder)}
                          />
                        </MenuContent>
                      </Menu>
                    </div>
                  ) : (
                    <h3 className="flex items-center gap-1.5 text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                      <NotebookIcon className="size-3.5 text-blue-500 dark:text-blue-400" />
                      <span>Notebooks</span>
                    </h3>
                  )}

                  <div className="flex items-center gap-2">
                    <Select
                      variant="compact"
                      size="sm"
                      options={SORT_SELECT_OPTIONS}
                      value={sortBy}
                      onChange={handleSortChange}
                      heading="Sort by"
                      ariaLabel={`Sort notebooks: ${SORT_LABELS[sortBy]}`}
                      align="right"
                    />
                    {!activeFolder && !showFoldersSection && (
                      <Button
                        icon={<FolderAddIcon className="size-4" />}
                        variant="secondary"
                        size="sm"
                        onClick={handleCreateFolder}
                      >
                        New folder
                      </Button>
                    )}
                    <Button
                      icon={<AddIcon className="size-4" />}
                      variant="primary"
                      size="sm"
                      onClick={() => setIsCreateNotebookOpen(true)}
                    >
                      New notebook
                    </Button>
                  </div>
                </div>

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
                ) : !activeFolder && allNotebooks.length === 0 ? (
                  <div className="flex w-full flex-col items-center justify-center gap-1 rounded-xs border-2 border-dashed border-blue-400/60 bg-gray-50/60 px-6 py-8 text-center dark:border-blue-600/60 dark:bg-gray-900/30">
                    <h3 className="text-foreground text-lg font-semibold">No notebooks yet</h3>
                    <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                      Notebooks bring your sources and AI-powered insights together in one place.
                      Create your first one to get started.
                    </p>
                  </div>
                ) : filteredNotebooks.length > 0 ? (
                  <>
                    <div className={notebookGridClassName}>
                      {displayedNotebooks.map((notebook) => {
                        const effectiveFolderId = getEffectiveFolderId(notebook);
                        return (
                          <NotebookCard
                            key={notebook.id}
                            notebook={notebook}
                            viewMode={notebookViewMode}
                            folders={folders ?? undefined}
                            folderTitle={
                              !activeFolder && effectiveFolderId
                                ? foldersById.get(effectiveFolderId)?.title
                                : undefined
                            }
                            isDragging={notebookDrag?.id === notebook.id}
                            onPointerDown={hasFolders ? handleNotebookPointerDown : undefined}
                            onChange={() => refetchNotebooks(true, false)}
                          />
                        );
                      })}
                    </div>
                    {hasMoreNotebooks && (
                      <button
                        type="button"
                        className="mt-1 w-full rounded-xs border border-dashed border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-medium text-blue-600 transition-colors hover:border-blue-300 hover:bg-blue-50/70 dark:border-gray-700 dark:bg-gray-800/30 dark:text-blue-400 dark:hover:border-blue-800 dark:hover:bg-blue-900/30"
                        onClick={() => setShowAllNotebooks((prev) => !prev)}
                      >
                        {showAllNotebooks
                          ? "Show less"
                          : `Show all ${filteredNotebooks.length} notebooks`}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="flex w-full flex-col items-center justify-center gap-1 rounded-xs border-2 border-dashed border-gray-400/30 bg-gray-50/60 px-6 py-8 text-center dark:border-gray-600/30 dark:bg-gray-900/30">
                    <h3 className="text-foreground text-md font-semibold">
                      {activeFolder ? `"${activeFolder.title}" is empty` : "This folder is empty"}
                    </h3>
                    <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                      Create a new notebook here or move an existing one from its card menu.
                    </p>
                  </div>
                )}
              </section>
            </div>
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
            {activeFolder && (
              <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <FolderIcon className="size-3.5 shrink-0 text-blue-500 dark:text-blue-400" />
                <span className="truncate">
                  Will be created in{" "}
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    {activeFolder.title}
                  </span>
                </span>
              </p>
            )}
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
        {dragGhost}
      </div>
    </div>
  );
}
