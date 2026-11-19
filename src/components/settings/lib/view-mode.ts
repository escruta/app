export type ViewMode = "grid" | "list";

export const VIEW_MODE_COOKIE_KEY = "globalNotebookViewMode";
export const SHOW_FOLDER_NOTEBOOKS_COOKIE_KEY = "showFolderNotebooksOnHome";
export const DEFAULT_SHOW_FOLDER_NOTEBOOKS = true;

export const VIEW_MODES: ViewMode[] = ["grid", "list"];

export const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  grid: "Grid",
  list: "List",
};
