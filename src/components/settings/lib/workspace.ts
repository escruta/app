export type SidebarTabId = "overview" | "conversations" | "sources" | "notes" | "tools";

export type SidebarBehavior = "remember" | "expanded" | "collapsed";

export const WORKSPACE_DEFAULT_SIDEBAR_TAB_COOKIE_KEY = "workspaceDefaultSidebarTab";
export const WORKSPACE_SIDEBAR_BEHAVIOR_COOKIE_KEY = "workspaceSidebarBehavior";
export const WORKSPACE_RESTORE_TABS_COOKIE_KEY = "workspaceRestoreTabs";
export const WORKSPACE_AUTO_SPLIT_COOKIE_KEY = "workspaceAutoSplit";

export const SIDEBAR_TAB_OPTIONS: { value: SidebarTabId; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "conversations", label: "History" },
  { value: "sources", label: "Sources" },
  { value: "notes", label: "Notes" },
  { value: "tools", label: "Tools" },
];

export const SIDEBAR_BEHAVIOR_OPTIONS: { value: SidebarBehavior; label: string }[] = [
  { value: "remember", label: "Remember last state" },
  { value: "expanded", label: "Always expanded" },
  { value: "collapsed", label: "Always collapsed" },
];

export const DEFAULT_WORKSPACE_SETTINGS = {
  defaultSidebarTab: "overview" as SidebarTabId,
  sidebarBehavior: "remember" as SidebarBehavior,
  restoreOpenTabs: true,
  autoSplitContent: false,
};
