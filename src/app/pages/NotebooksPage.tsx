import { useState } from "react";
import { useNavigate } from "react-router";
import type { Notebook } from "@/interfaces";
import { useCookie, useFetch, useIsTablet } from "@/hooks";
import {
  Button,
  Dropdown,
  Modal,
  TextField,
  SegmentedButtons,
  Spinner,
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  MenuLabel,
  IconButton,
} from "@/components/ui";
import { NotebookCard, CommonBar, SEOMetadata } from "@/components";
import {
  AddIcon,
  GridIcon,
  ListIcon,
  FireIcon,
  NotebookIcon,
  DotsVerticalIcon,
  CheckIcon,
} from "@/components/icons";
import { getRouteMetadata } from "@/lib/seo";
import { motion } from "motion/react";
import { SimpleBackground } from "@/components/backgrounds/SimpleBackground";
import { cn } from "@/lib/utils";

enum SortOptions {
  Newest = "Newest",
  Oldest = "Oldest",
  Alphabetical = "Alphabetical",
  ReverseAlphabetical = "Reverse Alphabetical",
}

type ViewMode = "grid" | "list";

export default function NotebooksPage() {
  const isTablet = useIsTablet();
  const navigate = useNavigate();
  const { data, loading, error, refetch: refetchNotebooks } = useFetch<Notebook[]>("/notebooks");
  const [sortBy, setSortBy] = useCookie<SortOptions>("notebookSortPreference", SortOptions.Newest);
  const [viewMode, setViewMode] = useCookie<ViewMode>("notebookViewMode", "grid");
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
              <p className="font-medium text-gray-600 dark:text-gray-400">Loading notebooks...</p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
                  You do not have permission to view these notebooks. Try logging in again.
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
                Error loading notebooks
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

  function getSortedNotebooks(): Notebook[] {
    if (!data) return [];

    const sortedData = [...data];
    switch (sortBy) {
      case SortOptions.Newest:
        return sortedData.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      case SortOptions.Oldest:
        return sortedData.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      case SortOptions.Alphabetical:
        return sortedData.sort((a, b) => a.title.localeCompare(b.title));
      case SortOptions.ReverseAlphabetical:
        return sortedData.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return sortedData;
    }
  }

  const metadata = getRouteMetadata("/notebooks");

  return (
    <div className="flex h-screen max-h-full w-full flex-col">
      <SEOMetadata
        title={metadata.title}
        description={metadata.description}
        url={metadata.url}
        image={metadata.image}
        twitterCard={metadata.twitterCard}
      />
      <div className="z-20 border-b border-gray-200 bg-white px-4 py-4 md:px-6 dark:border-gray-700 dark:bg-black">
        <div className="flex items-center justify-between gap-2">
          <h1 className="flex min-w-0 flex-1 items-center gap-1.5 text-gray-900 select-text *:leading-7 dark:text-white">
            <span className="truncate text-2xl font-bold">Notebooks</span>
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 md:p-4">
        <SimpleBackground />

        <CommonBar className="sticky top-0 z-20 mb-4 flex items-center justify-between gap-4">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full justify-center md:w-auto"
          >
            Create notebook
          </Button>

          {data && data.length > 0 && (
            <>
              {isTablet ? (
                <Menu>
                  <MenuTrigger>
                    <IconButton
                      icon={<DotsVerticalIcon />}
                      size="sm"
                      ariaLabel="Options"
                      variant="ghost"
                    />
                  </MenuTrigger>
                  <MenuContent align="right" className="min-w-[12rem]">
                    <div className="flex flex-col gap-0.5 p-0.5">
                      <MenuLabel>View Mode</MenuLabel>
                      <MenuItem
                        label="Grid"
                        onClick={() => setViewMode("grid")}
                        icon={
                          viewMode === "grid" ? (
                            <CheckIcon className="size-4 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <div className="size-4" />
                          )
                        }
                        className={cn(
                          viewMode === "grid" &&
                            "bg-blue-50 text-blue-700 dark:bg-gray-800 dark:text-blue-400",
                        )}
                      />
                      <MenuItem
                        label="List"
                        onClick={() => setViewMode("list")}
                        icon={
                          viewMode === "list" ? (
                            <CheckIcon className="size-4 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <div className="size-4" />
                          )
                        }
                        className={cn(
                          viewMode === "list" &&
                            "bg-blue-50 text-blue-700 dark:bg-gray-800 dark:text-blue-400",
                        )}
                      />
                      <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />
                      <MenuLabel>Sort by</MenuLabel>
                      {Object.values(SortOptions).map((option) => (
                        <MenuItem
                          key={option}
                          label={option}
                          onClick={() => setSortBy(option as SortOptions)}
                          icon={
                            sortBy === option ? (
                              <CheckIcon className="size-4 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <div className="size-4" />
                            )
                          }
                          className={cn(
                            sortBy === option &&
                              "bg-blue-50 text-blue-700 dark:bg-gray-800 dark:text-blue-400",
                          )}
                        />
                      ))}
                    </div>
                  </MenuContent>
                </Menu>
              ) : (
                <div className="flex flex-wrap items-center justify-end gap-8">
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
                    label="View:"
                  />

                  <Dropdown<SortOptions>
                    align="right"
                    options={Object.values(SortOptions)}
                    selectedOption={sortBy || SortOptions.Newest}
                    onSelect={(option) => setSortBy(option as SortOptions)}
                    label="Sort by:"
                  />
                </div>
              )}
            </>
          )}
        </CommonBar>

        {data && data.length > 0 ? (
          <div
            className={
              viewMode === "grid"
                ? "mb-8 grid grid-cols-2 gap-3 md:flex md:flex-wrap md:gap-4"
                : "mb-8 flex flex-col gap-3"
            }
          >
            {getSortedNotebooks().map((notebook: Notebook) => (
              <NotebookCard
                key={notebook.id}
                notebook={notebook}
                viewMode={viewMode}
                onChange={() => refetchNotebooks(true, false)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <div className="mb-5 flex size-20 items-center justify-center rounded-xs border border-blue-300 bg-blue-50 shadow-sm dark:border-blue-700 dark:bg-blue-950/30">
              <div className="size-10 text-blue-500 dark:text-blue-400">
                <NotebookIcon />
              </div>
            </div>
            <h3 className="text-foreground mb-3 text-xl font-semibold">No notebooks yet</h3>
            <p className="mb-6 max-w-md text-base leading-relaxed text-gray-500 dark:text-gray-400">
              Create your first notebook to start organizing your sources, notes, and AI-powered
              insights.
            </p>
          </div>
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
            {createError && (
              <div className="text-sm text-red-500">Error: {createError.message}</div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
}
