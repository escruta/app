import { useEffect, useMemo, useState } from "react";
import { CheckIcon, SearchIcon } from "@/components/icons";
import { Button, Checkbox, Modal, TextField } from "@/components/ui";
import { cn, getSourceIcon } from "@/lib/utils";
import type { Source } from "@/interfaces";

interface SelectSourcesModalProps {
  isOpen: boolean;
  sources: Source[];
  selectedSourceIds: string[];
  onClose: () => void;
  onApply: (selectedIds: string[]) => void;
}

export function SelectSourcesModal({
  isOpen,
  sources,
  selectedSourceIds,
  onClose,
  onApply,
}: SelectSourcesModalProps) {
  const readySources = useMemo(() => sources.filter((s) => s.status === "READY"), [sources]);
  const readyIds = useMemo(() => readySources.map((s) => s.id), [readySources]);

  const [draftIds, setDraftIds] = useState<string[]>(selectedSourceIds);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setDraftIds(selectedSourceIds);
    setSearchQuery("");
  }, [isOpen, selectedSourceIds]);

  const filteredSources = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return readySources;
    return readySources.filter((s) => s.title.toLowerCase().includes(q));
  }, [readySources, searchQuery]);

  const toggleSource = (id: string) => {
    setDraftIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const isAllSelected = readyIds.length > 0 && draftIds.length === readyIds.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Choose sources"
      subtitle="Select which indexed sources feed this generation."
      width="md"
      actions={
        <div className="flex w-full items-center justify-between gap-3">
          <span className="text-xs font-medium text-gray-500 select-none dark:text-gray-400">
            {draftIds.length} of {readySources.length} selected
          </span>
          <div className="flex items-center gap-2.5">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<CheckIcon />}
              disabled={draftIds.length === 0}
              onClick={() => {
                onApply(draftIds);
                onClose();
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <TextField
          id="filter-tool-sources"
          search
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            readySources.length === 0 ? "No indexed sources available" : "Search sources..."
          }
          onClear={() => setSearchQuery("")}
        />

        {readySources.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDraftIds(readyIds)}
              disabled={isAllSelected}
              className="flex-1"
            >
              Select all
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDraftIds([])}
              disabled={draftIds.length === 0}
              className="flex-1"
            >
              Clear
            </Button>
          </div>
        )}

        {readySources.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No indexed sources are ready in this notebook yet.
          </p>
        ) : filteredSources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 flex size-10 items-center justify-center rounded-xs border border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-800">
              <SearchIcon className="size-4" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              No matching sources
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {filteredSources.map((source) => {
              const checked = draftIds.includes(source.id);
              return (
                <div
                  key={source.id}
                  role="checkbox"
                  aria-checked={checked}
                  tabIndex={0}
                  onClick={() => toggleSource(source.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleSource(source.id);
                    }
                  }}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-xs border p-2.5 transition-colors select-none",
                    checked
                      ? "border-blue-500 bg-blue-50/60 dark:border-blue-400 dark:bg-blue-950/30"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600 dark:hover:bg-gray-800/60",
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <span className="flex size-4 shrink-0 items-center justify-center text-gray-500 dark:text-gray-400 [&>svg]:size-4">
                      {getSourceIcon(source.type)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                      {source.title}
                    </span>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={checked} onChange={() => toggleSource(source.id)} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
