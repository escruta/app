import type { Source, SourceGroup } from "@/interfaces";
import {
  AddIcon,
  UploadIcon,
  FileIcon,
  FolderAddIcon,
  FolderIcon,
  LinkIcon,
  NoteIcon,
  CompressIcon,
  SearchIcon,
} from "@/components/icons";
import { SourceChip } from "./SourceChip";
import { SourceGroupSection } from "./SourceGroupSection";
import { SearchSourcesModal } from "./SearchSourcesModal";
import {
  Button,
  Divider,
  MenuLabel,
  Modal,
  SelectList,
  TextField,
  FilePicker,
  Spinner,
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  IconButton,
  Tooltip,
} from "@/components/ui";
import { useState, useEffect } from "react";
import { useFetch } from "@/hooks";
import { cn } from "@/lib/utils";
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
  onToggleCollapse?: () => void;
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
  onToggleCollapse,
}: SourcesCardProps) {
  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState<boolean>(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState<boolean>(false);
  const [newGroupTitle, setNewGroupTitle] = useState<string>("");

  const [sourceType, setSourceType] = useState<SourceType>("File");
  const [newSourceLink, setNewSourceLink] = useState<string>("");
  const [newSourceFile, setNewSourceFile] = useState<File | null>(null);
  const [newSourceTextTitle, setNewSourceTextTitle] = useState<string>("");
  const [newSourceTextContent, setNewSourceTextContent] = useState<string>("");
  const [newSourceLinkError, setNewSourceLinkError] = useState<string>("");
  const [newSourceGroupId, setNewSourceGroupId] = useState<string | null>(null);

  const [draggingSourceId, setDraggingSourceId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null | undefined>(undefined);
  const [moveTarget, setMoveTarget] = useState<{ sourceId: string; groupId: string | null } | null>(
    null,
  );
  const [pendingMoves, setPendingMoves] = useState<Record<string, string | null>>({});

  const { data: groups, refetch: refetchGroups } = useFetch<SourceGroup[]>(
    `notebooks/${notebookId}/source-groups`,
  );

  const { loading: creatingGroup, refetch: createGroup } = useFetch<SourceGroup>(
    `notebooks/${notebookId}/source-groups`,
    {
      method: "POST",
      data: { title: newGroupTitle },
      onSuccess: () => {
        setNewGroupTitle("");
        setIsNewGroupModalOpen(false);
        refetchGroups(true);
      },
      onError: (error) => {
        console.error("Error creating source group:", error.message);
      },
    },
    false,
  );

  function handleGroupsChanged() {
    refetchGroups(true);
    onSourcesChange?.();
  }

  async function handleCreateGroup() {
    if (!newGroupTitle.trim()) return;
    await createGroup();
  }

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
                if (newSourceGroupId) {
                  formData.append("groupId", newSourceGroupId);
                }
              }
              return formData;
            })()
          : sourceType === "Text"
            ? {
                title: newSourceTextTitle,
                content: newSourceTextContent,
                groupId: newSourceGroupId,
              }
            : {
                link: newSourceLink,
                groupId: newSourceGroupId,
              },
      headers: sourceType === "File" ? {} : { "Content-Type": "application/json" },
      onSuccess: () => {
        setNewSourceLink("");
        setNewSourceFile(null);
        setNewSourceTextTitle("");
        setNewSourceTextContent("");
        setNewSourceGroupId(null);
        setSourceType("File");
        setIsAddSourceModalOpen(false);
        onSourcesChange?.();
      },
      onError: (error) => {
        console.error("Error adding source:", error.message);
        setNewSourceLinkError("We couldn't add this source: " + error.message);
      },
    },
    false,
  );

  const { refetch: moveSource } = useFetch<Source>(
    `notebooks/${notebookId}/sources`,
    {
      method: "PUT",
      data: moveTarget
        ? {
            id: moveTarget.sourceId,
            groupId: moveTarget.groupId,
            removeGroup: moveTarget.groupId === null,
          }
        : undefined,
      onSuccess: () => {
        useFetch.clearCache();
        setMoveTarget(null);
        handleGroupsChanged();
      },
      onError: (error) => {
        console.error("Error moving source:", error.message);
        const sourceId = moveTarget?.sourceId;
        if (sourceId) {
          setPendingMoves((prev) => {
            const next = { ...prev };
            delete next[sourceId];
            return next;
          });
        }
        setMoveTarget(null);
      },
    },
    false,
  );

  useEffect(() => {
    if (moveTarget) moveSource();
  }, [moveTarget, moveSource]);

  useEffect(() => {
    setPendingMoves((prev) => {
      const entries = Object.entries(prev);
      if (entries.length === 0) return prev;
      const next = { ...prev };
      let changed = false;
      for (const [id, groupId] of entries) {
        const source = sources.find((s) => s.id === id);
        if (!source || (source.groupId ?? null) === groupId) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [sources]);

  async function handleAddSource() {
    setNewSourceLinkError("");

    if (sourceType === "File") {
      if (!newSourceFile) {
        setNewSourceLinkError("Please choose a file first");
        return;
      }

      const maxFileSize = 50 * 1024 * 1024;
      if (newSourceFile.size > maxFileSize) {
        setNewSourceLinkError("File size exceeds the 50MB limit. Please select a smaller file.");
        return;
      }
    } else if (sourceType === "Text") {
      if (!newSourceTextTitle.trim() || !newSourceTextContent.trim()) {
        setNewSourceLinkError("Please add both a title and some content");
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
      setNewSourceGroupId(null);
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

  const renderSourceChip = (source: Source) => (
    <SourceChip
      key={source.id}
      source={source}
      notebookId={notebookId}
      groups={groups ?? undefined}
      onSourceSelect={onSourceSelect}
      selected={selectedSourceIds.includes(source.id)}
      onToggle={() => onToggleSource?.(source.id)}
      onDelete={() => {
        onSourcesChange?.();
      }}
      onMove={() => {
        onSourcesChange?.();
      }}
      onDragStart={(dragged) => setDraggingSourceId(dragged.id)}
      onDragEnd={handleSourceDragEnd}
      isDragging={draggingSourceId === source.id}
    />
  );

  function handleSourceDragEnd() {
    setDraggingSourceId(null);
    setDragOverTarget(undefined);
  }

  function getGroupId(source: Source): string | null {
    return Object.prototype.hasOwnProperty.call(pendingMoves, source.id)
      ? pendingMoves[source.id]
      : (source.groupId ?? null);
  }

  function handleGroupDragOver(e: React.DragEvent<HTMLDivElement>, target: string | null) {
    if (!draggingSourceId) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDragOverTarget(target);
  }

  function handleGroupDragLeave(e: React.DragEvent<HTMLDivElement>) {
    const next = e.relatedTarget as Node | null;
    if (next && e.currentTarget.contains(next)) return;
    setDragOverTarget(undefined);
  }

  function handleGroupDrop(e: React.DragEvent<HTMLDivElement>, target: string | null) {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = draggingSourceId ?? e.dataTransfer.getData("text/plain");
    setDragOverTarget(undefined);
    setDraggingSourceId(null);
    if (!sourceId) return;
    const source = sources.find((s) => s.id === sourceId);
    if (!source || getGroupId(source) === target) return;
    setPendingMoves((prev) => ({ ...prev, [sourceId]: target }));
    setMoveTarget({ sourceId, groupId: target });
  }

  const groupedSources = (groups ?? []).map((group) => ({
    group,
    sources: (sources ?? []).filter((s) => getGroupId(s) === group.id),
  }));
  const ungroupedSources = (sources ?? []).filter((s) => !getGroupId(s));
  const hasGroups = (groups ?? []).length > 0;

  return (
    <>
      <div className="flex h-full w-full flex-col overflow-hidden">
        <div className="z-10 shrink-0">
          <div className="flex h-15 items-center px-4 pt-4 pb-3">
            <h2 className="font-sans text-lg font-semibold">Sources</h2>
            <div className="flex flex-1 items-center justify-end gap-2">
              <Menu>
                <Tooltip text="Add source" position="bottom">
                  <MenuTrigger>
                    <IconButton icon={<AddIcon />} variant="primary" size="sm" />
                  </MenuTrigger>
                </Tooltip>
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
                  <MenuItem
                    icon={<SearchIcon />}
                    label="Search web"
                    onClick={() => setIsSearchModalOpen(true)}
                  />
                </MenuContent>
              </Menu>
              <Tooltip text="New group" position="bottom">
                <IconButton
                  icon={<FolderAddIcon />}
                  onClick={() => setIsNewGroupModalOpen(true)}
                  variant="secondary"
                  size="sm"
                  ariaLabel="New group"
                />
              </Tooltip>
              {onToggleCollapse && (
                <Tooltip text="Collapse panel" position="bottom">
                  <IconButton
                    icon={<CompressIcon />}
                    onClick={onToggleCollapse}
                    variant="secondary"
                    size="sm"
                    aria-label="Collapse panel"
                  />
                </Tooltip>
              )}
            </div>
          </div>
          <Divider className="my-0" />
        </div>
        <div className="w-full flex-1 overflow-y-auto px-4">
          {(() => {
            if (isLoading) {
              return (
                <div className="flex size-full items-center justify-center">
                  <Spinner />
                </div>
              );
            }
            if (sources && sources.length > 0) {
              return (
                <div
                  className="flex flex-col gap-2 py-4"
                  onDragOver={hasGroups ? (e) => handleGroupDragOver(e, null) : undefined}
                  onDragLeave={hasGroups ? handleGroupDragLeave : undefined}
                  onDrop={hasGroups ? (e) => handleGroupDrop(e, null) : undefined}
                >
                  <Button variant="secondary" size="sm" onClick={handleSelectAllToggle}>
                    {isAllSelected ? "Deselect all sources" : "Select all sources"}
                  </Button>
                  {hasGroups ? (
                    <>
                      {groupedSources.map(({ group, sources: groupSources }) => (
                        <SourceGroupSection
                          key={group.id}
                          notebookId={notebookId}
                          group={group}
                          onChanged={handleGroupsChanged}
                          isDropTarget={dragOverTarget === group.id}
                          onDragOver={(e) => handleGroupDragOver(e, group.id)}
                          onDragLeave={handleGroupDragLeave}
                          onDrop={(e) => handleGroupDrop(e, group.id)}
                        >
                          {groupSources.length > 0 ? (
                            groupSources.map(renderSourceChip)
                          ) : (
                            <p className="px-1 py-1 text-xs text-gray-400 select-none dark:text-gray-500">
                              No sources in this group yet
                            </p>
                          )}
                        </SourceGroupSection>
                      ))}
                      {ungroupedSources.length > 0 && (
                        <div
                          className={cn(
                            "flex flex-col gap-2 rounded-xs pt-1 transition-colors duration-150",
                            dragOverTarget === null &&
                              "bg-blue-50/60 ring-1 ring-blue-300 dark:bg-blue-900/10 dark:ring-blue-700",
                          )}
                        >
                          <span className="px-1 text-xs font-medium tracking-wide text-gray-400 uppercase select-none dark:text-gray-500">
                            Ungrouped
                          </span>
                          {ungroupedSources.map(renderSourceChip)}
                        </div>
                      )}
                    </>
                  ) : (
                    sources.map(renderSourceChip)
                  )}
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
      </div>

      {/* Search Web Modal */}
      <SearchSourcesModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        notebookId={notebookId}
        onSourcesAdded={() => {
          onSourcesChange?.();
        }}
      />

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

            {(groups ?? []).length > 0 && (
              <div className="mt-4 flex flex-col gap-2">
                <MenuLabel>Add to group</MenuLabel>
                <SelectList
                  options={(groups ?? []).map((group) => ({
                    id: group.id,
                    label: group.title,
                    icon: <FolderIcon />,
                  }))}
                  selectedId={newSourceGroupId}
                  onSelect={setNewSourceGroupId}
                  emptyText="No groups available"
                />
              </div>
            )}
          </div>

          {newSourceLinkError && (
            <div className="mt-4 text-sm font-medium text-red-500">{newSourceLinkError}</div>
          )}
        </Modal>
      )}

      {/* New Group Modal */}
      {isNewGroupModalOpen && (
        <Modal
          isOpen={isNewGroupModalOpen}
          onClose={() => {
            setIsNewGroupModalOpen(false);
            setNewGroupTitle("");
          }}
          title="New group"
          onSubmit={() => {
            if (newGroupTitle.trim() && !creatingGroup) handleCreateGroup();
          }}
          actions={
            <div className="flex w-full justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsNewGroupModalOpen(false);
                  setNewGroupTitle("");
                }}
                disabled={creatingGroup}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateGroup}
                disabled={!newGroupTitle.trim() || creatingGroup}
                icon={creatingGroup ? <Spinner /> : <AddIcon />}
              >
                {creatingGroup ? "Creating" : "Create"}
              </Button>
            </div>
          }
        >
          <TextField
            id="source-group-title"
            label="Name your group"
            type="text"
            value={newGroupTitle}
            onChange={(e) => setNewGroupTitle(e.target.value)}
            placeholder="e.g., Background, Methods, Results…"
            autoFocus
            className="mb-0"
          />
        </Modal>
      )}
    </>
  );
}
