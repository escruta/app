import { useShortcut } from "@/hooks";
import { cn } from "@/lib/utils";

type ChipVariant = "default" | "primary";
type ChipSize = "sm" | "md";

interface ChipProps {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: ChipVariant;
  size?: ChipSize;
  icon?: React.ReactNode;
  title?: string;
  multiline?: boolean;
}

const BASE_STYLES =
  "inline-flex items-center rounded-xs border font-semibold focus-visible:outline-none";

const VARIANT_STYLES: Record<ChipVariant, string> = {
  default:
    "bg-gray-50/70 border-gray-200 text-gray-600 dark:bg-gray-800/70 dark:border-gray-700 dark:text-gray-200",
  primary:
    "bg-blue-500 border-blue-600 text-white shadow-xs shadow-blue-500/20 dark:bg-blue-600 dark:border-blue-500",
};

const INTERACTIVE_STYLES: Record<ChipVariant, string> = {
  default:
    "cursor-pointer transition-colors duration-150 select-none hover:bg-gray-100 hover:border-gray-300 hover:text-gray-900 active:bg-gray-200 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:hover:text-white dark:active:bg-gray-600 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/25 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400/25",
  primary:
    "cursor-pointer transition-colors duration-150 select-none hover:bg-blue-600 hover:border-blue-700 active:bg-blue-700 dark:hover:bg-blue-500 dark:hover:border-blue-400 dark:active:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500/35 dark:focus-visible:ring-blue-400/40",
};

const SIZE_STYLES: Record<ChipSize, string> = {
  sm: "gap-1.5 px-2 py-0.5 text-xs",
  md: "gap-2 px-3 py-1 text-sm",
};

export function Chip({
  children,
  onClick,
  className,
  variant = "default",
  size = "md",
  icon,
  title,
  multiline = false,
}: ChipProps) {
  const handleKeyDown = useShortcut(
    "dialog-activate",
    () => {
      onClick?.();
    },
    { enabled: Boolean(onClick) },
  );

  return (
    <span
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      title={title}
      className={cn(
        BASE_STYLES,
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        onClick && INTERACTIVE_STYLES[variant],
        !children && icon && "p-1.5",
        className,
      )}
    >
      {icon && <span className="flex shrink-0 items-center [&>svg]:shrink-0">{icon}</span>}
      {children && <span className={cn(multiline ? "text-clip" : "truncate")}>{children}</span>}
    </span>
  );
}
