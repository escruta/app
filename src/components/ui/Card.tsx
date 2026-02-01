import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface BaseProps {
  children: React.ReactNode;
  className?: string;
}

interface ControlledProps extends BaseProps {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

interface UncontrolledProps extends BaseProps {
  isExpanded?: undefined;
  setIsExpanded?: undefined;
}

export function Card({
  children,
  className,
  isExpanded,
  setIsExpanded,
}: ControlledProps | UncontrolledProps) {
  useEffect(() => {
    if (!isExpanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsExpanded?.(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isExpanded, setIsExpanded]);

  return (
    <>
      {/* Backdrop */}
      {isExpanded && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/30 dark:bg-black/60 backdrop-blur-[1px] animate-in fade-in duration-200 cursor-default"
          onClick={() => setIsExpanded?.(false)}
          aria-label="Close expanded view"
        />
      )}

      {/* Card */}
      <div
        className={cn(
          "bg-white dark:bg-gray-900 p-4 rounded-xs border border-gray-200 dark:border-gray-700 ring-1 ring-gray-500/5 dark:ring-gray-500/10",
          className,
          {
            "fixed z-50 m-auto overflow-auto inset-0": isExpanded,
            "sm:inset-4 sm:max-h-[calc(100vh-4rem)] sm:max-w-[calc(100vw-4rem)]":
              isExpanded,
            "lg:inset-12 lg:max-h-[calc(100vh-6rem)] lg:max-w-[calc(100vw-12rem)]":
              isExpanded,
          },
        )}
        style={{
          position: isExpanded ? "fixed" : "relative",
        }}
      >
        {children}
      </div>
    </>
  );
}
