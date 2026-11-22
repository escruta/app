import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useAnimate } from "motion/react";
import { IconButton } from "./IconButton";
import { CloseIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/motion";
import { useIsMobile, useVisualViewportHeight, useShortcut, useAccessibility } from "@/hooks";
import { Tooltip } from "./Tooltip";

const modalListeners = new Set<() => void>();
const openModals: string[] = [];

function syncBodyScrollLock() {
  if (typeof document === "undefined") return;
  document.body.style.overflow = openModals.length > 0 ? "hidden" : "";
}

function useModalStack(isOpen: boolean) {
  const id = useId();
  const [index, setIndex] = useState(-1);

  useEffect(() => {
    if (isOpen) {
      if (!openModals.includes(id)) {
        openModals.push(id);
        syncBodyScrollLock();
        modalListeners.forEach((l) => l());
      }
      return () => {
        const idx = openModals.indexOf(id);
        if (idx !== -1) {
          openModals.splice(idx, 1);
          syncBodyScrollLock();
          modalListeners.forEach((l) => l());
        }
      };
    }
  }, [isOpen, id]);

  useEffect(() => {
    const update = () => {
      setIndex(openModals.indexOf(id));
    };
    update();
    modalListeners.add(update);
    return () => {
      modalListeners.delete(update);
    };
  }, [id]);

  return { index: index !== -1 ? index : 0 };
}

type ModalWidth = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

const WIDTH_STYLES: Record<ModalWidth, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-xl",
  xl: "max-w-2xl",
  "2xl": "max-w-3xl",
  "3xl": "max-w-4xl",
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  width?: ModalWidth;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  contentClassname?: string;
  noPadding?: boolean;
  onSubmit?: () => void;
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
  noPadding = false,
  onSubmit,
}: ModalProps) {
  const titleId = useId();
  const isMobile = useIsMobile();
  const { effectiveReducedMotion } = useAccessibility();
  const viewportHeight = useVisualViewportHeight();
  const [scope, animate] = useAnimate();
  const { index } = useModalStack(isOpen);

  const zIndexBackdrop = 60 + index * 10;
  const zIndexContent = 70 + index * 10;

  const maxHeight = isMobile && viewportHeight ? viewportHeight * 0.9 : undefined;

  const canDismiss = closeOnOutsideClick && closeOnEscape;

  const handleClose = async () => {
    if (isMobile && scope.current && !effectiveReducedMotion) {
      await animate(scope.current, { y: "100%" }, { duration: 0.15, ease: EASE_OUT });
    }
    onClose();
  };

  useShortcut("dialog-close", handleClose, {
    global: true,
    enabled: isOpen && closeOnEscape,
    preventDefault: false,
  });

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    onSubmit?.();
  };

  const header = (
    <div className="flex items-center justify-between gap-4 border-b border-gray-200 p-4 dark:border-gray-800">
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 id={titleId} className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
      </div>
      {canDismiss && (
        <Tooltip text="Close">
          <IconButton
            icon={<CloseIcon className="size-4" />}
            onClick={handleClose}
            variant="ghost"
            size="sm"
            ariaLabel="Close modal"
          />
        </Tooltip>
      )}
    </div>
  );

  const contentInner = (
    <>
      <div
        className={cn(
          "overflow-y-auto",
          isMobile ? (onSubmit ? "min-h-0 flex-1" : undefined) : "max-h-96",
          contentClassname,
        )}
      >
        <div className={cn(noPadding ? "h-full" : "p-4")}>{children}</div>
      </div>

      {actions && (
        <div className="flex justify-end gap-3 border-t border-gray-200 p-4 dark:border-gray-800">
          {actions}
        </div>
      )}
    </>
  );

  const body = onSubmit ? (
    <form onSubmit={handleSubmit} className={cn(isMobile && "flex min-h-0 flex-1 flex-col")}>
      {contentInner}
    </form>
  ) : (
    contentInner
  );

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-backdrop"
          className="fixed inset-0 bg-gray-950/30 backdrop-blur-[1px] dark:bg-gray-950/60"
          style={{ zIndex: zIndexBackdrop }}
          initial={effectiveReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={effectiveReducedMotion ? undefined : { opacity: 0 }}
          transition={effectiveReducedMotion ? { duration: 0 } : { duration: 0.15, ease: EASE_OUT }}
          onClick={closeOnOutsideClick ? handleClose : undefined}
        />
      )}

      {isOpen &&
        (isMobile ? (
          <motion.div
            key="modal-content-mobile-wrapper"
            className="pointer-events-none fixed inset-x-0 bottom-0"
            style={{ zIndex: zIndexContent }}
            initial={effectiveReducedMotion ? false : { y: "100%" }}
            animate={{ y: 0 }}
            exit={effectiveReducedMotion ? undefined : { y: "100%" }}
            transition={
              effectiveReducedMotion ? { duration: 0 } : { duration: 0.15, ease: EASE_OUT }
            }
          >
            <motion.div
              ref={scope}
              className="pointer-events-auto flex w-full flex-col border-t border-gray-200 bg-white shadow-xl ring-1 shadow-gray-950/15 ring-black/5 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/50 dark:ring-white/5"
              style={{ maxHeight: maxHeight ?? "90vh" }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              drag={canDismiss ? "y" : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={async (_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) {
                  if (!effectiveReducedMotion) {
                    await animate(scope.current, { y: "100%" }, { duration: 0.1, ease: EASE_OUT });
                  }
                  onClose();
                }
              }}
            >
              {header}
              {body}
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="modal-content-wrapper"
            className="pointer-events-none fixed inset-0 flex items-center justify-center p-20"
            style={{ zIndex: zIndexContent }}
            initial={effectiveReducedMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={effectiveReducedMotion ? undefined : { opacity: 0, y: -8 }}
            transition={
              effectiveReducedMotion ? { duration: 0 } : { duration: 0.15, ease: EASE_OUT }
            }
          >
            <div
              className={cn(
                "pointer-events-auto w-full rounded-xs border border-gray-200 bg-white shadow-xl ring-1 shadow-gray-950/15 ring-black/5 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/50 dark:ring-white/5",
                WIDTH_STYLES[width],
              )}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
            >
              {header}
              {body}
            </div>
          </motion.div>
        ))}
    </AnimatePresence>,
    document.body,
  );
}
