import { useShortcut } from "@/hooks";
import { cn } from "@/lib/utils";

interface ViewerFrameProps {
  children: React.ReactNode;
  isExpanded?: boolean;
  setIsExpanded?: (expanded: boolean) => void;
  className?: string;
}

export function ViewerFrame({ children, isExpanded, setIsExpanded, className }: ViewerFrameProps) {
  useShortcut("dialog-close", () => setIsExpanded?.(false), {
    global: true,
    enabled: Boolean(isExpanded && setIsExpanded),
    preventDefault: false,
  });

  return (
    <>
      {isExpanded && (
        <button
          type="button"
          className="fixed inset-0 z-60 cursor-default bg-gray-950/30 backdrop-blur-[1px] dark:bg-gray-950/60"
          onClick={() => setIsExpanded?.(false)}
          aria-label="Close expanded view"
        />
      )}
      <div
        className={cn(
          "relative flex flex-col overflow-hidden",
          isExpanded
            ? "fixed inset-0 z-70 m-auto overflow-auto bg-white md:inset-12 md:max-h-5/6 md:max-w-2xl md:rounded-xs md:border md:border-gray-200 md:shadow-xl md:ring-1 md:shadow-gray-950/15 md:ring-black/5 lg:max-h-4/5 lg:max-w-5xl dark:bg-gray-900 dark:md:border-gray-800 dark:md:shadow-black/50 dark:md:ring-white/5"
            : "h-full",
          isExpanded ? className?.replace(/h-full/g, "") : className,
        )}
        style={{ position: isExpanded ? "fixed" : "relative" }}
      >
        {children}
      </div>
    </>
  );
}
