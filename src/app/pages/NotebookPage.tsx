import { useEffect, useState, useRef } from "react";
import { useLoaderData } from "react-router";
import { useFetch, useCookie, useIsMobile, useIsTablet } from "@/hooks";
import type { Note, Source, Notebook, NotebookContent } from "@/interfaces";
import { EditIcon, NotebookIcon, FireIcon, ShareIcon, DotsVerticalIcon } from "@/components/icons";
import {
  Tooltip,
  IconButton,
  Tabs,
  type TabsRef,
  TextField,
  Button,
  Modal,
  Spinner,
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  Divider,
} from "@/components/ui";
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
  const [sourcesRefreshKey, setSourcesRefreshKey] = useState<number>(0);
  const [leftPanelWidth, setLeftPanelWidth] = useCookie<number>("notebookLeftPanelWidth", 50);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const tabsRef = useRef<TabsRef>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (notebook?.sources) {
      setSelectedSourceIds(notebook.sources.map((s) => s.id));
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
    if (error.status === 404) {
      return (
        <div className="flex h-screen w-full flex-col justify-center">
          <div className="border-y border-gray-200 bg-gray-50 px-6 py-5 dark:border-gray-700 dark:bg-gray-950">
            <motion.div
              className="flex items-center justify-center py-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xs bg-gray-100 dark:bg-gray-800">
                  <div className="h-8 w-8 text-gray-400 dark:text-gray-600">
                    <NotebookIcon />
                  </div>
                </div>
                <h1 className="mb-2 text-xl font-medium text-gray-700 dark:text-gray-300">
                  Notebook not found
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  The notebook you're looking for doesn't exist or has been deleted.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      );
    }

    if (error.status === 401) {
      return (
        <div className="flex h-screen w-full flex-col justify-center">
          <div className="border-y border-gray-200 bg-gray-50 px-6 py-5 dark:border-gray-700 dark:bg-gray-950">
            <motion.div
              className="flex items-center justify-center py-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xs bg-yellow-50 dark:bg-yellow-950">
                  <div className="h-8 w-8 text-yellow-500">
                    <NotebookIcon />
                  </div>
                </div>
                <h1 className="mb-2 text-xl font-medium text-yellow-600 dark:text-yellow-400">
                  Access denied
                </h1>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  You do not have permission to access this notebook.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-screen w-full flex-col justify-center">
        <div className="border-y border-gray-200 bg-gray-50 px-6 py-5 dark:border-gray-700 dark:bg-gray-950">
          <motion.div
            className="flex items-center justify-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="max-w-md text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xs bg-red-50 dark:bg-red-950">
                <div className="h-8 w-8 text-red-500">
                  <FireIcon />
                </div>
              </div>
              <h1 className="mb-2 text-lg font-medium text-red-600 dark:text-red-400">
                Error loading notebook
              </h1>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {error.message}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col justify-center">
        <div className="border-y border-gray-200 bg-gray-50 px-6 py-5 dark:border-gray-700 dark:bg-gray-950">
          <div className="flex items-center justify-center py-12">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="mb-4 inline-block h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
              <p className="font-medium text-gray-600 dark:text-gray-400">Loading notebook...</p>
            </motion.div>
          </div>
        </div>
      </div>
    );
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
                setSourcesRefreshKey((prev) => prev + 1);
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
          onSourceSelect={(source: Source) => setSelectedSource(source)}
          selectedSourceIds={selectedSourceIds}
          onToggleSource={handleToggleSource}
          onSelectAll={handleSelectAllSources}
          onClearSelection={handleClearSourceSelection}
          refreshTrigger={sourcesRefreshKey}
          onSourceCreated={() => {
            refetchNotebook(true, false);
          }}
          onSourceAdded={() => {
            refetchNotebook(true, false);
            setSourcesRefreshKey((prev) => prev + 1);
          }}
          onSourceDeleted={() => {
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
      <div className="z-10 border-b border-gray-200 bg-white px-4 py-4 md:px-6 dark:border-gray-700 dark:bg-black">
        <div className="flex items-center justify-between gap-2">
          <h1 className="flex min-w-0 flex-1 items-baseline gap-1.5 text-gray-900 select-text dark:text-white">
            <span className="hidden shrink-0 text-xs font-medium tracking-wide text-gray-500 uppercase md:block dark:text-gray-400">
              Notebook /{" "}
            </span>
            <span className="truncate text-2xl font-bold">{notebook?.title}</span>
          </h1>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex gap-3"
          >
            {isTablet ? (
              <Menu>
                <MenuTrigger>
                  <IconButton
                    icon={<DotsVerticalIcon />}
                    variant="ghost"
                    size="sm"
                    className="shrink-0 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  />
                </MenuTrigger>
                <MenuContent align="right">
                  <MenuItem
                    label="Edit title"
                    icon={<EditIcon />}
                    onClick={() => setIsRenameModalOpen(true)}
                  />
                  <Divider />
                  <MenuItem label="Share notebook" icon={<ShareIcon />} onClick={() => {}} />
                </MenuContent>
              </Menu>
            ) : (
              <>
                <Button onClick={() => {}} size="sm" icon={<ShareIcon />}>
                  Share notebook
                </Button>
                <Tooltip text="Edit title" position="left">
                  <IconButton
                    icon={<EditIcon />}
                    variant="ghost"
                    size="sm"
                    className="shrink-0 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setIsRenameModalOpen(true)}
                  />
                </Tooltip>
              </>
            )}
          </motion.div>
        </div>
      </div>

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
                    sourcesCount={notebook?.sources.length ?? 0}
                    readySourcesCount={
                      notebook?.sources.filter((s) => s.status === "READY").length ?? 0
                    }
                    selectedSourceIds={selectedSourceIds}
                    refreshTrigger={sourcesRefreshKey}
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
                sourcesCount={notebook?.sources.length ?? 0}
                readySourcesCount={
                  notebook?.sources.filter((s) => s.status === "READY").length ?? 0
                }
                selectedSourceIds={selectedSourceIds}
                refreshTrigger={sourcesRefreshKey}
                onSourceSelect={handleSourceSelectFromChat}
                externalQuestion={chatQuestion}
                onExternalQuestionHandled={() => setChatQuestion(null)}
              />
            </div>
          </section>
        )}
      </div>

      {/* Rename Modal */}
      <Modal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        title="Rename notebook"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsRenameModalOpen(false)}
              disabled={renamingNotebook}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRenameNotebook}
              disabled={!newTitle.trim() || renamingNotebook}
              icon={renamingNotebook ? <Spinner /> : <EditIcon />}
            >
              {renamingNotebook ? "Renaming" : "Rename"}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <TextField
            id="notebook-title"
            label="Notebook Title"
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Enter new notebook title"
            autoFocus
          />
          {renameError && (
            <div className="rounded-xs border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-500 dark:border-red-800 dark:bg-red-950">
              Error: {renameError.message}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
