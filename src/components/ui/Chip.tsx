import { cn } from "@/lib/utils";

type ChipVariants = "default" | "primary";

interface ChipProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: ChipVariants;
  icon?: React.ReactNode;
  title?: string;
  multiline?: boolean;
}

export function Chip({
  children,
  onClick,
  className = "",
  variant = "default",
  icon,
  title,
  multiline = false,
}: ChipProps) {
  const base =
    "inline-flex items-center gap-2 rounded-xs px-3 py-1 text-sm font-semibold transition-all duration-200 select-none focus:outline-none";

  const variantStyles: Record<ChipVariants, string> = {
    default:
      "bg-gray-50/60 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-800 hover:ring-1 hover:ring-gray-200 hover:ring-offset-1 hover:ring-offset-white dark:hover:ring-offset-gray-900 active:bg-gray-200 dark:bg-gray-800/60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:hover:text-gray-100 dark:active:bg-gray-600 focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900",
    primary:
      "bg-blue-500 border-2 border-blue-600 text-white shadow-sm shadow-blue-500/30 hover:shadow-md hover:shadow-blue-500/40 hover:ring-2 hover:ring-blue-300 hover:ring-offset-1 hover:ring-offset-white dark:hover:ring-offset-gray-900 active:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 dark:bg-blue-600 dark:border-blue-500 dark:hover:ring-blue-500/50",
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      title={title}
      className={cn(
        base,
        variantStyles[variant],
        {
          "cursor-pointer": onClick,
        },
        className,
      )}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      <span className={multiline ? "text-clip" : "truncate"}>{children}</span>
    </div>
  );
}
