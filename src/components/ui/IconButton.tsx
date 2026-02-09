import { cn } from "@/lib/utils";

type IconButtonProps = {
  icon: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  ariaLabel?: string;
  size?: "xs" | "sm" | "md" | "lg";
  tabIndex?: number;
};

export function IconButton({
  icon,
  onClick,
  className = "",
  variant = "primary",
  disabled = false,
  ariaLabel,
  size = "md",
  tabIndex,
}: IconButtonProps) {
  const baseStyles =
    "flex items-center justify-center rounded-xs transition-all duration-200 select-none focus:outline-none cursor-pointer";

  const variantStyles = {
    primary:
      "bg-blue-500 border-2 border-blue-600 text-white shadow-sm shadow-blue-500/30 hover:shadow-md hover:shadow-blue-500/40 hover:ring-2 hover:ring-blue-300 hover:ring-offset-1 hover:ring-offset-white dark:hover:ring-offset-gray-900 active:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 dark:bg-blue-600 dark:border-blue-500 dark:hover:ring-blue-500/50",
    secondary:
      "bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:ring-1 hover:ring-gray-200 hover:ring-offset-1 hover:ring-offset-white dark:hover:ring-offset-gray-900 active:bg-gray-100 dark:active:bg-gray-800 focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 dark:bg-gray-900/50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/50 dark:hover:border-gray-600",
    danger:
      "bg-red-500 border-2 border-red-600 text-white shadow-sm shadow-red-500/30 hover:shadow-md hover:shadow-red-500/40 hover:ring-2 hover:ring-red-300 hover:ring-offset-1 hover:ring-offset-white dark:hover:ring-offset-gray-900 active:bg-red-600 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 dark:bg-red-600 dark:border-red-500 dark:hover:ring-red-500/50",
    ghost:
      "bg-transparent border border-gray-300 text-gray-600 hover:border-gray-500 hover:bg-gray-50 hover:ring-1 hover:ring-gray-400 hover:ring-offset-1 hover:ring-offset-white dark:hover:ring-offset-gray-900 active:bg-gray-100 dark:active:bg-gray-800/50 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800/30 dark:hover:border-gray-500",
  };

  const sizeStyles = {
    xs: "size-6 p-1",
    sm: "size-8 p-1.5",
    md: "size-10 p-2.5",
    lg: "size-12 p-3",
  };

  const disabledStyles = "opacity-50 cursor-not-allowed pointer-events-none";

  return (
    <button
      onClick={onClick}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        {
          [disabledStyles]: disabled,
        },
        className,
      )}
      type="button"
      disabled={disabled}
      aria-label={ariaLabel}
      tabIndex={tabIndex}
    >
      {icon}
    </button>
  );
}
