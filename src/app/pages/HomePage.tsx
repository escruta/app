import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth, useCookie, useFetch } from "@/hooks";
import {
  Button,
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuTrigger,
  Modal,
  Spinner,
  TextField,
  Tooltip,
} from "@/components/ui";
import { NotebookCard, NoteCard, SEOMetadata, TopBar, FolderGroup } from "@/components";
import { GaussianBlurGradientBackground } from "@/components/backgrounds/GaussianBlurGradientBackground";
import { getRouteMetadata } from "@/lib/seo";
import {
  AddIcon,
  CheckIcon,
  DotsVerticalIcon,
  FireIcon,
  FolderAddIcon,
  FolderIcon,
  NotebookIcon,
  NoteIcon,
  SearchIcon,
} from "@/components/icons";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { Folder, Note, Notebook } from "@/interfaces";

enum SortOptions {
  Newest = "Newest",
  Oldest = "Oldest",
  Alphabetical = "Alphabetical",
  ReverseAlphabetical = "Reverse Alphabetical",
}

type ViewMode = "grid" | "list";

const GREETINGS = [
  "Welcome",
  "Good to see you",
  "Glad you're here",
  "Hello",
  "Hey there",
  "Hi",
  "Great to have you back",
  "Nice to see you again",
  "Howdy",
  "Greetings",
  "Salutations",
  "Ahoy",
  "What's up",
  "Yo",
  "Hiya",
  "Good day",
  "Pleased to meet your acquaintance",
  "Look who's back",
  "Long time no see",
  "Welcome aboard",
  "Welcome back",
  "Good morning",
  "Good afternoon",
  "Good evening",
  "Bonjour",
  "Hola",
  "Ciao",
  "Aloha",
  "Cheers",
  "How goes it",
  "Top of the morning",
  "Lovely to see you",
  "Delighted to have you",
  "Fantastic to see you",
  "Wonderful to have you here",
  "Thrilled you stopped by",
  "Always a pleasure",
  "The legend returns",
  "Back in action",
  "You made it",
  "There you are",
  "Fancy seeing you here",
  "Well, well, well",
  "Welcome to the hub",
  "Let's get to work",
  "Ready for another great day",
  "Hope you're doing well",
  "It's a beautiful day",
  "Make yourself at home",
  "Step right in",
];

const SUBTITLES = [
  "What would you like to work on today?",
  "Ready to tackle something new?",
  "What's on your mind today?",
  "How can we make progress today?",
  "Pick up where you left off?",
  "What shall we dive into?",
  "What's the plan for today?",
  "Ready to create something great?",
  "Where shall we begin?",
  "What are we building today?",
  "Let's get something done today.",
  "Time to make things happen.",
  "What's your focus for today?",
  "Ready to dive back in?",
  "What deserves your attention?",
  "Let's make today productive.",
  "Something new or something familiar?",
  "Where to next?",
  "What sparks your interest today?",
  "Shall we pick up where we left off?",
  "Your next breakthrough awaits.",
  "What's the priority for today?",
  "Time to turn ideas into reality.",
  "What challenge are we tackling?",
  "Let's pick a project and run with it.",
  "What's calling your name today?",
  "The day is yours — where to first?",
  "Ready for a productive session?",
  "What do you feel like working on?",
  "What story are we writing today?",
  "Let's get those gears turning.",
  "What's the first thing on your list?",
  "Where shall we make progress?",
  "Something big or something quick?",
  "What's the mission for today?",
  "Ready to check things off the list?",
  "What would make today a win?",
  "Your dashboard awaits, captain.",
  "Let's make some magic happen.",
  "Time to roll up the sleeves.",
  "What are we conquering today?",
  "What's inspiring you today?",
  "Let's turn plans into progress.",
  "What shall we explore?",
  "What's the next move?",
  "Your workspace is ready — dive in.",
  "What are you in the mood for?",
  "Let's get the ball rolling.",
  "What's the first order of business?",
  "Pick your adventure for today.",
];

function getSortedItems<T extends { createdAt: Date | string; title: string }>(
  items: T[],
  sortBy: SortOptions,
): T[] {
  const sorted = [...items];
  switch (sortBy) {
    case SortOptions.Newest:
      return sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    case SortOptions.Oldest:
      return sorted.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    case SortOptions.Alphabetical:
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case SortOptions.ReverseAlphabetical:
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    default:
      return sorted;
  }
}

export default function HomePage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const metadata = getRouteMetadata("/");

  const greeting = useMemo(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)], []);
  const subtitle = useMemo(() => SUBTITLES[Math.floor(Math.random() * SUBTITLES.length)], []);

  const {
    data: notebooks,
    loading: notebooksLoading,
    error: notebooksError,
    refetch: refetchNotebooks,
  } = useFetch<Notebook[]>("/notebooks");
  const {
    data: notes,
    loading: notesLoading,
    error: notesError,
    refetch: refetchNotes,
  } = useFetch<Note[]>("/notes");
  const { data: folders, refetch: refetchFolders } = useFetch<Folder[]>("/folders");

  const [notebookSort, setNotebookSort] = useCookie<SortOptions>(
    "notebookSortPreference",
    SortOptions.Newest,
  );
  const [globalViewMode] = useCookie<ViewMode>("globalViewMode", "grid");
  const [noteSort, setNoteSort] = useCookie<SortOptions>("noteSortPreference", SortOptions.Newest);

  const [isCreateNotebookOpen, setIsCreateNotebookOpen] = useState(false);
  const [newNotebookTitle, setNewNotebookTitle] = useState("");

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderTitle, setFolderTitle] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  function toggleFolderCollapse(folderId: string) {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }

  const {
    loading: creatingNotebook,
    error: createNotebookError,
    refetch: createNotebook,
  } = useFetch<Notebook>(
    "/notebooks",
    {
      method: "POST",
      data: { title: newNotebookTitle },
      onSuccess: (notebook) => {
        useFetch.clearCache("/notebooks");
        navigate(`/notebook/${notebook.id}`);
      },
      onError: (error) => {
        console.error("Error creating notebook:", error.message);
      },
    },
    false,
  );

  const { loading: addingNote, refetch: createNote } = useFetch<Note>(
    "/notes",
    {
      method: "POST",
      data: { title: "New note" },
      onSuccess: (newNote) => {
        useFetch.clearCache();
        navigate(`/note/${newNote.id}`);
      },
    },
    false,
  );

  const { loading: creatingFolder, refetch: createFolder } = useFetch<Folder>(
    "/folders",
    {
      method: "POST",
      data: { title: folderTitle },
      onSuccess: () => {
        useFetch.clearCache();
        refetchFolders(true, false);
        setIsFolderModalOpen(false);
        setFolderTitle("");
      },
    },
    false,
  );

  const { loading: updatingFolder, refetch: updateFolder } = useFetch<Folder>(
    `/folders/${editingFolderId}`,
    {
      method: "PATCH",
      data: { title: folderTitle },
      onSuccess: () => {
        useFetch.clearCache();
        refetchFolders(true, false);
        setIsFolderModalOpen(false);
        setFolderTitle("");
        setEditingFolderId(null);
      },
    },
    false,
  );

  const { loading: deletingFolder, refetch: executeDeleteFolder } = useFetch(
    `/folders/${folderToDelete?.id}`,
    {
      method: "DELETE",
      onSuccess: () => {
        useFetch.clearCache();
        refetchFolders(true, false);
        refetchNotes(true, false);
        refetchNotebooks(true, false);
        setFolderToDelete(null);
      },
    },
    false,
  );

  const viewMode = globalViewMode || "grid";

  const folderItems = (folders ?? []).map((folder) => {
    const folderNotebooks = (notebooks ?? []).filter((nb) => nb.folderId === folder.id);
    const folderNotes = (notes ?? []).filter((n) => n.folderId === folder.id);
    return {
      folder,
      notebooks: folderNotebooks,
      notes: folderNotes,
      total: folderNotebooks.length + folderNotes.length,
    };
  });

  type FolderEntry = {
    folder: Folder;
    count: number;
    items: (
      | { kind: "notebook"; id: string; createdAt: Date | string; item: Notebook }
      | { kind: "note"; id: string; createdAt: Date | string; item: Note }
    )[];
  };
  const folderEntries: FolderEntry[] = folderItems.map(({ folder, notebooks: nb, notes: nn }) => {
    const items: FolderEntry["items"] = [
      ...nb.map((n) => ({ kind: "notebook" as const, id: n.id, createdAt: n.createdAt, item: n })),
      ...nn.map((n) => ({ kind: "note" as const, id: n.id, createdAt: n.createdAt, item: n })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return { folder, count: items.length, items };
  });

  const unfiledNotebooks = (notebooks ?? []).filter((nb) => !nb.folderId);
  const unfiledNotes = (notes ?? []).filter((n) => !n.folderId);

  const sortedUnfiledNotebooks = getSortedItems(
    unfiledNotebooks,
    notebookSort || SortOptions.Newest,
  );
  const sortedUnfiledNotes = getSortedItems(unfiledNotes, noteSort || SortOptions.Newest);

  const handleSaveFolder = () => {
    if (editingFolderId) {
      updateFolder();
    } else {
      createFolder();
    }
  };

  const handleCreateFolder = () => {
    setEditingFolderId(null);
    setFolderTitle("");
    setIsFolderModalOpen(true);
  };

  const handleEditFolder = (folder: Folder) => {
    setEditingFolderId(folder.id);
    setFolderTitle(folder.title);
    setIsFolderModalOpen(true);
  };

  const handleCloseFolderModal = () => {
    setIsFolderModalOpen(false);
    setEditingFolderId(null);
    setFolderTitle("");
  };

  const hasNoteContent = !!unfiledNotes.length;
  const hasNotebookContent = !!unfiledNotebooks.length;
  const hasFolders = !!folders?.length;

  const renderOptionsMenu = (
    sortBy: SortOptions | undefined,
    setSortBy: (sort: SortOptions) => void,
    ariaLabel: string,
  ) => {
    const currentSort = sortBy || SortOptions.Newest;
    return (
      <Menu>
        <Tooltip text="More options" position="top">
          <MenuTrigger>
            <IconButton
              icon={<DotsVerticalIcon className="size-4" />}
              variant="ghost"
              size="sm"
              ariaLabel={ariaLabel}
            />
          </MenuTrigger>
        </Tooltip>
        <MenuContent align="right" className="min-w-48">
          <div className="flex flex-col gap-0.5 p-0.5">
            <MenuLabel>Sort by</MenuLabel>
            {Object.values(SortOptions).map((option) => (
              <MenuItem
                key={option}
                label={option}
                onClick={() => setSortBy(option as SortOptions)}
                icon={
                  currentSort === option ? (
                    <CheckIcon className="size-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <div className="size-4" />
                  )
                }
                className={cn(
                  currentSort === option &&
                    "bg-blue-50 text-blue-700 dark:bg-gray-800 dark:text-blue-400",
                )}
              />
            ))}
          </div>
        </MenuContent>
      </Menu>
    );
  };

  return (
    <div className="flex h-screen max-h-full w-full flex-col">
      <SEOMetadata
        title={metadata?.title || "Home"}
        description={metadata?.description || "Dashboard"}
        url={metadata?.url || "/"}
        image={metadata?.image}
        twitterCard={metadata?.twitterCard}
      />
      <TopBar />
      <div className="relative overflow-auto">
        <GaussianBlurGradientBackground />

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
              {greeting}, {currentUser?.name?.split(" ")[0] || "User"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>
          </motion.div>

          {/* Folders section */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <h3 className="mb-3 flex items-center justify-between gap-2 text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              <span className="flex items-center gap-1.5">
                <FolderIcon className="size-3.5 text-blue-500 dark:text-blue-400" />
                Folders
              </span>
              <div className="flex items-center gap-1">
                <Tooltip text="New folder" position="top">
                  <IconButton
                    icon={<FolderAddIcon className="size-4" />}
                    variant="primary"
                    size="sm"
                    ariaLabel="New folder"
                    onClick={handleCreateFolder}
                  />
                </Tooltip>
              </div>
            </h3>

            {hasFolders ? (
              <div className="flex flex-col gap-2">
                {folderEntries.map(({ folder, count, items }) => (
                  <FolderGroup
                    key={folder.id}
                    folder={folder}
                    itemCount={count}
                    isCollapsed={collapsedFolders.has(folder.id)}
                    onToggleCollapse={() => toggleFolderCollapse(folder.id)}
                    onEditFolder={() => handleEditFolder(folder)}
                    onDeleteFolder={() => setFolderToDelete(folder)}
                  >
                    {count > 0 ? (
                      <div
                        className={
                          viewMode === "grid"
                            ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4"
                            : "flex flex-col gap-3"
                        }
                      >
                        {items.map(({ kind, id, item }) =>
                          kind === "notebook" ? (
                            <NotebookCard
                              key={id}
                              notebook={item}
                              viewMode={viewMode}
                              folders={folders ?? undefined}
                              folderTitle={folder.title}
                              onChange={() => refetchNotebooks(true, false)}
                            />
                          ) : (
                            <NoteCard
                              key={id}
                              note={item}
                              viewMode={viewMode}
                              notebookTitle={
                                notebooks?.find((nb) => nb.id === item.notebookId)?.title
                              }
                              folders={folders ?? undefined}
                              onChange={() => refetchNotes(true, false)}
                            />
                          ),
                        )}
                      </div>
                    ) : (
                      <p className="px-4 py-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                        This folder is empty.
                      </p>
                    )}
                  </FolderGroup>
                ))}
              </div>
            ) : (
              <div className="flex w-full flex-col items-center justify-center gap-1 rounded-xs border-2 border-dashed border-blue-400/60 bg-gray-50/60 px-6 py-8 text-center dark:border-blue-600/60 dark:bg-gray-900/30">
                <h3 className="text-foreground text-lg font-semibold">No folders yet</h3>
                <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  Create a folder to group your notebooks and notes together.
                </p>
              </div>
            )}
          </motion.section>

          {/* Notebooks section */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <h3 className="mb-3 flex items-center justify-between gap-2 text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              <span className="flex items-center gap-1.5">
                <NotebookIcon className="size-3.5 text-blue-500 dark:text-blue-400" />
                Notebooks
              </span>
              <div className="flex items-center gap-1">
                {hasNotebookContent && (
                  <Tooltip text="Search notebooks" position="top">
                    <IconButton
                      icon={<SearchIcon className="size-4" />}
                      variant="ghost"
                      size="sm"
                      ariaLabel="Search notebooks"
                      onClick={() => navigate("/notebooks")}
                    />
                  </Tooltip>
                )}
                {hasNotebookContent &&
                  renderOptionsMenu(notebookSort, setNotebookSort, "Notebook options")}
                <Tooltip text="Create notebook" position="top">
                  <IconButton
                    icon={<AddIcon className="size-4" />}
                    size="sm"
                    ariaLabel="Create notebook"
                    onClick={() => setIsCreateNotebookOpen(true)}
                  />
                </Tooltip>
              </div>
            </h3>

            {notebooksLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner />
              </div>
            ) : notebooksError ? (
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
                    <h4 className="mb-2 text-lg font-medium text-red-600 dark:text-red-400">
                      Error loading notebooks
                    </h4>
                    <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                      {notebooksError.message}
                    </p>
                  </div>
                </motion.div>
              </div>
            ) : (
              <>
                {notebooks && notebooks.length > 0 ? (
                  sortedUnfiledNotebooks.length > 0 ? (
                    <div
                      className={
                        viewMode === "grid"
                          ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4"
                          : "flex flex-col gap-3"
                      }
                    >
                      {sortedUnfiledNotebooks.map((notebook) => (
                        <NotebookCard
                          key={notebook.id}
                          notebook={notebook}
                          viewMode={viewMode}
                          folders={folders ?? undefined}
                          onChange={() => refetchNotebooks(true, false)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex w-full flex-col items-center justify-center gap-1 rounded-xs border-2 border-dashed border-gray-400/30 bg-gray-50/60 px-6 py-8 text-center dark:border-gray-600/30 dark:bg-gray-900/30">
                      <h3 className="text-foreground text-md font-semibold">
                        All your notebooks are inside folders.
                      </h3>
                    </div>
                  )
                ) : (
                  <div className="flex w-full flex-col items-center justify-center gap-1 rounded-xs border-2 border-dashed border-blue-400/60 bg-gray-50/60 px-6 py-8 text-center dark:border-blue-600/60 dark:bg-gray-900/30">
                    <h3 className="text-foreground text-lg font-semibold">No notebooks yet</h3>
                    <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                      Create your first notebook to start organizing your sources and AI-powered
                      insights.
                    </p>
                  </div>
                )}
              </>
            )}
          </motion.section>

          {/* Notes section */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h3 className="mb-3 flex items-center justify-between gap-2 text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              <span className="flex items-center gap-1.5">
                <NoteIcon className="size-3.5 text-blue-500 dark:text-blue-400" />
                Notes
              </span>
              <div className="flex items-center gap-1">
                {hasNoteContent && (
                  <Tooltip text="Search notes" position="top">
                    <IconButton
                      icon={<SearchIcon className="size-4" />}
                      variant="ghost"
                      size="sm"
                      ariaLabel="Search notes"
                      onClick={() => navigate("/notes")}
                    />
                  </Tooltip>
                )}
                {hasNoteContent && renderOptionsMenu(noteSort, setNoteSort, "Note options")}
                <Tooltip text="New note" position="top">
                  <IconButton
                    icon={
                      addingNote ? <Spinner className="size-4" /> : <AddIcon className="size-4" />
                    }
                    size="sm"
                    ariaLabel="New note"
                    onClick={() => createNote()}
                    disabled={addingNote}
                  />
                </Tooltip>
              </div>
            </h3>

            {notesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner />
              </div>
            ) : notesError ? (
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
                    <h4 className="mb-2 text-lg font-medium text-red-600 dark:text-red-400">
                      Error loading notes
                    </h4>
                    <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                      {notesError.message}
                    </p>
                  </div>
                </motion.div>
              </div>
            ) : (
              <>
                {notes && notes.length > 0 ? (
                  sortedUnfiledNotes.length > 0 ? (
                    <div
                      className={
                        viewMode === "grid"
                          ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4"
                          : "flex flex-col gap-3"
                      }
                    >
                      {sortedUnfiledNotes.map((note) => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          viewMode={viewMode}
                          notebookTitle={notebooks?.find((nb) => nb.id === note.notebookId)?.title}
                          folders={folders ?? undefined}
                          onChange={() => refetchNotes(true, false)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex w-full flex-col items-center justify-center gap-1 rounded-xs border-2 border-dashed border-gray-400/30 bg-gray-50/60 px-6 py-8 text-center dark:border-gray-600/30 dark:bg-gray-900/30">
                      <h3 className="text-foreground text-md font-semibold">
                        All your notes are inside folders.
                      </h3>
                    </div>
                  )
                ) : (
                  <div className="flex w-full flex-col items-center justify-center gap-1 rounded-xs border-2 border-dashed border-blue-400/60 bg-gray-50/60 px-6 py-8 text-center dark:border-blue-600/60 dark:bg-gray-900/30">
                    <h3 className="text-foreground text-lg font-semibold">No notes yet</h3>
                    <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                      Create your first note to start capturing your ideas and insights.
                    </p>
                  </div>
                )}
              </>
            )}
          </motion.section>
        </div>

        {/* Create Notebook Modal */}
        <Modal
          isOpen={isCreateNotebookOpen}
          onClose={() => setIsCreateNotebookOpen(false)}
          title="Create new notebook"
          actions={
            <>
              <Button
                variant="secondary"
                onClick={() => setIsCreateNotebookOpen(false)}
                disabled={creatingNotebook}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={async () => await createNotebook()}
                disabled={!newNotebookTitle.trim() || creatingNotebook}
                icon={creatingNotebook ? <Spinner /> : <AddIcon />}
              >
                {creatingNotebook ? "Creating" : "Create"}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <TextField
              id="notebook-title"
              label="Notebook title"
              type="text"
              value={newNotebookTitle}
              onChange={(e) => setNewNotebookTitle(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && newNotebookTitle.trim() && !creatingNotebook) {
                  e.preventDefault();
                  await createNotebook();
                }
              }}
              placeholder="Enter notebook title"
              autoFocus
            />
            {createNotebookError && (
              <div className="text-sm text-red-500">Error: {createNotebookError.message}</div>
            )}
          </div>
        </Modal>

        {/* Folder Modal */}
        <Modal
          isOpen={isFolderModalOpen}
          onClose={handleCloseFolderModal}
          title={editingFolderId ? "Rename folder" : "New folder"}
          actions={
            <>
              <Button variant="secondary" onClick={handleCloseFolderModal}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => handleSaveFolder()}
                disabled={creatingFolder || updatingFolder || !folderTitle.trim()}
              >
                {creatingFolder || updatingFolder ? (
                  <div className="flex items-center gap-2">
                    <Spinner className="size-4" />
                    {editingFolderId ? "Saving..." : "Creating..."}
                  </div>
                ) : editingFolderId ? (
                  "Rename folder"
                ) : (
                  "Create folder"
                )}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <TextField
              id="folder-name-input"
              label="Folder name"
              value={folderTitle}
              onChange={(e) => setFolderTitle(e.target.value)}
              placeholder="E.g., Ideas"
              autoFocus
            />
          </div>
        </Modal>

        {/* Delete Folder Modal */}
        <Modal
          isOpen={!!folderToDelete}
          onClose={() => setFolderToDelete(null)}
          title="Delete folder"
          actions={
            <>
              <Button variant="secondary" onClick={() => setFolderToDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => executeDeleteFolder()}
                disabled={deletingFolder}
              >
                {deletingFolder ? (
                  <div className="flex items-center gap-2">
                    <Spinner className="size-4" />
                    Deleting...
                  </div>
                ) : (
                  "Delete"
                )}
              </Button>
            </>
          }
        >
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete the folder{" "}
            <span className="font-semibold">{folderToDelete?.title}</span>? This action cannot be
            undone. Items inside this folder will remain but will be moved out of the folder.
          </p>
        </Modal>
      </div>
    </div>
  );
}
