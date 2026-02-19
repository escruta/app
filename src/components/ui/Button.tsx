import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "danger" | "success" | "ghost";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  icon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  type?: "button" | "submit" | "reset";
}

export function Button({
  children,
  onClick,
  className = "",
  variant = "primary",
  disabled = false,
  icon,
  size = "md",
  type = "button",
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-xs font-semibold transition-all duration-200 focus:outline-none select-none whitespace-nowrap cursor-pointer";

  const sizeStyles: Record<"sm" | "md" | "lg", string> = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };

  const iconSizeStyles: Record<"sm" | "md" | "lg", string> = {
    sm: "size-4",
    md: "size-5",
    lg: "size-6",
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      "bg-blue-500 border-2 border-blue-600 text-white shadow-sm shadow-blue-500/30 hover:shadow-md hover:shadow-blue-500/40 hover:ring-2 hover:ring-blue-300 hover:ring-offset-1 hover:ring-offset-white dark:hover:ring-offset-gray-900 active:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 dark:bg-blue-600 dark:border-blue-500 dark:hover:ring-blue-500/50",
    secondary:
      "bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:ring-1 hover:ring-gray-200 hover:ring-offset-1 hover:ring-offset-white dark:hover:ring-offset-gray-900 active:bg-gray-100 dark:active:bg-gray-800 focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 dark:bg-gray-900/50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/50 dark:hover:border-gray-600",
    danger:
      "bg-red-500 border-2 border-red-600 text-white shadow-sm shadow-red-500/30 hover:shadow-md hover:shadow-red-500/40 hover:ring-2 hover:ring-red-300 hover:ring-offset-1 hover:ring-offset-white dark:hover:ring-offset-gray-900 active:bg-red-600 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 dark:bg-red-600 dark:border-red-500 dark:hover:ring-red-500/50",
    success:
      "bg-green-600 border-2 border-green-700 text-white shadow-sm shadow-green-600/30 hover:shadow-md hover:shadow-green-600/40 hover:ring-2 hover:ring-green-300 hover:ring-offset-1 hover:ring-offset-white dark:hover:ring-offset-gray-900 active:bg-green-700 focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 dark:bg-green-600 dark:border-green-500 dark:hover:ring-green-500/50",
    ghost:
      "bg-transparent border-0 text-gray-400 hover:bg-gray-800/30 hover:border-gray-500 hover:ring-1 hover:ring-gray-600 hover:ring-offset-1 hover:ring-offset-gray-900 active:bg-gray-800/50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900",
  };

  const disabledStyles =
    "opacity-50 cursor-not-allowed pointer-events-none shadow-none ring-0 hover:ring-0";

  return (
    <button
      onClick={onClick}
      className={cn(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        className,
        {
          [disabledStyles]: disabled,
        },
      )}
      type={type}
      disabled={disabled}
    >
      {icon && (
        <span
          className={cn(
            "mr-2 flex items-center justify-center",
            iconSizeStyles[size],
          )}
        >
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}
