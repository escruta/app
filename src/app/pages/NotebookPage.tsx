import { useEffect, useState, useRef } from "react";
import { useLoaderData } from "react-router";
import { useFetch, useCookie, useBreakpoint } from "@/hooks";
import type { Note, Source, Notebook, NotebookContent } from "@/interfaces";
import { motion, AnimatePresence } from "motion/react";
import {
  SourcesCard,
  NotesCard,
  ChatCard,
  NoteEditor,
  SourceViewer,
  ToolsCard,
  TopBar,
} from "@/components";
import { cn } from "@/lib/utils";
import { ExpandIcon } from "@/components/icons";
import { Tabs, Tooltip, IconButton, Spinner } from "@/components/ui";
import { SimpleBackground } from "@/components/backgrounds/SimpleBackground";
import { NotebookErrorState } from "./notebook/NotebookStates";
import { RenameNotebookModal } from "./notebook/RenameNotebookModal";

const MIN_SIDE_PANEL_PX = 280;
const MIN_CENTER_PANEL_PX = 400;

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
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [notesRefreshKey, setNotesRefreshKey] = useState<number>(0);
  const [isSourceExpanded, setIsSourceExpanded] = useState<boolean>(false);
  const [isNoteExpanded, setIsNoteExpanded] = useState<boolean>(false);
  const [leftPanelWidth, setLeftPanelWidth] = useCookie<number>("notebookLeftPanelWidth", 30);
  const [rightPanelWidth, setRightPanelWidth] = useCookie<number>("notebookRightPanelWidth", 30);
  const [isLeftCollapsed, setIsLeftCollapsed] = useCookie<boolean>("notebookLeftCollapsed", false);
  const [isRightCollapsed, setIsRightCollapsed] = useCookie<boolean>(
    "notebookRightCollapsed",
    false,
  );
  const [activeResizer, setActiveResizer] = useState<"left" | "right" | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const mode = useBreakpoint();
  const [compactTab, setCompactTab] = useState<"sources" | "chat" | "notes" | "tools">("chat");
  const handleCompactCollapse = () => setCompactTab("chat");

  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (!notebook?.sources) return;
    const hasPending = notebook.sources.some((s) => s.status === "PENDING");
    if (hasPending) {
      const timer = setTimeout(() => {
        refetchNotebook(true, false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notebook?.sources, refetchNotebook]);

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
    const tempSource: Source = {
      id: sourceId,
      notebookId: notebookId,
      title: "",
      link: "",
      type: "Text",
      status: "READY",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSelectedSource(tempSource);
    setIsLeftCollapsed(false);
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

  const handleNodeSelect = (question: string) => {
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
        const currentRight = isRightCollapsed ? 0 : Math.max(minSidePercent, rightPanelWidth ?? 25);
        const maxAvailable = 100 - minCenterPercent - currentRight;
        const maxLimit = Math.min(50, maxAvailable);
        const newWidth = Math.min(Math.max((x / rect.width) * 100, minSidePercent), maxLimit);
        setLeftPanelWidth(newWidth);
        setIsLeftCollapsed(false);
        if (
          !isRightCollapsed &&
          mode !== "extensive" &&
          currentRight + newWidth > 100 - minCenterPercent
        ) {
          setIsRightCollapsed(true);
        }
      } else if (activeResizer === "right") {
        const rightX = rect.width - x;
        const currentLeft = isLeftCollapsed ? 0 : Math.max(minSidePercent, leftPanelWidth ?? 25);
        const maxAvailable = 100 - minCenterPercent - currentLeft;
        const maxLimit = Math.min(50, maxAvailable);
        const newWidth = Math.min(Math.max((rightX / rect.width) * 100, minSidePercent), maxLimit);
        setRightPanelWidth(newWidth);
        setIsRightCollapsed(false);
        if (
          !isLeftCollapsed &&
          mode !== "extensive" &&
          currentLeft + newWidth > 100 - minCenterPercent
        ) {
          setIsLeftCollapsed(true);
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
  }, [
    activeResizer,
    setLeftPanelWidth,
    setRightPanelWidth,
    setIsLeftCollapsed,
    setIsRightCollapsed,
  ]);

  const expandLeft = () => {
    const containerWidth = sectionRef.current?.getBoundingClientRect().width ?? window.innerWidth;
    const { minSidePercent, minCenterPercent } = getPixelConstraints(containerWidth);

    let desiredLeft = Math.max(minSidePercent, leftPanelWidth ?? 30);
    const currentRight = isRightCollapsed ? 0 : Math.max(minSidePercent, rightPanelWidth ?? 30);

    if (mode === "extensive") {
      if (isRightCollapsed) {
        const maxAvailable = 100 - minCenterPercent;
        setLeftPanelWidth(Math.min(desiredLeft, maxAvailable));
        setIsLeftCollapsed(false);
        return;
      }
      let openLeft = desiredLeft;
      let openRight = currentRight;
      const free = 100 - minCenterPercent;
      if (openLeft + openRight > free) {
        const ratio = free / (openLeft + openRight);
        openLeft = Math.max(minSidePercent, openLeft * ratio);
        openRight = Math.max(minSidePercent, openRight * ratio);
      }
      setLeftPanelWidth(openLeft);
      setRightPanelWidth(openRight);
      setIsLeftCollapsed(false);
      return;
    }

    if (desiredLeft + currentRight + minCenterPercent > 100 && !isRightCollapsed) {
      setIsRightCollapsed(true);
    }
    setLeftPanelWidth(desiredLeft);
    setIsLeftCollapsed(false);
  };

  const expandRight = () => {
    const containerWidth = sectionRef.current?.getBoundingClientRect().width ?? window.innerWidth;
    const { minSidePercent, minCenterPercent } = getPixelConstraints(containerWidth);

    let desiredRight = Math.max(minSidePercent, rightPanelWidth ?? 30);
    const currentLeft = isLeftCollapsed ? 0 : Math.max(minSidePercent, leftPanelWidth ?? 30);

    if (mode === "extensive") {
      if (isLeftCollapsed) {
        const maxAvailable = 100 - minCenterPercent;
        setRightPanelWidth(Math.min(desiredRight, maxAvailable));
        setIsRightCollapsed(false);
        return;
      }
      let openRight = desiredRight;
      let openLeft = currentLeft;
      const free = 100 - minCenterPercent;
      if (openRight + openLeft > free) {
        const ratio = free / (openRight + openLeft);
        openRight = Math.max(minSidePercent, openRight * ratio);
        openLeft = Math.max(minSidePercent, openLeft * ratio);
      }
      setRightPanelWidth(openRight);
      setLeftPanelWidth(openLeft);
      setIsRightCollapsed(false);
      return;
    }

    if (desiredRight + currentLeft + minCenterPercent > 100 && !isLeftCollapsed) {
      setIsLeftCollapsed(true);
    }
    setRightPanelWidth(desiredRight);
    setIsRightCollapsed(false);
  };

  const handleMouseDownLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveResizer("left");
  };

  useEffect(() => {
    if (mode === "standard" && !isLeftCollapsed && !isRightCollapsed) {
      setIsRightCollapsed(true);
    }
  }, [mode, isLeftCollapsed, isRightCollapsed, setIsRightCollapsed]);

  useEffect(() => {
    if (mode === "compact" || !sectionRef.current) return;

    const clampPanelWidths = (containerWidth: number) => {
      const { minSidePercent, minCenterPercent } = getPixelConstraints(containerWidth);

      const left = isLeftCollapsed ? 0 : (leftPanelWidth ?? 30);
      const right = isRightCollapsed ? 0 : (rightPanelWidth ?? 30);

      let clampedLeft = left;
      let clampedRight = right;

      if (left > 0 && left < minSidePercent) {
        clampedLeft = minSidePercent;
      }
      if (right > 0 && right < minSidePercent) {
        clampedRight = minSidePercent;
      }

      const total = clampedLeft + clampedRight + minCenterPercent;
      if (total > 100) {
        if (mode === "extensive") {
          const free = 100 - minCenterPercent;
          if (clampedLeft + clampedRight > free) {
            const ratio = free / (clampedLeft + clampedRight);
            clampedLeft = Math.max(minSidePercent, clampedLeft * ratio);
            clampedRight = Math.max(minSidePercent, clampedRight * ratio);
          }
        } else {
          if (!isRightCollapsed && clampedLeft > 0) {
            setIsRightCollapsed(true);
          }
        }
      }

      if (clampedLeft !== left) setLeftPanelWidth(clampedLeft);
      if (clampedRight !== right) setRightPanelWidth(clampedRight);
    };

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        clampPanelWidths(entry.contentRect.width);
      }
    });

    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [
    mode,
    isLeftCollapsed,
    isRightCollapsed,
    leftPanelWidth,
    rightPanelWidth,
    setLeftPanelWidth,
    setRightPanelWidth,
    setIsRightCollapsed,
  ]);

  const handleDoubleClickLeft = () => {
    const containerWidth = sectionRef.current?.getBoundingClientRect().width ?? window.innerWidth;
    const { minSidePercent, minCenterPercent } = getPixelConstraints(containerWidth);

    if (!isRightCollapsed) {
      setLeftPanelWidth(minSidePercent);
    } else {
      const currentRight = isRightCollapsed ? 0 : Math.max(minSidePercent, rightPanelWidth ?? 30);
      const maxAvailable = 100 - minCenterPercent - currentRight;
      const maxLimit = Math.min(50, maxAvailable);
      setLeftPanelWidth(maxLimit);
    }
    setIsLeftCollapsed(false);
  };

  const handleMouseDownRight = (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveResizer("right");
  };

  const handleDoubleClickRight = () => {
    const containerWidth = sectionRef.current?.getBoundingClientRect().width ?? window.innerWidth;
    const { minSidePercent, minCenterPercent } = getPixelConstraints(containerWidth);

    if (!isLeftCollapsed) {
      setRightPanelWidth(minSidePercent);
    } else {
      const currentLeft = isLeftCollapsed ? 0 : Math.max(minSidePercent, leftPanelWidth ?? 30);
      const maxAvailable = 100 - minCenterPercent - currentLeft;
      const maxLimit = Math.min(50, maxAvailable);
      setRightPanelWidth(maxLimit);
    }
    setIsRightCollapsed(false);
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
              <span className="text-gray-400">Error loading notebook</span>
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

  const renderSourcesTabContent = (onToggleCollapse: () => void) => (
    <div className="relative h-full w-full">
      <AnimatePresence>
        {selectedSource ? (
          <motion.div
            key={selectedSource.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="absolute inset-0 z-10 h-[96%] self-end"
          >
            <SourceViewer
              notebookId={notebookId}
              source={selectedSource}
              handleCloseSource={() => setSelectedSource(null)}
              onSourceDelete={() => {
                setSelectedSource(null);
                refetchNotebook(true, false);
              }}
              onExpandedChange={setIsSourceExpanded}
              className="h-full"
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
      <div
        className={cn("h-full transition-[opacity,transform] duration-200", {
          "opacity-50 scale-[0.98]": selectedSource,
          "opacity-100 scale-100": !selectedSource,
        })}
      >
        <SourcesCard
          notebookId={notebookId}
          sources={notebook?.sources || []}
          isLoading={loading}
          onSourceSelect={(source: Source) => setSelectedSource(source)}
          selectedSourceIds={selectedSourceIds}
          onToggleSource={handleToggleSource}
          onSelectAll={handleSelectAllSources}
          onClearSelection={handleClearSourceSelection}
          onSourcesChange={() => {
            refetchNotebook(true, false);
          }}
          onToggleCollapse={onToggleCollapse}
        />
      </div>
    </div>
  );

  const sourcesTabContent = renderSourcesTabContent(() => setIsLeftCollapsed(true));
  const sourcesTabContentWithCollapse = (onToggleCollapse: () => void) =>
    renderSourcesTabContent(onToggleCollapse);

  const notesTabContent = (
    <div className="relative h-full w-full">
      <AnimatePresence>
        {selectedNote ? (
          <motion.div
            key={selectedNote.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="absolute inset-0 z-10 h-[96%] self-end"
          >
            <NoteEditor
              note={selectedNote}
              className="h-full"
              handleCloseNote={() => setSelectedNote(null)}
              onNoteDeleted={() => {
                setSelectedNote(null);
                setNotesRefreshKey((prev) => prev + 1);
              }}
              onExpandedChange={setIsNoteExpanded}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
      <div
        className={cn("h-full transition-[opacity,transform] duration-200", {
          "opacity-50 scale-[0.98]": selectedNote,
          "opacity-100 scale-100": !selectedNote,
        })}
      >
        <NotesCard
          notebookId={notebookId}
          onNoteSelect={(note: Note) => setSelectedNote(note)}
          refreshTrigger={notesRefreshKey}
        />
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
                "w-full truncate bg-transparent p-0 text-lg font-semibold transition-colors duration-200 focus:outline-none focus:ring-0 border-none",
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
              placeholder="Enter notebook title"
            />
          </div>
        }
      />

      <div className="flex-1 overflow-hidden p-3 md:p-4">
        <SimpleBackground />
        {mode === "compact" ? (
          <section className="flex h-full flex-col gap-2 overflow-hidden">
            <div className="no-scrollbar flex w-full shrink-0 overflow-x-auto rounded-xs border border-gray-200 bg-white p-1 dark:border-gray-600 dark:bg-gray-900">
              {(
                [
                  { id: "sources", label: "Sources" },
                  { id: "chat", label: "Chat" },
                  { id: "notes", label: "Notes" },
                  { id: "tools", label: "Tools" },
                ] as const
              ).map((tab) => (
                <div key={tab.id} className="group relative min-w-max flex-1">
                  {compactTab === tab.id && (
                    <div className="absolute inset-0 rounded-xs border border-gray-200/50 bg-white transition-all duration-150 ease-out dark:border-gray-600/50 dark:bg-gray-800" />
                  )}
                  {compactTab !== tab.id && (
                    <div className="absolute inset-0 rounded-xs bg-gray-100/40 opacity-0 transition-opacity duration-150 group-hover:opacity-100 dark:bg-gray-700/40" />
                  )}
                  <button
                    onClick={() => setCompactTab(tab.id)}
                    type="button"
                    className="relative w-full cursor-pointer rounded-xs px-6 py-1.5 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-gray-600 dark:focus-visible:ring-offset-gray-900"
                  >
                    <span
                      className={cn("text-sm transition-all duration-150", {
                        "font-semibold text-gray-800 dark:text-gray-100": compactTab === tab.id,
                        "font-medium text-gray-600 group-hover:text-gray-800 dark:text-gray-400 dark:group-hover:text-gray-200":
                          compactTab !== tab.id,
                      })}
                    >
                      {tab.label}
                    </span>
                  </button>
                </div>
              ))}
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden">
              <div className={cn("absolute inset-0 h-full", { hidden: compactTab !== "sources" })}>
                {sourcesTabContentWithCollapse(handleCompactCollapse)}
              </div>
              <div className={cn("absolute inset-0 h-full", { hidden: compactTab !== "chat" })}>
                <ChatCard
                  notebookId={notebookId}
                  sources={notebook?.sources || []}
                  selectedSourceIds={selectedSourceIds}
                  onSourceSelect={handleSourceSelectFromChat}
                  externalQuestion={chatQuestion}
                  onExternalQuestionHandled={() => setChatQuestion(null)}
                />
              </div>
              <div className={cn("absolute inset-0 h-full", { hidden: compactTab !== "notes" })}>
                {notesTabContent}
              </div>
              <div className={cn("absolute inset-0 h-full", { hidden: compactTab !== "tools" })}>
                <ToolsCard
                  notebookId={notebookId}
                  onNodeSelect={handleNodeSelect}
                  hasSources={(notebook?.sources?.length ?? 0) > 0}
                />
              </div>
            </div>
          </section>
        ) : (
          <section ref={sectionRef} className="flex h-full gap-1 overflow-hidden">
            <div
              className={cn(
                "min-h-0 flex flex-col overflow-hidden transition-[width,background-color,border-color] duration-200 ease-out shrink-0",
                {
                  "z-30": isSourceExpanded,
                },
              )}
              style={{ width: isLeftCollapsed ? "48px" : `${leftPanelWidth ?? 25}%` }}
            >
              {isLeftCollapsed && (
                <div className="flex h-full w-full flex-col items-center py-3">
                  <Tooltip text="Expand Sources" position="right">
                    <IconButton
                      icon={<ExpandIcon />}
                      onClick={expandLeft}
                      variant="secondary"
                      size="sm"
                      aria-label="Expand Sources"
                    />
                  </Tooltip>
                  <div
                    className="mt-4 flex-1 text-xs font-medium tracking-widest text-gray-400 uppercase select-none [writing-mode:vertical-rl]"
                    style={{ transform: "rotate(180deg)" }}
                  >
                    Sources
                  </div>
                </div>
              )}

              <div className={cn("h-full w-full", { hidden: isLeftCollapsed })}>
                {sourcesTabContent}
              </div>
            </div>

            {/* Left Resizer */}
            {!isLeftCollapsed && (
              <div
                className="group z-5 flex w-2 cursor-col-resize items-center justify-center"
                onMouseDown={handleMouseDownLeft}
                onDoubleClick={handleDoubleClickLeft}
                title="Double click to toggle"
              >
                <div
                  className={cn("w-px h-1/12 rounded-xs transition-all duration-150", {
                    "bg-blue-500 dark:bg-blue-400": activeResizer === "left",
                    "bg-gray-300/60 dark:bg-gray-600 group-hover:bg-blue-400 dark:group-hover:bg-blue-500":
                      activeResizer !== "left",
                  })}
                />
              </div>
            )}

            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <ChatCard
                notebookId={notebookId}
                sources={notebook?.sources || []}
                selectedSourceIds={selectedSourceIds}
                onSourceSelect={handleSourceSelectFromChat}
                externalQuestion={chatQuestion}
                onExternalQuestionHandled={() => setChatQuestion(null)}
              />
            </div>

            {/* Right Resizer */}
            {!isRightCollapsed && (
              <div
                className="group z-5 flex w-2 cursor-col-resize items-center justify-center"
                onMouseDown={handleMouseDownRight}
                onDoubleClick={handleDoubleClickRight}
                title="Double click to toggle"
              >
                <div
                  className={cn("w-px h-1/12 rounded-xs transition-all duration-150", {
                    "bg-blue-500 dark:bg-blue-400": activeResizer === "right",
                    "bg-gray-300/60 dark:bg-gray-600 group-hover:bg-blue-400 dark:group-hover:bg-blue-500":
                      activeResizer !== "right",
                  })}
                />
              </div>
            )}

            <div
              className={cn(
                "min-h-0 flex flex-col overflow-hidden transition-[width,background-color,border-color] duration-200 ease-out shrink-0",
                {
                  "z-30": isNoteExpanded,
                },
              )}
              style={{ width: isRightCollapsed ? "48px" : `${rightPanelWidth ?? 25}%` }}
            >
              {isRightCollapsed && (
                <div className="flex h-full w-full flex-col items-center py-3">
                  <Tooltip text="Expand Notes & Tools" position="left">
                    <IconButton
                      icon={<ExpandIcon />}
                      onClick={expandRight}
                      variant="secondary"
                      size="sm"
                      aria-label="Expand Notes & Tools"
                    />
                  </Tooltip>
                  <div className="mt-4 flex-1 text-xs font-medium tracking-widest text-gray-400 uppercase select-none [writing-mode:vertical-rl]">
                    Notes & Tools
                  </div>
                </div>
              )}

              <div className={cn("h-full w-full", { hidden: isRightCollapsed })}>
                <Tabs
                  className="h-full"
                  onToggleCollapse={() => setIsRightCollapsed(true)}
                  items={[
                    {
                      id: "notes",
                      label: "Notes",
                      content: notesTabContent,
                    },
                    {
                      id: "tools",
                      label: "Tools",
                      content: (
                        <ToolsCard
                          notebookId={notebookId}
                          onNodeSelect={handleNodeSelect}
                          hasSources={(notebook?.sources?.length ?? 0) > 0}
                        />
                      ),
                    },
                  ]}
                  defaultActiveTab="notes"
                />
              </div>
            </div>
          </section>
        )}
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
