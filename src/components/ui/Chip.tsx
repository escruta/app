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
    "inline-flex items-center gap-2 rounded-xs px-3 py-1 text-sm font-medium transition-all duration-200 select-none focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900";

  const variantStyles: Record<ChipVariants, string> = {
    default:
      "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800 active:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-100 dark:active:bg-gray-600 focus:ring-blue-400 border border-gray-200 dark:border-gray-700",
    primary:
      "bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 dark:active:bg-blue-800 focus:ring-blue-500",
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
      className={cn(base, variantStyles[variant], className)}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      <span className={multiline ? "text-clip" : "truncate"}>{children}</span>
    </div>
  );
}
