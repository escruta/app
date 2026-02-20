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
  Dropdown,
  FilePicker,
  Spinner,
} from "@/components/ui";
import { useEffect, useState } from "react";
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

  const {
    data: sources,
    loading,
    error,
    refetch: refetchSources,
  } = useFetch<Source[]>(`notebooks/${notebookId}/sources`);

  const [isAddSourceModalOpen, setIsAddSourceModalOpen] =
    useState<boolean>(false);
  const [isAIConverterEnabled, setIsAIConverterEnabled] =
    useState<boolean>(false);
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
      headers:
        sourceType === "File" ? {} : { "Content-Type": "application/json" },
      onSuccess: () => {
        setNewSourceLink("");
        setNewSourceFile(null);
        setSourceType("Website");
        setIsAddSourceModalOpen(false);
        refetchSources(true, false);
        onSourceAdded?.();
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
        setNewSourceLinkError(
          "File size exceeds the 50MB limit. Please select a smaller file.",
        );
        return;
      }
    } else {
      if (!newSourceLink.trim()) {
        setNewSourceLinkError("Please enter a valid URL");
        return;
      }

      if (sourceType === "Website" && !/^https?:\/\/.+/i.test(newSourceLink)) {
        setNewSourceLinkError(
          "Please enter a valid URL starting with https://",
        );
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
    sources &&
    sources.length > 0 &&
    selectedSourceIds.length === sources.length;

  const handleSelectAllToggle = () => {
    if (isAllSelected) {
      onClearSelection?.();
    } else if (sources) {
      onSelectAll?.(sources.map((s) => s.id));
    }
  };

  return (
    <>
      <Card className="h-full overflow-y-auto">
        <div className="flex flex-row justify-between items-center shrink-0">
          <h2 className="text-lg font-sans font-semibold">Sources</h2>
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
        <Divider className="my-4" />
        {(() => {
          if (loading) {
            return (
              <div className="text-center text-gray-500 text-sm">
                Loading sources...
              </div>
            );
          }
          if (error) {
            return (
              <div className="text-red-500 text-sm">
                Error loading sources: {error.message}
              </div>
            );
          }
          if (sources && sources.length > 0) {
            return (
              <div className="flex flex-col gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSelectAllToggle}
                >
                  {isAllSelected
                    ? "Deselect all sources"
                    : "Select all sources"}
                </Button>
                {sources.map((source) => (
                  <SourceChip
                    key={source.id}
                    source={source}
                    onSourceSelect={onSourceSelect}
                    selected={selectedSourceIds.includes(source.id)}
                    onToggle={() => onToggleSource?.(source.id)}
                  />
                ))}
              </div>
            );
          }
          return (
            <div className="flex flex-col items-center justify-center text-center py-10 px-4">
              <div className="size-20 bg-blue-50 dark:bg-blue-950/30 rounded-xs flex items-center justify-center mb-5 shadow-sm border border-blue-300 dark:border-blue-700">
                <div className="size-10 text-blue-500 dark:text-blue-400">
                  <UploadIcon />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No sources yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
                Add your first source to start gathering information. You can
                upload PDFs, add web links, or paste text.
              </p>
            </div>
          );
        })()}
      </Card>

      {/* Add Source Modal */}
      {isAddSourceModalOpen && (
        <Modal
          isOpen={isAddSourceModalOpen}
          onClose={handleModalClose}
          title="Add source"
          closeOnOutsideClick={!addingSource}
          closeOnEscape={!addingSource}
          actions={
            <div className="flex justify-between w-full">
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
                    (sourceType === "File"
                      ? !newSourceFile
                      : !newSourceLink.trim()) || addingSource
                  }
                  icon={addingSource ? <Spinner /> : <AddIcon />}
                >
                  {addingSource ? "Adding" : "Add"}
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            <Dropdown
              label="Source type"
              // options={["Website", "YouTube Video", "File"]}
              options={["Website", "File"]}
              selectedOption={sourceType}
              onSelect={setSourceType}
            />

            {sourceType === "File" ? (
              <>
                <FilePicker
                  id="source-file"
                  label="Select file"
                  onChange={setNewSourceFile}
                  value={newSourceFile}
                  accept=".pdf,.docx,.txt,.md"
                  placeholder="PDF, DOCX, TXT, or Markdown files"
                />
                <div className="text-gray-500">Maximum file size: 50 MB</div>
              </>
            ) : (
              <TextField
                id="source-link"
                label="URL"
                type="url"
                value={newSourceLink}
                onChange={(e) => setNewSourceLink(e.target.value)}
                placeholder={
                  sourceType === "YouTube Video"
                    ? "https://www.youtube.com/watch?v=..."
                    : "https://example.com"
                }
                autoFocus
              />
            )}

            {newSourceLinkError && (
              <div className="text-red-500 text-sm">{newSourceLinkError}</div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
