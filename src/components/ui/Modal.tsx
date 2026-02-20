import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useAnimate } from "motion/react";
import { IconButton } from "./IconButton";
import { CloseIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useIsMobile, useVisualViewportHeight } from "@/hooks";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  width?: "sm" | "md" | "lg" | "xl";
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  contentClassname?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  actions,
  width = "md",
  closeOnOutsideClick = true,
  closeOnEscape = true,
  contentClassname,
}: ModalProps) {
  const isMobile = useIsMobile();
  const viewportHeight = useVisualViewportHeight();
  const [scope, animate] = useAnimate();

  const maxHeight =
    isMobile && viewportHeight ? viewportHeight * 0.9 : undefined;

  const canDismiss = closeOnOutsideClick && closeOnEscape;

  const handleClose = async () => {
    if (isMobile && scope.current) {
      await animate(
        scope.current,
        { y: "100%" },
        { duration: 0.15, ease: "easeOut" },
      );
    }
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) handleClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeOnEscape]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="modal-backdrop"
        className="fixed inset-0 z-40 bg-black/30 dark:bg-black/60 backdrop-blur-[1px] opacity-60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={closeOnOutsideClick ? handleClose : undefined}
      />

      {isMobile ? (
        <div className="fixed inset-x-0 bottom-0 z-100 pointer-events-none">
          <motion.div
            ref={scope}
            key="modal-content-mobile"
            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 border-x-0 border-b-0 pointer-events-auto flex flex-col shadow-xl shadow-black/20 dark:shadow-black/40 ring-1 ring-gray-500/10 dark:ring-gray-500/20"
            style={{ maxHeight: maxHeight ?? "90vh" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            drag={canDismiss ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={async (_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                await animate(
                  scope.current,
                  { y: "100%" },
                  { duration: 0.1, ease: "easeOut" },
                );
                onClose();
              }
            }}
          >
            <div className="flex items-center justify-between gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col gap-0.5">
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-gray-800 dark:text-white"
                >
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {subtitle}
                  </p>
                )}
              </div>
              {!canDismiss ? null : (
                <IconButton
                  icon={<CloseIcon />}
                  onClick={handleClose}
                  variant="ghost"
                  size="sm"
                  ariaLabel="Close modal"
                />
              )}
            </div>

            <div className={cn("overflow-y-auto", contentClassname)}>
              <div className="p-4">{children}</div>
            </div>

            {actions && (
              <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
                {actions}
              </div>
            )}
          </motion.div>
        </div>
      ) : (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[100] pointer-events-none">
          <motion.div
            key="modal-content"
            className={cn(
              "w-full bg-white dark:bg-gray-900 rounded-xs border border-gray-200 dark:border-gray-800 pointer-events-auto shadow-xl shadow-gray-500/10 dark:shadow-black/30 ring-1 ring-gray-500/10 dark:ring-gray-500/20",
              {
                "max-w-md": width === "sm",
                "max-w-lg": width === "md",
                "max-w-xl": width === "lg",
                "max-w-2xl": width === "xl",
              },
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-center justify-between gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col gap-0.5">
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-gray-800 dark:text-white"
                >
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {subtitle}
                  </p>
                )}
              </div>
              {!canDismiss ? null : (
                <IconButton
                  icon={<CloseIcon />}
                  onClick={onClose}
                  variant="ghost"
                  size="sm"
                  ariaLabel="Close modal"
                />
              )}
            </div>

            <div className={cn("max-h-96 overflow-y-auto", contentClassname)}>
              <div className="p-4">{children}</div>
            </div>

            {actions && (
              <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
                {actions}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
