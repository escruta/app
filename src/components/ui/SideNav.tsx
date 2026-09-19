import { useState, useImperativeHandle, forwardRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
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

    const handleTabClick = (tabId: string) => {
      setActiveTabId(tabId);
      if (onChange) {
        onChange(tabId);
      }
      // Clicking the rail while collapsed expands the panel on that section.
      if (collapsed && onCollapsedChange) {
        onCollapsedChange(false);
      }
    };

    if (items.length === 0) return null;

    const activeTab = items.find((tab) => tab.id === activeTabId);

    return (
      <div className={cn("flex h-full w-full flex-row overflow-hidden", className)}>
        {/* Icon rail */}
        <div className="flex w-14 shrink-0 flex-col items-center gap-1 overflow-x-hidden overflow-y-auto border-r border-gray-200 py-2 dark:border-gray-800">
          {onNewChat && (
            <>
              <Tooltip text="New conversation" position="right">
                <IconButton
                  icon={<ChatNewIcon className="size-4" />}
                  onClick={onNewChat}
                  variant="primary"
                  size="sm"
                  ariaLabel="New conversation"
                />
              </Tooltip>
              <div className="my-1 h-px w-8 shrink-0 bg-gray-200 dark:bg-gray-800" />
            </>
          )}
          <nav aria-label="Panel sections" className="flex w-full flex-col items-center gap-1">
            {items.map((tab) => {
              const active = activeTabId === tab.id;
              return (
                <Tooltip key={tab.id} text={tab.label} position="right">
                  <button
                    onClick={() => handleTabClick(tab.id)}
                    type="button"
                    aria-current={active ? "page" : undefined}
                    aria-label={tab.label}
                    className={cn(
                      "group relative flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xs transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 dark:focus-visible:ring-blue-500",
                      active
                        ? "bg-blue-100 text-blue-700 ring-1 ring-blue-200 ring-inset dark:bg-blue-500/20 dark:text-blue-200 dark:ring-blue-700/60"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200",
                    )}
                  >
                    <span className="shrink-0 [&>svg]:size-5 [&>svg]:shrink-0">{tab.icon}</span>
                    {typeof tab.badge === "number" && tab.badge > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] leading-none font-semibold text-white dark:bg-blue-600">
                        {tab.badge > 99 ? "99+" : tab.badge}
                      </span>
                    )}
                  </button>
                </Tooltip>
              );
            })}
          </nav>
          {onToggleCollapse && (
            <div className="mt-auto flex flex-col items-center gap-1 pt-2">
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

        {/* Section content — shared box so every panel keeps the same width */}
        {!collapsed && (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTabId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.15,
                  ease: "easeOut",
                }}
                className="flex h-full w-full min-w-0 flex-col overflow-hidden"
              >
                <div className="flex h-full w-full min-w-0 flex-1 flex-col overflow-hidden">
                  {activeTab?.content}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    );
  },
);

SideNav.displayName = "SideNav";
