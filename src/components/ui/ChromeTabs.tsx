import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AddIcon, CloseIcon } from "@/components/icons";
import { Tooltip } from "./Tooltip";
import { IconButton } from "./IconButton";

export interface ChromeTabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  closable?: boolean;
}

interface ChromeTabsProps {
  tabs: ChromeTabItem[];
  activeTabId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onNewChat?: () => void;
  className?: string;
}

export function ChromeTabs({
  tabs,
  activeTabId,
  onSelect,
  onClose,
  onNewChat,
  className,
}: ChromeTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !activeTabId) return;
    const el = container.querySelector<HTMLElement>(`[data-tab-id="${activeTabId}"]`);
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeTabId, tabs.length]);

  if (tabs.length === 0 && !onNewChat) return null;

  return (
    <div
      className={cn(
        "flex justify-between py-2 shrink-0 items-center border-b border-gray-200 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-900/40 px-3",
        className,
      )}
    >
      <div
        ref={scrollRef}
        className="no-scrollbar flex min-w-0 flex-1 items-stretch gap-1.75 overflow-x-auto"
      >
        {tabs.map((tab) => {
          const active = tab.id === activeTabId;
          const closable = tab.closable !== false;
          return (
            <div
              key={tab.id}
              data-tab-id={tab.id}
              role="tab"
              tabIndex={0}
              aria-selected={active}
              onClick={() => onSelect(tab.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(tab.id);
                }
              }}
              className={cn(
                "group relative flex min-w-0 max-w-56 shrink-0 cursor-pointer items-center gap-2 pl-3 pr-1 py-1 text-sm transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 dark:focus-visible:ring-blue-500",
                {
                  "bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 border border-blue-500":
                    active,
                  "border border-gray-200 dark:border-gray-700 text-gray-500 hover:border-blue-300 hover:bg-gray-100/70 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:bg-gray-800/50 dark:hover:text-gray-200":
                    !active,
                },
              )}
            >
              {tab.icon && (
                <span className="shrink-0 [&>svg]:size-3.5 [&>svg]:shrink-0">{tab.icon}</span>
              )}
              <span className="min-w-0 flex-1 truncate whitespace-nowrap">
                {tab.label || "Untitled"}
              </span>
              {closable && (
                <IconButton
                  icon={<CloseIcon className="size-3" />}
                  variant="ghost"
                  size="xs"
                  onClick={() => onClose(tab.id)}
                  aria-label="Close tab"
                />
              )}
            </div>
          );
        })}
      </div>
      {onNewChat && (
        <Tooltip text="New chat" position="bottom">
          <IconButton
            icon={<AddIcon className="size-5" />}
            variant="ghost"
            size="sm"
            onClick={onNewChat}
            aria-label="New chat"
          />
        </Tooltip>
      )}
    </div>
  );
}
