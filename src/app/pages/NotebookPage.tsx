import { useEffect, useState, useRef } from "react";
import { useLoaderData, useLocation } from "react-router";
import { useFetch, useCookie, useIsMobile, useIsTablet } from "@/hooks";
import type { Note, Source, Notebook, NotebookContent } from "@/interfaces";
import { Tabs, type TabsRef } from "@/components/ui";
import { motion, AnimatePresence } from "motion/react";
import {
  SourcesCard,
  NotesCard,
  ChatCard,
  NoteEditor,
  SourceViewer,
  ToolsCard,
  SEOMetadata,
} from "@/components";
import { generateNotebookMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { ExpandIcon } from "@/components/icons";
import { Tooltip, IconButton } from "@/components/ui";
import { SimpleBackground } from "@/components/backgrounds/SimpleBackground";
import { NotebookErrorState, NotebookLoadingState } from "./notebook/NotebookStates";
import { RenameNotebookModal } from "./notebook/RenameNotebookModal";
import { NotebookHeader } from "./notebook/NotebookHeader";

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
  const location = useLocation();
  const [chatQuestion, setChatQuestion] = useState<string | null>(location.state?.question || null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [notesRefreshKey, setNotesRefreshKey] = useState<number>(0);
  const [leftPanelWidth, setLeftPanelWidth] = useCookie<number>("notebookLeftPanelWidth", 30);
  const [rightPanelWidth, setRightPanelWidth] = useCookie<number>("notebookRightPanelWidth", 30);
  const [isLeftCollapsed, setIsLeftCollapsed] = useCookie<boolean>("notebookLeftCollapsed", false);
  const [isRightCollapsed, setIsRightCollapsed] = useCookie<boolean>(
    "notebookRightCollapsed",
    false,
  );
  const [activeResizer, setActiveResizer] = useState<"left" | "right" | null>(null);
  const tabsRef = useRef<TabsRef>(null);
  const sectionRef = useRef<HTMLElement>(null);

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

  useEffect(() => {
    if (notebook?.sources) {
      if (initialLoadRef.current) {
        setSelectedSourceIds(notebook.sources.map((s) => s.id));
        initialLoadRef.current = false;
      } else {
        setSelectedSourceIds((prev) => {
          const newIds = notebook.sources.map((s) => s.id);
          const addedIds = newIds.filter((id) => !prev.includes(id));
          if (addedIds.length > 0) {
            return [...prev, ...addedIds];
          }
          const validIds = prev.filter((id) => newIds.includes(id));
          if (validIds.length !== prev.length) {
            return validIds;
          }
          return prev;
        });
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
    tabsRef.current?.setActiveTab("1");
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
    if (isMobile) {
      tabsRef.current?.setActiveTab("chat");
    }
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
      const minCenterWidth = 30;

      if (activeResizer === "left") {
        const currentRight = isRightCollapsed ? 0 : (rightPanelWidth ?? 25);
        const maxAvailable = 100 - minCenterWidth - currentRight;
        const maxLimit = Math.min(50, maxAvailable);
        const newWidth = Math.min(Math.max((x / rect.width) * 100, 30), maxLimit);
        setLeftPanelWidth(newWidth);
        setIsLeftCollapsed(false);
      } else if (activeResizer === "right") {
        const rightX = rect.width - x;
        const currentLeft = isLeftCollapsed ? 0 : (leftPanelWidth ?? 25);
        const maxAvailable = 100 - minCenterWidth - currentLeft;
        const maxLimit = Math.min(50, maxAvailable);
        const newWidth = Math.min(Math.max((rightX / rect.width) * 100, 30), maxLimit);
        setRightPanelWidth(newWidth);
        setIsRightCollapsed(false);
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
    let desiredLeft = Math.max(30, leftPanelWidth ?? 30);
    const currentRight = isRightCollapsed ? 0 : Math.max(30, rightPanelWidth ?? 30);

    if (desiredLeft + currentRight + 30 > 100) {
      const availableForRight = 100 - 30 - desiredLeft;
      if (availableForRight < 30 && !isRightCollapsed) {
        setRightPanelWidth(30);
        desiredLeft = 40;
      } else if (!isRightCollapsed) {
        setRightPanelWidth(availableForRight);
      }
    }
    setLeftPanelWidth(desiredLeft);
    setIsLeftCollapsed(false);
  };

  const expandRight = () => {
    let desiredRight = Math.max(30, rightPanelWidth ?? 30);
    const currentLeft = isLeftCollapsed ? 0 : Math.max(30, leftPanelWidth ?? 30);

    if (desiredRight + currentLeft + 30 > 100) {
      const availableForLeft = 100 - 30 - desiredRight;
      if (availableForLeft < 30 && !isLeftCollapsed) {
        setLeftPanelWidth(30);
        desiredRight = 40;
      } else if (!isLeftCollapsed) {
        setLeftPanelWidth(availableForLeft);
      }
    }
    setRightPanelWidth(desiredRight);
    setIsRightCollapsed(false);
  };

  const handleMouseDownLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveResizer("left");
  };

  const handleDoubleClickLeft = () => {
    const currentRight = isRightCollapsed ? 0 : Math.max(30, rightPanelWidth ?? 30);
    const maxAvailable = 100 - 30 - currentRight;
    const maxLimit = Math.min(50, maxAvailable);
    setLeftPanelWidth(maxLimit);
    setIsLeftCollapsed(false);
  };

  const handleMouseDownRight = (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveResizer("right");
  };

  const handleDoubleClickRight = () => {
    const currentLeft = isLeftCollapsed ? 0 : Math.max(30, leftPanelWidth ?? 30);
    const maxAvailable = 100 - 30 - currentLeft;
    const maxLimit = Math.min(50, maxAvailable);
    setRightPanelWidth(maxLimit);
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

  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

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
    return <NotebookErrorState error={error} />;
  }

  if (loading) {
    return <NotebookLoadingState />;
  }

  const metadata = notebook ? generateNotebookMetadata(notebook.title, notebookId) : null;

  const sourcesTabContent = (
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
          onToggleCollapse={() => setIsLeftCollapsed(true)}
        />
      </div>
    </div>
  );

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
      {metadata && (
        <SEOMetadata
          title={metadata.title}
          description={metadata.description}
          url={metadata.url}
          image={metadata.image}
          twitterCard={metadata.twitterCard}
        />
      )}
      <NotebookHeader
        title={notebook?.title}
        isTablet={isTablet}
        onRenameClick={() => setIsRenameModalOpen(true)}
        onShareClick={() => {}}
      />

      <div className="flex-1 overflow-hidden p-3 md:p-4">
        <SimpleBackground />
        {isMobile ? (
          <Tabs
            ref={tabsRef}
            className="h-full"
            defaultActiveTab="chat"
            items={[
              {
                id: "chat",
                label: "Chat",
                content: (
                  <ChatCard
                    notebookId={notebookId}
                    sources={notebook?.sources || []}
                    selectedSourceIds={selectedSourceIds}
                    onSourceSelect={handleSourceSelectFromChat}
                    externalQuestion={chatQuestion}
                    onExternalQuestionHandled={() => setChatQuestion(null)}
                  />
                ),
              },
              {
                id: "1",
                label: "Sources",
                content: sourcesTabContent,
              },
              {
                id: "2",
                label: "Notes",
                content: notesTabContent,
              },
              {
                id: "3",
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
          />
        ) : (
          <section ref={sectionRef} className="flex h-full gap-1 overflow-hidden">
            <div
              className={cn(
                "min-h-0 flex flex-col overflow-hidden transition-[width,background-color,border-color] duration-200 ease-out shrink-0",
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
