import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { CheckIcon } from "@/components/icons";

export interface SelectListOption {
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
  emptyText = "No options available",
}: SelectListProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 rounded-xs border border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-900/40 p-1.5 max-h-64 overflow-auto",
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
              onClick={() => onSelect(isSelected ? null : option.id)}
              className={cn(
                "group flex w-full items-center gap-2.5 rounded-xs px-3 py-2 text-sm font-medium transition-all duration-200 outline-none select-none cursor-pointer",
                {
                  "bg-blue-50 text-blue-700 dark:bg-gray-800 dark:text-blue-300": isSelected,
                  "text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800/60":
                    !isSelected,
                },
              )}
            >
              {option.icon && (
                <span
                  className={cn(
                    "flex size-4 flex-shrink-0 items-center justify-center transition-colors duration-200",
                    isSelected
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300",
                  )}
                >
                  {option.icon}
                </span>
              )}
              <span className="flex-1 truncate text-left">{option.label}</span>
              <span className="flex size-4 flex-shrink-0 items-center justify-center">
                <AnimatePresence mode="wait">
                  {isSelected && (
                    <motion.span
                      key="check"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.12, ease: "easeOut" }}
                      className="text-blue-600 dark:text-blue-400"
                    >
                      <CheckIcon className="size-4" />
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
