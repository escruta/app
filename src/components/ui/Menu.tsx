import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
  useId,
  createContext,
  useContext,
  cloneElement,
  type ReactNode,
  type KeyboardEvent,
  type ReactElement,
  type HTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { useShortcut, useAccessibility } from "@/hooks";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/motion";
import { motion, AnimatePresence } from "motion/react";

interface MenuContextType {
  isOpen: boolean;
  setIsOpen: (o: boolean) => void;
  close: (focusTrigger?: boolean) => void;
  openWithFocus: (target: "first" | "last") => void;
  pendingFocusRef: React.MutableRefObject<"first" | "last" | null>;
  triggerRef: React.RefObject<HTMLElement | null>;
  contentRef: React.RefObject<HTMLElement | null>;
  menuId: string;
}

const MenuContext = createContext<MenuContextType | null>(null);

export function Menu({ children, className }: { children: ReactNode; className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLElement>(null);
  const pendingFocusRef = useRef<"first" | "last" | null>(null);
  const menuId = `menu-${useId().replace(/:/g, "")}`;

  const close = useCallback((focusTrigger = false) => {
    pendingFocusRef.current = null;
    setIsOpen(false);
    if (focusTrigger) {
      triggerRef.current?.focus();
    }
  }, []);

  const openWithFocus = useCallback((target: "first" | "last") => {
    pendingFocusRef.current = target;
    setIsOpen(true);
  }, []);

  useShortcut("dialog-close", () => close(true), {
    global: true,
    enabled: isOpen,
    preventDefault: false,
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const isInsideTrigger = menuRef.current?.contains(target);
      const isInsideContent = contentRef.current?.contains(target);
      if (!isInsideTrigger && !isInsideContent) {
        close();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, close]);

  return (
    <MenuContext.Provider
      value={{
        isOpen,
        setIsOpen,
        close,
        openWithFocus,
        pendingFocusRef,
        triggerRef,
        contentRef,
        menuId,
      }}
    >
      <div className={cn("relative inline-block", className)} ref={menuRef}>
        {children}
      </div>
    </MenuContext.Provider>
  );
}

export function MenuTrigger({
  children,
  className,
}: {
  children: ReactElement<HTMLAttributes<HTMLElement>>;
  className?: string;
}) {
  const context = useContext(MenuContext);
  const localRef = useRef<HTMLSpanElement>(null);

  const handleActivateKeyDown = useShortcut(
    "dialog-activate",
    () => {
      if (!context) return;
      if (context.isOpen) {
        context.close();
      } else {
        context.openWithFocus("first");
      }
    },
    {
      enabled: !!context,
    },
  );

  const setRefs = useCallback(
    (node: HTMLSpanElement | null) => {
      localRef.current = node;
      if (node && context) {
        (context.triggerRef as React.MutableRefObject<HTMLElement | null>).current =
          node.firstChild as HTMLElement;
      }
    },
    [context],
  );

  if (!context) return null;

  return (
    <span ref={setRefs} className={cn("inline-block", className)}>
      {cloneElement(children, {
        onClick: (e: React.MouseEvent<HTMLElement>) => {
          children.props.onClick?.(e);
          context.setIsOpen(!context.isOpen);
        },
        onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
          children.props.onKeyDown?.(e);
          if (e.key === "ArrowDown") {
            e.preventDefault();
            context.openWithFocus("first");
            return;
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            context.openWithFocus("last");
            return;
          }
          handleActivateKeyDown(e);
        },
        "aria-haspopup": "menu",
        "aria-expanded": context.isOpen,
        "aria-controls": context.isOpen ? context.menuId : undefined,
      })}
    </span>
  );
}

function getEnabledMenuItems(container: HTMLElement | null): HTMLButtonElement[] {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])'),
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
  const { effectiveReducedMotion } = useAccessibility();
  const [placedUp, setPlacedUp] = useState(false);
  const [position, setPosition] = useState<{
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  }>({});

  const calculatePosition = useCallback(() => {
    if (!context?.triggerRef?.current) return;
    const rect = context.triggerRef.current.getBoundingClientRect();
    const gap = 6;
    const estimatedMenuHeight = 240;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const pos: typeof position = {};

    let resolvedUp = false;
    if (spaceBelow >= estimatedMenuHeight || spaceBelow >= spaceAbove) {
      pos.top = rect.bottom + gap;
    } else {
      pos.bottom = window.innerHeight - rect.top + gap;
      resolvedUp = true;
    }

    const viewportPadding = 8;
    if (align === "right") {
      pos.right = Math.max(viewportPadding, window.innerWidth - rect.right);
    } else {
      pos.left = Math.max(viewportPadding, rect.left);
    }

    setPlacedUp(resolvedUp);
    setPosition(pos);
  }, [context?.triggerRef, align]);

  useLayoutEffect(() => {
    if (context?.isOpen) {
      calculatePosition();
    }
  }, [context?.isOpen, calculatePosition]);

  useEffect(() => {
    if (!context?.isOpen) return;
    const handleScroll = () => {
      calculatePosition();
    };
    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: true });
      window.removeEventListener("resize", handleScroll);
    };
  }, [context?.isOpen, calculatePosition]);

  useEffect(() => {
    if (!context?.isOpen || !context.pendingFocusRef.current) return;
    const target = context.pendingFocusRef.current;
    context.pendingFocusRef.current = null;
    requestAnimationFrame(() => {
      const items = getEnabledMenuItems(context.contentRef.current);
      if (items.length === 0) return;
      const item = target === "last" ? items[items.length - 1] : items[0];
      item?.focus();
    });
  }, [context]);

  const setContentRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (context) {
        (context.contentRef as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    },
    [context],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!context) return;
    const items = getEnabledMenuItems(context.contentRef.current);
    if (items.length === 0) return;

    const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
        items[nextIndex]?.focus();
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const prevIndex =
          currentIndex < 0 ? items.length - 1 : (currentIndex - 1 + items.length) % items.length;
        items[prevIndex]?.focus();
        break;
      }
      case "Home":
        e.preventDefault();
        items[0]?.focus();
        break;
      case "End":
        e.preventDefault();
        items[items.length - 1]?.focus();
        break;
      case "Escape":
        e.preventDefault();
        context.close(true);
        break;
      case "Tab":
        context.close();
        break;
    }
  };

  if (!context) return null;

  const menu = (
    <AnimatePresence>
      {context.isOpen && (
        <motion.div
          ref={setContentRef}
          id={context.menuId}
          role="menu"
          onKeyDown={handleKeyDown}
          initial={effectiveReducedMotion ? false : { opacity: 0, y: placedUp ? 6 : -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={effectiveReducedMotion ? undefined : { opacity: 0, y: placedUp ? 6 : -6 }}
          transition={effectiveReducedMotion ? { duration: 0 } : { duration: 0.14, ease: EASE_OUT }}
          style={{
            position: "fixed",
            zIndex: 1000,
            ...position,
          }}
          className={cn(
            "max-h-60 w-max max-w-xs min-w-36 overflow-auto rounded-xs sm:max-w-sm",
            "border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900",
            "shadow-lg ring-1 shadow-gray-950/10 ring-black/5 dark:shadow-black/40 dark:ring-white/5",
            className,
          )}
        >
          <div className="flex flex-col gap-0.5 p-1.5">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(menu, document.body);
}

export function MenuLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "px-3 py-1.5 text-[11px] font-semibold tracking-wider text-gray-500 uppercase select-none dark:text-gray-400",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function MenuItem({
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
  const context = useContext(MenuContext);

  const handleKeyDown = useShortcut(
    "dialog-activate",
    () => {
      onClick();
      context?.close();
    },
    {
      enabled: !disabled,
    },
  );

  const baseStyles =
    "relative flex w-full items-center gap-2 rounded-xs px-3 py-2 text-left text-sm font-medium transition-colors duration-150 outline-none select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";

  const variantStyles = {
    default:
      "text-gray-700 dark:text-gray-200 hover:bg-blue-50 hover:text-blue-600 focus-visible:bg-blue-50 focus-visible:text-blue-600 active:bg-blue-100 dark:hover:bg-gray-800 dark:hover:text-blue-400 dark:focus-visible:bg-gray-800 dark:focus-visible:text-blue-400 dark:active:bg-gray-700",
    danger:
      "text-red-600 dark:text-red-400 hover:bg-red-50 focus-visible:bg-red-50 active:bg-red-100 dark:hover:bg-red-950/50 dark:focus-visible:bg-red-950/50 dark:active:bg-red-950/70",
  };

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      className={cn(baseStyles, variantStyles[variant], className)}
      onMouseEnter={() => {
        const active = document.activeElement;
        if (
          active instanceof HTMLElement &&
          context?.contentRef.current?.contains(active) &&
          active.getAttribute("role") === "menuitem"
        ) {
          active.blur();
        }
      }}
      onClick={() => {
        if (disabled) return;
        onClick();
        context?.close();
      }}
      onKeyDown={handleKeyDown}
    >
      {icon && (
        <span className="flex size-4 shrink-0 items-center justify-center [&_svg]:size-4 [&_svg]:shrink-0">
          {icon}
        </span>
      )}
      <span className="flex-1 truncate text-left">{label}</span>
    </button>
  );
}
