import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { createPortal } from "react-dom";

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

  const content = (
    <div
      className={cn(
        "bg-white dark:bg-gray-900 p-4 rounded-xs border border-gray-200 dark:border-gray-700 ring-1 ring-gray-500/5 dark:ring-gray-500/10",
        {
          "fixed z-50 m-auto overflow-auto inset-0": isExpanded,
          "sm:inset-12 sm:max-h-5/6 sm:max-w-2xl": isExpanded,
          "lg:max-h-4/5 lg:max-w-5xl": isExpanded,
        },
        !isExpanded && className,
        isExpanded && className?.replace(/h-full/g, ""),
      )}
      style={{
        position: isExpanded ? "fixed" : "relative",
      }}
    >
      {children}
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      {isExpanded &&
        createPortal(
          <button
            type="button"
            className="animate-in fade-in fixed inset-0 z-40 cursor-default bg-black/30 backdrop-blur-[1px] duration-200 dark:bg-black/60"
            onClick={() => setIsExpanded?.(false)}
            aria-label="Close expanded view"
          />,
          document.body,
        )}

      {/* Card */}
      {isExpanded ? createPortal(content, document.body) : content}
    </>
  );
}
