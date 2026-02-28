import type { Source } from "@/interfaces";
import { AddIcon, UploadIcon } from "@/components/icons";
import { SourceChip } from "./SourceChip";
import {
  Card,
  Button,
  Divider,
  Modal,
  TextField,
  Tooltip,
  Switch,
  FilePicker,
  Spinner,
} from "@/components/ui";
import { useEffect, useState, useRef } from "react";
import { useFetch } from "@/hooks";
import type { SourceType } from "@/lib/utils/index";

interface SourcesCardProps {
  notebookId: string;
  onSourceSelect?: (source: Source) => void;
  selectedSourceIds?: string[];
  onToggleSource?: (sourceId: string) => void;
  onSelectAll?: (sourceIds: string[]) => void;
  onClearSelection?: () => void;
  refreshTrigger?: number;
  onSourceAdded?: () => void;
}

export function SourcesCard({
  notebookId,
  onSourceSelect,
  selectedSourceIds = [],
  onToggleSource,
  onSelectAll,
  onClearSelection,
  refreshTrigger,
  onSourceAdded,
}: SourcesCardProps) {
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      refetchSources(true, false);
    }
  }, [refreshTrigger]);

  const pendingAddedSources = useRef<Set<string>>(new Set());

  const {
    data: sources,
    loading,
    error,
    refetch: refetchSources,
  } = useFetch<Source[]>(`notebooks/${notebookId}/sources`);

  useEffect(() => {
    if (!sources) return;

    let hasPending = false;
    for (const source of sources) {
      if (source.status === "PENDING") {
        hasPending = true;
      } else if (source.status === "READY" && pendingAddedSources.current.has(source.id)) {
        pendingAddedSources.current.delete(source.id);
        onSourceAdded?.();
      } else if (source.status === "FAILED" && pendingAddedSources.current.has(source.id)) {
        pendingAddedSources.current.delete(source.id);
      }
    }

    if (hasPending) {
      const timeoutId = setTimeout(() => {
        refetchSources(true, false);
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [sources, refetchSources, onSourceAdded]);

  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState<boolean>(false);
  const [isAIConverterEnabled, setIsAIConverterEnabled] = useState<boolean>(false);
  const [sourceType, setSourceType] = useState<SourceType>("Website");
  const [newSourceLink, setNewSourceLink] = useState<string>("");
  const [newSourceFile, setNewSourceFile] = useState<File | null>(null);
  const [newSourceLinkError, setNewSourceLinkError] = useState<string>("");

  const { loading: addingSource, refetch: addSource } = useFetch<Source>(
    sourceType === "File"
      ? `notebooks/${notebookId}/sources/upload?aiConverter=${isAIConverterEnabled}`
      : `notebooks/${notebookId}/sources?aiConverter=${isAIConverterEnabled}`,
    {
      method: "POST",
      data:
        sourceType === "File"
          ? (() => {
              const formData = new FormData();
              if (newSourceFile) {
                formData.append("file", newSourceFile);
                formData.append("title", newSourceFile.name);
              }
              return formData;
            })()
          : {
              link: newSourceLink,
            },
      headers: sourceType === "File" ? {} : { "Content-Type": "application/json" },
      onSuccess: (data: Source) => {
        setNewSourceLink("");
        setNewSourceFile(null);
        setSourceType("Website");
        setIsAddSourceModalOpen(false);
        if (data.status === "PENDING") {
          pendingAddedSources.current.add(data.id);
        } else {
          onSourceAdded?.();
        }
        refetchSources(true, false);
      },
      onError: (error) => {
        console.error("Error adding source:", error.message);
        setNewSourceLinkError("Failed to add source. " + error.message);
      },
    },
    false,
  );

  async function handleAddSource() {
    setNewSourceLinkError("");

    if (sourceType === "File") {
      if (!newSourceFile) {
        setNewSourceLinkError("Please select a file");
        return;
      }

      const maxFileSize = 50 * 1024 * 1024;
      if (newSourceFile.size > maxFileSize) {
        setNewSourceLinkError("File size exceeds the 50MB limit. Please select a smaller file.");
        return;
      }
    } else {
      if (!newSourceLink.trim()) {
        setNewSourceLinkError("Please enter a valid URL");
        return;
      }

      if (sourceType === "Website" && !/^https?:\/\/.+/i.test(newSourceLink)) {
        setNewSourceLinkError("Please enter a valid URL starting with https://");
        return;
      }

      if (sourceType === "YouTube Video") {
        const youtubeRegex =
          /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/i;
        if (!youtubeRegex.test(newSourceLink)) {
          setNewSourceLinkError("Please enter a valid YouTube URL");
          return;
        }
      }
    }

    await addSource();
  }

  function handleModalClose() {
    if (!addingSource) {
      setIsAddSourceModalOpen(false);
      setNewSourceLink("");
      setNewSourceFile(null);
      setSourceType("Website");
      setNewSourceLinkError("");
    }
  }

  const isAllSelected =
    sources && sources.length > 0 && selectedSourceIds.length === sources.length;

  const handleSelectAllToggle = () => {
    if (isAllSelected) {
      onClearSelection?.();
    } else if (sources) {
      onSelectAll?.(sources.map((s) => s.id));
    }
  };

  return (
    <>
      <Card className="flex h-full flex-col overflow-hidden p-0">
        <div className="z-10 shrink-0 rounded-t-xs bg-white dark:bg-gray-900">
          <div className="flex flex-row items-center justify-between p-4">
            <h2 className="font-sans text-lg font-semibold">Sources</h2>
            <div className="flex gap-3">
              {/* <Tooltip text="Find sources" position="bottom">
                <IconButton
                  icon={<StarsIcon />}
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                />
              </Tooltip> */}
              <Tooltip text="Add a new source" position="bottom">
                <Button
                  icon={<AddIcon />}
                  variant="primary"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setIsAddSourceModalOpen(true)}
                >
                  Add source
                </Button>
              </Tooltip>
            </div>
          </div>
          <Divider className="my-0" />
        </div>
        <div className="w-full flex-1 overflow-y-auto p-4">
          {(() => {
            if (loading) {
              return <div className="text-center text-sm text-gray-500">Loading sources...</div>;
            }
            if (error) {
              return (
                <div className="text-sm text-red-500">Error loading sources: {error.message}</div>
              );
            }
            if (sources && sources.length > 0) {
              return (
                <div className="flex flex-col gap-2">
                  <Button variant="secondary" size="sm" onClick={handleSelectAllToggle}>
                    {isAllSelected ? "Deselect all sources" : "Select all sources"}
                  </Button>
                  {sources.map((source) => (
                    <SourceChip
                      key={source.id}
                      source={source}
                      notebookId={notebookId}
                      onSourceSelect={onSourceSelect}
                      selected={selectedSourceIds.includes(source.id)}
                      onToggle={() => onToggleSource?.(source.id)}
                      onDelete={() => refetchSources(true, false)}
                    />
                  ))}
                </div>
              );
            }
            return (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <div className="mb-5 flex size-20 items-center justify-center rounded-xs border border-blue-300 bg-blue-50 shadow-sm dark:border-blue-700 dark:bg-blue-950/30">
                  <div className="size-10 text-blue-500 dark:text-blue-400">
                    <UploadIcon />
                  </div>
                </div>
                <h3 className="text-foreground mb-2 text-lg font-semibold">No sources yet</h3>
                <p className="max-w-xs text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  Add your first source to start gathering information. You can upload PDFs, add web
                  links, or paste text.
                </p>
              </div>
            );
          })()}
        </div>
      </Card>

      {/* Add Source Modal */}
      {isAddSourceModalOpen && (
        <Modal
          isOpen={isAddSourceModalOpen}
          onClose={handleModalClose}
          title="Add source"
          width="xl"
          contentClassname="max-h-[85vh]"
          closeOnOutsideClick={!addingSource}
          closeOnEscape={!addingSource}
          actions={
            <div className="flex w-full justify-between">
              {sourceType === "Website" || sourceType === "File" ? (
                <Tooltip
                  text="Enable AI to improve source readability."
                  position="bottom"
                  className="grid"
                >
                  <Switch
                    checked={isAIConverterEnabled}
                    onChange={setIsAIConverterEnabled}
                    label="AI converter"
                    disabled={addingSource}
                  />
                </Tooltip>
              ) : (
                <div className="flex-1"></div>
              )}
              <div className="flex gap-3">
                <Button variant="secondary" onClick={handleModalClose}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAddSource}
                  disabled={
                    (sourceType === "File" ? !newSourceFile : !newSourceLink.trim()) || addingSource
                  }
                  icon={addingSource ? <Spinner /> : <AddIcon />}
                >
                  {addingSource ? "Adding" : "Add"}
                </Button>
              </div>
            </div>
          }
        >
          <div className="flex flex-col gap-6">
            <TextField
              id="source-link"
              label="Website URL"
              type="url"
              value={newSourceLink}
              onChange={(e) => {
                setNewSourceLink(e.target.value);
                if (e.target.value) {
                  setSourceType("Website");
                  setNewSourceFile(null);
                }
              }}
              placeholder="https://example.com"
              autoFocus
              className="mb-0"
            />

            <Divider label="OR" className="my-0" />

            <FilePicker
              id="source-file"
              label="Upload File"
              onChange={(file) => {
                setNewSourceFile(file);
                if (file) {
                  setSourceType("File");
                  setNewSourceLink("");
                }
              }}
              value={newSourceFile}
              accept=".pdf,.docx,.txt,.md"
              placeholder="PDF, DOCX, TXT, or MD (Max 50MB)"
            />
          </div>

          {newSourceLinkError && (
            <div className="mt-4 text-sm font-medium text-red-500">{newSourceLinkError}</div>
          )}
        </Modal>
      )}
    </>
  );
}
