import { NavLink, useLocation, useNavigate } from "react-router";
import { Tooltip, IconButton } from "@/components/ui";
import { ChevronIcon } from "@/components/icons";
import { AppIcon } from "./AppIcon";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title?: React.ReactNode;
}

export function TopBar({ title }: TopBarProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();

  const isMac = window.electronAPI?.platform === "darwin";
  const isElectron = Boolean(window.electronAPI?.isElectron);

  return (
    <div
      className={cn(
        "app-region-drag z-50 flex h-14 w-full shrink-0 flex-row items-center justify-between border-b border-gray-200 bg-white pr-4 pl-4 md:pr-6 md:pl-6 dark:border-gray-800 dark:bg-gray-950",
        isMac && "pl-20",
        isElectron && !isMac && "pr-36",
      )}
    >
      <div className="flex items-center gap-4">
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

        {title && (
          <>
            <div className="mx-2 h-6 w-px bg-gray-200 dark:bg-gray-800" />
            <div className="app-region-no-drag flex min-w-0 items-center">
              <h1 className="truncate text-lg font-bold text-gray-900 dark:text-white">{title}</h1>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
