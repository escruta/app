import { useId } from "react";
import { cn } from "@/lib/utils";
import { CheckIcon } from "@/components/icons";
import { useAccessibility } from "@/hooks";
import { motion, AnimatePresence } from "motion/react";

interface CheckboxProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  label?: string;
}

export function Checkbox({
  checked,
  onChange,
  disabled = false,
  className,
  id,
  label,
}: CheckboxProps) {
  const { effectiveReducedMotion } = useAccessibility();
  const generatedId = useId();
  const resolvedId = id ?? generatedId;

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <label
        htmlFor={resolvedId}
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center",
          disabled ? "cursor-not-allowed" : "cursor-pointer",
        )}
      >
        <input
          type="checkbox"
          id={resolvedId}
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
        />
        <span
          aria-hidden="true"
          className={cn(
            "flex size-5 items-center justify-center rounded-xs border transition-colors duration-150",
            "peer-focus-visible:border-blue-500 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500/25 dark:peer-focus-visible:border-blue-400 dark:peer-focus-visible:ring-blue-400/25",
            checked
              ? "border-blue-600 bg-blue-500 dark:border-blue-500 dark:bg-blue-600"
              : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900",
            !disabled &&
              (checked
                ? "hover:border-blue-700 hover:bg-blue-600 dark:hover:border-blue-400 dark:hover:bg-blue-500"
                : "hover:border-blue-400 dark:hover:border-gray-500"),
            disabled && "opacity-50",
          )}
        >
          <span className="flex size-3.5 items-center justify-center">
            <AnimatePresence>
              {checked && (
                <motion.span
                  initial={effectiveReducedMotion ? false : { scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={effectiveReducedMotion ? undefined : { scale: 0, opacity: 0 }}
                  transition={effectiveReducedMotion ? { duration: 0 } : { duration: 0.1 }}
                  className="size-3.5 text-white"
                >
                  <CheckIcon />
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </span>
      </label>
      {label && (
        <label
          htmlFor={resolvedId}
          className={cn(
            "text-sm font-medium text-gray-700 select-none dark:text-gray-200",
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          )}
        >
          {label}
        </label>
      )}
    </div>
  );
}
