import { useState } from "react";
import { useNavigate } from "react-router";
import type { Notebook } from "@/interfaces";
import { useAuth, useCookie, useFetch } from "@/hooks";
import {
  Button,
  Dropdown,
  Modal,
  TextField,
  SegmentedButtons,
  Spinner,
} from "@/components/ui";
import { NotebookCard, CommonBar, SEOMetadata } from "@/components";
import {
  AddIcon,
  GridIcon,
  ListIcon,
  FireIcon,
  NotebookIcon,
} from "@/components/icons";
import { getRouteMetadata } from "@/lib/seo";
import { motion } from "motion/react";

enum SortOptions {
  Newest = "Newest",
  Oldest = "Oldest",
  Alphabetical = "Alphabetical",
  ReverseAlphabetical = "Reverse Alphabetical",
}

type ViewMode = "grid" | "list";

export default function HomePage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { data, loading, error } = useFetch<Notebook[]>("/notebooks");
  const [sortBy, setSortBy] = useCookie<SortOptions>(
    "notebookSortPreference",
    SortOptions.Newest,
  );
  const [viewMode, setViewMode] = useCookie<ViewMode>(
    "notebookViewMode",
    "grid",
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newNotebookTitle, setNewNotebookTitle] = useState("");

  const {
    loading: creatingNotebook,
    error: createError,
    refetch: createNotebook,
  } = useFetch<Notebook>(
    "/notebooks",
    {
      method: "POST",
      data: { title: newNotebookTitle },
      onSuccess: async (notebook) => {
        useFetch.clearCache("/notebooks");
        navigate(`/notebook/${notebook.id}`);
      },
      onError: (error) => {
        console.error("Error creating notebook:", error.message);
      },
    },
    false,
  );

  if (loading) {
    return (
      <div className="flex justify-center h-screen w-full flex-col">
        <div className="border-y border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 px-6 py-5">
          <div className="flex justify-center items-center py-12">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                Loading notebooks...
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    if (error.status === 401) {
      return (
        <div className="flex justify-center h-screen w-full flex-col">
          <div className="border-y border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 px-6 py-5">
            <motion.div
              className="flex justify-center items-center py-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-50 dark:bg-yellow-950 rounded-xs flex items-center justify-center mb-4 mx-auto">
                  <div className="w-8 h-8 text-yellow-500">
                    <NotebookIcon />
                  </div>
                </div>
                <h1 className="text-xl font-medium text-yellow-600 dark:text-yellow-400 mb-2">
                  Access denied
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  You do not have permission to view these notebooks. Try
                  logging in again.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-center h-screen w-full flex-col">
        <div className="border-y border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 px-6 py-5">
          <motion.div
            className="flex justify-center items-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-950 rounded-xs flex items-center justify-center mb-4 mx-auto">
                <div className="w-8 h-8 text-red-500">
                  <FireIcon />
                </div>
              </div>
              <h1 className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
                Error loading notebooks
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {error.message}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  function getSortedNotebooks() {
    if (!data) return [];

    const sortedData = [...data];
    switch (sortBy) {
      case SortOptions.Newest:
        return sortedData.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      case SortOptions.Oldest:
        return sortedData.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      case SortOptions.Alphabetical:
        return sortedData.sort((a, b) => a.title.localeCompare(b.title));
      case SortOptions.ReverseAlphabetical:
        return sortedData.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return sortedData;
    }
  }

  const metadata = getRouteMetadata("/");

  return (
    <div className="flex h-screen max-h-full w-full flex-col">
      <SEOMetadata
        title={metadata.title}
        description={metadata.description}
        url={metadata.url}
        image={metadata.image}
        twitterCard={metadata.twitterCard}
      />
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 px-4 py-4 md:px-6 md:py-5">
        <div className="flex justify-between items-center gap-4">
          <h1 className="flex flex-col items-start gap-1.5 min-w-0">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Notebooks
            </span>
            <span className="text-2xl font-bold truncate w-full text-gray-900 dark:text-white select-text">
              Welcome, {currentUser?.fullName || "User"}!
            </span>
          </h1>
        </div>
      </div>

      <div className="flex-1 p-3 md:p-4 bg-gray-50 dark:bg-gray-950 overflow-auto">
        <div className="pointer-events-none blur-xl fixed w-full h-16 bg-gradient-to-b from-blue-50 dark:from-gray-950 to-transparent z-10"></div>

        <CommonBar className="flex-col md:flex-row justify-between items-stretch md:items-center sticky top-0 z-20 mb-4 backdrop-blur-2xl bg-gray-50/60 dark:bg-gray-800/70 gap-3 md:gap-0">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full md:w-auto justify-center"
          >
            Create notebook
          </Button>

          {data && data.length > 0 ? (
            <div className="flex items-center gap-2 md:gap-4 flex-wrap pb-1 md:pb-0 justify-between md:justify-end">
              <SegmentedButtons
                options={[
                  {
                    value: "grid" as const,
                    icon: <GridIcon />,
                    ariaLabel: "Grid view",
                  },
                  {
                    value: "list" as const,
                    icon: <ListIcon />,
                    ariaLabel: "List view",
                  },
                ]}
                value={viewMode || "grid"}
                onChange={setViewMode}
                size="sm"
              />

              <Dropdown<SortOptions>
                options={Object.values(SortOptions)}
                selectedOption={sortBy || SortOptions.Newest}
                onSelect={(option) => setSortBy(option as SortOptions)}
                label="Sort by:"
              />
            </div>
          ) : (
            <span></span>
          )}
        </CommonBar>

        {data && data.length > 0 ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-2 md:flex md:flex-wrap gap-3 md:gap-4 mb-8"
                : "flex flex-col gap-3 mb-8"
            }
          >
            {getSortedNotebooks().map((notebook) => (
              <NotebookCard
                key={notebook.id}
                notebook={notebook}
                viewMode={viewMode}
              />
            ))}
          </div>
        ) : (
          <CommonBar className="text-center text-gray-500">
            No notebooks available. Create one to get started!
          </CommonBar>
        )}

        {/* Create Notebook Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create new notebook"
          actions={
            <>
              <Button
                variant="secondary"
                onClick={() => setIsCreateModalOpen(false)}
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
              label="Notebook Title"
              type="text"
              value={newNotebookTitle}
              onChange={(e) => setNewNotebookTitle(e.target.value)}
              placeholder="Enter notebook title"
              autoFocus
            />
            {createError && (
              <div className="text-red-500 text-sm">
                Error: {createError.message}
              </div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
}
