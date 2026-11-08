import { memo, useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useLoaderData } from "react-router";
import { useFetch, useCookie, useRealtimeEvent, useShortcut, useShortcuts } from "@/hooks";
import type {
  Note,
  Source,
  Notebook,
  NotebookContent,
  JobType,
  ConversationStatus,
} from "@/interfaces";
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
  ChatIcon,
  BookOpenIcon,
  SplitIcon,
  FileTextIcon,
  ToolsIcon,
  CloseIcon,
} from "@/components/icons";
import { Spinner, ChromeTabs, SideNav, ContextMenuItem } from "@/components/ui";
import { ToolResultTab } from "@/components/tools";
import { NotebookErrorState } from "./notebook/NotebookStates";
import { RenameNotebookModal } from "./notebook/RenameNotebookModal";

const COLLAPSED_SIDE_PANEL_PX = 72;
const MIN_SIDE_PANEL_PX = 376;
const MAX_SIDE_PANEL_PX = 464;
const DEFAULT_SIDE_PANEL_PX = 376;
const MIN_CENTER_PANEL_PX = 400;
const MIN_SPLIT_PERCENT = 30;
const MAX_SPLIT_PERCENT = 70;
const TAB_DRAG_THRESHOLD_PX = 4;

type TabKind = "chat" | "source" | "note" | "tool";
const NEW_CHAT_ID = "__new_chat__";

type TabDescriptor = {
  kind: TabKind;
  refId: string;
  seq: number;
  title: string;
  source?: Source | undefined;
  note?: Note | undefined;
  toolType?: JobType | undefined;
};

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

function normalizeSidePanelWidth(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < MIN_SIDE_PANEL_PX) {
    return DEFAULT_SIDE_PANEL_PX;
  }
  return Math.min(MAX_SIDE_PANEL_PX, Math.max(MIN_SIDE_PANEL_PX, Math.round(value)));
}

function getMaxSidePanelPx(containerWidth: number): number {
  if (!Number.isFinite(containerWidth) || containerWidth <= 0) {
    return MAX_SIDE_PANEL_PX;
  }
  return Math.max(
    MIN_SIDE_PANEL_PX,
    Math.min(MAX_SIDE_PANEL_PX, containerWidth - MIN_CENTER_PANEL_PX),
  );
}

function sanitizeTabsForCookie(tabs: TabDescriptor[]): TabDescriptor[] {
  return tabs.map((t) => ({
    ...t,
    source: t.source ? { ...t.source, content: undefined } : undefined,
    note: t.note ? { ...t.note, content: "" } : undefined,
  }));
}

const EMPTY_SOURCES: Source[] = [];

interface TabPaneContentProps {
  tab: TabDescriptor;
  tabKeyStr: string;
  notebookId: string;
  isActive: boolean;
  isVisible: boolean;
  sources: Source[];
  selectedSourceIds: string[];
  chatQuestion: string | null;
  onClearChatQuestion: () => void;
  onSourceSelectFromChat: (sourceId: string) => void;
  onConversationCreated: (tabKeyStr: string, conversationId: string) => void;
  onTabTitleChange: (tabKeyStr: string, title: string) => void;
  onConversationCompleted: () => void;
  onConversationSeen: (conversationId: string) => void;
  onConversationStateChange: (
    id: string,
    state: { status: ConversationStatus; hasUnseenReply: boolean },
  ) => void;
  onCloseTab: (tabKeyStr: string) => void;
  onSourceDeleted: (tabKeyStr: string) => void;
  onNoteUpdated: (tabKeyStr: string, updatedNote: Note) => void;
  onNoteDeleted: (tabKeyStr: string) => void;
  onNodeSelect: (question: string) => void;
}

const TabPaneContent = memo(
  function TabPaneContent({
    tab,
    tabKeyStr,
    notebookId,
    isActive,
    isVisible,
    sources,
    selectedSourceIds,
    chatQuestion,
    onClearChatQuestion,
    onSourceSelectFromChat,
    onConversationCreated,
    onTabTitleChange,
    onConversationCompleted,
    onConversationSeen,
    onConversationStateChange,
    onCloseTab,
    onSourceDeleted,
    onNoteUpdated,
    onNoteDeleted,
    onNodeSelect,
  }: TabPaneContentProps) {
    const handleClose = useCallback(() => onCloseTab(tabKeyStr), [onCloseTab, tabKeyStr]);
    const handleSourceDelete = useCallback(
      () => onSourceDeleted(tabKeyStr),
      [onSourceDeleted, tabKeyStr],
    );
    const handleConvCreated = useCallback(
      (id: string) => onConversationCreated(tabKeyStr, id),
      [onConversationCreated, tabKeyStr],
    );
    const handleTitleChange = useCallback(
      (title: string) => onTabTitleChange(tabKeyStr, title),
      [onTabTitleChange, tabKeyStr],
    );
    const handleNoteUpdate = useCallback(
      (updatedNote: Note) => onNoteUpdated(tabKeyStr, updatedNote),
      [onNoteUpdated, tabKeyStr],
    );
    const handleNoteDelete = useCallback(
      () => onNoteDeleted(tabKeyStr),
      [onNoteDeleted, tabKeyStr],
    );

    switch (tab.kind) {
      case "chat":
        return (
          <ChatCard
            notebookId={notebookId}
            sources={sources}
            selectedSourceIds={selectedSourceIds}
            onSourceSelect={onSourceSelectFromChat}
            externalQuestion={isActive ? chatQuestion : null}
            onExternalQuestionHandled={onClearChatQuestion}
            autoFocus={isActive}
            initialConversationId={tab.refId === NEW_CHAT_ID ? null : tab.refId}
            initialConversationTitle={tab.refId === NEW_CHAT_ID ? null : tab.title}
            onConversationCreated={handleConvCreated}
            onTitleChange={handleTitleChange}
            onConversationCompleted={onConversationCompleted}
            onConversationSeen={onConversationSeen}
            onConversationStateChange={onConversationStateChange}
          />
        );
      case "source":
        if (!tab.source) return null;
        return (
          <SourceViewer
            notebookId={notebookId}
            source={tab.source}
            isActive={isVisible}
            handleCloseSource={handleClose}
            onSourceDelete={handleSourceDelete}
            className="h-full"
          />
        );
      case "note":
        if (!tab.note) return null;
        return (
          <NoteEditor
            note={tab.note}
            className="h-full"
            handleCloseNote={handleClose}
            onNoteUpdated={handleNoteUpdate}
            onNoteDeleted={handleNoteDelete}
          />
        );
      case "tool":
        if (!tab.toolType) return null;
        return (
          <ToolResultTab
            notebookId={notebookId}
            toolType={tab.toolType}
            title={tab.title}
            onClose={handleClose}
            onNodeSelect={onNodeSelect}
          />
        );
    }
  },
  (prev, next) => {
    if (
      prev.tabKeyStr !== next.tabKeyStr ||
      prev.notebookId !== next.notebookId ||
      prev.tab.kind !== next.tab.kind
    ) {
      return false;
    }

    switch (next.tab.kind) {
      case "source":
        return prev.isVisible === next.isVisible && prev.tab.source === next.tab.source;
      case "note":
        return prev.isVisible === next.isVisible && prev.tab.note === next.tab.note;
      case "tool":
        return (
          prev.isVisible === next.isVisible &&
          prev.tab.toolType === next.tab.toolType &&
          prev.tab.title === next.tab.title
        );
      case "chat":
        if (!prev.isVisible && !next.isVisible && prev.tab === next.tab) {
          return true;
        }
        return (
          prev.isActive === next.isActive &&
          prev.isVisible === next.isVisible &&
          prev.tab === next.tab &&
          prev.sources === next.sources &&
          prev.selectedSourceIds === next.selectedSourceIds &&
          (next.isActive ? prev.chatQuestion === next.chatQuestion : true)
        );
    }
  },
);

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
  const [seenConversationId, setSeenConversationId] = useState<string | null>(null);
  const [conversationStates, setConversationStates] = useState<
    Record<string, { status: ConversationStatus; hasUnseenReply: boolean }>
  >({});
  const { value: leftPanelWidth, setValue: setLeftPanelWidth } = useCookie<number>(
    "notebookLeftPanelWidth",
    DEFAULT_SIDE_PANEL_PX,
  );
  const { value: isLeftCollapsed, setValue: setIsLeftCollapsed } = useCookie<boolean>(
    "notebookLeftCollapsed",
    false,
  );
  const normalizedLeftPanelWidth = normalizeSidePanelWidth(leftPanelWidth);
  const leftDragStartWidthRef = useRef<number>(normalizedLeftPanelWidth);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [activeResizer, setActiveResizer] = useState<"left" | "split" | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const { value: splitRatio, setValue: setSplitRatio } = useCookie<number>(
    "notebookSplitRatio",
    50,
  );
  const { value: splitState, setValue: setSplitState } = useCookie<SplitState | null>(
    `notebookSplit-${notebookId}`,
    null,
  );

  type TabDragState = { id: string; x: number; y: number; side: "left" | "right" | null };
  const [tabDrag, setTabDrag] = useState<TabDragState | null>(null);
  const tabDragRef = useRef<TabDragState | null>(null);
  const tabDragStartRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const placeTabRef = useRef<(id: string, side: "left" | "right") => void>(() => {});

  const { value: persistedTabs, setValue: setPersistedTabs } = useCookie<TabDescriptor[]>(
    `notebookTabs-${notebookId}`,
    [],
  );
  const { value: persistedActiveKey, setValue: setPersistedActiveKey } = useCookie<string | null>(
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
  const mountedTabKeysRef = useRef<Set<string>>(new Set());

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
          const newSources = currentIds.filter((id) => !prevSourcesRef.current.includes(id));

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

  const effectiveSplitState = useMemo<SplitState | null>(() => {
    if (!splitState) return null;
    const keys = tabs.map(tabKey);
    const shapeOk =
      Array.isArray(splitState.rightGroup) &&
      typeof splitState.leftKey === "string" &&
      typeof splitState.rightKey === "string";

    if (!shapeOk) {
      const rightGroup = keys.filter((k) => k !== effectiveActiveKey);
      return rightGroup.length > 0
        ? { leftKey: effectiveActiveKey, rightKey: rightGroup[0], rightGroup }
        : null;
    }

    const rightGroup = splitState.rightGroup.filter((k) => keys.includes(k));
    const leftGroup = keys.filter((k) => !rightGroup.includes(k));
    if (leftGroup.length === 0 || rightGroup.length === 0) {
      return null;
    }

    const leftKey = leftGroup.includes(splitState.leftKey)
      ? splitState.leftKey
      : leftGroup.includes(effectiveActiveKey)
        ? effectiveActiveKey
        : leftGroup[0];
    const rightKey = rightGroup.includes(splitState.rightKey)
      ? splitState.rightKey
      : rightGroup.includes(effectiveActiveKey)
        ? effectiveActiveKey
        : rightGroup[0];

    if (
      leftKey === splitState.leftKey &&
      rightKey === splitState.rightKey &&
      rightGroup.length === splitState.rightGroup.length
    ) {
      return splitState;
    }

    return { leftKey, rightKey, rightGroup };
  }, [splitState, tabs, effectiveActiveKey]);

  const selectTab = useCallback(
    (key: string) => {
      if (effectiveSplitState) {
        const inRight = effectiveSplitState.rightGroup.includes(key);
        const inLeft = !inRight && tabs.some((t) => tabKey(t) === key);
        if (inRight) {
          setSplitState({ ...effectiveSplitState, rightKey: key });
        } else if (inLeft) {
          setSplitState({ ...effectiveSplitState, leftKey: key });
        } else if (effectiveSplitState.rightGroup.includes(effectiveActiveKey)) {
          setSplitState({
            ...effectiveSplitState,
            rightGroup: [...effectiveSplitState.rightGroup, key],
            rightKey: key,
          });
        } else {
          setSplitState({ ...effectiveSplitState, leftKey: key });
        }
      }
      setActiveTabKey(key);
      setPersistedActiveKey(key);
    },
    [effectiveSplitState, tabs, effectiveActiveKey, setSplitState, setPersistedActiveKey],
  );

  const openTab = useCallback(
    (descriptor: Omit<TabDescriptor, "seq"> & { seq?: number }) => {
      const seq = descriptor.seq ?? tabSeqRef.current++;
      const candidate: TabDescriptor = { ...(descriptor as TabDescriptor), seq } as TabDescriptor;
      const candidateKey = tabKey(candidate);

      if (descriptor.kind === "chat" && descriptor.refId === NEW_CHAT_ID) {
        const existingNewChat = tabs.find((t) => t.kind === "chat" && t.refId === NEW_CHAT_ID);
        if (existingNewChat) {
          selectTab(tabKey(existingNewChat));
          return;
        }
      }

      const existingIndex = tabs.findIndex((t) => {
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
      const idx = tabs.findIndex((t) => tabKey(t) === key);
      if (idx < 0) return;

      mountedTabKeysRef.current.delete(key);
      const next = tabs.filter((t) => tabKey(t) !== key);

      if (next.length === 0) {
        const fresh: TabDescriptor = {
          kind: "chat",
          refId: NEW_CHAT_ID,
          seq: tabSeqRef.current++,
          title: "New conversation",
        };
        const freshKey = tabKey(fresh);
        setTabs([fresh]);
        setSplitState(null);
        setActiveTabKey(freshKey);
        setPersistedActiveKey(freshKey);
        return;
      }

      if (effectiveSplitState) {
        const prevRightGroup = effectiveSplitState.rightGroup;
        const prevLeftGroup = tabs.map(tabKey).filter((k) => !prevRightGroup.includes(k));
        const closingRight = prevRightGroup.includes(key);
        const nextRightGroup = prevRightGroup.filter((k) => k !== key);
        const nextLeftGroup = prevLeftGroup.filter((k) => k !== key);

        if (nextLeftGroup.length === 0 || nextRightGroup.length === 0) {
          const survivingVisibleKey =
            nextLeftGroup.length === 0 ? effectiveSplitState.rightKey : effectiveSplitState.leftKey;
          const fallbackKey = next.some((t) => tabKey(t) === survivingVisibleKey)
            ? survivingVisibleKey
            : tabKey(next[Math.min(idx, next.length - 1)]);
          setTabs(next);
          setSplitState(null);
          setActiveTabKey(fallbackKey);
          setPersistedActiveKey(fallbackKey);
          return;
        }

        let nextLeftKey = effectiveSplitState.leftKey;
        if (!closingRight && key === effectiveSplitState.leftKey) {
          const leftIdx = prevLeftGroup.indexOf(key);
          nextLeftKey = nextLeftGroup[Math.min(Math.max(0, leftIdx), nextLeftGroup.length - 1)];
        }

        let nextRightKey = effectiveSplitState.rightKey;
        if (closingRight && key === effectiveSplitState.rightKey) {
          const rightIdx = prevRightGroup.indexOf(key);
          nextRightKey = nextRightGroup[Math.min(Math.max(0, rightIdx), nextRightGroup.length - 1)];
        }

        const nextActiveKey =
          key === effectiveActiveKey
            ? closingRight
              ? nextRightKey
              : nextLeftKey
            : effectiveActiveKey;

        setTabs(next);
        setSplitState({
          leftKey: nextLeftKey,
          rightKey: nextRightKey,
          rightGroup: nextRightGroup,
        });
        if (nextActiveKey !== activeTabKey) {
          setActiveTabKey(nextActiveKey);
          setPersistedActiveKey(nextActiveKey);
        }
        return;
      }

      setTabs(next);
      if (key === effectiveActiveKey) {
        const neighbour = next[Math.min(idx, next.length - 1)];
        const neighbourKey = tabKey(neighbour);
        setActiveTabKey(neighbourKey);
        setPersistedActiveKey(neighbourKey);
      }
    },
    [
      tabs,
      effectiveSplitState,
      effectiveActiveKey,
      activeTabKey,
      setSplitState,
      setPersistedActiveKey,
    ],
  );

  const cycleTab = useCallback(
    (direction: 1 | -1) => {
      if (tabs.length <= 1) return;
      let list: string[];
      if (effectiveSplitState) {
        const rightGroup = effectiveSplitState.rightGroup.filter((k) =>
          tabs.some((t) => tabKey(t) === k),
        );
        const leftGroup = tabs.map(tabKey).filter((k) => !rightGroup.includes(k));
        if (rightGroup.includes(effectiveActiveKey)) {
          list = rightGroup.length > 1 ? rightGroup : tabs.map(tabKey);
        } else if (leftGroup.includes(effectiveActiveKey)) {
          list = leftGroup.length > 1 ? leftGroup : tabs.map(tabKey);
        } else {
          list = tabs.map(tabKey);
        }
      } else {
        list = tabs.map(tabKey);
      }
      if (list.length <= 1) return;
      const idx = list.indexOf(effectiveActiveKey);
      const current = idx >= 0 ? idx : 0;
      const next = (current + direction + list.length) % list.length;
      selectTab(list[next]);
    },
    [tabs, effectiveActiveKey, effectiveSplitState, selectTab],
  );

  const closeTabRef = useRef(closeTab);
  closeTabRef.current = closeTab;
  const effectiveActiveKeyRef = useRef(effectiveActiveKey);
  effectiveActiveKeyRef.current = effectiveActiveKey;
  const cycleTabRef = useRef(cycleTab);
  cycleTabRef.current = cycleTab;
  const isLeftCollapsedRef = useRef(isLeftCollapsed);
  isLeftCollapsedRef.current = isLeftCollapsed;

  useEffect(() => {
    const cleanup = window.electronAPI?.shortcuts?.onCloseTabRequest(() => {
      closeTabRef.current(effectiveActiveKeyRef.current);
    });
    return cleanup;
  }, []);

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

  const placeTab = useCallback(
    (id: string, side: "left" | "right") => {
      const keys = tabs.map(tabKey);
      if (!effectiveSplitState) {
        const others = keys.filter((k) => k !== id);
        const otherKey = others.length > 0 ? others[0] : createChatTabSilent();
        setSplitState(
          side === "left"
            ? { leftKey: id, rightKey: otherKey, rightGroup: [otherKey] }
            : { leftKey: otherKey, rightKey: id, rightGroup: [id] },
        );
      } else if (side === "right") {
        if (effectiveSplitState.rightGroup.includes(id)) {
          setSplitState({ ...effectiveSplitState, rightKey: id });
        } else {
          const rightGroup = [...effectiveSplitState.rightGroup, id];
          const leftGroup = keys.filter((k) => !rightGroup.includes(k));
          if (leftGroup.length === 0) {
            setSplitState(null);
          } else {
            const leftKey =
              effectiveSplitState.leftKey === id || !leftGroup.includes(effectiveSplitState.leftKey)
                ? leftGroup[0]
                : effectiveSplitState.leftKey;
            setSplitState({ leftKey, rightKey: id, rightGroup });
          }
        }
      } else {
        if (!effectiveSplitState.rightGroup.includes(id)) {
          setSplitState({ ...effectiveSplitState, leftKey: id });
        } else {
          const rightGroup = effectiveSplitState.rightGroup.filter((k) => k !== id);
          if (rightGroup.length === 0) {
            setSplitState(null);
          } else {
            const rightKey =
              effectiveSplitState.rightKey === id ? rightGroup[0] : effectiveSplitState.rightKey;
            setSplitState({ leftKey: id, rightKey, rightGroup });
          }
        }
      }
      setActiveTabKey(id);
      setPersistedActiveKey(id);
    },
    [tabs, effectiveSplitState, createChatTabSilent, setSplitState, setPersistedActiveKey],
  );
  placeTabRef.current = placeTab;

  useEffect(() => {
    setPersistedTabs(sanitizeTabsForCookie(tabs));
  }, [tabs, setPersistedTabs]);

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

  useEffect(() => {
    if (effectiveSplitState !== splitState) {
      setSplitState(effectiveSplitState);
    }
  }, [effectiveSplitState, splitState, setSplitState]);
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

  const handleConversationSeen = useCallback((conversationId: string) => {
    setSeenConversationId(conversationId);
    setConversationStates((prev) => {
      const current = prev[conversationId];
      if (!current || !current.hasUnseenReply) return prev;
      return {
        ...prev,
        [conversationId]: { ...current, hasUnseenReply: false },
      };
    });
  }, []);

  const handleConversationUpdated = useCallback(
    (event: {
      notebookId?: string;
      conversationId?: string;
      title?: string;
      status?: ConversationStatus;
      hasUnseenReply?: boolean;
    }) => {
      if (event?.notebookId !== notebookId || !event.conversationId) return;

      if (event.title) {
        setTabs((prev) =>
          prev.map((t) =>
            t.kind === "chat" && t.refId === event.conversationId && t.title !== event.title
              ? { ...t, title: event.title! }
              : t,
          ),
        );
      }

      setConversationStates((prev) => {
        const existing = prev[event.conversationId!];
        const status = event.status ?? existing?.status ?? "IDLE";
        const isCurrentActive = event.conversationId === currentConversationId;
        const hasUnseenReply = isCurrentActive
          ? false
          : (event.hasUnseenReply ?? existing?.hasUnseenReply ?? false);
        return {
          ...prev,
          [event.conversationId!]: { status, hasUnseenReply },
        };
      });
    },
    [notebookId, currentConversationId],
  );

  useRealtimeEvent("conversation.updated", handleConversationUpdated);

  const handleTabTitleChange = useCallback((tabKeyStr: string, title: string) => {
    if (!title) return;
    setTabs((prev) =>
      prev.map((t) => (tabKey(t) === tabKeyStr && t.title !== title ? { ...t, title } : t)),
    );
  }, []);

  const handleNodeSelect = useCallback(
    (question: string) => {
      const firstChat = tabs.find((t) => t.kind === "chat");
      if (firstChat && activeTab?.kind !== "chat") {
        selectTab(tabKey(firstChat));
      }
      setChatQuestion(question);
    },
    [tabs, activeTab, selectTab],
  );

  const handleClearChatQuestion = useCallback(() => {
    setChatQuestion(null);
  }, []);

  const handleConversationStateChange = useCallback(
    (id: string, state: { status: ConversationStatus; hasUnseenReply: boolean }) => {
      setConversationStates((prev) => ({ ...prev, [id]: state }));
    },
    [],
  );

  const handleSourceDeleted = useCallback(
    (tabKeyStr: string) => {
      closeTab(tabKeyStr);
      refetchNotebook(true, false);
    },
    [closeTab, refetchNotebook],
  );

  const handleNoteUpdated = useCallback((tabKeyStr: string, updatedNote: Note) => {
    setTabs((prev) =>
      prev.map((t) =>
        tabKey(t) === tabKeyStr ? { ...t, title: updatedNote.title, note: updatedNote } : t,
      ),
    );
    setNotesRefreshKey((prev) => prev + 1);
  }, []);

  const handleNoteDeleted = useCallback(
    (tabKeyStr: string) => {
      closeTab(tabKeyStr);
      setNotesRefreshKey((prev) => prev + 1);
    },
    [closeTab],
  );

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

      if (activeResizer === "left") {
        const maxAllowedPx = getMaxSidePanelPx(rect.width);
        const collapseThresholdPx = (COLLAPSED_SIDE_PANEL_PX + MIN_SIDE_PANEL_PX) / 2;
        if (x < collapseThresholdPx) {
          setLeftPanelWidth(leftDragStartWidthRef.current);
          setIsLeftCollapsed(true);
        } else {
          const clampedPx = Math.round(Math.min(Math.max(x, MIN_SIDE_PANEL_PX), maxAllowedPx));
          setLeftPanelWidth(clampedPx);
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
    leftDragStartWidthRef.current = normalizedLeftPanelWidth;
    setActiveResizer("left");
  };

  const handleMouseDownSplit = (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveResizer("split");
  };

  const handleTabPointerDown = (e: React.PointerEvent<HTMLDivElement>, id: string) => {
    if (e.button !== 0) return;
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
    const handleBlur = () => endTabDrag(false);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handleCancel);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handleCancel);
      window.removeEventListener("blur", handleBlur);
    };
  }, [endTabDrag]);

  useShortcuts(
    [
      {
        id: "close-tab",
        handler: () => closeTabRef.current(effectiveActiveKeyRef.current),
        stopPropagation: true,
      },
      {
        id: "toggle-sidebar",
        handler: () => setIsLeftCollapsed(!isLeftCollapsedRef.current),
        stopPropagation: true,
      },
      {
        id: "chat-new",
        handler: () => openNewChatTab(),
        stopPropagation: true,
      },
      {
        id: "next-tab",
        handler: () => cycleTabRef.current(1),
        stopPropagation: true,
      },
      {
        id: "previous-tab",
        handler: () => cycleTabRef.current(-1),
        stopPropagation: true,
      },
      {
        id: "cancel-tab-drag",
        handler: () => endTabDrag(false),
        enabled: Boolean(tabDrag),
        stopPropagation: true,
      },
    ],
    { global: true },
  );

  const handlePaneMouseDown = (side: "left" | "right") => (e: React.MouseEvent) => {
    if (e.button !== 0 || !effectiveSplitState) return;
    const key = side === "left" ? effectiveSplitState.leftKey : effectiveSplitState.rightKey;
    if (key && key !== activeTabKey) {
      setActiveTabKey(key);
      setPersistedActiveKey(key);
    }
  };

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
              className={cn("flex h-full w-1/2 p-2 transition-colors duration-200", {
                "justify-start": side === "left",
                "justify-end": side !== "left",
                "bg-gray-100/50 dark:bg-black/30": dimmed,
              })}
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
          {
            "opacity-100": tabDrag.side,
            "opacity-60": !tabDrag.side,
          },
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
    if (leftPanelWidth !== normalizedLeftPanelWidth) {
      setLeftPanelWidth(normalizedLeftPanelWidth);
    }
  }, [leftPanelWidth, normalizedLeftPanelWidth, setLeftPanelWidth]);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    setContainerWidth(node.getBoundingClientRect().width);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [loading, error, validNotebookId]);

  const handleDoubleClickLeft = () => {
    setIsLeftCollapsed(!isLeftCollapsed);
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

  const handleRenameNotebookKeyDown = useShortcut("dialog-confirm", (event) => {
    (event.currentTarget as HTMLInputElement).blur();
  });

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

  const chromeTabsItems = tabs.map((t) => {
    const k = tabKey(t);
    const isActive = k === effectiveActiveKey;
    const convState =
      t.kind === "chat" && t.refId !== NEW_CHAT_ID ? conversationStates[t.refId] : undefined;
    const isGenerating = convState?.status === "GENERATING";
    const hasUnseen = Boolean(convState?.hasUnseenReply) && !isGenerating && !isActive;

    return {
      id: k,
      label: t.title || (t.kind === "chat" ? "New conversation" : t.title),
      icon: isGenerating ? (
        <Spinner
          size={14}
          className="text-blue-500 dark:text-blue-400"
          aria-label="Generating response"
        />
      ) : (
        getTabIcon(t)
      ),
      indicator: hasUnseen ? (
        <span
          className="relative flex size-2 items-center justify-center"
          aria-label="New response ready"
        >
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-blue-400 opacity-75 dark:bg-blue-500" />
          <span className="relative inline-flex size-2 rounded-full bg-blue-500 dark:bg-blue-400" />
        </span>
      ) : undefined,
      closable: true,
    };
  });

  const itemsByKey = new Map(chromeTabsItems.map((item) => [item.id, item]));
  const rightGroupKeys = effectiveSplitState ? effectiveSplitState.rightGroup : [];
  const leftGroupKeys = effectiveSplitState
    ? tabs.map(tabKey).filter((k) => !rightGroupKeys.includes(k))
    : [];
  const leftStripItems = leftGroupKeys
    .map((k) => itemsByKey.get(k))
    .filter((item): item is (typeof chromeTabsItems)[number] => item !== undefined);
  const rightStripItems = rightGroupKeys
    .map((k) => itemsByKey.get(k))
    .filter((item): item is (typeof chromeTabsItems)[number] => item !== undefined);
  const splitLeftTab = effectiveSplitState
    ? (tabs.find((t) => tabKey(t) === effectiveSplitState.leftKey) ?? null)
    : null;
  const splitRightTab = effectiveSplitState
    ? (tabs.find((t) => tabKey(t) === effectiveSplitState.rightKey) ?? null)
    : null;
  const splitActive =
    effectiveSplitState !== null && splitLeftTab !== null && splitRightTab !== null;

  const renderTabContextMenu = (id: string) => (
    <>
      <ContextMenuItem
        icon={<SplitIcon className="size-3.5" />}
        label="Split left"
        onClick={() => placeTab(id, "left")}
      />
      <ContextMenuItem
        icon={<SplitIcon className="size-3.5" />}
        label="Split right"
        onClick={() => placeTab(id, "right")}
      />
      {splitActive && (
        <ContextMenuItem
          icon={<CloseIcon className="size-3.5" />}
          label="Close split view"
          onClick={() => setSplitState(null)}
        />
      )}
    </>
  );

  const tabActiveIndicatorFor = (isPaneActive: boolean) =>
    isPaneActive ? undefined : cn("bg-gray-300 dark:bg-gray-700");

  const effectiveSplitRatio = splitRatio ?? 50;
  const renderedLeftWidthPx = isLeftCollapsed
    ? COLLAPSED_SIDE_PANEL_PX
    : Math.min(normalizedLeftPanelWidth, getMaxSidePanelPx(containerWidth));

  const centerColumn = (
    <div ref={centerRef} className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex h-11 shrink-0 overflow-hidden bg-white dark:bg-gray-950">
        <div
          className="min-w-0 shrink-0 overflow-hidden"
          style={{ width: splitActive ? `${effectiveSplitRatio}%` : "100%" }}
        >
          <ChromeTabs
            tabs={splitActive ? leftStripItems : chromeTabsItems}
            activeTabId={
              splitActive && effectiveSplitState ? effectiveSplitState.leftKey : effectiveActiveKey
            }
            onSelect={selectTab}
            onClose={closeTab}
            onTabPointerDown={handleTabPointerDown}
            renderTabContextMenu={renderTabContextMenu}
            className="h-11"
            activeIndicatorClassName={
              splitActive
                ? tabActiveIndicatorFor(!rightGroupKeys.includes(effectiveActiveKey))
                : undefined
            }
          />
        </div>
        {splitActive && effectiveSplitState && (
          <>
            <div className="w-px shrink-0 bg-gray-200 dark:bg-gray-800" />
            <div className="min-w-0 flex-1 overflow-hidden">
              <ChromeTabs
                tabs={rightStripItems}
                activeTabId={effectiveSplitState.rightKey}
                onSelect={selectTab}
                onClose={closeTab}
                onTabPointerDown={handleTabPointerDown}
                renderTabContextMenu={renderTabContextMenu}
                className="h-11"
                activeIndicatorClassName={tabActiveIndicatorFor(
                  rightGroupKeys.includes(effectiveActiveKey),
                )}
              />
            </div>
          </>
        )}
      </div>

      <div
        ref={contentRef}
        className="relative min-h-0 flex-1 overflow-hidden bg-white dark:bg-gray-950"
      >
        {tabs.map((t) => {
          const k = tabKey(t);
          const isActive = k === effectiveActiveKey;
          const paneRole: "full" | "left" | "right" | "hidden" =
            splitActive && effectiveSplitState
              ? k === effectiveSplitState.leftKey
                ? "left"
                : k === effectiveSplitState.rightKey
                  ? "right"
                  : "hidden"
              : isActive
                ? "full"
                : "hidden";
          const isVisible = paneRole !== "hidden";

          if (isVisible) {
            mountedTabKeysRef.current.add(k);
          }

          if (!mountedTabKeysRef.current.has(k)) {
            return null;
          }

          const paneStyle: React.CSSProperties | undefined =
            paneRole === "left"
              ? { left: 0, width: `${effectiveSplitRatio}%` }
              : paneRole === "right"
                ? { left: `calc(${effectiveSplitRatio}% + 1px)`, right: 0 }
                : undefined;

          return (
            <div
              key={k}
              style={paneStyle}
              onMouseDown={
                paneRole === "left"
                  ? handlePaneMouseDown("left")
                  : paneRole === "right"
                    ? handlePaneMouseDown("right")
                    : undefined
              }
              className={cn("absolute inset-y-0 h-full overflow-hidden", {
                "inset-x-0": paneRole === "full" || paneRole === "hidden",
                "tab-pane-inactive": !isVisible,
              })}
            >
              <TabPaneContent
                tab={t}
                tabKeyStr={k}
                notebookId={notebookId}
                isActive={isActive}
                isVisible={isVisible}
                sources={notebook?.sources ?? EMPTY_SOURCES}
                selectedSourceIds={selectedSourceIds}
                chatQuestion={isActive ? chatQuestion : null}
                onClearChatQuestion={handleClearChatQuestion}
                onSourceSelectFromChat={handleSourceSelectFromChat}
                onConversationCreated={handleConversationCreated}
                onTabTitleChange={handleTabTitleChange}
                onConversationCompleted={handleConversationCompleted}
                onConversationSeen={handleConversationSeen}
                onConversationStateChange={handleConversationStateChange}
                onCloseTab={closeTab}
                onSourceDeleted={handleSourceDeleted}
                onNoteUpdated={handleNoteUpdated}
                onNoteDeleted={handleNoteDeleted}
                onNodeSelect={handleNodeSelect}
              />
            </div>
          );
        })}

        {splitActive && (
          <div
            style={{ left: `${effectiveSplitRatio}%` }}
            className="group absolute inset-y-0 z-5 flex -translate-x-1/2 cursor-col-resize items-stretch justify-center after:absolute after:-inset-x-3 after:inset-y-0"
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
        )}
      </div>
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
              onKeyDown={handleRenameNotebookKeyDown}
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
              "flex min-h-0 shrink-0 flex-col overflow-hidden bg-gray-50/60 dark:bg-gray-900/50",
              activeResizer !== "left" &&
                "transition-[width,min-width,max-width,background-color,border-color] duration-200 ease-out",
            )}
            style={{
              width: `${renderedLeftWidthPx}px`,
              minWidth: `${renderedLeftWidthPx}px`,
              maxWidth: `${renderedLeftWidthPx}px`,
            }}
          >
            <div className="h-full w-full">
              <SideNav
                className="h-full"
                onNewChat={openNewChatTab}
                collapsed={isLeftCollapsed}
                onCollapsedChange={setIsLeftCollapsed}
                onToggleCollapse={() => setIsLeftCollapsed(!isLeftCollapsed)}
                items={[
                  {
                    id: "overview",
                    label: "Overview",
                    icon: <BookOpenIcon />,
                    content: (
                      <OverviewPanel
                        notebookId={notebookId}
                        readySourcesCount={
                          (notebook?.sources ?? []).filter((s) => s.status === "READY").length
                        }
                        sources={notebook?.sources ?? []}
                        notes={notebook?.notes ?? []}
                        onOpenSource={(source) =>
                          openTab({
                            kind: "source",
                            refId: source.id,
                            title: source.title,
                            source,
                          })
                        }
                        onOpenNote={(note) =>
                          openTab({ kind: "note", refId: note.id, title: note.title, note })
                        }
                      />
                    ),
                  },
                  {
                    id: "conversations",
                    label: "History",
                    icon: <ChatIcon />,
                    content: (
                      <ConversationHistory
                        notebookId={notebookId}
                        currentConversationId={currentConversationId}
                        refreshTrigger={conversationsRefreshKey}
                        seenConversationId={seenConversationId}
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
                    icon: <FileTextIcon />,
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
                    icon: <ToolsIcon />,
                    content: toolsListContent,
                  },
                ]}
                defaultActiveTab="overview"
              />
            </div>
          </div>

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
