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
}

export function SegmentedButtons<T = string>({
  options,
  value,
  onChange,
  className = "",
  size = "md",
}: SegmentedButtonsProps<T>) {
  const containerStyles =
    "flex gap-1 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-700 p-1 shadow-sm shadow-gray-500/5 dark:shadow-black/10";

  const buttonBaseStyles =
    "flex items-center justify-center rounded-xs transition-all duration-200 select-none font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900";

  const sizeStyles = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
  };

  return (
    <div className={cn(containerStyles, className)}>
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => onChange(option.value)}
          className={cn(buttonBaseStyles, sizeStyles[size], {
            "bg-blue-100 dark:bg-gray-800 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/20 dark:ring-blue-500/30":
              value === option.value,
            "text-gray-900 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-gray-600 hover:ring-1 hover:ring-blue-300/50 active:bg-blue-100 dark:active:bg-gray-700":
              value !== option.value,
          })}
          aria-label={option.ariaLabel || option.label}
          type="button"
        >
          {option.icon ? (
            <span className="w-4 h-4 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full">
              {option.icon}
            </span>
          ) : (
            option.label
          )}
        </button>
      ))}
    </div>
  );
}
