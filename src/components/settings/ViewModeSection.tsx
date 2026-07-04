import { useCookie } from "@/hooks";
import { CommonBar } from "@/components";
import { Dropdown } from "@/components/ui";
import { GridIcon, ListIcon } from "@/components/icons";

type ViewMode = "grid" | "list";

const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  grid: "Grid",
  list: "List",
};

export function ViewModeSection() {
  const [viewMode, setViewMode] = useCookie<ViewMode>("globalViewMode", "grid");

  return (
    <CommonBar className="z-10 flex-col items-start justify-center">
      <div className="flex flex-col gap-3 *:w-fit">
        <h2 className="text-xl font-medium">Display</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Choose how notebooks and notes are displayed across the application.
        </p>
        <Dropdown<ViewMode>
          options={["grid", "list"]}
          selectedOption={viewMode}
          onSelect={(option) => setViewMode(option)}
          label="Show cards as: "
          renderOption={(option) => (
            <span className="flex items-center gap-2">
              {option === "grid" ? (
                <GridIcon className="size-4" />
              ) : (
                <ListIcon className="size-4" />
              )}
              {VIEW_MODE_LABELS[option]}
            </span>
          )}
        />
      </div>
    </CommonBar>
  );
}
