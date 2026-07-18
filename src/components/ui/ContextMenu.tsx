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

interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
}

interface ContextMenuContextType {
  state: ContextMenuState;
  setState: (s: ContextMenuState) => void;
  contentRef: React.RefObject<HTMLElement | null>;
}

const ContextMenuContext = createContext<ContextMenuContextType | null>(null);

export function ContextMenu({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ContextMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
  });
  const contentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!state.isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!contentRef.current?.contains(target)) {
        setState({ isOpen: false, position: { x: 0, y: 0 } });
      }
    };

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setState({ isOpen: false, position: { x: 0, y: 0 } });
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [state.isOpen]);

  return (
    <ContextMenuContext.Provider value={{ state, setState, contentRef }}>
      {children}
    </ContextMenuContext.Provider>
  );
}

export function ContextMenuTrigger({
  children,
  className,
  disabled,
}: {
  children: ReactElement<HTMLAttributes<HTMLElement>>;
  className?: string;
  disabled?: boolean;
}) {
  const context = useContext(ContextMenuContext);

  if (!context) return null;

  return cloneElement(children, {
    onContextMenu: (e: React.MouseEvent<HTMLElement>) => {
      if (disabled) return;
      children.props.onContextMenu?.(e);
      e.preventDefault();
      context.setState({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
      });
    },
    className: cn(children.props.className, className),
  });
}

export function ContextMenuContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const context = useContext(ContextMenuContext);
  const [adjustedPosition, setAdjustedPosition] = useState<{
    top?: number;
    left?: number;
    bottom?: number;
    right?: number;
  }>({});
  const localRef = useRef<HTMLDivElement>(null);
  const hasMeasured = useRef(false);

  const calculatePosition = useCallback(() => {
    if (!localRef.current) return;
    const menuRect = localRef.current.getBoundingClientRect();
    const { x, y } = context?.state.position ?? { x: 0, y: 0 };
    const gap = 8;

    const pos: typeof adjustedPosition = {};
    const spaceBelow = window.innerHeight - y - gap;
    const spaceRight = window.innerWidth - x - gap;

    if (spaceBelow >= menuRect.height || spaceBelow >= y) {
      pos.top = y + gap;
    } else {
      pos.bottom = window.innerHeight - y + gap;
    }

    if (spaceRight >= menuRect.width) {
      pos.left = x + gap;
    } else {
      pos.right = window.innerWidth - x + gap;
    }

    setAdjustedPosition(pos);
  }, [context?.state.position]);

  useEffect(() => {
    if (context?.state.isOpen) {
      hasMeasured.current = false;
    }
  }, [context?.state.isOpen]);

  useEffect(() => {
    const el = localRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      calculatePosition();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [calculatePosition]);

  useEffect(() => {
    if (!context?.state.isOpen) return;
    const handleScroll = () => {
      calculatePosition();
    };
    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: true });
      window.removeEventListener("resize", handleScroll);
    };
  }, [context?.state.isOpen, calculatePosition]);

  const setContentRef = useCallback(
    (node: HTMLDivElement | null) => {
      localRef.current = node;
      if (node && context) {
        (context.contentRef as React.MutableRefObject<HTMLElement | null>).current = node;
        if (!hasMeasured.current) {
          hasMeasured.current = true;
          requestAnimationFrame(() => calculatePosition());
        }
      }
    },
    [context, calculatePosition],
  );

  const menu = (
    <AnimatePresence>
      {context?.state.isOpen && (
        <motion.div
          ref={setContentRef}
          role="menu"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          style={{
            position: "fixed",
            ...adjustedPosition,
          }}
          className={cn(
            "z-50 min-w-40 rounded-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-1.5 shadow-lg shadow-gray-500/10 dark:shadow-black/20 ring-1 ring-gray-500/5 dark:ring-gray-500/10",
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

export function ContextMenuLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "px-3 py-1.5 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ContextMenuSeparator({ className }: { className?: string }) {
  return <div className={cn("-mx-1.5 my-1 h-px bg-gray-200 dark:bg-gray-700", className)} />;
}

export function ContextMenuItem({
  label,
  onClick,
  icon,
  variant = "default",
  className,
  disabled,
}: {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  variant?: "default" | "danger";
  className?: string;
  disabled?: boolean;
}) {
  const context = useContext(ContextMenuContext);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
      context?.setState({ isOpen: false, position: { x: 0, y: 0 } });
    }
  };

  const baseStyles =
    "flex w-full items-center gap-2 rounded-xs px-3 py-2 text-sm transition-all duration-200 outline-none select-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";

  const variantStyles = {
    default:
      "text-gray-700 dark:text-gray-200 hover:bg-blue-50 hover:ring-1 hover:ring-blue-300 focus:bg-blue-50 dark:hover:bg-gray-800 dark:focus:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 active:bg-blue-100 dark:active:bg-gray-700",
    danger:
      "text-red-600 dark:text-red-400 hover:bg-red-50 hover:ring-1 hover:ring-red-300 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30 focus:ring-red-500 dark:focus:ring-red-400",
  };

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      className={cn(baseStyles, variantStyles[variant], className)}
      onClick={() => {
        if (disabled) return;
        onClick();
        context?.setState({ isOpen: false, position: { x: 0, y: 0 } });
      }}
      onKeyDown={handleKeyDown}
    >
      {icon && <span className="flex size-4 shrink-0 items-center justify-center">{icon}</span>}
      <span className="flex-1 text-left font-medium">{label}</span>
    </button>
  );
}
