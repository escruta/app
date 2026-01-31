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
    "flex items-center justify-center rounded-xs transition-all duration-200 select-none focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900";

  const variantStyles = {
    primary:
      "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700",
    secondary:
      "bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-400 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700",
    danger:
      "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 dark:bg-red-600 dark:hover:bg-red-700",
    ghost:
      "bg-transparent text-gray-800 hover:bg-gray-100 focus:ring-gray-400 dark:text-gray-200 dark:hover:bg-gray-800",
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
