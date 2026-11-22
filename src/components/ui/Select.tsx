import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { CheckIcon, ChevronIcon } from "@/components/icons";
import { useShortcut, useAccessibility } from "@/hooks";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/motion";
import { IconButton } from "./IconButton";

export interface SelectOption<T> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

type SelectProps<T> = {
  options: readonly SelectOption<T>[];
  value: T | null | undefined;
  onChange: (value: T) => void;
  label?: string;
  heading?: string;
  placeholder?: string;
  variant?: "field" | "icon" | "compact";
  iconVariant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  align?: "left" | "right";
  up?: boolean;
  ariaLabel?: string;
  onOpenChange?: (isOpen: boolean) => void;
};

export function Select<T>({
  options,
  value,
  onChange,
  label,
  heading,
  placeholder = "Choose an option",
  variant = "field",
  iconVariant = "ghost",
  size = "md",
  className = "",
  triggerClassName = "",
  disabled = false,
  align = "left",
  up = false,
  ariaLabel,
  onOpenChange,
}: SelectProps<T>) {
  const { effectiveReducedMotion } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const typeaheadRef = useRef("");
  const typeaheadTimeoutRef = useRef<number | null>(null);
  const baseId = useId().replace(/:/g, "");
  const labelId = `select-${baseId}-label`;
  const listboxId = `select-${baseId}-listbox`;
  const optionId = (index: number) => `${listboxId}-option-${index}`;
  const [placedUp, setPlacedUp] = useState(up);
  const [position, setPosition] = useState<{
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    minWidth?: number;
  }>({});

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      onOpenChange?.(open);
    },
    [onOpenChange],
  );

  const close = useCallback(
    (focusTrigger = false) => {
      handleOpenChange(false);
      setActiveIndex(-1);
      if (focusTrigger) {
        triggerRef.current?.focus();
      }
    },
    [handleOpenChange],
  );

  const open = useCallback(
    (index: number) => {
      const fallback = index >= 0 && index < options.length ? index : 0;
      setActiveIndex(options.length > 0 ? fallback : -1);
      handleOpenChange(true);
    },
    [handleOpenChange, options.length],
  );

  const moveActive = useCallback(
    (delta: number) => {
      if (options.length === 0) return;
      setActiveIndex((current) => {
        if (current < 0) return delta > 0 ? 0 : options.length - 1;
        return (current + delta + options.length) % options.length;
      });
    },
    [options.length],
  );

  const selectOption = useCallback(
    (option: SelectOption<T>) => {
      onChange(option.value);
      close(true);
    },
    [close, onChange],
  );

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const gap = 6;
    const estimatedListHeight = 240;
    const pos: typeof position = {
      minWidth: variant === "field" || variant === "compact" ? rect.width : undefined,
    };
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;

    let resolvedUp = false;
    if (up) {
      if (spaceAbove >= estimatedListHeight || spaceAbove >= spaceBelow) {
        pos.bottom = window.innerHeight - rect.top + gap;
        resolvedUp = true;
      } else {
        pos.top = rect.bottom + gap;
      }
    } else {
      if (spaceBelow >= estimatedListHeight || spaceBelow >= spaceAbove) {
        pos.top = rect.bottom + gap;
      } else {
        pos.bottom = window.innerHeight - rect.top + gap;
        resolvedUp = true;
      }
    }

    const viewportPadding = 8;
    if (align === "right") {
      pos.right = Math.max(viewportPadding, window.innerWidth - rect.right);
    } else {
      pos.left = Math.max(viewportPadding, rect.left);
    }

    setPlacedUp(resolvedUp);
    setPosition(pos);
  }, [align, up, variant]);

  useLayoutEffect(() => {
    if (isOpen && !disabled) {
      calculatePosition();
    }
  }, [isOpen, disabled, calculatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => calculatePosition();
    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: true });
      window.removeEventListener("resize", handleScroll);
    };
  }, [isOpen, calculatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideTrigger = triggerRef.current?.contains(target);
      const insideList = listRef.current?.contains(target);
      if (!insideTrigger && !insideList) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, close]);

  useEffect(() => {
    if (!isOpen || activeIndex < 0 || !listRef.current) return;
    const option = listRef.current.querySelector<HTMLElement>(
      `[data-select-index="${activeIndex}"]`,
    );
    option?.scrollIntoView({ block: "nearest" });
  }, [isOpen, activeIndex]);

  useEffect(() => {
    return () => {
      if (typeaheadTimeoutRef.current !== null) {
        window.clearTimeout(typeaheadTimeoutRef.current);
      }
    };
  }, []);

  useShortcut("dialog-close", () => close(true), {
    global: true,
    enabled: isOpen,
    preventDefault: false,
  });

  const handleTypeahead = (key: string) => {
    if (typeaheadTimeoutRef.current !== null) {
      window.clearTimeout(typeaheadTimeoutRef.current);
    }

    const character = key.toLowerCase();
    let query = typeaheadRef.current + character;
    let match = options.findIndex((option) => option.label.toLowerCase().startsWith(query));

    if (match < 0 && query.length > 1) {
      query = character;
      match = options.findIndex((option) => option.label.toLowerCase().startsWith(query));
    }

    typeaheadRef.current = query;
    typeaheadTimeoutRef.current = window.setTimeout(() => {
      typeaheadRef.current = "";
      typeaheadTimeoutRef.current = null;
    }, 500);

    if (match < 0) return false;

    if (isOpen) {
      setActiveIndex(match);
    } else {
      open(match);
    }
    return true;
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (disabled) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (isOpen) moveActive(1);
        else open(selectedIndex);
        break;
      case "ArrowUp":
        event.preventDefault();
        if (isOpen) moveActive(-1);
        else open(selectedIndex);
        break;
      case "Home":
        if (isOpen && options.length > 0) {
          event.preventDefault();
          setActiveIndex(0);
        }
        break;
      case "End":
        if (isOpen && options.length > 0) {
          event.preventDefault();
          setActiveIndex(options.length - 1);
        }
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (isOpen) {
          const option = options[activeIndex];
          if (option) selectOption(option);
        } else {
          open(selectedIndex);
        }
        break;
      case "Escape":
        if (isOpen) {
          event.preventDefault();
          close(true);
        }
        break;
      case "Tab":
        if (isOpen) close();
        break;
      default:
        if (
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey &&
          event.key.length === 1 &&
          handleTypeahead(event.key)
        ) {
          event.preventDefault();
        }
    }
  };

  const toggle = () => {
    if (disabled) return;
    if (isOpen) close();
    else open(selectedIndex);
  };

  const triggerAria = {
    role: "combobox" as const,
    "aria-haspopup": "listbox" as const,
    "aria-expanded": isOpen,
    "aria-controls": isOpen ? listboxId : undefined,
    "aria-activedescendant": isOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined,
  };

  const chevron = (
    <ChevronIcon
      aria-hidden="true"
      direction={isOpen !== up ? "up" : "down"}
      className="size-4 text-gray-400 transition-transform duration-150 dark:text-gray-500"
    />
  );

  const trigger =
    variant === "icon" ? (
      <IconButton
        ref={triggerRef}
        icon={selectedOption?.icon ?? chevron}
        variant={iconVariant}
        size={size}
        ariaLabel={ariaLabel ?? (selectedOption ? `Select: ${selectedOption.label}` : placeholder)}
        disabled={disabled}
        onClick={toggle}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          size === "sm" ? "[&_svg]:size-4 [&_svg]:shrink-0" : "[&_svg]:size-5 [&_svg]:shrink-0",
          isOpen &&
            !disabled &&
            (iconVariant === "secondary"
              ? "border-blue-500 bg-blue-50 text-blue-600 dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-400"
              : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"),
          triggerClassName,
        )}
        {...triggerAria}
      />
    ) : variant === "compact" ? (
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        onKeyDown={handleTriggerKeyDown}
        disabled={disabled}
        aria-label={ariaLabel}
        {...triggerAria}
        className={cn(
          "inline-flex max-w-40 items-center gap-1.5 rounded-xs border border-gray-200 bg-white text-gray-700 shadow-xs select-none",
          "transition-[background-color,border-color,color,box-shadow] duration-150",
          "focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/25 focus-visible:outline-none",
          "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400/25",
          size === "sm" ? "h-8 px-2.5 text-xs" : "h-10 px-3 text-sm",
          !disabled &&
            "cursor-pointer hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 dark:hover:border-gray-600 dark:hover:bg-gray-800 dark:hover:text-white",
          disabled && "cursor-not-allowed opacity-50",
          isOpen &&
            !disabled &&
            "border-blue-500 bg-blue-50/60 text-blue-700 ring-2 ring-blue-500/20 dark:border-blue-400 dark:bg-blue-950/30 dark:text-blue-300 dark:ring-blue-400/20",
          triggerClassName,
        )}
      >
        {selectedOption?.icon && (
          <span className="flex size-4 shrink-0 items-center justify-center [&_svg]:size-4 [&_svg]:shrink-0">
            {selectedOption.icon}
          </span>
        )}
        <span className="truncate font-medium">{selectedOption?.label ?? placeholder}</span>
        <span className="flex shrink-0 items-center text-gray-400 dark:text-gray-500">
          <ChevronIcon
            aria-hidden="true"
            direction={isOpen !== up ? "up" : "down"}
            className={cn(
              "transition-transform duration-150",
              size === "sm" ? "size-3.5" : "size-4",
            )}
          />
        </span>
      </button>
    ) : (
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        onKeyDown={handleTriggerKeyDown}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-labelledby={!ariaLabel && label ? labelId : undefined}
        {...triggerAria}
        className={cn(
          "relative w-full rounded-xs border border-gray-300 bg-white text-left text-gray-900 shadow-xs select-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100",
          "transition-[background-color,border-color,color,box-shadow] duration-150",
          "focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/25 focus-visible:outline-none dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400/25",
          size === "sm" ? "h-8 px-2.5 pr-7 text-xs" : "h-10 px-3 pr-9 text-sm",
          !disabled && "cursor-pointer hover:border-gray-400 dark:hover:border-gray-600",
          disabled && "cursor-not-allowed bg-gray-50 opacity-50 dark:bg-gray-950",
          isOpen &&
            !disabled &&
            "border-blue-500 ring-2 ring-blue-500/20 dark:border-blue-400 dark:ring-blue-400/20",
          triggerClassName,
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selectedOption?.icon && (
            <span className="flex size-4 shrink-0 items-center justify-center [&_svg]:size-4 [&_svg]:shrink-0">
              {selectedOption.icon}
            </span>
          )}
          <span
            className={cn(
              "block truncate",
              selectedOption == null && "font-normal text-gray-400 dark:text-gray-500",
            )}
          >
            {selectedOption?.label ?? placeholder}
          </span>
        </span>

        <span
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 flex items-center",
            size === "sm" ? "pr-2" : "pr-2.5",
          )}
        >
          {chevron}
        </span>
      </button>
    );

  return (
    <div
      className={cn(
        variant === "field" ? "flex items-center gap-3" : "relative inline-flex",
        className,
      )}
    >
      {variant === "field" && label && (
        <p
          id={labelId}
          className="text-sm font-medium whitespace-nowrap text-gray-700 select-none dark:text-gray-200"
        >
          {label}
        </p>
      )}

      <div className={cn(variant === "field" && "relative max-w-xs min-w-0 flex-1 sm:max-w-sm")}>
        {trigger}
      </div>

      {createPortal(
        <AnimatePresence>
          {isOpen && !disabled && (
            <motion.div
              ref={listRef}
              id={listboxId}
              role="listbox"
              aria-label={ariaLabel ?? heading ?? label}
              aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
              initial={effectiveReducedMotion ? false : { opacity: 0, y: placedUp ? 6 : -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={effectiveReducedMotion ? undefined : { opacity: 0, y: placedUp ? 6 : -6 }}
              transition={
                effectiveReducedMotion ? { duration: 0 } : { duration: 0.14, ease: EASE_OUT }
              }
              style={{
                position: "fixed",
                zIndex: 1000,
                ...position,
              }}
              className={cn(
                "max-h-60 w-max max-w-xs overflow-auto rounded-xs sm:max-w-sm",
                variant === "compact" ? "min-w-28" : "min-w-36",
                "border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900",
                "shadow-lg ring-1 shadow-gray-950/10 ring-black/5 dark:shadow-black/40 dark:ring-white/5",
              )}
            >
              <div className="flex flex-col gap-0.5 p-1.5">
                {heading && (
                  <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-gray-500 uppercase select-none dark:text-gray-400">
                    {heading}
                  </div>
                )}
                {options.map((option, index) => {
                  const isSelected = option.value === value;
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={index}
                      id={optionId(index)}
                      data-select-index={index}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      tabIndex={-1}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => selectOption(option)}
                      className={cn(
                        "relative flex w-full cursor-pointer items-center gap-2 rounded-xs text-left font-medium transition-colors duration-150 outline-none select-none",
                        "active:bg-blue-100 dark:active:bg-gray-700",
                        size === "sm" ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm",
                        isSelected
                          ? isActive
                            ? "bg-blue-100/80 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                            : "bg-blue-50/80 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                          : isActive
                            ? "bg-blue-50 text-blue-600 dark:bg-gray-800 dark:text-blue-400"
                            : "text-gray-700 dark:text-gray-200",
                      )}
                    >
                      {option.icon && (
                        <span className="flex size-4 shrink-0 items-center justify-center [&_svg]:size-4 [&_svg]:shrink-0">
                          {option.icon}
                        </span>
                      )}
                      <span className="flex-1 truncate pr-5">{option.label}</span>
                      {isSelected && (
                        <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-blue-600 dark:text-blue-400">
                          <CheckIcon aria-hidden="true" className="size-4" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
