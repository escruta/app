import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  createContext,
  useContext,
  cloneElement,
  type ReactNode,
  type ReactElement,
  type HTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { useShortcut, useAccessibility } from "@/hooks";
import { readClipboardText, writeClipboardText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/motion";
import { motion, AnimatePresence } from "motion/react";
import { CopyIcon, CutIcon, PasteIcon } from "@/components/icons";

interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  target?: HTMLInputElement | HTMLTextAreaElement | null;
}

const TEXT_INPUT_TYPES = new Set(["", "text", "search", "email", "password", "url", "tel"]);

function isTextField(target: EventTarget | null): target is HTMLInputElement | HTMLTextAreaElement {
  if (target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLInputElement) return TEXT_INPUT_TYPES.has(target.type);
  return false;
}

function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement;
  const descriptor = Object.getOwnPropertyDescriptor(proto.prototype, "value");
  descriptor?.set?.call(el, value);
}

function replaceRange(
  el: HTMLInputElement | HTMLTextAreaElement,
  start: number,
  end: number,
  replacement: string,
) {
  const next = el.value.slice(0, start) + replacement + el.value.slice(end);
  el.focus();
  setNativeValue(el, next);
  const caret = start + replacement.length;
  el.setSelectionRange(caret, caret);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

interface ContextMenuContextType {
  state: ContextMenuState;
  setState: (s: ContextMenuState) => void;
  close: () => void;
  contentRef: React.RefObject<HTMLElement | null>;
}

const ContextMenuContext = createContext<ContextMenuContextType | null>(null);

const CompactContext = createContext<boolean>(false);

function getEnabledMenuItems(container: HTMLElement | null): HTMLButtonElement[] {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])'),
  );
}

export function ContextMenu({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ContextMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
  });
  const contentRef = useRef<HTMLElement>(null);

  const close = useCallback(() => {
    setState({ isOpen: false, position: { x: 0, y: 0 } });
  }, []);

  useShortcut("dialog-close", close, {
    global: true,
    enabled: state.isOpen,
    preventDefault: false,
  });

  useEffect(() => {
    if (!state.isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!contentRef.current?.contains(target)) {
        close();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [state.isOpen, close]);

  return (
    <ContextMenuContext.Provider value={{ state, setState, close, contentRef }}>
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
    "data-context-menu-trigger": true,
    onContextMenu: (e: React.MouseEvent<HTMLElement>) => {
      if (disabled) return;
      children.props.onContextMenu?.(e);
      e.preventDefault();
      e.stopPropagation();
      context.setState({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
      });
    },
    className: cn(children.props.className, className),
  } as HTMLAttributes<HTMLElement>);
}

export function ContextMenuContent({
  children,
  className,
  compact = false,
}: {
  children: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  const context = useContext(ContextMenuContext);
  const { effectiveReducedMotion } = useAccessibility();
  const [placedUp, setPlacedUp] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState<{
    top?: number;
    left?: number;
    bottom?: number;
    right?: number;
  }>({});
  const localRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(() => {
    if (!localRef.current || !context?.state.isOpen) return;
    const menuRect = localRef.current.getBoundingClientRect();
    const { x, y } = context.state.position;
    const gap = 6;
    const viewportPadding = 8;

    const pos: typeof adjustedPosition = {};
    const spaceBelow = window.innerHeight - y - gap;
    const spaceAbove = y - gap;
    const spaceRight = window.innerWidth - x - gap;

    let resolvedUp = false;
    if (spaceBelow >= menuRect.height || spaceBelow >= spaceAbove) {
      pos.top = Math.max(
        viewportPadding,
        Math.min(y + gap, window.innerHeight - menuRect.height - viewportPadding),
      );
    } else {
      pos.bottom = Math.max(
        viewportPadding,
        Math.min(
          window.innerHeight - y + gap,
          window.innerHeight - menuRect.height - viewportPadding,
        ),
      );
      resolvedUp = true;
    }

    if (spaceRight >= menuRect.width || spaceRight >= x - gap) {
      pos.left = Math.max(
        viewportPadding,
        Math.min(x + gap, window.innerWidth - menuRect.width - viewportPadding),
      );
    } else {
      pos.right = Math.max(
        viewportPadding,
        Math.min(window.innerWidth - x + gap, window.innerWidth - menuRect.width - viewportPadding),
      );
    }

    setPlacedUp(resolvedUp);
    setAdjustedPosition(pos);
  }, [context?.state.isOpen, context?.state.position]);

  useLayoutEffect(() => {
    if (context?.state.isOpen) {
      calculatePosition();
    } else {
      setAdjustedPosition({});
      setPlacedUp(false);
    }
  }, [context?.state.isOpen, context?.state.position, calculatePosition]);

  useEffect(() => {
    if (!context?.state.isOpen) return;
    const el = localRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      calculatePosition();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [context?.state.isOpen, calculatePosition]);

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

  useEffect(() => {
    if (!context?.state.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const items = getEnabledMenuItems(localRef.current);
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
        case "Tab":
          context.close();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [context]);

  const setContentRef = useCallback(
    (node: HTMLDivElement | null) => {
      localRef.current = node;
      if (context) {
        (context.contentRef as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    },
    [context],
  );

  if (!context) return null;

  const fallbackPos = {
    top: context.state.position.y + 6,
    left: context.state.position.x + 6,
  };

  const menu = (
    <AnimatePresence>
      {context.state.isOpen && (
        <motion.div
          ref={setContentRef}
          role="menu"
          initial={effectiveReducedMotion ? false : { opacity: 0, y: placedUp ? 6 : -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={effectiveReducedMotion ? undefined : { opacity: 0, y: placedUp ? 6 : -6 }}
          transition={effectiveReducedMotion ? { duration: 0 } : { duration: 0.14, ease: EASE_OUT }}
          style={{
            position: "fixed",
            zIndex: 1000,
            ...(Object.keys(adjustedPosition).length > 0 ? adjustedPosition : fallbackPos),
          }}
          onMouseDown={(e) => e.preventDefault()}
          className={cn(
            "max-h-60 w-max max-w-xs overflow-auto rounded-xs sm:max-w-sm",
            "border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900",
            "shadow-lg ring-1 shadow-gray-950/10 ring-black/5 dark:shadow-black/40 dark:ring-white/5",
            compact ? "min-w-28" : "min-w-36",
            className,
          )}
        >
          <CompactContext.Provider value={compact}>
            <div className={cn("flex flex-col gap-0.5", compact ? "p-1" : "p-1.5")}>{children}</div>
          </CompactContext.Provider>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(menu, document.body);
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
  const compact = useContext(CompactContext);

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

  const baseStyles = compact
    ? "relative flex w-full items-center gap-1.5 rounded-xs px-2 py-1 text-left text-xs font-medium transition-colors duration-150 outline-none select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
    : "relative flex w-full items-center gap-2 rounded-xs px-3 py-2 text-left text-sm font-medium transition-colors duration-150 outline-none select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";

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
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => {
        if (disabled) return;
        onClick();
        context?.close();
      }}
      onKeyDown={handleKeyDown}
    >
      {icon && (
        <span
          className={cn("flex shrink-0 items-center justify-center [&_svg]:shrink-0", {
            "size-3.5 [&_svg]:size-3.5": compact,
            "size-4 [&_svg]:size-4": !compact,
          })}
        >
          {icon}
        </span>
      )}
      <span className="flex-1 truncate text-left">{label}</span>
    </button>
  );
}

function ContextMenuCopy({
  label = "Copy",
  icon,
  className,
  onCopied,
}: {
  label?: string;
  icon?: ReactNode;
  className?: string;
  onCopied?: (text: string) => void;
}) {
  const [hasSelection, setHasSelection] = useState(false);

  useEffect(() => {
    const update = () => {
      const sel = window.getSelection();
      setHasSelection(!!sel && sel.toString().trim().length > 0);
    };
    update();
    document.addEventListener("selectionchange", update);
    return () => document.removeEventListener("selectionchange", update);
  }, []);

  const handleCopy = () => {
    const sel = window.getSelection();
    const text = sel?.toString() ?? "";
    if (!text) return;
    void writeClipboardText(text).catch((e) => {
      console.warn("Clipboard write failed:", e);
    });
    onCopied?.(text);
  };

  return (
    <ContextMenuItem
      label={label}
      icon={icon ?? <CopyIcon className="size-full" />}
      onClick={handleCopy}
      disabled={!hasSelection}
      className={className}
    />
  );
}

function TextFieldContextMenuItems() {
  const context = useContext(ContextMenuContext);
  const target = context?.state.target ?? null;
  const start = target?.selectionStart ?? 0;
  const end = target?.selectionEnd ?? 0;
  const text = target ? target.value.slice(start, end) : "";
  const hasSelection = text.length > 0;
  const isEditable = !!target && !target.readOnly && !target.disabled;

  const handleCopy = useCallback(async () => {
    if (!target || !hasSelection) return;
    try {
      await writeClipboardText(text);
    } catch (e) {
      console.warn("Clipboard write failed:", e);
    }
  }, [target, hasSelection, text]);

  const handleCut = useCallback(async () => {
    if (!target || !hasSelection || !isEditable) return;
    await handleCopy();
    replaceRange(target, start, end, "");
  }, [target, hasSelection, isEditable, handleCopy, start, end]);

  const handlePaste = useCallback(async () => {
    if (!target || !isEditable) return;
    try {
      const clipboardText = await readClipboardText();
      if (!clipboardText) {
        target.focus();
        return;
      }
      replaceRange(target, start, end, clipboardText);
    } catch (e) {
      console.warn("Clipboard read failed:", e);
      target.focus();
    }
  }, [target, isEditable, start, end]);

  return (
    <>
      <ContextMenuItem
        label="Cut"
        icon={<CutIcon className="size-full" />}
        onClick={handleCut}
        disabled={!hasSelection || !isEditable}
      />
      <ContextMenuItem
        label="Copy"
        icon={<CopyIcon className="size-full" />}
        onClick={handleCopy}
        disabled={!hasSelection}
      />
      <ContextMenuItem
        label="Paste"
        icon={<PasteIcon className="size-full" />}
        onClick={handlePaste}
        disabled={!isEditable}
      />
    </>
  );
}

function SyntheticTrigger() {
  const context = useContext(ContextMenuContext);

  useEffect(() => {
    if (!context) return;
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;

      if (target?.closest("[data-context-menu-trigger], .ProseMirror")) {
        context.close();
        return;
      }

      if (isTextField(target)) {
        e.preventDefault();
        if (!target.disabled && document.activeElement !== target) {
          target.focus({ preventScroll: true });
        }
        context.setState({
          isOpen: true,
          position: { x: e.clientX, y: e.clientY },
          target,
        });
        return;
      }

      if (target?.closest("input, textarea, [contenteditable='true']")) {
        context.close();
        return;
      }

      const sel = window.getSelection();
      const selText = sel?.toString().trim() ?? "";

      if (!selText) return;

      e.preventDefault();
      context.setState({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
      });
    };

    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, [context]);

  return null;
}

function TextFieldAwareItems({ children }: { children?: ReactNode }) {
  const context = useContext(ContextMenuContext);
  if (context?.state.target) return <TextFieldContextMenuItems />;
  return <>{children ?? <ContextMenuCopy />}</>;
}

export function GlobalContextMenu({ children }: { children?: ReactNode }) {
  return (
    <ContextMenu>
      <SyntheticTrigger />
      <ContextMenuContent compact>
        <TextFieldAwareItems>{children}</TextFieldAwareItems>
      </ContextMenuContent>
    </ContextMenu>
  );
}
