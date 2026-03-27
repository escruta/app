import type { Source } from "@/interfaces";
import { AddIcon, UploadIcon, FileIcon, LinkIcon, NoteIcon } from "@/components/icons";
import { SourceChip } from "./SourceChip";
import {
  Card,
  Button,
  Divider,
  Modal,
  TextField,
  FilePicker,
  Spinner,
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
} from "@/components/ui";
import { useState } from "react";
import { useFetch } from "@/hooks";
import type { SourceType } from "@/interfaces";

interface SourcesCardProps {
  notebookId: string;
  sources: Source[];
  isLoading?: boolean;
  onSourceSelect?: (source: Source) => void;
  selectedSourceIds?: string[];
  onToggleSource?: (sourceId: string) => void;
  onSelectAll?: (sourceIds: string[]) => void;
  onClearSelection?: () => void;
  onSourcesChange?: () => void;
}

export function SourcesCard({
  notebookId,
  sources,
  isLoading,
  onSourceSelect,
  selectedSourceIds = [],
  onToggleSource,
  onSelectAll,
  onClearSelection,
  onSourcesChange,
}: SourcesCardProps) {
  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState<boolean>(false);

  const [sourceType, setSourceType] = useState<SourceType>("File");
  const [newSourceLink, setNewSourceLink] = useState<string>("");
  const [newSourceFile, setNewSourceFile] = useState<File | null>(null);
  const [newSourceTextTitle, setNewSourceTextTitle] = useState<string>("");
  const [newSourceTextContent, setNewSourceTextContent] = useState<string>("");
  const [newSourceLinkError, setNewSourceLinkError] = useState<string>("");

  const handleOpenModal = (type: SourceType) => {
    setSourceType(type);
    setIsAddSourceModalOpen(true);
  };

  const { loading: addingSource, refetch: addSource } = useFetch<Source>(
    sourceType === "File"
      ? `notebooks/${notebookId}/sources/upload`
      : sourceType === "Text"
        ? `notebooks/${notebookId}/sources/text`
        : `notebooks/${notebookId}/sources`,
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
          : sourceType === "Text"
            ? {
                title: newSourceTextTitle,
                content: newSourceTextContent,
              }
            : {
                link: newSourceLink,
              },
      headers: sourceType === "File" ? {} : { "Content-Type": "application/json" },
      onSuccess: () => {
        setNewSourceLink("");
        setNewSourceFile(null);
        setNewSourceTextTitle("");
        setNewSourceTextContent("");
        setSourceType("File");
        setIsAddSourceModalOpen(false);
        onSourcesChange?.();
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
    } else if (sourceType === "Text") {
      if (!newSourceTextTitle.trim() || !newSourceTextContent.trim()) {
        setNewSourceLinkError("Please enter both title and content");
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
      setNewSourceTextTitle("");
      setNewSourceTextContent("");
      setSourceType("File");
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
              <Menu>
                <MenuTrigger>
                  <Button icon={<AddIcon />} variant="primary" size="sm" className="shrink-0">
                    Add source
                  </Button>
                </MenuTrigger>
                <MenuContent>
                  <MenuItem
                    icon={<FileIcon />}
                    label="Upload file"
                    onClick={() => handleOpenModal("File")}
                  />
                  <MenuItem
                    icon={<LinkIcon />}
                    label="Website link"
                    onClick={() => handleOpenModal("Website")}
                  />
                  <MenuItem
                    icon={<NoteIcon />}
                    label="Direct text"
                    onClick={() => handleOpenModal("Text")}
                  />
                </MenuContent>
              </Menu>
            </div>
          </div>
          <Divider className="my-0" />
        </div>
        <div className="w-full flex-1 overflow-y-auto px-4">
          {(() => {
            if (isLoading) {
              return <div className="text-center text-sm text-gray-500">Loading sources...</div>;
            }
            if (sources && sources.length > 0) {
              return (
                <div className="flex flex-col gap-2 py-4">
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
                      onDelete={() => {
                        onSourcesChange?.();
                      }}
                    />
                  ))}
                </div>
              );
            }
            return (
              <div className="flex size-full flex-col items-center justify-start pt-24 text-center">
                <div className="mb-5 flex size-20 items-center justify-center rounded-xs border border-blue-300 bg-blue-50 shadow-sm dark:border-blue-700 dark:bg-blue-950/30">
                  <div className="size-10 text-blue-500 dark:text-blue-400">
                    <UploadIcon />
                  </div>
                </div>
                <h3 className="text-foreground mb-2 text-lg font-semibold">No sources yet</h3>
                <p className="max-w-xs text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  Add your first source to start gathering information. You can upload PDFs, add web
                  links or paste text.
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
          title={
            sourceType === "File"
              ? "Upload file"
              : sourceType === "Website"
                ? "Add website link"
                : "Add direct text"
          }
          width="md"
          closeOnOutsideClick={!addingSource}
          closeOnEscape={!addingSource}
          actions={
            <div className="flex w-full justify-end gap-3">
              <Button variant="secondary" onClick={handleModalClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAddSource}
                disabled={
                  (sourceType === "File" && !newSourceFile) ||
                  (sourceType === "Website" && !newSourceLink.trim()) ||
                  (sourceType === "Text" &&
                    (!newSourceTextTitle.trim() || !newSourceTextContent.trim())) ||
                  addingSource
                }
                icon={addingSource ? <Spinner /> : <AddIcon />}
              >
                {addingSource ? "Adding" : "Add"}
              </Button>
            </div>
          }
        >
          <div className="flex flex-col">
            {sourceType === "File" && (
              <FilePicker
                id="source-file"
                onChange={(file) => {
                  setNewSourceFile(file);
                  if (file) {
                    setNewSourceLink("");
                  }
                }}
                value={newSourceFile}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md"
                placeholder="PDF, DOCX, XLSX, PPTX, TXT or MD (Max 50MB)"
                className="h-full"
              />
            )}

            {sourceType === "Website" && (
              <div className="flex w-full flex-col gap-4">
                <TextField
                  id="source-link"
                  label="Website URL"
                  type="url"
                  value={newSourceLink}
                  onChange={(e) => setNewSourceLink(e.target.value)}
                  placeholder="https://example.com or YouTube video link"
                  autoFocus
                  className="mb-0"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Paste a link to an article, blog post or a YouTube video to extract its content
                </p>
              </div>
            )}

            {sourceType === "Text" && (
              <div className="flex w-full flex-col gap-4">
                <TextField
                  id="source-text-title"
                  label="Title"
                  type="text"
                  value={newSourceTextTitle}
                  onChange={(e) => setNewSourceTextTitle(e.target.value)}
                  placeholder="E.g., Meeting Notes"
                  className="mb-0"
                />
                <TextField
                  id="source-text-content"
                  label="Content"
                  multiline
                  minRows={5}
                  maxRows={10}
                  value={newSourceTextContent}
                  onChange={(e) => setNewSourceTextContent(e.target.value)}
                  placeholder="Paste or type your text here..."
                  className="mb-0"
                />
              </div>
            )}
          </div>

          {newSourceLinkError && (
            <div className="mt-4 text-sm font-medium text-red-500">{newSourceLinkError}</div>
          )}
        </Modal>
      )}
    </>
  );
}
