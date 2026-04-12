import { useEffect } from "react";
import { motion } from "motion/react";
import { IconButton } from "./IconButton";
import { CloseIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center"
    | "bottom-center";
  icon?: React.ReactNode;
  index?: number;
}

export function Toast({
  message,
  isVisible,
  onClose,
  duration = 5000,
  position = "bottom-right",
  icon,
  index = 0,
}: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [isVisible, duration, onClose]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{
        opacity: 1 - index * 0.15,
        y: -(index * 16),
        scale: 1 - index * 0.05,
        zIndex: 50 - index,
      }}
      exit={{
        opacity: 0,
        scale: 0.9,
        transition: { duration: 0.2, ease: "easeOut" },
      }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      style={{ transformOrigin: "bottom" }}
      className={cn("fixed z-50 max-w-sm w-full px-4", {
        "top-8 right-8": position === "top-right",
        "top-8 left-8": position === "top-left",
        "bottom-8 right-8": position === "bottom-right",
        "bottom-8 left-8": position === "bottom-left",
        "top-8 left-1/2 -translate-x-1/2": position === "top-center",
        "bottom-8 left-1/2 -translate-x-1/2": position === "bottom-center",
      })}
    >
      <div
        className="flex items-center justify-between rounded-xs bg-white p-4 text-gray-900 shadow-lg ring-1 ring-gray-200 dark:bg-gray-900 dark:text-white dark:ring-gray-800"
        role="alert"
      >
        <div className="flex items-center">
          {icon && <span className="mr-3">{icon}</span>}
          <p className="text-sm font-medium">{message}</p>
        </div>
        <IconButton
          icon={<CloseIcon />}
          onClick={onClose}
          variant="ghost"
          size="xs"
          ariaLabel="Close toast"
          className="ml-2"
        />
      </div>
    </motion.div>
  );
}
