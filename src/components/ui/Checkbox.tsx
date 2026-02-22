import { cn } from "@/lib/utils";
import { CheckIcon } from "@/components/icons";
import { motion, AnimatePresence } from "motion/react";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  label?: string;
}

export function Checkbox({
  checked,
  onChange,
  disabled = false,
  className = "",
  id,
  label,
}: CheckboxProps) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <label
        className={cn(
          "relative flex items-center justify-center size-5 cursor-pointer rounded-xs border-2 transition-all duration-200 box-border shrink-0",
          {
            "bg-blue-500 border-blue-500": checked && !disabled,
            "bg-gray-50 border-gray-300 dark:bg-gray-800 dark:border-gray-600":
              !checked && !disabled,
            "opacity-50 cursor-not-allowed": disabled,
            "hover:border-blue-400": !disabled && !checked,
          },
        )}
        htmlFor={id}
      >
        <input
          type="checkbox"
          id={id}
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        <div className="size-3.5 flex items-center justify-center">
          <AnimatePresence>
            {checked && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="text-white size-3.5"
              >
                <CheckIcon />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </label>
      {label && (
        <label
          htmlFor={id}
          className={cn(
            "text-sm cursor-pointer select-none",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        >
          {label}
        </label>
      )}
    </div>
  );
}
