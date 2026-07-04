import { useMemo, useState } from "react";
import type { Note, Notebook } from "@/interfaces";
import { useCookie, useFetch } from "@/hooks";
import { SEOMetadata, TopBar } from "@/components";
import { NoteCard } from "@/components";
import { NoteIcon, SearchIcon } from "@/components/icons";
import { getRouteMetadata } from "@/lib/seo";
import { motion } from "motion/react";
import { SimpleBackground } from "@/components/backgrounds/SimpleBackground";
import { TextField } from "@/components/ui";

export default function NotesPage() {
  const { data: notes } = useFetch<Note[]>("/notes");
  const { data: notebooks } = useFetch<Notebook[]>("/notebooks");
  const [query, setQuery] = useState("");
  const [globalViewMode] = useCookie<"grid" | "list">("globalViewMode", "grid");
  const viewMode = globalViewMode || "grid";

  const metadata = getRouteMetadata("/notes") || { title: "Notes - Escruta" };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = notes || [];
    if (!q) return list;
    return list.filter((note) => note.title.toLowerCase().includes(q));
  }, [notes, query]);

  return (
    <div className="flex h-screen max-h-full w-full flex-col">
      <SEOMetadata title={metadata.title} description={metadata.description} />
      <TopBar title="Notes" />

      <div className="flex-1 overflow-auto py-4">
        <SimpleBackground />

        <div className="mx-auto max-w-5xl space-y-4 px-6">
          <TextField
            id="note-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClear={() => setQuery("")}
            placeholder="Search notes..."
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
              {filtered.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  viewMode={viewMode}
                  notebookTitle={notebooks?.find((nb) => nb.id === note.notebookId)?.title}
                />
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
                    <NoteIcon />
                  </div>
                )}
              </div>
              <h3 className="text-foreground mb-3 text-xl font-semibold">
                {query.trim() ? "No matches found" : "No notes yet"}
              </h3>
              <p className="mb-6 max-w-md text-base leading-relaxed text-gray-500 dark:text-gray-400">
                {query.trim()
                  ? "Try a different search term."
                  : "Create your first note from the Home page."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
