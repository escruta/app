import { useId } from "react";
import { BookOpenIcon, ChatIcon, FileTextIcon, NoteIcon, ToolsIcon } from "@/components/icons";
import { Select, Switch, type SelectOption } from "@/components/ui";
import { useCookie } from "@/hooks";
import { SettingsGroup } from "../shared/SettingsSection";
import {
  DEFAULT_WORKSPACE_SETTINGS,
  SIDEBAR_BEHAVIOR_OPTIONS,
  SIDEBAR_TAB_OPTIONS,
  WORKSPACE_AUTO_SPLIT_COOKIE_KEY,
  WORKSPACE_DEFAULT_SIDEBAR_TAB_COOKIE_KEY,
  WORKSPACE_RESTORE_TABS_COOKIE_KEY,
  WORKSPACE_SIDEBAR_BEHAVIOR_COOKIE_KEY,
  type SidebarBehavior,
  type SidebarTabId,
} from "../lib/workspace";

const SIDEBAR_TAB_ICONS: Record<SidebarTabId, React.ReactNode> = {
  overview: <BookOpenIcon className="size-4" />,
  conversations: <ChatIcon className="size-4" />,
  sources: <FileTextIcon className="size-4" />,
  notes: <NoteIcon className="size-4" />,
  tools: <ToolsIcon className="size-4" />,
};

const SIDEBAR_TAB_SELECT_OPTIONS: SelectOption<SidebarTabId>[] = SIDEBAR_TAB_OPTIONS.map(
  (option) => ({
    value: option.value,
    label: option.label,
    icon: SIDEBAR_TAB_ICONS[option.value],
  }),
);

export function WorkspaceSettings() {
  const restoreTabsLabelId = useId();
  const restoreTabsDescId = useId();
  const autoSplitLabelId = useId();
  const autoSplitDescId = useId();

  const { value: defaultSidebarTab, setValue: setDefaultSidebarTab } = useCookie<SidebarTabId>(
    WORKSPACE_DEFAULT_SIDEBAR_TAB_COOKIE_KEY,
    DEFAULT_WORKSPACE_SETTINGS.defaultSidebarTab,
  );
  const { value: sidebarBehavior, setValue: setSidebarBehavior } = useCookie<SidebarBehavior>(
    WORKSPACE_SIDEBAR_BEHAVIOR_COOKIE_KEY,
    DEFAULT_WORKSPACE_SETTINGS.sidebarBehavior,
  );
  const { value: restoreOpenTabs, setValue: setRestoreOpenTabs } = useCookie<boolean>(
    WORKSPACE_RESTORE_TABS_COOKIE_KEY,
    DEFAULT_WORKSPACE_SETTINGS.restoreOpenTabs,
  );
  const { value: autoSplitContent, setValue: setAutoSplitContent } = useCookie<boolean>(
    WORKSPACE_AUTO_SPLIT_COOKIE_KEY,
    DEFAULT_WORKSPACE_SETTINGS.autoSplitContent,
  );

  return (
    <SettingsGroup
      title="Workspace"
      description="Control how notebooks, tabs, and the side panel behave when you open them."
    >
      <div className="divide-y divide-gray-200 overflow-hidden rounded-xs border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Default sidebar panel
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              Choose which section is active when you open a notebook.
            </p>
          </div>
          <div className="shrink-0 self-start sm:self-center">
            <Select
              variant="compact"
              size="sm"
              align="right"
              options={SIDEBAR_TAB_SELECT_OPTIONS}
              value={defaultSidebarTab}
              onChange={setDefaultSidebarTab}
              ariaLabel="Default sidebar panel"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Sidebar on open</p>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              Remember the last collapsed state or always start expanded or collapsed.
            </p>
          </div>
          <div className="shrink-0 self-start sm:self-center">
            <Select
              variant="compact"
              size="sm"
              align="right"
              options={SIDEBAR_BEHAVIOR_OPTIONS}
              value={sidebarBehavior}
              onChange={setSidebarBehavior}
              ariaLabel="Sidebar on open"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 px-4 py-3.5">
          <div className="min-w-0">
            <p
              id={restoreTabsLabelId}
              className="text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              Restore open tabs
            </p>
            <p
              id={restoreTabsDescId}
              className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400"
            >
              Reopen your previous tabs and split layout when returning to a notebook.
            </p>
          </div>
          <Switch
            checked={restoreOpenTabs}
            onChange={setRestoreOpenTabs}
            ariaLabelledBy={restoreTabsLabelId}
            ariaDescribedBy={restoreTabsDescId}
          />
        </div>

        <div className="flex items-center justify-between gap-4 px-4 py-3.5">
          <div className="min-w-0">
            <p
              id={autoSplitLabelId}
              className="text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              Open content in split view
            </p>
            <p
              id={autoSplitDescId}
              className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400"
            >
              Automatically open sources, notes, and learning tools in a right pane beside your
              active tab.
            </p>
          </div>
          <Switch
            checked={autoSplitContent}
            onChange={setAutoSplitContent}
            ariaLabelledBy={autoSplitLabelId}
            ariaDescribedBy={autoSplitDescId}
          />
        </div>
      </div>
    </SettingsGroup>
  );
}
