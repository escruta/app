import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

type SidePanelProps = {
  title: string;
  actions?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  loading?: boolean;
  loadingFallback?: ReactNode;
};

export function SidePanel({
  title,
  actions,
  toolbar,
  children,
  className,
  contentClassName,
  loading = false,
  loadingFallback,
}: SidePanelProps) {
  return (
    <div className={cn("flex h-full w-full flex-col overflow-hidden", className)}>
      <div className="z-10 shrink-0">
        <div className="flex h-12 items-center gap-2 border-b border-gray-200 px-4 dark:border-gray-800">
          <h2 className="min-w-0 truncate font-sans text-base font-semibold">{title}</h2>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2">{actions}</div>
        </div>
      </div>
      {toolbar ? (
        <div className="flex h-15 shrink-0 items-center border-b border-gray-200 px-4 dark:border-gray-800">
          <div className="w-full">{toolbar}</div>
        </div>
      ) : null}
      <div
        aria-busy={loading || undefined}
        className={cn("min-h-0 flex-1 overflow-y-auto", contentClassName)}
      >
        {loading
          ? (loadingFallback ?? (
              <div className="flex size-full items-center justify-center">
                <Spinner />
              </div>
            ))
          : children}
      </div>
    </div>
  );
}
