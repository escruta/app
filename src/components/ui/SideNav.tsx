import { useState, useImperativeHandle, forwardRef } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { panelSwitchTransition } from "@/lib/motion";
import { IconButton } from "./IconButton";
import { ChatNewIcon, CollapseHorizontalIcon, ExpandHorizontalIcon } from "@/components/icons";
import { Tooltip } from "./Tooltip";

export type SideNavItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  badge?: number | undefined;
};

type SideNavProps = {
  items: SideNavItem[];
  defaultActiveTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
  onToggleCollapse?: () => void;
  onNewChat?: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
};

export interface SideNavRef {
  setActiveTab: (tabId: string) => void;
}

export const SideNav = forwardRef<SideNavRef, SideNavProps>(
  (
    {
      items,
      defaultActiveTab,
      onChange,
      className = "",
      onToggleCollapse,
      onNewChat,
      collapsed = false,
      onCollapsedChange,
    },
    ref,
  ) => {
    const [activeTabId, setActiveTabId] = useState<string>(
      defaultActiveTab || (items.length > 0 ? items[0].id : ""),
    );

    useImperativeHandle(ref, () => ({
      setActiveTab: (tabId: string) => {
        setActiveTabId(tabId);
        if (onChange) {
          onChange(tabId);
        }
      },
    }));

    const setPanelCollapsed = (next: boolean) => {
      if (onCollapsedChange) {
        onCollapsedChange(next);
      } else if (next !== collapsed) {
        onToggleCollapse?.();
      }
    };

    const handleTabClick = (tabId: string) => {
      if (tabId === activeTabId) {
        setPanelCollapsed(!collapsed);
        return;
      }

      setActiveTabId(tabId);
      if (onChange) {
        onChange(tabId);
      }
      if (collapsed) {
        setPanelCollapsed(false);
      }
    };

    if (items.length === 0) return null;

    const activeTab = items.find((tab) => tab.id === activeTabId) ?? items[0];

    return (
      <div className={cn("flex h-full w-full min-w-0 flex-row overflow-hidden", className)}>
        <div className="flex w-18 max-w-18 min-w-18 shrink-0 flex-col items-center overflow-x-hidden overflow-y-auto border-r border-gray-200 dark:border-gray-800">
          {onNewChat && (
            <div className="flex h-12 w-full shrink-0 items-center justify-center border-b border-gray-200 dark:border-gray-800">
              <Tooltip text="New conversation" position="right">
                <IconButton
                  icon={<ChatNewIcon className="size-4" />}
                  onClick={onNewChat}
                  variant="primary"
                  size="sm"
                  ariaLabel="New conversation"
                />
              </Tooltip>
            </div>
          )}
          <nav
            aria-label="Panel sections"
            className="flex w-full flex-col items-center gap-1 px-1 py-2"
          >
            {items.map((tab) => {
              const active = activeTab.id === tab.id;
              const showActive = active && !collapsed;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  aria-label={tab.label}
                  className={cn(
                    "group relative flex w-full shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xs px-1 py-1.5 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 dark:focus-visible:ring-blue-500",
                    showActive
                      ? "bg-blue-100 text-blue-700 ring-1 ring-blue-200 ring-inset dark:bg-blue-500/20 dark:text-blue-200 dark:ring-blue-700/60"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200",
                  )}
                >
                  <span className="relative flex size-5 shrink-0 items-center justify-center [&>svg]:size-5 [&>svg]:shrink-0">
                    {tab.icon}
                    {typeof tab.badge === "number" && tab.badge > 0 && (
                      <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] leading-none font-semibold text-white dark:bg-blue-600">
                        {tab.badge > 99 ? "99+" : tab.badge}
                      </span>
                    )}
                  </span>
                  <span className="w-full truncate text-center text-[11px] leading-tight font-medium">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </nav>
          {onToggleCollapse && (
            <div className="mt-auto flex flex-col items-center gap-1 p-2">
              <Tooltip text={collapsed ? "Expand panel" : "Collapse panel"} position="right">
                <IconButton
                  icon={
                    collapsed ? (
                      <ExpandHorizontalIcon direction="right" className="size-4" />
                    ) : (
                      <CollapseHorizontalIcon className="size-4" />
                    )
                  }
                  onClick={onToggleCollapse}
                  variant="ghost"
                  size="sm"
                  ariaLabel={collapsed ? "Expand panel" : "Collapse panel"}
                />
              </Tooltip>
            </div>
          )}
        </div>

        <div
          aria-hidden={collapsed}
          inert={collapsed || undefined}
          className={cn(
            "flex h-full min-h-0 min-w-76 flex-1 flex-col overflow-hidden",
            collapsed && "pointer-events-none invisible",
          )}
        >
          <motion.div
            key={activeTab.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={panelSwitchTransition}
            className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden"
          >
            {activeTab.content}
          </motion.div>
        </div>
      </div>
    );
  },
);

SideNav.displayName = "SideNav";
