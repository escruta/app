import { useState, useImperativeHandle, forwardRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { IconButton } from "./IconButton";
import { Button } from "./Button";
import { ChatNewIcon, CompressIcon } from "@/components/icons";
import { Tooltip } from "./Tooltip";

type SideNavItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
};

type SideNavProps = {
  items: SideNavItem[];
  defaultActiveTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
  onToggleCollapse?: () => void;
  onNewChat?: () => void;
};

export interface SideNavRef {
  setActiveTab: (tabId: string) => void;
}

export const SideNav = forwardRef<SideNavRef, SideNavProps>(
  ({ items, defaultActiveTab, onChange, className = "", onToggleCollapse, onNewChat }, ref) => {
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
    };

    if (items.length === 0) return null;

    const activeTab = items.find((tab) => tab.id === activeTabId);

    return (
      <div className={cn("flex w-full flex-col", className)}>
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-200 py-2 pr-2 pl-3 dark:border-gray-800">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {onNewChat && (
              <Button
                onClick={onNewChat}
                icon={<ChatNewIcon className="size-3.5" />}
                variant="primary"
                size="sm"
                className="w-full"
              >
                New conversation
              </Button>
            )}
            <nav className="flex min-w-0 flex-1 flex-col gap-0.5">
              {items.map((tab, index) => {
                const active = activeTabId === tab.id;
                return (
                  <button
                    key={index}
                    onClick={() => handleTabClick(tab.id)}
                    type="button"
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex min-w-0 shrink-0 cursor-pointer items-center gap-2.5 rounded-xs px-2.5 py-1.5 text-sm whitespace-nowrap transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 dark:focus-visible:ring-blue-500",
                      active
                        ? "bg-blue-100 font-semibold text-blue-700 dark:bg-blue-500/25 dark:text-blue-300"
                        : "font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200",
                    )}
                  >
                    {tab.icon && (
                      <span
                        className={cn(
                          "shrink-0 [&>svg]:size-4 [&>svg]:shrink-0",
                          active
                            ? "text-blue-600 dark:text-blue-300"
                            : "text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300",
                        )}
                      >
                        {tab.icon}
                      </span>
                    )}
                    <span className="min-w-0 truncate">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          {onToggleCollapse && (
            <Tooltip text="Collapse panel" position="bottom">
              <IconButton
                icon={<CompressIcon />}
                onClick={onToggleCollapse}
                variant="ghost"
                size="sm"
                aria-label="Collapse panel"
              />
            </Tooltip>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTabId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{
                duration: 0.15,
                ease: "easeOut",
              }}
              className="h-full"
            >
              {activeTab?.content}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  },
);

SideNav.displayName = "SideNav";
