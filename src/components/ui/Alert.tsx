import { cn } from "@/lib/utils";

type AlertVariant = "danger" | "warning" | "info" | "success";

interface AlertProps {
  title?: string;
  message: string;
  variant?: AlertVariant;
  className?: string;
}

export function Alert({
  title,
  message,
  variant = "info",
  className = "",
}: AlertProps) {
  const variantStyles: Record<
    AlertVariant,
    { container: string; title: string; message: string }
  > = {
    danger: {
      container: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
      title: "text-red-800 dark:text-red-200",
      message: "text-red-600 dark:text-red-300",
    },
    warning: {
      container:
        "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800",
      title: "text-amber-800 dark:text-amber-200",
      message: "text-amber-600 dark:text-amber-300",
    },
    info: {
      container:
        "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
      title: "text-blue-800 dark:text-blue-200",
      message: "text-blue-600 dark:text-blue-300",
    },
    success: {
      container:
        "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
      title: "text-green-800 dark:text-green-200",
      message: "text-green-600 dark:text-green-300",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className={cn("p-4 border rounded-xs", styles.container, className)}
      role="alert"
    >
      {title && (
        <p className={cn("text-sm font-medium", styles.title)}>{title}</p>
      )}
      <p
        className={cn(
          "text-sm",
          {
            "mt-1": title,
          },
          styles.message,
        )}
      >
        {message}
      </p>
    </div>
  );
}
