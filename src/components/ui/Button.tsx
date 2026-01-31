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
    "group relative inline-flex items-center justify-center overflow-hidden rounded-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 select-none whitespace-nowrap";

  const sizeStyles: Record<"sm" | "md" | "lg", string> = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      "bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700 dark:active:bg-blue-800",
    secondary:
      "bg-gray-100 text-gray-800 hover:bg-gray-200 active:bg-gray-300 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:active:bg-gray-500",
    danger:
      "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 focus:ring-red-500 dark:bg-red-600 dark:hover:bg-red-700 dark:active:bg-red-800",
    success:
      "bg-green-600 text-white hover:bg-green-700 active:bg-green-800 focus:ring-green-500 dark:bg-green-600 dark:hover:bg-green-700 dark:active:bg-green-800",
    ghost:
      "bg-transparent text-gray-800 hover:bg-gray-100 active:bg-gray-200 focus:ring-gray-400 dark:text-gray-200 dark:hover:bg-gray-800 dark:active:bg-gray-700",
  };

  const disabledStyles = "opacity-50 cursor-not-allowed pointer-events-none";

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
        <span className="mr-2 flex items-center justify-center size-5">
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}
