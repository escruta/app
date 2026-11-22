import { cn } from "@/lib/utils";

type DividerProps = {
  className?: string;
  orientation?: "horizontal" | "vertical";
  label?: string;
};

export function Divider({ className, orientation = "horizontal", label }: DividerProps) {
  if (orientation === "vertical") {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn("mx-2 border-r border-gray-200 dark:border-gray-800", className)}
      />
    );
  }

  if (label) {
    return (
      <div role="separator" className={cn("relative flex items-center py-2", className)}>
        <div className="grow border-t border-gray-200 dark:border-gray-800" />
        <span className="mx-3 shrink text-xs font-medium text-gray-500 select-none dark:text-gray-400">
          {label}
        </span>
        <div className="grow border-t border-gray-200 dark:border-gray-800" />
      </div>
    );
  }

  return <hr className={cn("my-2 border-t border-gray-200 dark:border-gray-800", className)} />;
}
