import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  className?: string;
}

export function Switch({
  checked,
  onChange,
  disabled = false,
  id,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  className,
}: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-xs border p-0.5 transition-colors duration-150 select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 dark:focus-visible:ring-blue-400/35",
        checked
          ? "border-blue-600 bg-blue-500 dark:border-blue-500 dark:bg-blue-600"
          : "border-gray-300 bg-gray-200 dark:border-gray-600 dark:bg-gray-800",
        !disabled &&
          (checked
            ? "hover:border-blue-700 hover:bg-blue-600 group-hover:border-blue-700 group-hover:bg-blue-600 dark:hover:border-blue-400 dark:hover:bg-blue-500 dark:group-hover:border-blue-400 dark:group-hover:bg-blue-500"
            : "hover:border-gray-400 group-hover:border-gray-400 dark:hover:border-gray-500 dark:group-hover:border-gray-500"),
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none block size-3.5 rounded-xs bg-white shadow-xs transition-transform duration-150",
          checked ? "translate-x-4" : "translate-x-0",
        )}
      />
    </button>
  );
}
