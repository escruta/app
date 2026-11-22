import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  useAccessibility,
  useAuth,
  useCookie,
  useFetch,
  useGreeting,
  useMediaQuery,
  useSettings,
} from "@/hooks";
import { BREAKPOINTS } from "@/hooks/useBreakpoint";
import { panelSwitchTransition } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  Button,
  CardSkeleton,
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Select,
  SORT_SELECT_OPTIONS,
  TextField,
  Tooltip,
} from "@/components/ui";
import {
  DitherHalftoneBackground,
  FolderCard,
  FolderCardSkeleton,
  NotebookCard,
  TopBar,
} from "@/components";
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
  RestartIcon,
  SearchIcon,
  SettingsIcon,
} from "@/components/icons";
import type { Folder, Notebook, NotebooksPageResponse } from "@/interfaces";
import {
  DEFAULT_SHOW_FOLDER_NOTEBOOKS,
  getSortedItems,
  SHOW_FOLDER_NOTEBOOKS_COOKIE_KEY,
  SORT_LABELS,
  type SortOption,
  type ViewMode,
  VIEW_MODE_COOKIE_KEY,
} from "@/components/settings";
import { CreateNotebookModal, DeleteFolderModal, FolderModal } from "./home/HomeModals";

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
  const { effectiveReducedMotion } = useAccessibility();
  const { openSettings } = useSettings();
  const { greeting, subtitle } = useGreeting();

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

  const { value: globalSort, setValue: setGlobalSort } = useCookie<SortOption>(
    "globalSortPreference",
    "Newest",
  );
  const { value: globalNotebookViewMode } = useCookie<ViewMode>(VIEW_MODE_COOKIE_KEY, "grid");
  const { value: showFolderNotebooks } = useCookie<boolean>(
    SHOW_FOLDER_NOTEBOOKS_COOKIE_KEY,
    DEFAULT_SHOW_FOLDER_NOTEBOOKS,
  );

  const [isCreateNotebookOpen, setIsCreateNotebookOpen] = useState(false);
  const [newNotebookTitle, setNewNotebookTitle] = useState("");

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderTitle, setFolderTitle] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);

  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [showAllNotebooks, setShowAllNotebooks] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
        setNewNotebookTitle("");
        setIsCreateNotebookOpen(false);
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
  const MAX_NOTEBOOK_ITEMS = notebookViewMode === "grid" ? gridColumns * 2 : 6;

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
    if (activeFolder) {
      return getSortedItems(notebooksByFolder.get(activeFolder.id) ?? [], sortBy);
    }
    const homeNotebooks = showFolderNotebooks
      ? allNotebooks
      : allNotebooks.filter((notebook) => !getEffectiveFolderId(notebook));
    return getSortedItems(homeNotebooks, sortBy);
  }, [
    activeFolder,
    allNotebooks,
    notebooksByFolder,
    showFolderNotebooks,
    getEffectiveFolderId,
    sortBy,
  ]);

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

  const handleOpenFolder = useCallback((folderId: string) => {
    setShowAllNotebooks(false);
    setActiveFolderId(folderId);
  }, []);

  const handleExitFolder = useCallback(() => {
    setShowAllNotebooks(false);
    setActiveFolderId(null);
  }, []);

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
  const firstName = currentUser?.name?.split(" ")[0] || "User";

  const folderGridClassName = "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4";
  const notebookGridClassName =
    notebookViewMode === "grid" ? folderGridClassName : "flex flex-col gap-2.5";

  const topBarTitle = activeFolder ? (
    <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
      <button
        type="button"
        onClick={handleExitFolder}
        className="hidden shrink-0 cursor-pointer text-xs font-medium tracking-wide text-gray-500 uppercase transition-colors hover:text-blue-600 md:block dark:text-gray-400 dark:hover:text-blue-400"
      >
        Home /{" "}
      </button>
      <span className="truncate text-lg font-semibold text-gray-900 dark:text-white">
        {activeFolder.title}
      </span>
    </div>
  ) : (
    "Home"
  );

  const viewKey = isSearchActive ? "search" : (activeFolder?.id ?? "root");

  return (
    <div className="flex h-screen max-h-full w-full flex-col">
      <title>{activeFolder ? `${activeFolder.title} - Home - Escruta` : "Home - Escruta"}</title>
      <TopBar title={topBarTitle} />

      <div
        ref={scrollContainerRef}
        className="relative min-h-0 flex-1 overflow-auto overflow-y-scroll"
      >
        <DitherHalftoneBackground interactionTargetRef={scrollContainerRef} />

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8 md:py-10">
          {/* Header & primary actions */}
          <header className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl dark:text-white">
                  {greeting}, {firstName}
                </h2>
                <p className="mt-1.5 text-sm text-gray-600 md:text-base dark:text-gray-400">
                  {subtitle}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2 self-start">
                {!activeFolder && (
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
                <Tooltip text="Settings" position="bottom">
                  <IconButton
                    icon={<SettingsIcon className="size-4" />}
                    onClick={openSettings}
                    variant="secondary"
                    size="sm"
                    ariaLabel="Settings"
                  />
                </Tooltip>
              </div>
            </div>

            {/* Search bar */}
            <TextField
              id="home-search"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onClear={() => handleSearch("")}
              onKeyDown={(e) => {
                if (e.key === "Escape" && query) {
                  e.preventDefault();
                  handleSearch("");
                }
              }}
              placeholder="Search all notebooks..."
              className="border-gray-200 bg-white/85 text-sm dark:border-gray-700 dark:bg-gray-950/85"
              search
            />
          </header>

          {/* Main library body */}
          <motion.div
            key={viewKey}
            initial={effectiveReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={effectiveReducedMotion ? { duration: 0 } : panelSwitchTransition}
            className="flex flex-col gap-8"
          >
            {isSearchActive ? (
              <section className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-1.5 text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                    <SearchIcon className="size-4 text-blue-500 dark:text-blue-400" />
                    <span>Search results</span>
                    {!isSearching && !searchLoading && searchItems.length > 0 && (
                      <span className="text-xs font-normal text-gray-500 tabular-nums dark:text-gray-400">
                        ({searchItems.length}
                        {searchHasMore ? "+" : ""})
                      </span>
                    )}
                  </h3>

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

                {isSearching || (searchLoading && searchItems.length === 0) ? (
                  <div className={notebookGridClassName}>
                    {Array.from({ length: gridColumns * 2 }).map((_, i) => (
                      <CardSkeleton key={i} viewMode={notebookViewMode} />
                    ))}
                  </div>
                ) : searchError ? (
                  <div className="flex w-full flex-col items-center justify-center gap-2 rounded-xs border border-dashed border-red-300 bg-red-50/60 px-6 py-10 text-center dark:border-red-800/60 dark:bg-red-950/20">
                    <div className="flex size-10 items-center justify-center rounded-xs bg-red-100 text-red-500 dark:bg-red-900/40 dark:text-red-400">
                      <FireIcon className="size-5" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      We couldn't search your notebooks
                    </h3>
                    <p className="max-w-sm text-sm leading-relaxed text-gray-500 dark:text-gray-400">
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
                            notebook.folderId
                              ? foldersById.get(notebook.folderId)?.title
                              : undefined
                          }
                          onChange={() => refetchNotebooks(true, false)}
                        />
                      ))}
                    </div>
                    {searchLoading && (
                      <div className={notebookGridClassName}>
                        {Array.from({ length: gridColumns }).map((_, i) => (
                          <CardSkeleton key={`more-${i}`} viewMode={notebookViewMode} />
                        ))}
                      </div>
                    )}
                    <div ref={searchSentinelRef} className="h-px" />
                  </>
                ) : (
                  <div className="flex w-full flex-col items-center justify-center gap-2 rounded-xs border border-dashed border-gray-300 bg-gray-50/50 px-6 py-12 text-center dark:border-gray-800 dark:bg-gray-900/30">
                    <div className="flex size-11 items-center justify-center rounded-xs border border-gray-200 bg-white text-gray-400 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-500">
                      <SearchIcon className="size-5" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      No matches found
                    </h3>
                    <p className="max-w-sm text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                      No notebooks match "{query.trim()}". Try a different search term.
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-2"
                      onClick={() => handleSearch("")}
                    >
                      Clear search
                    </Button>
                  </div>
                )}
              </section>
            ) : (
              <>
                {showFoldersSection && (
                  <section className="flex flex-col gap-3">
                    <h3 className="flex items-center gap-1.5 text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                      <FolderIcon className="size-4 text-blue-500 dark:text-blue-400" />
                      <span>Folders</span>
                      {!foldersLoading && (
                        <span className="text-xs font-normal text-gray-400 tabular-nums dark:text-gray-500">
                          ({folderItems.length})
                        </span>
                      )}
                    </h3>

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
                              "-ml-1.5 inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xs px-1.5 py-0.5 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:focus-visible:ring-blue-400",
                              notebookDrag?.targetFolderId === null
                                ? "bg-blue-50 text-blue-600 ring-1 ring-blue-400 dark:bg-blue-950/60 dark:text-blue-400 dark:ring-blue-500"
                                : "text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400",
                            )}
                          >
                            <NotebookIcon className="size-4" />
                            <span>Notebooks</span>
                          </button>
                          <ChevronIcon
                            direction="right"
                            className="size-4 shrink-0 text-gray-400 dark:text-gray-500"
                          />
                          <span className="flex min-w-0 items-center gap-1.5 text-gray-900 dark:text-gray-100">
                            <FolderIcon className="size-4 shrink-0 text-blue-500 dark:text-blue-400" />
                            <span className="truncate">{activeFolder.title}</span>
                          </span>
                          {!notebooksLoading && (
                            <span className="text-xs font-normal text-gray-400 tabular-nums dark:text-gray-500">
                              ({filteredNotebooks.length})
                            </span>
                          )}
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
                        <NotebookIcon className="size-4 text-blue-500 dark:text-blue-400" />
                        <span>Notebooks</span>
                        {!notebooksLoading && !notebooksError && (
                          <span className="text-xs font-normal text-gray-400 tabular-nums dark:text-gray-500">
                            ({filteredNotebooks.length})
                          </span>
                        )}
                      </h3>
                    )}

                    <div className="flex items-center gap-2">
                      {notebookDrag && (
                        <span className="hidden text-xs font-medium text-blue-600 sm:inline dark:text-blue-400">
                          {activeFolder
                            ? "Drop on Notebooks to remove from folder"
                            : "Drop on a folder to move"}
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

                  {notebooksLoading ? (
                    <div className={notebookGridClassName}>
                      {Array.from({ length: gridColumns * 2 }).map((_, i) => (
                        <CardSkeleton key={i} viewMode={notebookViewMode} />
                      ))}
                    </div>
                  ) : notebooksError ? (
                    <div className="flex w-full flex-col items-center justify-center gap-2 rounded-xs border border-dashed border-red-300 bg-red-50/60 px-6 py-12 text-center dark:border-red-800/60 dark:bg-red-950/20">
                      <div className="flex size-11 items-center justify-center rounded-xs bg-red-100 text-red-500 dark:bg-red-900/40 dark:text-red-400">
                        <FireIcon className="size-5" />
                      </div>
                      <h4 className="text-base font-semibold text-red-600 dark:text-red-400">
                        We couldn't load your notebooks
                      </h4>
                      <p className="max-w-md text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                        {notebooksError.message}
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-2"
                        icon={<RestartIcon className="size-4" />}
                        onClick={() => refetchNotebooks(true, false)}
                      >
                        Try again
                      </Button>
                    </div>
                  ) : !activeFolder && allNotebooks.length === 0 ? (
                    <div className="flex w-full flex-col items-center justify-center gap-2 rounded-xs border border-dashed border-blue-300/80 bg-gray-50/50 px-6 py-14 text-center dark:border-blue-800/60 dark:bg-gray-900/30">
                      <div className="mb-1 flex size-12 items-center justify-center rounded-xs border border-blue-200 bg-blue-50 text-blue-500 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-400">
                        <NotebookIcon className="size-6" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        No notebooks yet
                      </h3>
                      <p className="max-w-sm text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                        Notebooks bring your sources and AI-powered insights together in one place.
                        Create your first one to get started.
                      </p>
                      <Button
                        icon={<AddIcon className="size-4" />}
                        variant="primary"
                        size="sm"
                        className="mt-3"
                        onClick={() => setIsCreateNotebookOpen(true)}
                      >
                        Create your first notebook
                      </Button>
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
                          className="mt-1 w-full cursor-pointer rounded-xs border border-dashed border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-medium text-blue-600 transition-colors hover:border-blue-300 hover:bg-blue-50/70 dark:border-gray-800 dark:bg-gray-900/30 dark:text-blue-400 dark:hover:border-blue-800 dark:hover:bg-blue-950/30"
                          onClick={() => setShowAllNotebooks((prev) => !prev)}
                        >
                          {showAllNotebooks
                            ? "Show less"
                            : `Show all ${filteredNotebooks.length} notebooks`}
                        </button>
                      )}
                    </>
                  ) : activeFolder ? (
                    <div className="flex w-full flex-col items-center justify-center gap-2 rounded-xs border border-dashed border-gray-300 bg-gray-50/50 px-6 py-12 text-center dark:border-gray-800 dark:bg-gray-900/30">
                      <div className="mb-1 flex size-11 items-center justify-center rounded-xs border border-gray-200 bg-white text-gray-400 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-500">
                        <FolderIcon className="size-5" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        "{activeFolder.title}" is empty
                      </h3>
                      <p className="max-w-sm text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                        Create a new notebook here or move an existing one from its card menu.
                      </p>
                      <Button
                        icon={<AddIcon className="size-4" />}
                        variant="primary"
                        size="sm"
                        className="mt-2"
                        onClick={() => setIsCreateNotebookOpen(true)}
                      >
                        New notebook
                      </Button>
                    </div>
                  ) : (
                    <div className="flex w-full flex-col items-center justify-center gap-2 rounded-xs border border-dashed border-gray-300 bg-gray-50/50 px-6 py-10 text-center dark:border-gray-800 dark:bg-gray-900/30">
                      <div className="mb-1 flex size-11 items-center justify-center rounded-xs border border-gray-200 bg-white text-gray-400 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-500">
                        <FolderIcon className="size-5" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        All notebooks are in folders
                      </h3>
                      <p className="max-w-md text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                        Open a folder above to view them, or create a new notebook outside a folder.
                      </p>
                    </div>
                  )}
                </section>
              </>
            )}
          </motion.div>
        </div>

        <CreateNotebookModal
          isOpen={isCreateNotebookOpen}
          onClose={() => {
            setIsCreateNotebookOpen(false);
            setNewNotebookTitle("");
          }}
          title={newNotebookTitle}
          onTitleChange={setNewNotebookTitle}
          activeFolder={activeFolder}
          creating={creatingNotebook}
          error={createNotebookError}
          onCreate={() => createNotebook()}
        />

        <FolderModal
          isOpen={isFolderModalOpen}
          isEditing={Boolean(editingFolderId)}
          title={folderTitle}
          onTitleChange={setFolderTitle}
          saving={creatingFolder || updatingFolder}
          onClose={handleCloseFolderModal}
          onSave={handleSaveFolder}
        />

        <DeleteFolderModal
          folder={folderToDelete}
          deleting={deletingFolder}
          onClose={() => setFolderToDelete(null)}
          onConfirm={() => executeDeleteFolder()}
        />

        {dragGhost}
      </div>
    </div>
  );
}
