import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui";
import { CloseIcon } from "@/components/icons";
import type { JobStatus } from "@/interfaces";

interface ToolCardProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  status?: JobStatus | null;
  hasResult?: boolean;
  onViewResult?: () => void;
}

export function ToolCard({
  icon,
  title,
  description,
  onClick,
  disabled = false,
  className,
  status,
  hasResult,
  onViewResult,
}: ToolCardProps) {
  const isLoading = status === "PENDING" || status === "PROCESSING";
  const isCompleted = status === "COMPLETED";
  const isFailed = status === "FAILED";

  const baseClasses = `
    group relative overflow-hidden rounded-xs border cursor-pointer 
    transition-all duration-300 ease-out select-none
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 
    dark:focus:ring-offset-gray-900
    bg-white dark:bg-gray-800
    border-gray-200 dark:border-gray-600
    hover:bg-blue-50 dark:hover:bg-gray-700
    hover:border-blue-300 dark:hover:border-gray-500
  `;

  const loadingClasses = `
    border-blue-300 dark:border-blue-600
    bg-blue-50/50 dark:bg-blue-950/30
  `;

  const completedClasses = `
    border-green-300 dark:border-green-600
    bg-green-50/50 dark:bg-green-950/30
  `;

  const failedClasses = `
    border-red-300 dark:border-red-600
    bg-red-50/50 dark:bg-red-950/30
  `;

  const disabledClasses = `
    opacity-50 cursor-not-allowed 
    !hover:bg-white !dark:hover:bg-gray-800
    !hover:border-gray-200 !dark:hover:border-gray-600
  `;

  function handleClick() {
    if (disabled || isLoading) return;

    if (hasResult && onViewResult) {
      onViewResult();
    } else {
      onClick?.();
    }
  }

  return (
    <div
      className={cn(
        baseClasses,
        {
          [disabledClasses]: disabled || isLoading,
          [loadingClasses]: isLoading,
          [completedClasses]: isCompleted && hasResult,
          [failedClasses]: isFailed,
        },
        className,
      )}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (!disabled && !isLoading && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          handleClick();
        }
      }}
      tabIndex={disabled || isLoading ? -1 : 0}
      role="button"
      aria-disabled={disabled || isLoading}
    >
      <div className="relative p-3 h-full flex items-center gap-3">
        <div
          className={cn("shrink-0 p-2 rounded-xs transition-all duration-300", {
            "bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-800":
              !isLoading && !isCompleted && !isFailed,
            "bg-blue-100 dark:bg-blue-800": isLoading,
            "bg-green-100 dark:bg-green-800": isCompleted && hasResult,
            "bg-red-100 dark:bg-red-800": isFailed,
          })}
        >
          {isLoading ? (
            <div className="size-4">
              <Spinner size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
          ) : isCompleted && hasResult ? (
            <div className="size-4 text-green-600 dark:text-green-400">
              {icon}
            </div>
          ) : isFailed ? (
            <div className="size-4 text-red-600 dark:text-red-400">
              <CloseIcon />
            </div>
          ) : (
            <div
              className={cn(
                "size-4 transition-all duration-300",
                "text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400",
              )}
            >
              {icon}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 justify-center gap-0.5">
          <h3
            className={cn(
              "font-medium text-sm leading-tight transition-colors duration-300",
              {
                "text-gray-900 dark:text-gray-100 group-hover:text-blue-900 dark:group-hover:text-blue-100":
                  !isLoading && !isCompleted && !isFailed,
                "text-blue-700 dark:text-blue-300": isLoading,
                "text-green-700 dark:text-green-300": isCompleted && hasResult,
                "text-red-700 dark:text-red-300": isFailed,
              },
            )}
          >
            {title}
          </h3>
          <p
            className={cn(
              "text-xs leading-tight transition-colors duration-300 truncate",
              {
                "text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300":
                  !isLoading && !isCompleted && !isFailed,
                "text-blue-600 dark:text-blue-400": isLoading,
                "text-green-600 dark:text-green-400": isCompleted && hasResult,
                "text-red-600 dark:text-red-400": isFailed,
              },
            )}
          >
            {isLoading
              ? "Generating..."
              : isCompleted && hasResult
                ? "Ready!"
                : isFailed
                  ? "Failed."
                  : description}
          </p>
        </div>
      </div>
    </div>
  );
}
