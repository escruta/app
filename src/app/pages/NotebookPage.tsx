import { useEffect, useState, useRef } from "react";
import { useLoaderData } from "react-router";
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
  const [chatQuestion, setChatQuestion] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [notesRefreshKey, setNotesRefreshKey] = useState<number>(0);
  const [leftPanelWidth, setLeftPanelWidth] = useCookie<number>("notebookLeftPanelWidth", 50);
  const [isResizing, setIsResizing] = useState<boolean>(false);
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
      if (!isResizing || !sectionRef.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;

      const newWidth = Math.min(Math.max((x / rect.width) * 100, 36), 64);
      setLeftPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.classList.remove("resizing");
    };

    if (isResizing) {
      document.body.classList.add("resizing");
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.classList.remove("resizing");
    };
  }, [isResizing, setLeftPanelWidth]);

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

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleDoubleClick = () => {
    setLeftPanelWidth(50);
  };

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
        className={cn("h-full transition-all duration-200", {
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
              notebookId={notebookId}
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
        className={cn("h-full transition-all duration-200", {
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
              className={cn("min-h-0 flex flex-col overflow-hidden", {
                "transition-all duration-200 ease-out": !isResizing,
              })}
              style={{ width: `${leftPanelWidth ?? 50}%` }}
            >
              <Tabs
                ref={tabsRef}
                className="h-full"
                items={[
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
                defaultActiveTab="1"
              />
            </div>

            {/* Resizer */}
            <div
              className="group z-5 flex w-2 cursor-col-resize items-center justify-center"
              onMouseDown={handleMouseDown}
              onDoubleClick={handleDoubleClick}
            >
              <div
                className={cn("w-px h-1/12 rounded-xs transition-all duration-150", {
                  "bg-blue-500 dark:bg-blue-400": isResizing,
                  "bg-gray-300/60 dark:bg-gray-600 group-hover:bg-blue-400 dark:group-hover:bg-blue-500":
                    !isResizing,
                })}
              />
            </div>

            <div
              className={cn("min-h-0 flex flex-col overflow-hidden", {
                "transition-all duration-200 ease-out": !isResizing,
              })}
              style={{ width: `${100 - (leftPanelWidth ?? 50)}%` }}
            >
              <ChatCard
                notebookId={notebookId}
                sources={notebook?.sources || []}
                selectedSourceIds={selectedSourceIds}
                onSourceSelect={handleSourceSelectFromChat}
                externalQuestion={chatQuestion}
                onExternalQuestionHandled={() => setChatQuestion(null)}
              />
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
