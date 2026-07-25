import { useCookie } from "@/hooks";
import { CommonBar } from "@/components";
import { Dropdown } from "@/components/ui";
import { GridIcon, ListIcon } from "@/components/icons";

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

function ViewModeDropdown({ cookieKey, label }: { cookieKey: string; label: string }) {
  const [viewMode, setViewMode] = useCookie<ViewMode>(cookieKey, "grid");

  return (
    <Dropdown<ViewMode>
      options={VIEW_MODES}
      selectedOption={viewMode}
      onSelect={(option) => setViewMode(option)}
      label={label}
      renderOption={(option) => (
        <span className="flex items-center gap-2">
          {option === "grid" ? <GridIcon className="size-4" /> : <ListIcon className="size-4" />}
          {VIEW_MODE_LABELS[option]}
        </span>
      )}
    />
  );
}

export function ViewModeSection() {
  return (
    <CommonBar className="z-10 flex-col items-start justify-center">
      <div className="flex flex-col gap-3 *:w-fit">
        <h2 className="text-xl font-medium">Display</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Choose how folders, notebooks, and notes are displayed across the application.
        </p>
        <ViewModeDropdown cookieKey={VIEW_MODE_COOKIE_KEYS.folder} label="Show folders as: " />
        <ViewModeDropdown cookieKey={VIEW_MODE_COOKIE_KEYS.notebook} label="Show notebooks as: " />
        <ViewModeDropdown cookieKey={VIEW_MODE_COOKIE_KEYS.note} label="Show notes as: " />
      </div>
    </CommonBar>
  );
}
