import { cn } from "@/lib/utils";

type AlertVariant = "danger" | "warning" | "info" | "success";

interface AlertProps {
  title?: string;
  message: string;
  variant?: AlertVariant;
  className?: string;
}

export function Alert({ title, message, variant = "info", className = "" }: AlertProps) {
  const variantStyles: Record<AlertVariant, { container: string; title: string; message: string }> =
    {
      danger: {
        container:
          "bg-red-50/50 dark:bg-red-950/20 border-l-4 border-l-red-500 dark:border-l-red-400",
        title: "text-red-800 dark:text-red-200",
        message: "text-red-600 dark:text-red-300",
      },
      warning: {
        container:
          "bg-amber-50/50 dark:bg-amber-950/20 border-l-4 border-l-amber-500 dark:border-l-amber-400",
        title: "text-amber-800 dark:text-amber-200",
        message: "text-amber-600 dark:text-amber-300",
      },
      info: {
        container:
          "bg-blue-50/50 dark:bg-blue-950/20 border-l-4 border-l-blue-500 dark:border-l-blue-400",
        title: "text-blue-800 dark:text-blue-200",
        message: "text-blue-600 dark:text-blue-300",
      },
      success: {
        container:
          "bg-green-50/50 dark:bg-green-950/20 border-l-4 border-l-green-500 dark:border-l-green-400",
        title: "text-green-800 dark:text-green-200",
        message: "text-green-600 dark:text-green-300",
      },
    };

  const styles = variantStyles[variant];

  return (
    <div
      className={cn("flex items-start gap-3 px-4 py-3 rounded-xs", styles.container, className)}
      role="alert"
    >
      <div className="min-w-0 flex-1">
        {title && <p className={cn("text-sm font-medium", styles.title)}>{title}</p>}
        <p className={cn("text-sm", { "mt-1": title }, styles.message)}>{message}</p>
      </div>
    </div>
  );
}
