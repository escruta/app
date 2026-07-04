import { useMemo, useState } from "react";
import type { Notebook } from "@/interfaces";
import { useCookie, useFetch } from "@/hooks";
import { SEOMetadata, TopBar } from "@/components";
import { NotebookCard } from "@/components";
import { NotebookIcon, SearchIcon } from "@/components/icons";
import { getRouteMetadata } from "@/lib/seo";
import { motion } from "motion/react";
import { SimpleBackground } from "@/components/backgrounds/SimpleBackground";
import { TextField } from "@/components/ui";

export default function NotebooksPage() {
  const { data } = useFetch<Notebook[]>("/notebooks");
  const [query, setQuery] = useState("");
  const [globalViewMode] = useCookie<"grid" | "list">("globalViewMode", "grid");
  const viewMode = globalViewMode || "grid";

  const metadata = getRouteMetadata("/notebooks");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data || [];
    return (data || []).filter((notebook) => notebook.title.toLowerCase().includes(q));
  }, [data, query]);

  return (
    <div className="flex h-screen max-h-full w-full flex-col">
      <SEOMetadata
        title={metadata.title}
        description={metadata.description}
        url={metadata.url}
        image={metadata.image}
        twitterCard={metadata.twitterCard}
      />
      <TopBar title="Notebooks" />

      <div className="flex-1 overflow-auto py-4">
        <SimpleBackground />

        <div className="mx-auto max-w-5xl space-y-4 px-6">
          <TextField
            id="notebook-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClear={() => setQuery("")}
            placeholder="Search notebooks..."
            search
            autoFocus
          />

          {filtered.length > 0 ? (
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
              {filtered.map((notebook: Notebook) => (
                <NotebookCard key={notebook.id} notebook={notebook} viewMode={viewMode} />
              ))}
            </motion.div>
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
                  : "Create your first notebook from the Home page."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
