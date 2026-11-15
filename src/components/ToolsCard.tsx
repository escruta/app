import { useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { AddIcon, FilterIcon, SearchIcon, ToolsIcon } from "@/components/icons";
import {
  Alert,
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  PanelList,
  PanelListItem,
  Select,
  type SelectOption,
  SidePanel,
  Skeleton,
  SortMenu,
  TextField,
  Tooltip,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { useCookie, useToolGenerations } from "@/hooks";
import { getSortedItems, type SortOption } from "@/components/settings/lib/sort";
import type {
  GenerationJob,
  GenerationOptions,
  GenerationRequestPayload,
  JobType,
  Source,
} from "@/interfaces";
import { CustomizeToolModal } from "./tools/CustomizeToolModal";
import { ToolGenerationChip } from "./tools/ToolGenerationChip";
import { TOOL_DEFINITIONS, TOOL_LIST } from "./tools/toolConfig";

interface ToolsCardProps {
  notebookId: string;
  sources?: Source[];
  selectedSourceIds?: string[];
  activeToolJobId?: string | null;
  onOpenToolJob?: (job: GenerationJob) => void;
  onToolJobRenamed?: (job: GenerationJob) => void;
  onToolJobDeleted?: (jobId: string) => void;
}

type TypeFilter = "ALL" | JobType;

const FILTER_OPTIONS: SelectOption<TypeFilter>[] = [
  { value: "ALL", label: "All tools", icon: <FilterIcon className="size-4" /> },
  ...TOOL_LIST.map((tool) => ({
    value: tool.type as TypeFilter,
    label: tool.title,
    icon: tool.icon,
  })),
];

export function ToolsCard({
  notebookId,
  sources = [],
  selectedSourceIds = [],
  activeToolJobId = null,
  onOpenToolJob,
  onToolJobRenamed,
  onToolJobDeleted,
}: ToolsCardProps) {
  const {
    jobs,
    isLoading,
    error,
    clearError,
    startGeneration,
    retryGeneration,
    renameGeneration,
    deleteGeneration,
  } = useToolGenerations(notebookId);

  const { value: sortPreference, setValue: setSortPreference } = useCookie<SortOption>(
    "toolsSortPreference",
    "Newest",
  );
  const sortBy = sortPreference ?? "Newest";

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [customizeState, setCustomizeState] = useState<{
    type: JobType;
    initialOptions?: GenerationOptions | null;
    initialTitle?: string;
  } | null>(null);
  const [isCustomSubmitting, setIsCustomSubmitting] = useState(false);

  const readySources = useMemo(() => sources.filter((s) => s.status === "READY"), [sources]);
  const readySourceIds = useMemo(() => readySources.map((s) => s.id), [readySources]);
  const effectiveSelectedIds = useMemo(() => {
    const valid = selectedSourceIds.filter((id) => readySourceIds.includes(id));
    return valid.length > 0 ? valid : readySourceIds;
  }, [selectedSourceIds, readySourceIds]);

  const hasReadySources = readySources.length > 0;

  const filteredAndSortedJobs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = jobs.filter((job) => {
      if (typeFilter !== "ALL" && job.type !== typeFilter) return false;
      if (query) {
        const inTitle = job.title?.toLowerCase().includes(query);
        const inFocus = job.options?.focusTopic?.toLowerCase().includes(query);
        if (!inTitle && !inFocus) return false;
      }
      return true;
    });
    return getSortedItems(filtered, sortBy, (j) => j.createdAt);
  }, [jobs, typeFilter, searchQuery, sortBy]);

  const handleCustomizeSubmit = async (payload: GenerationRequestPayload) => {
    setIsCustomSubmitting(true);
    try {
      const created = await startGeneration(payload);
      setCustomizeState(null);
      if (created && onOpenToolJob) {
        onOpenToolJob(created);
      }
    } catch (err) {
      console.error("Failed to start customized generation:", err);
    } finally {
      setIsCustomSubmitting(false);
    }
  };

  const handleGenerateAnother = async (job: GenerationJob) => {
    try {
      const created = await startGeneration({
        type: job.type,
        options: job.options ?? undefined,
      });
      if (created && onOpenToolJob) {
        onOpenToolJob(created);
      }
    } catch (err) {
      console.error("Failed to generate another:", err);
    }
  };

  const handleRetry = async (job: GenerationJob) => {
    try {
      await retryGeneration(job.id);
    } catch (err) {
      console.error("Failed to retry generation:", err);
    }
  };

  const handleRename = async (jobId: string, title: string) => {
    const updated = await renameGeneration(jobId, title);
    if (updated) {
      onToolJobRenamed?.(updated);
    }
    return updated;
  };

  const handleDelete = async (jobId: string) => {
    const deleted = await deleteGeneration(jobId);
    if (deleted) {
      onToolJobDeleted?.(jobId);
    }
    return deleted;
  };

  const activeFilterLabel = typeFilter === "ALL" ? "All tools" : TOOL_DEFINITIONS[typeFilter].title;

  return (
    <>
      <SidePanel
        title="Tools"
        actions={
          <>
            <Tooltip
              text={`Filter tools: ${activeFilterLabel}`}
              position="bottom"
              className="inline-flex"
            >
              <Select
                variant="icon"
                iconVariant="secondary"
                size="sm"
                options={FILTER_OPTIONS}
                value={typeFilter}
                onChange={setTypeFilter}
                heading="Filter by"
                ariaLabel={`Filter tools: ${activeFilterLabel}`}
                align="right"
                triggerClassName={cn(
                  typeFilter !== "ALL" &&
                    "border-blue-400 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-400",
                )}
              />
            </Tooltip>

            <SortMenu value={sortBy} onChange={setSortPreference} label="generations" />

            <Menu>
              <Tooltip
                text={hasReadySources ? "Generate tool" : "Add indexed sources first"}
                position="bottom"
              >
                <MenuTrigger>
                  <IconButton
                    icon={<AddIcon />}
                    variant="primary"
                    size="sm"
                    disabled={!hasReadySources}
                    ariaLabel="Generate tool"
                  />
                </MenuTrigger>
              </Tooltip>
              <MenuContent align="right">
                {TOOL_LIST.map((tool) => (
                  <MenuItem
                    key={tool.type}
                    icon={tool.icon}
                    label={tool.title}
                    disabled={!hasReadySources}
                    onClick={() => setCustomizeState({ type: tool.type })}
                  />
                ))}
              </MenuContent>
            </Menu>
          </>
        }
        toolbar={
          <TextField
            id="search-generated-tools"
            search
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              !isLoading && jobs.length === 0 ? "No generations yet" : "Search your generations..."
            }
            onClear={() => setSearchQuery("")}
          />
        }
        contentClassName="space-y-2 px-4 py-3"
      >
        {error && (
          <div onClick={clearError} className="cursor-pointer">
            <Alert variant="danger" message={error} />
          </div>
        )}

        {isLoading ? (
          <>
            <Skeleton variant="rectangle" height={48} />
            <Skeleton variant="rectangle" height={48} />
            <Skeleton variant="rectangle" height={48} />
          </>
        ) : jobs.length === 0 ? (
          <div className="flex size-full flex-col items-center justify-start pt-12 text-center">
            <div className="mb-5 flex size-20 items-center justify-center rounded-xs border border-blue-300 bg-blue-50 shadow-sm dark:border-blue-700 dark:bg-blue-950/30">
              <div className="size-10 text-blue-500 dark:text-blue-400">
                <ToolsIcon />
              </div>
            </div>
            <h3 className="text-foreground mb-2 text-lg font-semibold">No generations yet</h3>
            <p className="max-w-xs text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              {hasReadySources
                ? "Use the + button above to choose a study tool, customize its metrics, and generate."
                : "Add and index sources in your notebook first to start generating study tools."}
            </p>
          </div>
        ) : filteredAndSortedJobs.length === 0 ? (
          <div className="flex size-full flex-col items-center justify-start pt-12 text-center">
            <div className="mb-5 flex size-20 items-center justify-center rounded-xs border border-blue-300 bg-blue-50 shadow-sm dark:border-blue-700 dark:bg-blue-950/30">
              <div className="size-10 text-blue-500 dark:text-blue-400">
                <SearchIcon />
              </div>
            </div>
            <h3 className="text-foreground mb-2 text-lg font-semibold">No results</h3>
            <p className="max-w-xs text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              No generations match that filter or search.
            </p>
          </div>
        ) : (
          <PanelList className="flex flex-col gap-2">
            <AnimatePresence>
              {filteredAndSortedJobs.map((job) => (
                <PanelListItem key={job.id}>
                  <ToolGenerationChip
                    job={job}
                    isActive={job.id === activeToolJobId}
                    onSelect={(selected) => onOpenToolJob?.(selected)}
                    onCustomizeVariation={(selected) =>
                      setCustomizeState({
                        type: selected.type,
                        initialOptions: selected.options ?? null,
                      })
                    }
                    onGenerateAnother={handleGenerateAnother}
                    onRetry={handleRetry}
                    onRename={handleRename}
                    onDelete={handleDelete}
                  />
                </PanelListItem>
              ))}
            </AnimatePresence>
          </PanelList>
        )}
      </SidePanel>

      {customizeState && (
        <CustomizeToolModal
          isOpen={Boolean(customizeState)}
          toolType={customizeState.type}
          sources={sources}
          defaultSelectedSourceIds={effectiveSelectedIds}
          initialOptions={customizeState.initialOptions}
          initialTitle={customizeState.initialTitle}
          isSubmitting={isCustomSubmitting}
          onClose={() => setCustomizeState(null)}
          onGenerate={handleCustomizeSubmit}
        />
      )}
    </>
  );
}
