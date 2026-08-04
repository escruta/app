import { useState, useImperativeHandle, forwardRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { IconButton } from "./IconButton";
import { CompressIcon } from "@/components/icons";
import { Tooltip } from "./Tooltip";

type TabItem = {
  id: string;
  label: string;
  content: React.ReactNode;
};

type TabsProps = {
  items: TabItem[];
  defaultActiveTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
  onToggleCollapse?: () => void;
};

export interface TabsRef {
  setActiveTab: (tabId: string) => void;
}

export const Tabs = forwardRef<TabsRef, TabsProps>(
  ({ items, defaultActiveTab, onChange, className = "", onToggleCollapse }, ref) => {
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
        <div className="flex w-full shrink-0 items-center border-b border-gray-200 pl-1.5 dark:border-gray-700">
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
          <div className="no-scrollbar flex min-w-0 flex-1 overflow-x-auto">
            {items.map((tab, index) => (
              <button
                key={index}
                onClick={() => handleTabClick(tab.id)}
                type="button"
                className={cn(
                  "relative min-w-0 flex-1 cursor-pointer px-6 py-2.5 text-sm whitespace-nowrap text-center transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-200 dark:focus-visible:ring-gray-600",
                  activeTabId === tab.id
                    ? "font-semibold text-gray-800 dark:text-gray-100"
                    : "font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "absolute inset-x-0 bottom-0 h-0.5 rounded-full transition-opacity duration-150",
                    activeTabId === tab.id
                      ? "bg-blue-500 opacity-100 dark:bg-blue-400"
                      : "opacity-0",
                  )}
                />
              </button>
            ))}
          </div>
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

Tabs.displayName = "Tabs";
