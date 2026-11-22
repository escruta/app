import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useAccessibility } from "@/hooks";
import { CheckIcon } from "@/components/icons";

interface SelectListOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface SelectListProps {
  options: SelectListOption[];
  selectedId: string | null | undefined;
  onSelect: (id: string | null) => void;
  className?: string;
  emptyText?: string;
}

export function SelectList({
  options,
  selectedId,
  onSelect,
  className,
  emptyText = "No options to choose from",
}: SelectListProps) {
  const { effectiveReducedMotion } = useAccessibility();

  return (
    <div
      role="listbox"
      className={cn(
        "flex max-h-64 flex-col gap-0.5 overflow-auto rounded-xs border border-gray-200 bg-gray-50/50 p-1.5 dark:border-gray-800 dark:bg-gray-900/50",
        className,
      )}
    >
      {options.length === 0 ? (
        <p className="px-3 py-6 text-center text-sm text-gray-400 select-none dark:text-gray-500">
          {emptyText}
        </p>
      ) : (
        options.map((option) => {
          const isSelected = selectedId === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => onSelect(isSelected ? null : option.id)}
              className={cn(
                "group flex w-full cursor-pointer items-center gap-2.5 rounded-xs px-3 py-2 text-sm font-medium transition-colors duration-150 select-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none focus-visible:ring-inset dark:focus-visible:ring-blue-400",
                isSelected
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                  : "text-gray-700 hover:bg-white hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800/70 dark:hover:text-gray-100",
              )}
            >
              {option.icon && (
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center transition-colors duration-150 [&_svg]:size-4 [&_svg]:shrink-0",
                    isSelected
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300",
                  )}
                >
                  {option.icon}
                </span>
              )}
              <span className="flex-1 truncate text-left">{option.label}</span>
              <span className="flex size-4 shrink-0 items-center justify-center">
                <AnimatePresence mode="wait">
                  {isSelected && (
                    <motion.span
                      key="check"
                      initial={effectiveReducedMotion ? false : { scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={effectiveReducedMotion ? undefined : { scale: 0, opacity: 0 }}
                      transition={
                        effectiveReducedMotion
                          ? { duration: 0 }
                          : { duration: 0.12, ease: "easeOut" }
                      }
                      className="text-blue-600 dark:text-blue-400"
                    >
                      <CheckIcon aria-hidden="true" className="size-4" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </button>
          );
        })
      )}
    </div>
  );
}
