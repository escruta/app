import { CheckIcon, CloseIcon, InfoIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { ComponentType } from "react";

type AlertVariant = "danger" | "warning" | "info" | "success";

interface AlertProps {
  message: string;
  variant?: AlertVariant;
  className?: string;
}

export function Alert({ message, variant = "info", className = "" }: AlertProps) {
  const variantStyles: Record<
    AlertVariant,
    {
      container: string;
      message: string;
      icon: ComponentType<IconProps>;
    }
  > = {
    danger: {
      container:
        "bg-red-50/50 dark:bg-red-950/20 border-l-4 border-l-red-500 dark:border-l-red-400",
      message: "text-red-800 dark:text-red-200",
      icon: CloseIcon,
    },
    warning: {
      container:
        "bg-yellow-50/50 dark:bg-yellow-950/20 border-l-4 border-l-yellow-500 dark:border-l-yellow-400",
      message: "text-yellow-800 dark:text-yellow-200",
      icon: InfoIcon,
    },
    info: {
      container:
        "bg-blue-50/50 dark:bg-blue-950/20 border-l-4 border-l-blue-500 dark:border-l-blue-400",
      message: "text-blue-800 dark:text-blue-200",
      icon: InfoIcon,
    },
    success: {
      container:
        "bg-green-50/50 dark:bg-green-950/20 border-l-4 border-l-green-500 dark:border-l-green-400",
      message: "text-green-800 dark:text-green-200",
      icon: CheckIcon,
    },
  };

  const styles = variantStyles[variant];
  const Icon = styles.icon;

  return (
    <div
      className={cn("flex gap-3 px-4 py-3 rounded-r-xs", styles.container, className)}
      role="alert"
    >
      <Icon className={cn("size-5 shrink-0", styles.message)} />
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium", styles.message)}>{message}</p>
      </div>
    </div>
  );
}
