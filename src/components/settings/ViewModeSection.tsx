import { useCookie } from "@/hooks";
import { CommonBar } from "@/components";
import { GridIcon, ListIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "list";

export const VIEW_MODE_COOKIE_KEYS = {
  folder: "globalFolderViewMode",
  notebook: "globalNotebookViewMode",
  note: "globalNoteViewMode",
} as const;

const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  grid: "Grid",
  list: "List",
};

const VIEW_MODES: ViewMode[] = ["grid", "list"];

type ViewCategory = "folder" | "notebook" | "note";

const CATEGORY_LABELS: Record<ViewCategory, string> = {
  folder: "Folders",
  notebook: "Notebooks",
  note: "Notes",
};

const CATEGORY_COOKIE_KEYS: Record<ViewCategory, string> = {
  folder: VIEW_MODE_COOKIE_KEYS.folder,
  notebook: VIEW_MODE_COOKIE_KEYS.notebook,
  note: VIEW_MODE_COOKIE_KEYS.note,
};

function ViewModePreview({ mode }: { mode: ViewMode }) {
  return (
    <div className="flex h-16 w-full items-center justify-center rounded-xs bg-gray-50 dark:bg-gray-800">
      {mode === "grid" ? (
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-4 w-6 rounded-xs border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-900"
            />
          ))}
        </div>
      ) : (
        <div className="flex w-16 flex-col gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-2 w-full rounded-xs border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-900"
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ViewModeLegendTile({ mode }: { mode: ViewMode }) {
  return (
    <div className="flex flex-col gap-2 rounded-xs border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
      <ViewModePreview mode={mode} />
      <span className="flex items-center justify-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-200">
        {mode === "grid" ? <GridIcon className="size-3.5" /> : <ListIcon className="size-3.5" />}
        {VIEW_MODE_LABELS[mode]}
      </span>
    </div>
  );
}

function SegmentedControl({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div
      role="radiogroup"
      className="flex rounded-xs border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800"
    >
      {VIEW_MODES.map((mode) => {
        const selected = value === mode;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(mode)}
            className={cn(
              "flex items-center gap-1 rounded-xs px-2.5 py-1 text-xs font-medium cursor-pointer",
              "transition-all duration-200 outline-none",
              selected
                ? "bg-white text-blue-600 shadow-sm dark:bg-gray-900 dark:text-blue-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
            )}
          >
            {mode === "grid" ? (
              <GridIcon className="size-3.5" />
            ) : (
              <ListIcon className="size-3.5" />
            )}
            {VIEW_MODE_LABELS[mode]}
          </button>
        );
      })}
    </div>
  );
}

function CategoryRow({ category }: { category: ViewCategory }) {
  const [viewMode, setViewMode] = useCookie<ViewMode>(CATEGORY_COOKIE_KEYS[category], "grid");

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
        {CATEGORY_LABELS[category]}
      </p>
      <SegmentedControl value={viewMode} onChange={setViewMode} />
    </div>
  );
}

export function ViewModeSection() {
  return (
    <CommonBar className="z-10 flex-col items-start justify-center">
      <div className="flex w-full flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-medium">Display</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose how folders, notebooks, and notes are displayed across the application.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ViewModeLegendTile mode="grid" />
          <ViewModeLegendTile mode="list" />
        </div>
        <div className="flex flex-col gap-3">
          <CategoryRow category="folder" />
          <CategoryRow category="notebook" />
          <CategoryRow category="note" />
        </div>
      </div>
    </CommonBar>
  );
}
