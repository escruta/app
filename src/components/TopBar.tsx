import { NavLink, useLocation, useNavigate } from "react-router";
import { Tooltip, IconButton } from "@/components/ui";
import { ChevronIcon } from "@/components/icons";
import { isDesktop, isMacDesktop } from "@/lib/desktop";
import { AppIcon } from "./AppIcon";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title?: React.ReactNode;
}

export function TopBar({ title }: TopBarProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();

  const isMac = isMacDesktop;
  const hasWindowControls = isDesktop && !isMac;

  return (
    <div
      data-tauri-drag-region
      className={cn(
        "app-region-drag z-50 flex h-14 w-full shrink-0 flex-row items-center justify-between border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950",
        {
          "pl-20": isMac,
          "pr-36": hasWindowControls,
          "pr-4 md:pr-6": !hasWindowControls,
        },
      )}
    >
      <div data-tauri-drag-region className="flex h-full min-w-0 flex-1 items-center">
        <div className="flex h-full w-18 shrink-0 items-center justify-center">
          {location.pathname !== "/" ? (
            <Tooltip text="Previous page" position="bottom" className="app-region-no-drag shrink-0">
              <IconButton
                icon={<ChevronIcon direction="left" className="size-5" />}
                onClick={() => navigate(-1)}
                variant="ghost"
                size="sm"
                ariaLabel="Previous page"
              />
            </Tooltip>
          ) : (
            <NavLink
              to="/"
              className="app-region-no-drag group grid h-10 w-10 shrink-0 place-items-center"
            >
              <AppIcon className="size-8 fill-gray-800 transition-all duration-300 group-hover:fill-blue-500 dark:fill-gray-50 dark:group-hover:fill-blue-400" />
            </NavLink>
          )}
        </div>

        {title && (
          <>
            <div className="h-full w-px shrink-0 bg-gray-200 dark:bg-gray-800" />
            <div className="app-region-no-drag ml-5 flex min-w-0 items-center">
              <h1 className="truncate text-lg font-bold text-gray-900 dark:text-white">{title}</h1>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
