import type { Note, NoteGroup } from "@/interfaces";
import { AddIcon, EditIcon, FolderAddIcon } from "@/components/icons";
import { NoteChip } from "./NoteChip";
import { NoteGroupSection } from "./NoteGroupSection";
import {
  Button,
  IconButton,
  Modal,
  Spinner,
  TextField,
  Tooltip,
  SidePanel,
  PanelList,
  PanelListItem,
  SortMenu,
} from "@/components/ui";
import { useCookie, useFetch } from "@/hooks";
import { cn } from "@/lib/utils";
import { getSortedItems, type SortOption } from "@/components/settings/lib/sort";
import { useEffect, useMemo, useState } from "react";

interface NotesCardProps {
  notebookId: string;
  onNoteSelect?: (note: Note) => void;
  onNoteRenamed?: (note: Note) => void;
  onNoteDeleted?: (note: Note) => void;
  refreshTrigger?: number;
}

export function NotesCard({
  notebookId,
  onNoteSelect,
  onNoteRenamed,
  onNoteDeleted,
  refreshTrigger,
}: NotesCardProps) {
  const {
    data: notes,
    loading,
    error,
    refetch: refetchNotes,
  } = useFetch<Note[]>(`/notes?notebookId=${notebookId}`);

  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState<boolean>(false);
  const [newGroupTitle, setNewGroupTitle] = useState<string>("");

  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null | undefined>(undefined);
  const [moveTarget, setMoveTarget] = useState<{ noteId: string; groupId: string | null } | null>(
    null,
  );
  const [pendingMoves, setPendingMoves] = useState<Record<string, string | null>>({});
  const { value: sortPreference, setValue: setSortPreference } = useCookie<SortOption>(
    "notesSortPreference",
    "Alphabetical",
  );
  const sortBy = sortPreference ?? "Alphabetical";

  useEffect(() => {
    if (refreshTrigger !== undefined) {
      refetchNotes(true, false);
    }
  }, [refreshTrigger]);

  const {
    data: groups,
    loading: groupsLoading,
    refetch: refetchGroups,
  } = useFetch<NoteGroup[]>(`notebooks/${notebookId}/note-groups`);

  const { loading: creatingGroup, refetch: createGroup } = useFetch<NoteGroup>(
    `notebooks/${notebookId}/note-groups`,
    {
      method: "POST",
      data: { title: newGroupTitle },
      onSuccess: () => {
        setNewGroupTitle("");
        setIsNewGroupModalOpen(false);
        refetchGroups(true);
      },
      onError: (error) => {
        console.error("Error creating note group:", error.message);
      },
    },
    false,
  );

  function handleGroupsChanged() {
    refetchGroups(true);
    refetchNotes(true, false);
  }

  async function handleCreateGroup() {
    if (!newGroupTitle.trim()) return;
    await createGroup();
  }

  const { loading: addingNote, refetch: createNote } = useFetch<Note>(
    `/notes`,
    {
      method: "POST",
      data: {
        title: "New Note",
        notebookId: notebookId,
      },
      onSuccess: (newNote) => {
        useFetch.clearCache();
        refetchNotes(true, false);
        if (onNoteSelect) onNoteSelect(newNote);
      },
      onError: (error) => {
        console.error("Error adding note:", error.message);
      },
    },
    false,
  );

  const { refetch: moveNote } = useFetch<Note>(
    `/notes`,
    {
      method: "PUT",
      data: moveTarget
        ? {
            id: moveTarget.noteId,
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
        console.error("Error moving note:", error.message);
        const noteId = moveTarget?.noteId;
        if (noteId) {
          setPendingMoves((prev) => {
            const next = { ...prev };
            delete next[noteId];
            return next;
          });
        }
        setMoveTarget(null);
      },
    },
    false,
  );

  useEffect(() => {
    if (moveTarget) moveNote();
  }, [moveTarget, moveNote]);

  useEffect(() => {
    setPendingMoves((prev) => {
      const entries = Object.entries(prev);
      if (entries.length === 0) return prev;
      const next = { ...prev };
      let changed = false;
      for (const [id, groupId] of entries) {
        const note = (notes ?? []).find((n) => n.id === id);
        if (!note || (note.groupId ?? null) === groupId) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [notes]);

  function handleNoteDragEnd() {
    setDraggingNoteId(null);
    setDragOverTarget(undefined);
  }

  function getGroupId(note: Note): string | null {
    return Object.prototype.hasOwnProperty.call(pendingMoves, note.id)
      ? pendingMoves[note.id]
      : (note.groupId ?? null);
  }

  function handleGroupDragOver(e: React.DragEvent<HTMLDivElement>, target: string | null) {
    if (!draggingNoteId) return;
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
    const noteId = draggingNoteId ?? e.dataTransfer.getData("text/plain");
    setDragOverTarget(undefined);
    setDraggingNoteId(null);
    if (!noteId) return;
    const note = (notes ?? []).find((n) => n.id === noteId);
    if (!note || getGroupId(note) === target) return;
    setPendingMoves((prev) => ({ ...prev, [noteId]: target }));
    setMoveTarget({ noteId, groupId: target });
  }

  function handleNoteRenamed(updatedNote: Note) {
    refetchNotes(true, false);
    onNoteRenamed?.(updatedNote);
  }

  function handleNoteDeleted(note: Note) {
    refetchNotes(true, false);
    onNoteDeleted?.(note);
  }

  const renderNoteChip = (note: Note) => (
    <PanelListItem key={note.id}>
      <NoteChip
        note={note}
        notebookId={notebookId}
        groups={groups ?? undefined}
        onSelect={onNoteSelect}
        onRename={handleNoteRenamed}
        onDelete={handleNoteDeleted}
        onMove={() => handleGroupsChanged()}
        onDragStart={(dragged) => setDraggingNoteId(dragged.id)}
        onDragEnd={handleNoteDragEnd}
        isDragging={draggingNoteId === note.id}
      />
    </PanelListItem>
  );

  const sortedNotes = useMemo(() => getSortedItems(notes ?? [], sortBy), [notes, sortBy]);
  const groupedNotes = (groups ?? []).map((group) => ({
    group,
    notes: sortedNotes.filter((note) => getGroupId(note) === group.id),
  }));
  const ungroupedNotes = sortedNotes.filter((note) => !getGroupId(note));
  const hasGroups = (groups ?? []).length > 0;
  const isInitialLoading = (loading && !notes) || (groupsLoading && !groups);

  return (
    <>
      <SidePanel
        title="Notes"
        actions={
          <>
            <Tooltip text={addingNote ? "Adding note..." : "Add note"} position="bottom">
              <IconButton
                icon={addingNote ? <Spinner /> : <AddIcon />}
                variant="primary"
                size="sm"
                onClick={() => createNote()}
                disabled={addingNote}
              />
            </Tooltip>
            <SortMenu value={sortBy} onChange={setSortPreference} label="notes" />
            <Tooltip text="New group" position="bottom">
              <IconButton
                icon={<FolderAddIcon />}
                onClick={() => setIsNewGroupModalOpen(true)}
                variant="secondary"
                size="sm"
                ariaLabel="New group"
              />
            </Tooltip>
          </>
        }
        contentClassName="px-4"
        loading={isInitialLoading}
      >
        {error ? (
          <div className="text-sm text-red-500">We couldn't load your notes: {error.message}</div>
        ) : notes && notes.length > 0 ? (
          <PanelList
            className="flex flex-col gap-2 py-4"
            onDragOver={hasGroups ? (e) => handleGroupDragOver(e, null) : undefined}
            onDragLeave={hasGroups ? handleGroupDragLeave : undefined}
            onDrop={hasGroups ? (e) => handleGroupDrop(e, null) : undefined}
          >
            {hasGroups ? (
              <>
                {groupedNotes.map(({ group, notes: groupNotes }) => (
                  <PanelListItem key={group.id}>
                    <NoteGroupSection
                      notebookId={notebookId}
                      group={group}
                      onChanged={handleGroupsChanged}
                      isDropTarget={dragOverTarget === group.id}
                      onDragOver={(e) => handleGroupDragOver(e, group.id)}
                      onDragLeave={handleGroupDragLeave}
                      onDrop={(e) => handleGroupDrop(e, group.id)}
                    >
                      {groupNotes.length > 0 ? (
                        groupNotes.map(renderNoteChip)
                      ) : (
                        <p className="px-1 py-1 text-xs text-gray-400 select-none dark:text-gray-500">
                          No notes in this group yet
                        </p>
                      )}
                    </NoteGroupSection>
                  </PanelListItem>
                ))}
                {ungroupedNotes.length > 0 && (
                  <PanelListItem>
                    <div
                      className={cn(
                        "flex flex-col gap-2 rounded-xs pt-1 transition-colors duration-150",
                        {
                          "bg-blue-50/60 ring-1 ring-blue-300 dark:bg-blue-900/10 dark:ring-blue-700":
                            dragOverTarget === null,
                        },
                      )}
                    >
                      <span className="px-1 text-xs font-medium tracking-wide text-gray-400 uppercase select-none dark:text-gray-500">
                        Ungrouped
                      </span>
                      {ungroupedNotes.map(renderNoteChip)}
                    </div>
                  </PanelListItem>
                )}
              </>
            ) : (
              sortedNotes.map((note) => (
                <PanelListItem key={note.id}>
                  <NoteChip
                    note={note}
                    onSelect={onNoteSelect}
                    onRename={handleNoteRenamed}
                    onDelete={handleNoteDeleted}
                  />
                </PanelListItem>
              ))
            )}
          </PanelList>
        ) : (
          <div className="flex size-full flex-col items-center justify-start pt-24 text-center">
            <div className="mb-5 flex size-20 items-center justify-center rounded-xs border border-blue-300 bg-blue-50 shadow-sm dark:border-blue-700 dark:bg-blue-950/30">
              <div className="size-10 text-blue-500 dark:text-blue-400">
                <EditIcon />
              </div>
            </div>
            <h3 className="text-foreground mb-2 text-lg font-semibold">No notes yet</h3>
            <p className="max-w-xs text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              Create your first note to start capturing ideas and insights from your sources.
            </p>
          </div>
        )}
      </SidePanel>

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
            id="note-group-title"
            label="Name your group"
            type="text"
            value={newGroupTitle}
            onChange={(e) => setNewGroupTitle(e.target.value)}
            placeholder="e.g., Ideas, Research, To review…"
            autoFocus
            className="mb-0"
          />
        </Modal>
      )}
    </>
  );
}
