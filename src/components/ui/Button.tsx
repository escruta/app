import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "danger" | "success" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = Omit<React.ComponentPropsWithRef<"button">, "children" | "onClick"> & {
  children: React.ReactNode;
  onClick?: (() => void) | React.MouseEventHandler<HTMLButtonElement>;
  variant?: ButtonVariant;
  icon?: React.ReactNode;
  size?: ButtonSize;
};

const BASE_STYLES =
  "inline-flex items-center justify-center rounded-xs border font-semibold transition-[background-color,border-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 select-none whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:shadow-none";

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 px-3 text-xs",
  md: "h-10 gap-2 px-4 text-sm",
  lg: "h-12 gap-2 px-6 text-base",
};

const ICON_SIZE_STYLES: Record<ButtonSize, string> = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
};

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-500 border-blue-600 text-white shadow-xs shadow-blue-500/20 hover:bg-blue-600 hover:border-blue-700 active:bg-blue-700 focus-visible:ring-blue-500/35 dark:bg-blue-600 dark:border-blue-500 dark:hover:bg-blue-500 dark:hover:border-blue-400 dark:active:bg-blue-700 dark:focus-visible:ring-blue-400/40",
  secondary:
    "bg-white border-gray-200 text-gray-700 shadow-xs hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100 focus-visible:border-blue-500 focus-visible:ring-blue-500/25 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:border-gray-600 dark:hover:text-white dark:active:bg-gray-700 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400/25",
  danger:
    "bg-red-500 border-red-600 text-white shadow-xs shadow-red-500/20 hover:bg-red-600 hover:border-red-700 active:bg-red-700 focus-visible:ring-red-500/35 dark:bg-red-600 dark:border-red-500 dark:hover:bg-red-500 dark:hover:border-red-400 dark:active:bg-red-700 dark:focus-visible:ring-red-400/40",
  success:
    "bg-green-600 border-green-700 text-white shadow-xs shadow-green-600/20 hover:bg-green-700 hover:border-green-800 active:bg-green-800 focus-visible:ring-green-600/35 dark:bg-green-600 dark:border-green-500 dark:hover:bg-green-500 dark:hover:border-green-400 dark:active:bg-green-700 dark:focus-visible:ring-green-400/40",
  ghost:
    "bg-transparent border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 focus-visible:border-blue-500/70 focus-visible:ring-blue-500/25 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 dark:active:bg-gray-700 dark:focus-visible:border-blue-400/70 dark:focus-visible:ring-blue-400/25",
};

export function Button({
  children,
  onClick,
  className,
  variant = "primary",
  disabled = false,
  icon,
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      onClick={onClick as React.MouseEventHandler<HTMLButtonElement> | undefined}
      className={cn(BASE_STYLES, SIZE_STYLES[size], VARIANT_STYLES[variant], className)}
      type={type}
      disabled={disabled}
    >
      {icon && (
        <span
          className={cn(
            "flex shrink-0 items-center justify-center [&>svg]:size-full",
            ICON_SIZE_STYLES[size],
          )}
        >
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}
