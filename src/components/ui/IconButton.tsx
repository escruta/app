import { cn } from "@/lib/utils";

type IconButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type IconButtonSize = "xs" | "sm" | "md" | "lg";

type IconButtonProps = Omit<React.ComponentPropsWithRef<"button">, "children"> & {
  icon: React.ReactNode;
  variant?: IconButtonVariant;
  ariaLabel?: string;
  size?: IconButtonSize;
};

const BASE_STYLES =
  "inline-flex shrink-0 items-center justify-center rounded-xs border transition-[background-color,border-color,color,box-shadow] duration-150 select-none focus-visible:outline-none focus-visible:ring-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:shadow-none [&>svg]:shrink-0";

const VARIANT_STYLES: Record<IconButtonVariant, string> = {
  primary:
    "bg-blue-500 border-blue-600 text-white shadow-xs shadow-blue-500/20 hover:bg-blue-600 hover:border-blue-700 active:bg-blue-700 focus-visible:ring-blue-500/35 dark:bg-blue-600 dark:border-blue-500 dark:hover:bg-blue-500 dark:hover:border-blue-400 dark:active:bg-blue-700 dark:focus-visible:ring-blue-400/40",
  secondary:
    "bg-white border-gray-200 text-gray-700 shadow-xs hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100 focus-visible:border-blue-500 focus-visible:ring-blue-500/25 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:border-gray-600 dark:hover:text-white dark:active:bg-gray-700 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400/25",
  danger:
    "bg-red-500 border-red-600 text-white shadow-xs shadow-red-500/20 hover:bg-red-600 hover:border-red-700 active:bg-red-700 focus-visible:ring-red-500/35 dark:bg-red-600 dark:border-red-500 dark:hover:bg-red-500 dark:hover:border-red-400 dark:active:bg-red-700 dark:focus-visible:ring-red-400/40",
  ghost:
    "bg-transparent border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 focus-visible:border-blue-500/70 focus-visible:ring-blue-500/25 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 dark:active:bg-gray-700 dark:focus-visible:border-blue-400/70 dark:focus-visible:ring-blue-400/25",
};

const SIZE_STYLES: Record<IconButtonSize, string> = {
  xs: "size-6 p-1",
  sm: "size-8 p-1.5",
  md: "size-10 p-2.5",
  lg: "size-12 p-3",
};

export function IconButton({
  icon,
  className,
  variant = "primary",
  disabled = false,
  ariaLabel,
  size = "md",
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={cn(BASE_STYLES, VARIANT_STYLES[variant], SIZE_STYLES[size], className)}
      disabled={disabled}
      aria-label={ariaLabel ?? props["aria-label"]}
    >
      {icon}
    </button>
  );
}
