import { cn } from "@/lib/utils";

interface SegmentedOption<T = string> {
  value: T;
  ariaLabel?: string;
}

interface SegmentedOptionWithLabel<T = string> extends SegmentedOption<T> {
  label: string;
  icon?: never;
}

interface SegmentedOptionWithIcon<T = string> extends SegmentedOption<T> {
  label?: never;
  icon: React.ReactNode;
}

interface SegmentedButtonsProps<T = string> {
  options: (SegmentedOptionWithLabel<T> | SegmentedOptionWithIcon<T>)[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
  label?: string;
}

export function SegmentedButtons<T = string>({
  options,
  value,
  onChange,
  className = "",
  size = "md",
  label,
}: SegmentedButtonsProps<T>) {
  const containerStyles =
    "flex gap-0.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-900 p-1 shadow-sm shadow-gray-500/5 dark:shadow-black/10";

  const buttonBaseStyles =
    "flex items-center justify-center rounded-xs transition-all duration-200 select-none font-medium outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 cursor-pointer";

  const sizeStyles = {
    sm: "px-2 py-1.5 text-xs",
    md: "px-3 py-2 text-sm",
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {label && (
        <p className="text-sm font-medium whitespace-nowrap text-gray-700 select-none dark:text-gray-200">
          {label}
        </p>
      )}

      <div className={containerStyles}>
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => onChange(option.value)}
            className={cn(buttonBaseStyles, sizeStyles[size], {
              "bg-blue-100 dark:bg-gray-700 text-blue-700 dark:text-blue-300":
                value === option.value,
              "text-gray-700 dark:text-gray-200 hover:bg-blue-50 hover:ring-1 hover:ring-blue-300 focus:bg-blue-50 dark:hover:bg-gray-700 dark:focus:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 active:bg-blue-100 dark:active:bg-gray-600":
                value !== option.value,
            })}
            aria-label={option.ariaLabel || option.label}
            type="button"
          >
            {option.icon ? (
              <span className="flex size-4 items-center justify-center">{option.icon}</span>
            ) : (
              option.label
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
