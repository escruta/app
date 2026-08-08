import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useLoaderData } from "react-router";
import { useFetch, useCookie, useRealtimeEvent } from "@/hooks";
import type { Note, Source, Notebook, NotebookContent, JobType } from "@/interfaces";
import {
  SourcesCard,
  NotesCard,
  ChatCard,
  NoteEditor,
  SourceViewer,
  ToolsCard,
  TopBar,
} from "@/components";
import { getSourceIcon } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  ChatNewIcon,
  NoteIcon,
  MindMapIcon,
  StudyIcon,
  CardIcon,
  QuestionnaireIcon,
  FolderIcon,
  GridIcon,
} from "@/components/icons";
import { Spinner, ChromeTabs, SideNav } from "@/components/ui";
import { ToolResultTab } from "@/components/tools";
import { SimpleBackground } from "@/components/backgrounds/SimpleBackground";
import { NotebookErrorState } from "./notebook/NotebookStates";
import { RenameNotebookModal } from "./notebook/RenameNotebookModal";

const MIN_SIDE_PANEL_PX = 280;
const MIN_CENTER_PANEL_PX = 400;
const MAX_LEFT_PANEL_PERCENT = 40;

type TabKind = "chat" | "source" | "note" | "tool";
const NEW_CHAT_ID = "__new_chat__";

type TabDescriptor = {
  kind: TabKind;
  /** For chat: either NEW_CHAT_ID or a real conversation id. */
  refId: string;
  /** For tabs whose ref id may change (new chat), an incremental counter. */
  seq: number;
  title: string;
  source?: Source | undefined;
  note?: Note | undefined;
  toolType?: JobType | undefined;
};

const TOOL_META: Record<JobType, { title: string; icon: React.ReactNode }> = {
  MIND_MAP: { title: "Mind Map", icon: <MindMapIcon /> },
  STUDY_GUIDE: { title: "Study Guide", icon: <StudyIcon /> },
  FLASHCARDS: { title: "Flashcards", icon: <CardIcon /> },
  QUESTIONNAIRE: { title: "Questionnaire", icon: <QuestionnaireIcon /> },
};

const tabKey = (t: TabDescriptor) => `${t.kind}:${t.seq}`;

function getTabIcon(tab: TabDescriptor) {
  switch (tab.kind) {
    case "chat":
      return <ChatNewIcon />;
    case "source":
      return tab.source ? getSourceIcon(tab.source.type) : null;
    case "note":
      return <NoteIcon />;
    case "tool":
      return tab.toolType ? TOOL_META[tab.toolType].icon : null;
  }
}

function getPixelConstraints(containerWidth: number) {
  const minSidePercent = (MIN_SIDE_PANEL_PX / containerWidth) * 100;
  const minCenterPercent = (MIN_CENTER_PANEL_PX / containerWidth) * 100;
  return { minSidePercent, minCenterPercent };
}

export default function NotebookPage() {
  const notebookId: string = useLoaderData();
  const {
    data: notebook,
    loading,
    error,
    refetch: refetchNotebook,
  } = useFetch<NotebookContent>(`/notebooks/${notebookId}`, {
    onError: (error) => {
      console.error("Error fetching notebook:", error.message);
    },
  });

  const [isRenameModalOpen, setIsRenameModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [chatQuestion, setChatQuestion] = useState<string | null>(null);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [notesRefreshKey, setNotesRefreshKey] = useState<number>(0);
  const [leftPanelWidth, setLeftPanelWidth] = useCookie<number>("notebookLeftPanelWidth", 30);
  const [isLeftCollapsed, setIsLeftCollapsed] = useCookie<boolean>("notebookLeftCollapsed", false);
  const [activeResizer, setActiveResizer] = useState<"left" | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const [persistedTabs, setPersistedTabs] = useCookie<TabDescriptor[]>(
    `notebookTabs-${notebookId}`,
    [],
  );
  const [persistedActiveKey, setPersistedActiveKey] = useCookie<string | null>(
    `notebookActiveTab-${notebookId}`,
    null,
  );
  const [tabs, setTabs] = useState<TabDescriptor[]>(() => {
    if (persistedTabs && persistedTabs.length > 0) return persistedTabs;
    return [{ kind: "chat", refId: NEW_CHAT_ID, seq: 0, title: "New conversation" }];
  });
  const [activeTabKey, setActiveTabKey] = useState<string>(() => {
    if (persistedActiveKey && persistedTabs?.some((t) => tabKey(t) === persistedActiveKey))
      return persistedActiveKey;
    if (persistedTabs && persistedTabs.length > 0) return tabKey(persistedTabs[0]);
    return tabKey({
      kind: "chat",
      refId: NEW_CHAT_ID,
      seq: 0,
      title: "",
    });
  });
  const tabSeqRef = useRef<number>(
    Math.max(0, ...(persistedTabs ?? []).map((t) => t.seq ?? 0)) + 1,
  );

  const initialLoadRef = useRef(true);

  const handleSourceUpdated = useCallback(
    (event: { notebookId?: string; sourceId?: string; status?: string }) => {
      if (event?.notebookId === notebookId) {
        refetchNotebook(true, false);
      }
    },
    [notebookId, refetchNotebook],
  );

  useRealtimeEvent("source.updated", handleSourceUpdated);

  const prevSourcesRef = useRef<string[]>([]);

  useEffect(() => {
    if (notebook?.sources) {
      const currentIds = notebook.sources.map((s) => s.id);
      if (initialLoadRef.current) {
        setSelectedSourceIds(currentIds);
        prevSourcesRef.current = currentIds;
        initialLoadRef.current = false;
      } else {
        setSelectedSourceIds((prev) => {
          // Identify truly new sources that weren't in the previous fetch
          const newSources = currentIds.filter((id) => !prevSourcesRef.current.includes(id));

          // Keep only selected ids that still exist
          const validPrev = prev.filter((id) => currentIds.includes(id));

          if (newSources.length > 0 || validPrev.length !== prev.length) {
            return [...validPrev, ...newSources];
          }
          return prev;
        });
        prevSourcesRef.current = currentIds;
      }
    }
  }, [notebook]);

  const handleSourceSelectFromChat = (sourceId: string) => {
    const found = notebook?.sources?.find((s) => s.id === sourceId);
    const source: Source = found ?? {
      id: sourceId,
      notebookId: notebookId,
      title: "",
      link: "",
      type: "Text",
      status: "READY",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    openTab({
      kind: "source",
      refId: source.id,
      seq: tabSeqRef.current++,
      title: source.title,
      source,
    });
  };

  const handleToggleSource = (sourceId: string) => {
    setSelectedSourceIds((prev) =>
      prev.includes(sourceId) ? prev.filter((id) => id !== sourceId) : [...prev, sourceId],
    );
  };

  const handleSelectAllSources = (ids: string[]) => {
    setSelectedSourceIds(ids);
  };

  const handleClearSourceSelection = () => {
    setSelectedSourceIds([]);
  };

  const openTab = useCallback(
    (descriptor: Omit<TabDescriptor, "seq"> & { seq?: number }) => {
      const seq = descriptor.seq ?? tabSeqRef.current++;
      const candidate: TabDescriptor = { ...(descriptor as TabDescriptor), seq } as TabDescriptor;
      const candidateKey = tabKey(candidate);

      setTabs((prev) => {
        // Focus existing equivalent tab when possible.
        const findExisting = () => {
          if (descriptor.kind === "chat" && descriptor.refId === NEW_CHAT_ID) return -1;
          return prev.findIndex((t) => {
            if (t.kind !== descriptor.kind) return false;
            if (
              descriptor.kind === "source" ||
              descriptor.kind === "note" ||
              descriptor.kind === "chat"
            )
              return t.refId === descriptor.refId;
            if (descriptor.kind === "tool") return t.toolType === descriptor.toolType;
            return false;
          });
        };
        const existingIndex = findExisting();
        if (existingIndex >= 0) {
          const existingKey = tabKey(prev[existingIndex]);
          setActiveTabKey(existingKey);
          setPersistedActiveKey(existingKey);
          const updated = [...prev];
          updated[existingIndex] = {
            ...prev[existingIndex],
            title: candidate.title || prev[existingIndex].title,
            source: candidate.source ?? prev[existingIndex].source,
            note: candidate.note ?? prev[existingIndex].note,
          };
          return updated;
        }
        setActiveTabKey(candidateKey);
        setPersistedActiveKey(candidateKey);
        return [...prev, candidate];
      });
    },
    [setPersistedActiveKey],
  );

  const closeTab = useCallback(
    (key: string) => {
      setTabs((prev) => {
        const idx = prev.findIndex((t) => tabKey(t) === key);
        if (idx < 0) return prev;
        const next = prev.filter((t) => tabKey(t) !== key);
        if (next.length === 0) {
          const fresh: TabDescriptor = {
            kind: "chat",
            refId: NEW_CHAT_ID,
            seq: tabSeqRef.current++,
            title: "New conversation",
          };
          const freshKey = tabKey(fresh);
          setActiveTabKey(freshKey);
          setPersistedActiveKey(freshKey);
          return [fresh];
        }
        if (tabKey(prev[idx]) === activeTabKey) {
          const neighbour = next[Math.min(idx, next.length - 1)];
          const neighbourKey = tabKey(neighbour);
          setActiveTabKey(neighbourKey);
          setPersistedActiveKey(neighbourKey);
        }
        return next;
      });
      if (persistedActiveKey === key) setPersistedActiveKey(null);
    },
    [activeTabKey, persistedActiveKey, setPersistedActiveKey],
  );

  const selectTab = useCallback(
    (key: string) => {
      setActiveTabKey(key);
      setPersistedActiveKey(key);
    },
    [setPersistedActiveKey],
  );

  const openNewChatTab = useCallback(() => {
    openTab({ kind: "chat", refId: NEW_CHAT_ID, title: "New conversation" });
  }, [openTab]);

  // Persist open tabs so they survive reloads (like the panel width cookie).
  useEffect(() => {
    setPersistedTabs(tabs);
  }, [tabs, setPersistedTabs]);

  // Refresh title/icon on source tabs when notebook data reloads, and drop
  // source tabs whose underlying source has been deleted.
  useEffect(() => {
    if (!notebook?.sources) return;
    setTabs((prev) => {
      let changed = false;
      const next = prev
        .map((t) => {
          if (t.kind !== "source" || !t.source) return t;
          const fresh = notebook.sources?.find((s) => s.id === t.source!.id);
          if (!fresh) {
            changed = true;
            return null;
          }
          if (fresh.title !== t.title) {
            changed = true;
            return { ...t, title: fresh.title, source: fresh };
          }
          return t;
        })
        .filter((t): t is TabDescriptor => t !== null);
      return changed ? next : prev;
    });
  }, [notebook?.sources]);

  const activeTab = useMemo(
    () => tabs.find((t) => tabKey(t) === activeTabKey) ?? tabs[0],
    [tabs, activeTabKey],
  );

  // When a chat tab creates a real conversation, anchor its refId so it persists
  // and won't be reused as a new-chat tab.
  const handleConversationCreated = useCallback((tabKeyStr: string, conversationId: string) => {
    setTabs((prev) =>
      prev.map((t) => {
        if (tabKey(t) !== tabKeyStr) return t;
        if (t.refId === conversationId) return t;
        return { ...t, refId: conversationId };
      }),
    );
  }, []);

  const handleTabTitleChange = useCallback((tabKeyStr: string, title: string) => {
    if (!title) return;
    setTabs((prev) =>
      prev.map((t) => (tabKey(t) === tabKeyStr && t.title !== title ? { ...t, title } : t)),
    );
  }, []);

  const handleNodeSelect = (question: string) => {
    const firstChat = tabs.find((t) => t.kind === "chat");
    if (firstChat && activeTab?.kind !== "chat") {
      selectTab(tabKey(firstChat));
    }
    setChatQuestion(question);
  };

  useEffect(() => {
    if (notebook?.title) {
      setNewTitle(notebook.title);
    }
  }, [notebook]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!activeResizer || !sectionRef.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const { minSidePercent, minCenterPercent } = getPixelConstraints(rect.width);

      if (activeResizer === "left") {
        const maxAvailable = 100 - minCenterPercent;
        const maxLimit = Math.min(MAX_LEFT_PANEL_PERCENT, maxAvailable);
        const pct = (x / rect.width) * 100;
        if (pct < minSidePercent) {
          setIsLeftCollapsed(true);
        } else {
          setLeftPanelWidth(Math.min(Math.max(pct, minSidePercent), maxLimit));
          setIsLeftCollapsed(false);
        }
      }
    };

    const handleMouseUp = () => {
      setActiveResizer(null);
      document.body.classList.remove("resizing");
    };

    if (activeResizer) {
      document.body.classList.add("resizing");
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.classList.remove("resizing");
    };
  }, [activeResizer, setLeftPanelWidth, setIsLeftCollapsed]);

  const handleMouseDownLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveResizer("left");
  };

  useEffect(() => {
    if (!sectionRef.current) return;

    const clampPanelWidths = (containerWidth: number) => {
      const { minSidePercent, minCenterPercent } = getPixelConstraints(containerWidth);

      const left = isLeftCollapsed ? 0 : (leftPanelWidth ?? 30);

      let clampedLeft = left;

      if (left > 0 && left < minSidePercent) {
        clampedLeft = minSidePercent;
      }

      const maxLimit = Math.min(MAX_LEFT_PANEL_PERCENT, 100 - minCenterPercent);
      clampedLeft = Math.min(clampedLeft, maxLimit);

      if (clampedLeft !== left) setLeftPanelWidth(clampedLeft);
    };

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        clampPanelWidths(entry.contentRect.width);
      }
    });

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, [isLeftCollapsed, leftPanelWidth, setLeftPanelWidth]);

  const handleDoubleClickLeft = () => {
    if (!isLeftCollapsed) {
      setIsLeftCollapsed(true);
      return;
    }
    const containerWidth = sectionRef.current?.getBoundingClientRect().width ?? window.innerWidth;
    const { minSidePercent, minCenterPercent } = getPixelConstraints(containerWidth);
    const maxLimit = Math.min(MAX_LEFT_PANEL_PERCENT, 100 - minCenterPercent);
    const desired = Math.max(minSidePercent, leftPanelWidth ?? minSidePercent);
    setLeftPanelWidth(Math.min(desired, maxLimit));
    setIsLeftCollapsed(false);
  };

  const {
    loading: renamingNotebook,
    error: renameError,
    refetch: renameNotebook,
  } = useFetch<Notebook>(
    "/notebooks",
    {
      method: "PUT",
      data: {
        id: notebookId,
        title: newTitle,
      },
    },
    false,
  );

  async function handleRenameNotebook() {
    if (!newTitle.trim()) return;
    try {
      await renameNotebook();
      if (notebook) notebook.title = newTitle;
      setIsRenameModalOpen(false);
    } catch (error) {
      console.error("Error renaming notebook:", error);
    }
  }

  if (error) {
    return (
      <div className="flex h-screen max-h-full w-full flex-col">
        <TopBar
          title={
            <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
              <span className="hidden shrink-0 text-xs font-medium tracking-wide text-gray-500 uppercase md:block dark:text-gray-400">
                Notebook /{" "}
              </span>
              <span className="text-gray-400">We couldn't load your notebook</span>
            </div>
          }
        />
        <div className="relative flex-1 overflow-hidden">
          <SimpleBackground />
          <NotebookErrorState error={error} />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen max-h-full w-full flex-col">
        <TopBar
          title={
            <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
              <span className="hidden shrink-0 text-xs font-medium tracking-wide text-gray-500 uppercase md:block dark:text-gray-400">
                Notebook /{" "}
              </span>
              <span className="opacity-0">Loading</span>
            </div>
          }
        />
        <div className="relative flex flex-1 items-center justify-center overflow-hidden">
          <SimpleBackground />
          <Spinner />
        </div>
      </div>
    );
  }

  const sourcesListContent = (onToggleCollapse?: () => void) => (
    <SourcesCard
      notebookId={notebookId}
      sources={notebook?.sources || []}
      isLoading={loading}
      onSourceSelect={(source: Source) =>
        openTab({ kind: "source", refId: source.id, title: source.title, source })
      }
      selectedSourceIds={selectedSourceIds}
      onToggleSource={handleToggleSource}
      onSelectAll={handleSelectAllSources}
      onClearSelection={handleClearSourceSelection}
      onSourcesChange={() => refetchNotebook(true, false)}
      onToggleCollapse={onToggleCollapse}
    />
  );

  const notesListContent = (
    <NotesCard
      notebookId={notebookId}
      onNoteSelect={(note: Note) =>
        openTab({ kind: "note", refId: note.id, title: note.title, note })
      }
      refreshTrigger={notesRefreshKey}
    />
  );

  const toolsListContent = (
    <ToolsCard
      notebookId={notebookId}
      onNodeSelect={handleNodeSelect}
      hasSources={(notebook?.sources?.length ?? 0) > 0}
      onOpenTool={(type: JobType, title: string) =>
        openTab({ kind: "tool", refId: type, title, toolType: type })
      }
    />
  );

  const renderTabContent = (tab: TabDescriptor, isActive: boolean) => {
    const k = tabKey(tab);
    switch (tab.kind) {
      case "chat":
        return (
          <ChatCard
            notebookId={notebookId}
            sources={notebook?.sources || []}
            selectedSourceIds={selectedSourceIds}
            onSourceSelect={handleSourceSelectFromChat}
            externalQuestion={isActive ? chatQuestion : null}
            onExternalQuestionHandled={() => setChatQuestion(null)}
            hideSummaryAndQuestions={false}
            autoFocus={isActive}
            initialConversationId={tab.refId === NEW_CHAT_ID ? null : tab.refId}
            initialConversationTitle={tab.refId === NEW_CHAT_ID ? null : tab.title}
            onConversationCreated={(id) => handleConversationCreated(k, id)}
            onTitleChange={(title) => handleTabTitleChange(k, title)}
            onOpenConversation={(id, title) => openTab({ kind: "chat", refId: id, title })}
            onNewChat={openNewChatTab}
          />
        );
      case "source":
        if (!tab.source) return null;
        return (
          <SourceViewer
            notebookId={notebookId}
            source={tab.source}
            handleCloseSource={() => closeTab(k)}
            onSourceDelete={() => {
              closeTab(k);
              refetchNotebook(true, false);
            }}
            className="h-full"
          />
        );
      case "note":
        if (!tab.note) return null;
        return (
          <NoteEditor
            note={tab.note}
            className="h-full"
            handleCloseNote={() => closeTab(k)}
            onNoteUpdated={(updatedNote) => {
              setTabs((prev) =>
                prev.map((t) =>
                  tabKey(t) === k ? { ...t, title: updatedNote.title, note: updatedNote } : t,
                ),
              );
              setNotesRefreshKey((prev) => prev + 1);
            }}
            onNoteDeleted={() => {
              closeTab(k);
              setNotesRefreshKey((prev) => prev + 1);
            }}
          />
        );
      case "tool":
        if (!tab.toolType) return null;
        return (
          <ToolResultTab
            notebookId={notebookId}
            toolType={tab.toolType}
            title={tab.title}
            onClose={() => closeTab(k)}
            onNodeSelect={handleNodeSelect}
          />
        );
    }
  };

  const chromeTabsItems = tabs.map((t) => ({
    id: tabKey(t),
    label: t.title || (t.kind === "chat" ? "New conversation" : t.title),
    icon: getTabIcon(t),
    closable: true,
  }));

  const activeExists = tabs.some((t) => tabKey(t) === activeTabKey);
  const effectiveActiveKey = activeExists ? activeTabKey : tabKey(tabs[0]);

  const centerColumn = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <ChromeTabs
        tabs={chromeTabsItems}
        activeTabId={effectiveActiveKey}
        onSelect={selectTab}
        onClose={closeTab}
        onNewChat={openNewChatTab}
      />
      <div className="relative min-h-0 flex-1 overflow-hidden bg-white dark:bg-gray-950">
        {tabs.map((t) => {
          const k = tabKey(t);
          const isActive = k === effectiveActiveKey;
          return (
            <div key={k} className={cn("absolute inset-0 h-full", { hidden: !isActive })}>
              {renderTabContent(t, isActive)}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen max-h-full w-full flex-col">
      <title>{notebook?.title ? `${notebook.title} - Notebook - Escruta` : "Escruta"}</title>
      <TopBar
        title={
          <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
            <span className="hidden shrink-0 text-xs font-medium tracking-wide text-gray-500 uppercase md:block dark:text-gray-400">
              Notebook /{" "}
            </span>
            <input
              className={cn(
                "app-region-no-drag w-full truncate bg-transparent p-0 text-lg font-semibold transition-colors duration-200 focus:outline-none focus:ring-0 border-none",
                {
                  "text-blue-600 dark:text-blue-400": renamingNotebook,
                },
              )}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onBlur={() => {
                if (newTitle.trim() && newTitle !== notebook?.title) {
                  handleRenameNotebook();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                }
              }}
              disabled={renamingNotebook}
              placeholder="Give your notebook a title..."
            />
          </div>
        }
      />

      <div className="relative flex-1 overflow-hidden">
        <SimpleBackground />
        <section ref={sectionRef} className="flex h-full overflow-hidden">
          <div
            className={cn(
              "min-h-0 flex max-w-md flex-col overflow-hidden border-r border-gray-200 bg-gray-50/60 transition-[width,background-color,border-color] duration-200 ease-out shrink-0 dark:border-gray-800 dark:bg-gray-900/50",
            )}
            style={{ width: isLeftCollapsed ? "48px" : `${leftPanelWidth ?? 25}%` }}
          >
            {isLeftCollapsed && (
              <div className="flex h-full w-full items-center justify-center">
                <div
                  className="text-xs font-medium tracking-widest text-gray-400 uppercase select-none [writing-mode:vertical-rl]"
                  style={{ transform: "rotate(180deg)" }}
                >
                  Sources · Notes · Tools
                </div>
              </div>
            )}

            <div className={cn("h-full w-full", { hidden: isLeftCollapsed })}>
              <SideNav
                className="h-full"
                items={[
                  {
                    id: "sources",
                    label: "Sources",
                    icon: <FolderIcon />,
                    content: sourcesListContent(),
                  },
                  {
                    id: "notes",
                    label: "Notes",
                    icon: <NoteIcon />,
                    content: notesListContent,
                  },
                  {
                    id: "tools",
                    label: "Tools",
                    icon: <GridIcon />,
                    content: toolsListContent,
                  },
                ]}
                defaultActiveTab="sources"
              />
            </div>
          </div>

          {/* Left Resizer */}
          <div
            className="group relative z-5 flex shrink-0 cursor-col-resize items-stretch justify-center after:absolute after:-inset-3"
            onMouseDown={handleMouseDownLeft}
            onDoubleClick={handleDoubleClickLeft}
            title="Double click to collapse or expand"
          >
            <div
              className={cn("w-px rounded-xs transition-all duration-150", {
                "bg-blue-500 dark:bg-blue-400": activeResizer === "left",
                "bg-transparent group-hover:bg-blue-400/70 dark:group-hover:bg-blue-500/70":
                  activeResizer !== "left",
              })}
            />
          </div>

          {centerColumn}
        </section>
      </div>

      <RenameNotebookModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        handleRenameNotebook={handleRenameNotebook}
        renamingNotebook={renamingNotebook}
        renameError={renameError}
      />
    </div>
  );
}
