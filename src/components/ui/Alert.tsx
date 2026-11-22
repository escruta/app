import { CheckIcon, CloseIcon, InfoIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { ComponentType } from "react";

type AlertVariant = "danger" | "warning" | "info" | "success";

interface AlertProps {
  message: string;
  variant?: AlertVariant;
  className?: string;
}

const ALERT_VARIANTS: Record<
  AlertVariant,
  {
    container: string;
    message: string;
    icon: ComponentType<IconProps>;
  }
> = {
  danger: {
    container:
      "bg-red-50/60 dark:bg-red-950/25 border-red-200/80 dark:border-red-900/60 border-l-red-500 dark:border-l-red-400",
    message: "text-red-800 dark:text-red-200",
    icon: CloseIcon,
  },
  warning: {
    container:
      "bg-yellow-50/60 dark:bg-yellow-950/25 border-yellow-200/80 dark:border-yellow-900/60 border-l-yellow-500 dark:border-l-yellow-400",
    message: "text-yellow-800 dark:text-yellow-200",
    icon: InfoIcon,
  },
  info: {
    container:
      "bg-blue-50/60 dark:bg-blue-950/25 border-blue-200/80 dark:border-blue-900/60 border-l-blue-500 dark:border-l-blue-400",
    message: "text-blue-800 dark:text-blue-200",
    icon: InfoIcon,
  },
  success: {
    container:
      "bg-green-50/60 dark:bg-green-950/25 border-green-200/80 dark:border-green-900/60 border-l-green-500 dark:border-l-green-400",
    message: "text-green-800 dark:text-green-200",
    icon: CheckIcon,
  },
};

export function Alert({ message, variant = "info", className }: AlertProps) {
  const styles = ALERT_VARIANTS[variant];
  const Icon = styles.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xs border border-l-[3px] px-3.5 py-2.5",
        styles.container,
        className,
      )}
      role="alert"
    >
      <Icon aria-hidden="true" className={cn("mt-0.5 size-4 shrink-0", styles.message)} />
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm leading-relaxed font-medium", styles.message)}>{message}</p>
      </div>
    </div>
  );
}
