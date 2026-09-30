import { useState, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CloseIcon } from "@/components/icons";
import { IconButton } from "./IconButton";
import { ContextMenu, ContextMenuTrigger, ContextMenuContent } from "./ContextMenu";

interface ChromeTabItem {
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
  className?: string;
  onTabPointerDown?: (e: PointerEvent<HTMLDivElement>, id: string) => void;
  actions?: ReactNode;
  renderTabContextMenu?: (id: string) => ReactNode;
}

export function ChromeTabs({
  tabs,
  activeTabId,
  onSelect,
  onClose,
  className,
  onTabPointerDown,
  actions,
  renderTabContextMenu,
}: ChromeTabsProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (tabs.length === 0) return null;

  return (
    <div
      className={cn(
        "relative flex h-11 shrink-0 items-stretch justify-between bg-gray-50/60 dark:bg-gray-900/40",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gray-200 dark:bg-gray-800" />

      <div className="relative z-10 flex min-w-0 flex-1 items-stretch gap-0.5 overflow-hidden px-2">
        {tabs.map((tab, index) => {
          const active = tab.id === activeTabId;
          const closable = tab.closable !== false;
          const previous = tabs[index - 1];
          const hasSeparator = Boolean(!active && previous && previous.id !== activeTabId);
          const separatorHidden = hoveredId === tab.id || hoveredId === previous?.id;
          const tabNode = (
            <div
              key={tab.id}
              data-tab-id={tab.id}
              role="tab"
              tabIndex={0}
              aria-selected={active}
              title={tab.label || "Untitled"}
              onPointerDown={(e) => onTabPointerDown?.(e, tab.id)}
              onClick={() => onSelect(tab.id)}
              onMouseDown={(e: MouseEvent<HTMLDivElement>) => {
                if (e.button === 1) e.preventDefault();
              }}
              onAuxClick={(e: MouseEvent<HTMLDivElement>) => {
                if (e.button === 1) {
                  e.preventDefault();
                  e.stopPropagation();
                  if (closable) onClose(tab.id);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(tab.id);
                }
              }}
              onMouseEnter={() => setHoveredId(tab.id)}
              onMouseLeave={() => setHoveredId((current) => (current === tab.id ? null : current))}
              className={cn(
                "relative flex h-full min-w-0 max-w-56 flex-1 cursor-pointer touch-none items-center gap-2 rounded-t-xs border border-b-0 px-3 py-1 text-sm font-medium transition-[background-color,border-color,color] duration-200 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-inset dark:focus-visible:ring-blue-500",
                {
                  "border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100":
                    active,
                  "border-transparent text-gray-500 hover:bg-gray-200/50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800/40 dark:hover:text-gray-200":
                    !active,
                },
              )}
            >
              {hasSeparator && (
                <span
                  className={cn(
                    "pointer-events-none absolute top-1/2 -left-0.5 h-4 w-px -translate-y-1/2 bg-gray-300 transition-opacity duration-200 dark:bg-gray-700",
                    separatorHidden ? "opacity-0" : "opacity-100",
                  )}
                />
              )}
              {active && (
                <span className="pointer-events-none absolute -inset-x-px -top-px h-0.5 rounded-t-xs bg-blue-500 dark:bg-blue-400" />
              )}
              {tab.icon && (
                <span className="shrink-0 [&>svg]:size-3.5 [&>svg]:shrink-0">{tab.icon}</span>
              )}
              <span className="min-w-0 flex-1 truncate whitespace-nowrap">
                {tab.label || "Untitled"}
              </span>
              {closable && (
                <span
                  className="shrink-0"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <IconButton
                    icon={<CloseIcon className="size-3" />}
                    variant="ghost"
                    size="xs"
                    onClick={() => onClose(tab.id)}
                    aria-label="Close tab"
                    className="hover:ring-0 hover:ring-offset-0 focus-visible:ring-offset-0 focus-visible:ring-inset"
                  />
                </span>
              )}
            </div>
          );

          if (!renderTabContextMenu) return tabNode;

          return (
            <ContextMenu key={tab.id}>
              <ContextMenuTrigger>{tabNode}</ContextMenuTrigger>
              <ContextMenuContent compact>{renderTabContextMenu(tab.id)}</ContextMenuContent>
            </ContextMenu>
          );
        })}
      </div>

      {actions && <div className="flex shrink-0 items-center gap-1 pr-2">{actions}</div>}
    </div>
  );
}
