import { useBreakpoint } from "@/hooks";
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
  const breakpoint = useBreakpoint();

  useEffect(() => {
    if (breakpoint === "compact") {
      setIsExpanded?.(true);
    }
  }, [breakpoint]);

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
          "fixed z-70 m-auto overflow-auto inset-0": isExpanded,
          "md:inset-12 md:max-h-5/6 md:max-w-2xl": isExpanded,
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
      {/* Backdrop — inline, position:fixed covers viewport regardless of DOM position */}
      {isExpanded && (
        <button
          type="button"
          className="animate-in fade-in fixed inset-0 z-60 cursor-default bg-black/30 backdrop-blur-[1px] duration-200 dark:bg-black/60"
          onClick={() => setIsExpanded?.(false)}
          aria-label="Close expanded view"
        />
      )}

      {/* Card — always inline; position:fixed on expanded handles overlay */}
      {content}
    </>
  );
}
