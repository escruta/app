import { useState, useRef } from "react";
import { useFetch } from "@/hooks";
import { Button, TextField, Modal, Spinner, IconButton, Checkbox, Tooltip } from "@/components/ui";
import { SearchIcon, AddIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/interfaces";

interface SearchSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  notebookId: string;
  onSourcesAdded: () => void;
}

export function SearchSourcesModal({
  isOpen,
  onClose,
  notebookId,
  onSourcesAdded,
}: SearchSourcesModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLinks, setSelectedLinks] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<SearchResult[]>([]);
  const payloadRef = useRef<Record<string, unknown>>({ link: "", title: "" });

  const {
    loading: isSearching,
    error: searchError,
    refetch: search,
  } = useFetch<{ results: SearchResult[] }>(
    "/search",
    {
      method: "POST",
      data: { query: searchTerm, maxResults: 10 },
      onError: () => {},
      onSuccess: (data) => {
        setResults(data.results);
      },
    },
    false,
  );

  const [isAdding, setIsAdding] = useState(false);

  function handleClose() {
    useFetch.clearCache("/search");
    setSelectedLinks(new Set());
    setSearchTerm("");
    setResults([]);
    onClose();
  }

  async function handleSearch() {
    if (!searchTerm.trim()) return;
    setSelectedLinks(new Set());
    await search(true);
  }

  function toggleSource(link: string) {
    setSelectedLinks((prev) => {
      const next = new Set(prev);
      if (next.has(link)) next.delete(link);
      else next.add(link);
      return next;
    });
  }

  async function handleAddSelected() {
    const links = Array.from(selectedLinks);
    if (links.length === 0) return;

    setIsAdding(true);
    for (const link of links) {
      const result = results.find((r) => r.link === link);
      if (!result) continue;
      payloadRef.current = { link, title: result.title };
      try {
        await addSource(true);
      } catch {}
    }
    setIsAdding(false);
    setSelectedLinks(new Set());
    setSearchTerm("");
    onSourcesAdded();
    handleClose();
  }

  const { refetch: addSource } = useFetch<unknown>(
    `notebooks/${notebookId}/sources`,
    {
      method: "POST",
      get data() {
        return payloadRef.current;
      },
    },
    false,
  );

  const isAllSelected = results.length > 0 && selectedLinks.size === results.length;

  function handleSelectAllToggle() {
    if (isAllSelected) {
      setSelectedLinks(new Set());
    } else {
      setSelectedLinks(new Set(results.map((r) => r.link)));
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Search the web"
      width={results.length > 0 ? "xl" : "md"}
      closeOnEscape={results.length === 0}
      closeOnOutsideClick={results.length === 0}
      actions={
        results.length > 0 && (
          <>
            <Button variant="secondary" onClick={() => handleClose()} disabled={isAdding}>
              Cancel
            </Button>
            <Button
              onClick={handleAddSelected}
              disabled={isAdding || selectedLinks.size === 0}
              icon={isAdding ? <Spinner /> : <AddIcon />}
            >
              {isAdding
                ? "Adding..."
                : selectedLinks.size > 0
                  ? `Add ${selectedLinks.size} selected source${selectedLinks.size > 1 ? "s" : ""}`
                  : "Add selected sources"}
            </Button>
          </>
        )
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <TextField
              id="search-query"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              placeholder="Search for articles, blogs or videos..."
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") handleSearch();
              }}
              className="mb-0"
            />
          </div>
          <Tooltip text="Search" position="top">
            <IconButton
              icon={isSearching ? <Spinner /> : <SearchIcon className="size-4" />}
              onClick={handleSearch}
              disabled={isSearching || !searchTerm.trim()}
              className="shrink-0"
            />
          </Tooltip>
        </div>

        {searchError && (
          <div className="text-sm text-red-500">Search failed. Please try again.</div>
        )}

        {!isSearching && results.length > 0 && (
          <div className="flex flex-col gap-2">
            <Button variant="secondary" size="sm" onClick={handleSelectAllToggle}>
              {isAllSelected ? "Deselect all results" : "Select all results"}
            </Button>

            {results.map((result) => (
              <div
                key={result.link}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xs border p-3 transition-colors",
                  selectedLinks.has(result.link)
                    ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30"
                    : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600",
                )}
                onClick={() => toggleSource(result.link)}
              >
                <div className="max-w-full min-w-0 flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{result.title}</div>
                  <a
                    href={result.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-fit max-w-full truncate text-sm text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {result.link}
                  </a>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {result.snippet}
                  </div>
                </div>
                <Checkbox
                  checked={selectedLinks.has(result.link)}
                  onChange={() => toggleSource(result.link)}
                  className="pointer-events-none shrink-0"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
