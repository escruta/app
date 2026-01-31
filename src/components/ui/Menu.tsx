import {
  useState,
  useRef,
  useEffect,
  useCallback,
  createContext,
  useContext,
  cloneElement,
  type ReactNode,
  type KeyboardEvent,
  type ReactElement,
  type HTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface MenuContextType {
  isOpen: boolean;
  setIsOpen: (o: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  contentRef: React.RefObject<HTMLElement | null>;
}

const MenuContext = createContext<MenuContextType | null>(null);

export function Menu({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const isInsideTrigger = menuRef.current?.contains(target);
      const isInsideContent = contentRef.current?.contains(target);
      if (!isInsideTrigger && !isInsideContent) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <MenuContext.Provider value={{ isOpen, setIsOpen, triggerRef, contentRef }}>
      <div className={cn("relative inline-block", className)} ref={menuRef}>
        {children}
      </div>
    </MenuContext.Provider>
  );
}

export function MenuTrigger({
  children,
}: {
  children: ReactElement<HTMLAttributes<HTMLElement>>;
}) {
  const context = useContext(MenuContext);
  const localRef = useRef<HTMLSpanElement>(null);

  const setRefs = useCallback(
    (node: HTMLSpanElement | null) => {
      localRef.current = node;
      if (node && context) {
        (
          context.triggerRef as React.MutableRefObject<HTMLElement | null>
        ).current = node.firstChild as HTMLElement;
      }
    },
    [context],
  );

  if (!context) return null;

  return (
    <span ref={setRefs} className="inline-block">
      {cloneElement(children, {
        onClick: (e: React.MouseEvent<HTMLElement>) => {
          children.props.onClick?.(e);
          context.setIsOpen(!context.isOpen);
        },
        onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
          children.props.onKeyDown?.(e);
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            context.setIsOpen(true);
          }
        },
        "aria-haspopup": "menu",
        "aria-expanded": context.isOpen,
      })}
    </span>
  );
}

export function MenuContent({
  children,
  align = "right",
  className,
}: {
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  const context = useContext(MenuContext);
  const [position, setPosition] = useState({ top: 0, left: 0, right: 0 });

  useEffect(() => {
    if (context?.triggerRef?.current && context?.isOpen) {
      const rect = context.triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        right: window.innerWidth - rect.right - window.scrollX,
      });
    }
  }, [context?.triggerRef, context?.isOpen]);

  const setContentRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node && context) {
        (
          context.contentRef as React.MutableRefObject<HTMLElement | null>
        ).current = node;
      }
    },
    [context],
  );

  if (!context?.isOpen) return null;

  const menu = (
    <AnimatePresence>
      {context?.isOpen && (
        <motion.div
          ref={setContentRef}
          role="menu"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{
            position: "fixed",
            top: position.top,
            ...(align === "right"
              ? { right: position.right }
              : { left: position.left }),
          }}
          className={cn(
            "z-[9999] min-w-[10rem] rounded-xs border border-gray-200 bg-white/95 p-1.5 shadow-lg backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/95",
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(menu, document.body);
}

export function MenuItem({
  label,
  onClick,
  icon,
  variant = "default",
  className,
}: {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  variant?: "default" | "danger";
  className?: string;
}) {
  const context = useContext(MenuContext);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
      context?.setIsOpen(false);
    }
  };

  const baseStyles =
    "flex w-full items-center gap-2 rounded-xs px-3 py-2 text-sm transition-all duration-200 outline-none select-none";

  const variantStyles = {
    default:
      "text-gray-700 dark:text-gray-200 hover:bg-blue-50 focus:bg-blue-50 dark:hover:bg-gray-700 dark:focus:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 active:bg-blue-100 dark:active:bg-gray-600",
    danger:
      "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30",
  };

  return (
    <button
      type="button"
      role="menuitem"
      className={cn(baseStyles, variantStyles[variant], className)}
      onClick={() => {
        onClick();
        context?.setIsOpen(false);
      }}
      onKeyDown={handleKeyDown}
    >
      {icon && (
        <span className="flex-shrink-0 size-4 flex items-center justify-center">
          {icon}
        </span>
      )}
      <span className="flex-1 text-left font-medium">{label}</span>
    </button>
  );
}
