import { cn } from "@/lib/utils";

interface ViewerFrameProps {
  children: React.ReactNode;
  isExpanded?: boolean;
  setIsExpanded?: (expanded: boolean) => void;
  className?: string;
}

export function ViewerFrame({ children, isExpanded, setIsExpanded, className }: ViewerFrameProps) {
  return (
    <>
      {isExpanded && (
        <button
          type="button"
          className="animate-in fade-in fixed inset-0 z-60 cursor-default bg-gray-950/30 backdrop-blur-[1px] duration-200 dark:bg-gray-950/60"
          onClick={() => setIsExpanded?.(false)}
          aria-label="Close expanded view"
        />
      )}
      <div
        className={cn(
          "relative flex flex-col overflow-hidden",
          {
            "fixed z-70 m-auto inset-0 overflow-auto bg-white dark:bg-gray-900 md:inset-12 md:max-h-5/6 md:max-w-2xl lg:max-h-4/5 lg:max-w-5xl":
              isExpanded,
            "h-full": !isExpanded,
          },
          isExpanded ? className?.replace(/h-full/g, "") : className,
        )}
        style={{ position: isExpanded ? "fixed" : "relative" }}
      >
        {children}
      </div>
    </>
  );
}
