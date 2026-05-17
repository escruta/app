import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { IconButton } from "./IconButton";
import { CloseIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface CanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  contentClassname?: string;
  width?: "sm" | "md" | "lg" | "xl";
  minHeight?: string;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  fullScreen?: boolean;
}

export function CanvasModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  actions,
  className,
  contentClassname,
  width = "md",
  minHeight,
  closeOnOutsideClick = true,
  closeOnEscape = true,
  fullScreen = false,
}: CanvasModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, closeOnEscape]);

  const canDismiss = closeOnOutsideClick && closeOnEscape;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={cn(
            "absolute inset-0 z-40 flex items-center justify-center",
            fullScreen ? "p-0" : "p-4 md:p-10",
          )}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/15 opacity-5 backdrop-blur-[0.5px] dark:bg-black/60"
            onClick={closeOnOutsideClick ? onClose : undefined}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "relative z-10 w-full flex flex-col bg-white dark:bg-gray-900 shadow-2xl rounded-xs border border-gray-200 dark:border-gray-800",
              fullScreen
                ? "h-full max-w-none rounded-none"
                : cn(
                    {
                      "max-w-md": width === "sm",
                      "max-w-lg": width === "md",
                      "max-w-xl": width === "lg",
                      "max-w-2xl": width === "xl",
                    },
                    minHeight,
                  ),
              className,
            )}
          >
            {title && (
              <div className="flex items-center justify-between gap-4 border-b border-gray-200 p-4 dark:border-gray-700">
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h2>
                  {subtitle && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
                  )}
                </div>
                {canDismiss && (
                  <IconButton
                    icon={<CloseIcon />}
                    onClick={onClose}
                    variant="ghost"
                    size="sm"
                    ariaLabel="Close modal"
                  />
                )}
              </div>
            )}

            <div
              className={cn(
                "overflow-y-auto",
                !title && fullScreen ? "p-0" : "p-4",
                contentClassname,
              )}
            >
              {children}
            </div>

            {actions && (
              <div className="flex justify-end gap-3 border-t border-gray-200 p-4 dark:border-gray-700">
                {actions}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
