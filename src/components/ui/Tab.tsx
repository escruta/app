import { useState, useImperativeHandle, forwardRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

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
};

export interface TabsRef {
  setActiveTab: (tabId: string) => void;
}

export const Tabs = forwardRef<TabsRef, TabsProps>(
  ({ items, defaultActiveTab, onChange, className = "" }, ref) => {
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
      <div className={cn("w-full relative", className)}>
        <div className="no-scrollbar flex w-full justify-start overflow-x-auto rounded-xs border border-gray-200 bg-gray-50/65 p-1 dark:border-gray-600 dark:bg-gray-900/65">
          {items.map((tab, index) => (
            <div key={index} className="group relative min-w-max flex-1">
              {activeTabId === tab.id && (
                <div className="absolute inset-0 rounded-xs border border-gray-200/50 bg-white transition-all duration-150 ease-out dark:border-gray-600/50 dark:bg-gray-800" />
              )}
              {activeTabId !== tab.id && (
                <div className="absolute inset-0 rounded-xs bg-gray-100/40 opacity-0 transition-opacity duration-150 group-hover:opacity-100 dark:bg-gray-700/40" />
              )}
              <button
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  "w-full px-6 py-1.5 text-sm font-medium rounded-xs transition-all duration-200 relative whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 cursor-pointer",
                  {
                    "": activeTabId === tab.id,
                  },
                )}
                type="button"
              >
                <span
                  className={cn("text-sm transition-all duration-150", {
                    "text-gray-800 dark:text-gray-100 font-semibold": activeTabId === tab.id,
                    "text-gray-600 dark:text-gray-400 font-medium group-hover:text-gray-800 dark:group-hover:text-gray-200":
                      activeTabId !== tab.id,
                  })}
                >
                  {tab.label}
                </span>
              </button>
            </div>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 mt-2 h-[calc(100%-3.5rem)] max-h-full flex-grow overflow-hidden">
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
