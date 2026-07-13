import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Folder, Notebook, NotebooksPageResponse } from "@/interfaces";
import { useCookie, useFetch } from "@/hooks";
import { TopBar } from "@/components";
import { NotebookCard } from "@/components";
import { NotebookIcon, SearchIcon } from "@/components/icons";
import { motion } from "motion/react";
import { SimpleBackground } from "@/components/backgrounds/SimpleBackground";
import { TextField, CardSkeleton } from "@/components/ui";
import type { SortOption } from "@/components/settings";

const PAGE_SIZE: number = 20;

export default function NotebooksPage() {
  const [globalViewMode] = useCookie<"grid" | "list">("globalViewMode", "grid");
  const [globalSort] = useCookie<SortOption>("globalSortPreference", "Newest");
  const viewMode = globalViewMode || "grid";

  const { data: folders } = useFetch<Folder[]>("/folders");

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<Notebook[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const sort = globalSort || "Newest";
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadRef = useRef(true);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);

  const onSuccessRef = useRef<(data: NotebooksPageResponse) => void>(undefined);
  onSuccessRef.current = (data) => {
    initialLoadRef.current = false;
    setIsSearching(false);
    if (page === 0) {
      setItems(data.notebooks);
    } else {
      setItems((prev) => [...prev, ...data.notebooks]);
    }
    hasMoreRef.current = data.hasMore;
  };

  const params = useMemo(() => {
    const p: Record<string, string> = {
      limit: String(PAGE_SIZE),
      offset: String(page * PAGE_SIZE),
      sort,
    };
    if (debouncedQuery) p.search = debouncedQuery;
    return p;
  }, [page, sort, debouncedQuery]);

  const { loading } = useFetch<NotebooksPageResponse>(
    "/notebooks/page",
    {
      params,
      skipCache: true,
      onSuccess: (data) => onSuccessRef.current?.(data),
    },
    true,
  );

  loadingRef.current = loading;

  const handleSearch = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setIsSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      setItems([]);
      hasMoreRef.current = true;
      setDebouncedQuery(newQuery);
    }, 300);
  }, []);

  const sentinelCallbackRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMoreRef.current &&
          !loadingRef.current &&
          !initialLoadRef.current
        ) {
          setPage((prev) => prev + 1);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px 400px 0px",
      },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="flex h-screen max-h-full w-full flex-col">
      <title>Notebooks - Escruta</title>
      <TopBar title="Notebooks" />

      <div className="flex-1 overflow-y-scroll py-4">
        <SimpleBackground />

        <div className="mx-auto max-w-5xl space-y-4 px-6">
          <TextField
            id="notebook-search"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onClear={() => handleSearch("")}
            placeholder="Search your notebooks..."
            search
            autoFocus
          />

          {initialLoadRef.current || isSearching || (loading && items.length === 0) ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4"
                  : "flex flex-col gap-3"
              }
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <CardSkeleton key={i} viewMode={viewMode} />
              ))}
            </div>
          ) : items.length > 0 ? (
            <>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4"
                    : "flex flex-col gap-3"
                }
              >
                {items.map((notebook: Notebook) => (
                  <NotebookCard
                    key={notebook.id}
                    notebook={notebook}
                    viewMode={viewMode}
                    folders={folders ?? undefined}
                  />
                ))}
              </motion.div>

              {loading && (
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4"
                      : "flex flex-col gap-3"
                  }
                >
                  {Array.from({ length: 4 }).map((_, i) => (
                    <CardSkeleton key={`more-${i}`} viewMode={viewMode} />
                  ))}
                </div>
              )}

              <div ref={sentinelCallbackRef} className="h-px" />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <div className="mb-5 flex size-20 items-center justify-center rounded-xs border border-blue-300 bg-blue-50 shadow-sm dark:border-blue-700 dark:bg-blue-950/30">
                {query.trim() ? (
                  <div className="size-10 text-gray-400 dark:text-gray-500">
                    <SearchIcon />
                  </div>
                ) : (
                  <div className="size-10 text-blue-500 dark:text-blue-400">
                    <NotebookIcon />
                  </div>
                )}
              </div>
              <h3 className="text-foreground mb-3 text-xl font-semibold">
                {query.trim() ? "No matches found" : "No notebooks yet"}
              </h3>
              <p className="mb-6 max-w-md text-base leading-relaxed text-gray-500 dark:text-gray-400">
                {query.trim()
                  ? "Try a different search term."
                  : "Head to the Home page to create your first notebook."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
