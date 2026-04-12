import { useState, useCallback } from "react";
import type { ReactNode } from "react";
import { ToastContext, type ToastData, type ToastContextType } from "@/contexts";
import { Toast } from "@/components/ui";
import { AnimatePresence } from "motion/react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (
      message: string,
      type: ToastType = "info",
      options: Partial<Omit<ToastData, "id" | "message" | "type">> = {},
    ) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastData = {
        id,
        message,
        type,
        duration: 5000,
        position: "bottom-right",
        ...options,
      };

      setToasts((prevToasts) => {
        const updated = [...prevToasts, newToast];
        return updated.slice(-3);
      });

      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          hideToast(id);
        }, newToast.duration);
      }
    },
    [hideToast],
  );

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const contextValue: ToastContextType = {
    toasts,
    showToast,
    hideToast,
    clearToasts,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <AnimatePresence>
        {toasts.map((toast, index) => {
          const offset = toasts.length - 1 - index;
          return (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              isVisible={true}
              onClose={() => hideToast(toast.id)}
              duration={toast.duration}
              position={toast.position}
              icon={toast.icon}
              index={offset}
            />
          );
        })}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}
