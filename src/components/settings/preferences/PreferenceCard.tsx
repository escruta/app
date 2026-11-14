import { AnimatePresence, motion } from "motion/react";
import { CheckIcon } from "@/components/icons";
import { useAccessibility } from "@/hooks";
import { cn } from "@/lib/utils";

interface SelectionIndicatorProps {
  selected: boolean;
  className?: string;
}

export function SelectionIndicator({ selected, className }: SelectionIndicatorProps) {
  const { effectiveReducedMotion } = useAccessibility();

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-xs border transition-colors duration-200",
        selected
          ? "border-blue-500 bg-blue-500 text-white dark:border-blue-400 dark:bg-blue-500"
          : "border-gray-300 bg-white group-hover:border-blue-300 dark:border-gray-600 dark:bg-gray-950 dark:group-hover:border-gray-500",
        className,
      )}
    >
      <AnimatePresence mode="wait">
        {selected && (
          <motion.span
            key="check"
            initial={effectiveReducedMotion ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={effectiveReducedMotion ? undefined : { scale: 0, opacity: 0 }}
            transition={
              effectiveReducedMotion ? { duration: 0 } : { duration: 0.12, ease: "easeOut" }
            }
            className="flex items-center justify-center"
          >
            <CheckIcon className="size-3" />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

interface PreferenceOptionButtonProps {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
  className?: string;
}

export function PreferenceOptionButton({
  selected,
  onSelect,
  children,
  className,
}: PreferenceOptionButtonProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "group relative flex cursor-pointer flex-col text-left rounded-xs border p-3 transition-all duration-200 select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-gray-950",
        selected
          ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500/25 dark:border-blue-400 dark:bg-blue-950/30 dark:ring-blue-400/25"
          : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-600 dark:hover:bg-gray-800/70",
        className,
      )}
    >
      {children}
    </button>
  );
}
