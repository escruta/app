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
  ConversationHistory,
} from "@/components";
import { OverviewPanel } from "@/components/chat/OverviewPanel";
import { getSourceIcon } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  NoteIcon,
  MindMapIcon,
  StudyIcon,
  CardIcon,
  QuestionnaireIcon,
  FolderIcon,
  GridIcon,
  ChatIcon,
  StarsIcon,
  SplitIcon,
} from "@/components/icons";
import { Spinner, ChromeTabs, SideNav, IconButton, Tooltip } from "@/components/ui";
import { ToolResultTab } from "@/components/tools";
import { SimpleBackground } from "@/components/backgrounds/SimpleBackground";
import { NotebookErrorState } from "./notebook/NotebookStates";
import { RenameNotebookModal } from "./notebook/RenameNotebookModal";

const MIN_SIDE_PANEL_PX = 280;
const MIN_CENTER_PANEL_PX = 400;
const MAX_LEFT_PANEL_PERCENT = 40;
const MIN_SPLIT_PERCENT = 30;
const MAX_SPLIT_PERCENT = 70;
/** Pointer movement (px) before a tab press becomes a drag. */
const TAB_DRAG_THRESHOLD_PX = 4;

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

/** Split view state: each side is a tab group with its own active tab.
 * `rightGroup` lists the tabs that belong to the right strip; every other tab
 * belongs to the left strip. Each tab lives in exactly one side, so the same
 * tab can never be shown on both sides. */
type SplitState = { leftKey: string; rightKey: string; rightGroup: string[] };

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
      return <ChatIcon />;
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
  const validNotebookId = notebookId !== "null" && notebookId !== "undefined" ? notebookId : null;
  const {
    data: notebook,
    loading,
    error,
    refetch: refetchNotebook,
  } = useFetch<NotebookContent>(
    validNotebookId ? `/notebooks/${validNotebookId}` : "",
    {
      onError: (error) => {
        console.error("Error fetching notebook:", error.message);
      },
    },
    Boolean(validNotebookId),
  );

  const [isRenameModalOpen, setIsRenameModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [chatQuestion, setChatQuestion] = useState<string | null>(null);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [notesRefreshKey, setNotesRefreshKey] = useState<number>(0);
  const [conversationsRefreshKey, setConversationsRefreshKey] = useState<number>(0);
  const [leftPanelWidth, setLeftPanelWidth] = useCookie<number>("notebookLeftPanelWidth", 30);
  const [isLeftCollapsed, setIsLeftCollapsed] = useCookie<boolean>("notebookLeftCollapsed", false);
  const [activeResizer, setActiveResizer] = useState<"left" | "split" | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [splitRatio, setSplitRatio] = useCookie<number>("notebookSplitRatio", 50);
  const [splitState, setSplitState] = useCookie<SplitState | null>(
    `notebookSplit-${notebookId}`,
    null,
  );

  // Pointer-based tab dragging: a small threshold separates clicks from drags,
  // so plain clicks always work and no drag state can get stuck.
  type TabDragState = { id: string; x: number; y: number; side: "left" | "right" | null };
  const [tabDrag, setTabDrag] = useState<TabDragState | null>(null);
  const tabDragRef = useRef<TabDragState | null>(null);
  const tabDragStartRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const placeTabRef = useRef<(id: string, side: "left" | "right") => void>(() => {});

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

  const activeExists = tabs.some((t) => tabKey(t) === activeTabKey);
  const effectiveActiveKey = activeExists ? activeTabKey : tabKey(tabs[0]);

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

  // Clicking a tab only affects ITS side: the tab becomes the active one of
  // its own strip (replacing the previously active tab of that pane). Unknown
  // keys (newly created tabs) join the side of the current active tab.
  const selectTab = useCallback(
    (key: string) => {
      if (splitState) {
        const inRight = splitState.rightGroup.includes(key);
        const inLeft = !inRight && tabs.some((t) => tabKey(t) === key);
        if (inRight) {
          setSplitState({ ...splitState, rightKey: key });
        } else if (inLeft) {
          setSplitState({ ...splitState, leftKey: key });
        } else if (splitState.rightGroup.includes(effectiveActiveKey)) {
          setSplitState({
            ...splitState,
            rightGroup: [...splitState.rightGroup, key],
            rightKey: key,
          });
        } else {
          setSplitState({ ...splitState, leftKey: key });
        }
      }
      setActiveTabKey(key);
      setPersistedActiveKey(key);
    },
    [splitState, tabs, effectiveActiveKey, setPersistedActiveKey],
  );

  const openTab = useCallback(
    (descriptor: Omit<TabDescriptor, "seq"> & { seq?: number }) => {
      const seq = descriptor.seq ?? tabSeqRef.current++;
      const candidate: TabDescriptor = { ...(descriptor as TabDescriptor), seq } as TabDescriptor;
      const candidateKey = tabKey(candidate);

      // Focus existing equivalent tab when possible.
      const existingIndex = tabs.findIndex((t) => {
        if (t.kind !== descriptor.kind) return false;
        if (descriptor.kind === "chat" && descriptor.refId === NEW_CHAT_ID) return false;
        if (
          descriptor.kind === "source" ||
          descriptor.kind === "note" ||
          descriptor.kind === "chat"
        )
          return t.refId === descriptor.refId;
        if (descriptor.kind === "tool") return t.toolType === descriptor.toolType;
        return false;
      });

      if (existingIndex >= 0) {
        selectTab(tabKey(tabs[existingIndex]));
        setTabs((prev) => {
          const updated = [...prev];
          updated[existingIndex] = {
            ...prev[existingIndex],
            title: candidate.title || prev[existingIndex].title,
            source: candidate.source ?? prev[existingIndex].source,
            note: candidate.note ?? prev[existingIndex].note,
          };
          return updated;
        });
        return;
      }

      setTabs((prev) => [...prev, candidate]);
      selectTab(candidateKey);
    },
    [tabs, selectTab],
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

  const openNewChatTab = useCallback(() => {
    openTab({ kind: "chat", refId: NEW_CHAT_ID, title: "New conversation" });
  }, [openTab]);

  const createChatTabSilent = useCallback(() => {
    const seq = tabSeqRef.current++;
    const candidate: TabDescriptor = {
      kind: "chat",
      refId: NEW_CHAT_ID,
      seq,
      title: "New conversation",
    };
    setTabs((prev) => [...prev, candidate]);
    return tabKey(candidate);
  }, []);

  // Activate split view: the current tab keeps the left pane (and its strip),
  // every other tab goes to the right strip.
  const toggleSplit = useCallback(() => {
    if (splitState) {
      setSplitState(null);
      return;
    }
    const otherKeys = tabs.map(tabKey).filter((k) => k !== effectiveActiveKey);
    const rightGroup = otherKeys.length > 0 ? otherKeys : [createChatTabSilent()];
    setSplitState({ leftKey: effectiveActiveKey, rightKey: rightGroup[0], rightGroup });
  }, [splitState, setSplitState, tabs, effectiveActiveKey, createChatTabSilent]);

  // Drop a tab on one side of the split view: it becomes that side's active
  // tab and joins its strip. Each tab lives in exactly one side.
  const placeTab = useCallback(
    (id: string, side: "left" | "right") => {
      const keys = tabs.map(tabKey);
      if (!splitState) {
        const others = keys.filter((k) => k !== id);
        const otherKey = others.length > 0 ? others[0] : createChatTabSilent();
        setSplitState(
          side === "left"
            ? { leftKey: id, rightKey: otherKey, rightGroup: [otherKey] }
            : { leftKey: otherKey, rightKey: id, rightGroup: [id] },
        );
      } else if (side === "right") {
        if (splitState.rightGroup.includes(id)) {
          setSplitState({ ...splitState, rightKey: id });
        } else {
          const rightGroup = [...splitState.rightGroup, id];
          const leftGroup = keys.filter((k) => !rightGroup.includes(k));
          if (leftGroup.length === 0) {
            setSplitState(null);
          } else {
            const leftKey =
              splitState.leftKey === id || !leftGroup.includes(splitState.leftKey)
                ? leftGroup[0]
                : splitState.leftKey;
            setSplitState({ leftKey, rightKey: id, rightGroup });
          }
        }
      } else {
        if (!splitState.rightGroup.includes(id)) {
          setSplitState({ ...splitState, leftKey: id });
        } else {
          const rightGroup = splitState.rightGroup.filter((k) => k !== id);
          if (rightGroup.length === 0) {
            setSplitState(null);
          } else {
            const rightKey = splitState.rightKey === id ? rightGroup[0] : splitState.rightKey;
            setSplitState({ leftKey: id, rightKey, rightGroup });
          }
        }
      }
      setActiveTabKey(id);
      setPersistedActiveKey(id);
    },
    [tabs, splitState, createChatTabSilent, setPersistedActiveKey],
  );
  placeTabRef.current = placeTab;

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

  const currentConversationId = useMemo(() => {
    if (activeTab?.kind === "chat" && activeTab.refId !== NEW_CHAT_ID) return activeTab.refId;
    return null;
  }, [activeTab]);
  // Keep the split groups valid: drop closed tabs from the groups, replace a
  // side's active tab when it was closed (preferring the globally active tab),
  // migrate old cookie shapes, and exit split view when a side runs out of
  // tabs. Each tab still belongs to exactly one side, so duplicates are
  // impossible by construction.
  useEffect(() => {
    if (!splitState) return;
    const keys = tabs.map(tabKey);
    const effActive = keys.includes(activeTabKey) ? activeTabKey : keys[0];
    const shapeOk =
      Array.isArray(splitState.rightGroup) &&
      typeof splitState.leftKey === "string" &&
      typeof splitState.rightKey === "string";

    if (!shapeOk) {
      const rightGroup = keys.filter((k) => k !== effActive);
      setSplitState(
        rightGroup.length > 0 ? { leftKey: effActive, rightKey: rightGroup[0], rightGroup } : null,
      );
      return;
    }

    const rightGroup = splitState.rightGroup.filter((k) => keys.includes(k));
    const leftGroup = keys.filter((k) => !rightGroup.includes(k));
    if (leftGroup.length === 0 || rightGroup.length === 0) {
      setSplitState(null);
      return;
    }
    let { leftKey, rightKey } = splitState;
    if (!leftGroup.includes(leftKey)) {
      leftKey = leftGroup.includes(effActive) ? effActive : leftGroup[0];
    }
    if (!rightGroup.includes(rightKey)) {
      rightKey = rightGroup.includes(effActive) ? effActive : rightGroup[0];
    }
    if (
      leftKey !== splitState.leftKey ||
      rightKey !== splitState.rightKey ||
      rightGroup.length !== splitState.rightGroup.length
    ) {
      setSplitState({ leftKey, rightKey, rightGroup });
    }
  }, [tabs, activeTabKey, splitState, setSplitState]);
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

  const handleConversationCompleted = useCallback(() => {
    setConversationsRefreshKey((prev) => prev + 1);
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
      if (!activeResizer) return;

      if (activeResizer === "split") {
        if (!contentRef.current) return;
        const rect = contentRef.current.getBoundingClientRect();
        const pct = ((e.clientX - rect.left) / rect.width) * 100;
        setSplitRatio(Math.min(MAX_SPLIT_PERCENT, Math.max(MIN_SPLIT_PERCENT, pct)));
        return;
      }

      if (!sectionRef.current) return;

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
  }, [activeResizer, setLeftPanelWidth, setIsLeftCollapsed, setSplitRatio]);

  const handleMouseDownLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveResizer("left");
  };

  const handleMouseDownSplit = (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveResizer("split");
  };

  // --- Pointer-based tab dragging -----------------------------------------
  // A drag begins only after the pointer moves past a small threshold, so
  // plain clicks always work. Everything runs on window-level pointer events,
  // so the drag always ends (no stuck overlays).

  const handleTabPointerDown = (e: React.PointerEvent<HTMLDivElement>, id: string) => {
    if (e.button !== 0) return;
    // Don't start a drag from the tab's buttons (e.g. close).
    if ((e.target as HTMLElement).closest("button")) return;
    tabDragStartRef.current = { id, x: e.clientX, y: e.clientY };
  };

  const endTabDrag = useCallback((place: boolean) => {
    const current = tabDragRef.current;
    if (current && place && current.side) placeTabRef.current(current.id, current.side);
    tabDragStartRef.current = null;
    if (tabDragRef.current) {
      tabDragRef.current = null;
      setTabDrag(null);
      document.body.classList.remove("tab-dragging");
    }
  }, []);

  useEffect(() => {
    const getDropSide = (x: number, y: number): "left" | "right" | null => {
      const rect = centerRef.current?.getBoundingClientRect();
      if (!rect) return null;
      const inside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      if (!inside) return null;
      return x - rect.left < rect.width / 2 ? "left" : "right";
    };

    const handlePointerMove = (e: PointerEvent) => {
      const start = tabDragStartRef.current;
      if (start && !tabDragRef.current) {
        const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y);
        if (moved >= TAB_DRAG_THRESHOLD_PX) {
          tabDragRef.current = { id: start.id, x: e.clientX, y: e.clientY, side: null };
          setTabDrag(tabDragRef.current);
          document.body.classList.add("tab-dragging");
        }
        return;
      }
      const current = tabDragRef.current;
      if (current) {
        const side = getDropSide(e.clientX, e.clientY);
        if (side !== current.side || e.clientX !== current.x || e.clientY !== current.y) {
          tabDragRef.current = { ...current, x: e.clientX, y: e.clientY, side };
          setTabDrag(tabDragRef.current);
        }
      }
    };

    const handlePointerUp = () => endTabDrag(true);
    const handleCancel = () => endTabDrag(false);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") endTabDrag(false);
    };
    const handleBlur = () => endTabDrag(false);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handleCancel);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handleCancel);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", handleBlur);
    };
  }, [endTabDrag]);

  // Clicking inside a pane just marks its tab as the globally active one (so
  // new tabs opened from the sidebar land there). It never moves content.
  const handlePaneMouseDown = (side: "left" | "right") => (e: React.MouseEvent) => {
    if (e.button !== 0 || !splitState) return;
    const key = side === "left" ? splitState.leftKey : splitState.rightKey;
    if (key && key !== activeTabKey) {
      setActiveTabKey(key);
      setPersistedActiveKey(key);
    }
  };

  // Snap-style drop preview + floating ghost chip shown while dragging a tab.
  // Dropping on a half moves the tab to that side's strip.
  const draggingTab = tabDrag ? (tabs.find((t) => tabKey(t) === tabDrag.id) ?? null) : null;
  const dropOverlay =
    tabDrag && draggingTab ? (
      <div className="pointer-events-none absolute inset-0 z-10 flex">
        {(["left", "right"] as const).map((side) => {
          const hovered = tabDrag.side === side;
          const dimmed = tabDrag.side !== null && !hovered;
          return (
            <div
              key={side}
              className={cn(
                "flex h-full w-1/2 p-2 transition-colors duration-200",
                side === "left" ? "justify-start" : "justify-end",
                dimmed && "bg-gray-100/50 dark:bg-black/30",
              )}
            >
              <div
                className={cn(
                  "flex w-full items-center justify-center rounded-xs border transition-colors duration-150",
                  {
                    "border-blue-300 bg-blue-50/80 shadow-sm dark:border-blue-700 dark:bg-blue-950/30":
                      hovered,
                    "border-transparent": !hovered,
                  },
                )}
              >
                {hovered && (
                  <div className="pointer-events-none flex items-center gap-1.5 rounded-xs border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                    <span className="shrink-0 [&>svg]:size-3.5 [&>svg]:shrink-0">
                      {getTabIcon(draggingTab)}
                    </span>
                    <span className="max-w-44 min-w-0 truncate">
                      {draggingTab.title || "Untitled"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    ) : null;

  const dragGhost =
    tabDrag && draggingTab ? (
      <div
        className={cn(
          "pointer-events-none fixed z-50 flex items-center gap-1.5 rounded-xs border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200",
          tabDrag.side ? "opacity-100" : "opacity-60",
        )}
        style={{
          left: tabDrag.x,
          top: tabDrag.y,
          transform: "translate(-50%, calc(-100% - 8px))",
        }}
      >
        <span className="shrink-0 [&>svg]:size-3.5 [&>svg]:shrink-0">
          {getTabIcon(draggingTab)}
        </span>
        <span className="max-w-44 min-w-0 truncate">{draggingTab.title || "Untitled"}</span>
      </div>
    ) : null;

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

  if (!validNotebookId) {
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
          <NotebookErrorState error={{ status: 404, message: "Invalid notebook link" }} />
        </div>
      </div>
    );
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
            autoFocus={isActive}
            initialConversationId={tab.refId === NEW_CHAT_ID ? null : tab.refId}
            initialConversationTitle={tab.refId === NEW_CHAT_ID ? null : tab.title}
            onConversationCreated={(id) => handleConversationCreated(k, id)}
            onTitleChange={(title) => handleTabTitleChange(k, title)}
            onConversationCompleted={handleConversationCompleted}
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

  // Split panes: each side is a tab group; the pane shows its group's active
  // tab. Each tab belongs to exactly one side, so the same tab can never show
  // on both sides.
  const itemsByKey = new Map(chromeTabsItems.map((item) => [item.id, item]));
  const rightGroupKeys = splitState ? splitState.rightGroup : [];
  const leftGroupKeys = splitState
    ? tabs.map(tabKey).filter((k) => !rightGroupKeys.includes(k))
    : [];
  const leftStripItems = leftGroupKeys
    .map((k) => itemsByKey.get(k))
    .filter((item): item is (typeof chromeTabsItems)[number] => item !== undefined);
  const rightStripItems = rightGroupKeys
    .map((k) => itemsByKey.get(k))
    .filter((item): item is (typeof chromeTabsItems)[number] => item !== undefined);
  const splitLeftTab = splitState
    ? (tabs.find((t) => tabKey(t) === splitState.leftKey) ?? null)
    : null;
  const splitRightTab = splitState
    ? (tabs.find((t) => tabKey(t) === splitState.rightKey) ?? null)
    : null;
  const splitActive = splitState !== null && splitLeftTab !== null && splitRightTab !== null;

  const splitResizer = (
    <div
      className="group relative z-5 flex shrink-0 cursor-col-resize items-stretch justify-center after:absolute after:-inset-3"
      onMouseDown={handleMouseDownSplit}
      title="Drag to resize"
    >
      <div
        className={cn("w-px rounded-xs transition-all duration-150", {
          "bg-blue-500 dark:bg-blue-400": activeResizer === "split",
          "bg-gray-200 group-hover:bg-blue-400/70 dark:bg-gray-800 dark:group-hover:bg-blue-500/70":
            activeResizer !== "split",
        })}
      />
    </div>
  );

  const splitToggleButton = (
    <Tooltip text={splitActive ? "Close split view" : "Split view"}>
      <IconButton
        icon={<SplitIcon className="size-3.5" />}
        variant={splitActive ? "primary" : "ghost"}
        size="xs"
        onClick={toggleSplit}
        ariaLabel={splitActive ? "Close split view" : "Split view"}
      />
    </Tooltip>
  );

  const centerColumn = (
    <div ref={centerRef} className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {splitActive && splitState && splitLeftTab && splitRightTab ? (
        <div ref={contentRef} className="flex min-h-0 flex-1">
          <div
            className="flex min-h-0 shrink-0 flex-col overflow-hidden"
            style={{ width: `${splitRatio ?? 50}%` }}
          >
            <ChromeTabs
              tabs={leftStripItems}
              activeTabId={splitState.leftKey}
              onSelect={selectTab}
              onClose={closeTab}
              onTabPointerDown={handleTabPointerDown}
              className="h-11"
            />
            <div
              className="relative min-h-0 flex-1 overflow-hidden"
              onMouseDown={handlePaneMouseDown("left")}
            >
              <div key={tabKey(splitLeftTab)} className="h-full">
                {renderTabContent(splitLeftTab, tabKey(splitLeftTab) === effectiveActiveKey)}
              </div>
            </div>
          </div>
          {splitResizer}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <ChromeTabs
              tabs={rightStripItems}
              activeTabId={splitState.rightKey}
              onSelect={selectTab}
              onClose={closeTab}
              onTabPointerDown={handleTabPointerDown}
              actions={splitToggleButton}
              className="h-11"
            />
            <div
              className="relative min-h-0 flex-1 overflow-hidden"
              onMouseDown={handlePaneMouseDown("right")}
            >
              <div key={tabKey(splitRightTab)} className="h-full">
                {renderTabContent(splitRightTab, tabKey(splitRightTab) === effectiveActiveKey)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <ChromeTabs
            tabs={chromeTabsItems}
            activeTabId={effectiveActiveKey}
            onSelect={selectTab}
            onClose={closeTab}
            onTabPointerDown={handleTabPointerDown}
            actions={splitToggleButton}
          />
          <div
            ref={contentRef}
            className="relative min-h-0 flex-1 overflow-hidden bg-white dark:bg-gray-950"
          >
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
        </>
      )}
      {dropOverlay}
      {dragGhost}
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
                  Overview · Conversations · Sources · Notes · Tools
                </div>
              </div>
            )}

            <div className={cn("h-full w-full", { hidden: isLeftCollapsed })}>
              <SideNav
                className="h-full"
                onNewChat={openNewChatTab}
                items={[
                  {
                    id: "overview",
                    label: "Overview",
                    icon: <StarsIcon />,
                    content: (
                      <OverviewPanel
                        notebookId={notebookId}
                        readySourcesCount={
                          (notebook?.sources ?? []).filter((s) => s.status === "READY").length
                        }
                      />
                    ),
                  },
                  {
                    id: "conversations",
                    label: "Conversations",
                    icon: <ChatIcon />,
                    content: (
                      <ConversationHistory
                        notebookId={notebookId}
                        currentConversationId={currentConversationId}
                        refreshTrigger={conversationsRefreshKey}
                        onSelectConversation={(id, title) =>
                          openTab({ kind: "chat", refId: id, title })
                        }
                        onNewConversation={openNewChatTab}
                      />
                    ),
                  },
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
                defaultActiveTab="overview"
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
                "bg-gray-200 group-hover:bg-blue-400/70 dark:bg-gray-800 dark:group-hover:bg-blue-500/70":
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
