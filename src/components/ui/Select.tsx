import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { CheckIcon, ChevronIcon } from "@/components/icons";
import { useShortcut } from "@/hooks";
import { cn } from "@/lib/utils";
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
  size?: "sm" | "md";
  className?: string;
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
  size = "md",
  className = "",
  disabled = false,
  align = "left",
  up = false,
  ariaLabel,
  onOpenChange,
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const typeaheadRef = useRef("");
  const typeaheadTimeoutRef = useRef<number | null>(null);
  const listboxId = `select-${useId().replace(/:/g, "")}-listbox`;
  const optionId = (index: number) => `${listboxId}-option-${index}`;
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
      minWidth: variant === "field" ? rect.width : undefined,
    };
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;

    if (up) {
      if (spaceAbove >= estimatedListHeight || spaceAbove >= spaceBelow) {
        pos.bottom = window.innerHeight - rect.top + gap;
      } else {
        pos.top = rect.bottom + gap;
      }
    } else {
      if (spaceBelow >= estimatedListHeight || spaceBelow >= spaceAbove) {
        pos.top = rect.bottom + gap;
      } else {
        pos.bottom = window.innerHeight - rect.top + gap;
      }
    }

    if (align === "right") {
      pos.right = Math.max(0, window.innerWidth - rect.right);
    } else {
      pos.left = Math.max(0, rect.left);
    }

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
      direction={isOpen !== up ? "up" : "down"}
      className={cn("text-gray-400 transition-transform duration-200", {
        "size-4": size === "sm",
        "size-5": size !== "sm",
      })}
    />
  );

  const trigger =
    variant === "icon" ? (
      <IconButton
        ref={triggerRef}
        icon={selectedOption?.icon ?? chevron}
        variant="ghost"
        size={size}
        ariaLabel={ariaLabel ?? (selectedOption ? `Select: ${selectedOption.label}` : placeholder)}
        disabled={disabled}
        onClick={toggle}
        onKeyDown={handleTriggerKeyDown}
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
          "inline-flex max-w-40 items-center gap-1.5 rounded-xs border",
          "border-gray-200 bg-white text-gray-700 shadow-sm",
          "transition-all duration-200 ease-in-out select-none",
          "hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
          "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:bg-gray-800 dark:hover:text-blue-400 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-gray-900",
          {
            "h-8 px-2.5 text-xs": size === "sm",
            "h-9 px-3 text-sm": size !== "sm",
            "cursor-pointer": !disabled,
            "opacity-50 cursor-not-allowed": disabled,
            "border-blue-500 bg-blue-50 ring-1 ring-blue-500 dark:border-blue-400 dark:bg-gray-800":
              isOpen && !disabled,
          },
        )}
      >
        {selectedOption?.icon && (
          <span className="flex size-4 shrink-0 items-center justify-center">
            {selectedOption.icon}
          </span>
        )}
        <span className="truncate font-medium">{selectedOption?.label ?? placeholder}</span>
        <span className="flex shrink-0 items-center text-gray-400 dark:text-gray-500">
          <ChevronIcon
            direction={isOpen !== up ? "up" : "down"}
            className={cn("transition-transform duration-200", {
              "size-3.5": size === "sm",
              "size-4": size !== "sm",
            })}
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
        {...triggerAria}
        className={cn(
          "relative w-full text-left",
          "bg-white dark:bg-gray-900",
          "border border-gray-300 dark:border-gray-600",
          "rounded-xs",
          "text-gray-900 dark:text-gray-100",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900",
          "transition-all duration-200 ease-in-out",
          "select-none",
          {
            "h-8 px-2 pr-7 text-xs": size === "sm",
            "h-10 px-3 pr-10 text-sm": size === "md",
            "hover:border-blue-500 hover:ring-1 hover:ring-blue-300 hover:ring-offset-1 hover:ring-offset-white dark:hover:ring-offset-gray-900 dark:hover:border-blue-400 cursor-pointer":
              !disabled,
            "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900 hover:ring-0": disabled,
            "ring-2 ring-blue-500 dark:ring-blue-400 border-blue-500 dark:border-blue-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-900":
              isOpen && !disabled,
          },
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selectedOption?.icon && (
            <span className="flex size-4 shrink-0 items-center justify-center">
              {selectedOption.icon}
            </span>
          )}
          <span
            className={cn("block truncate", {
              "text-gray-500 dark:text-gray-400 font-normal": selectedOption == null,
            })}
          >
            {selectedOption?.label ?? placeholder}
          </span>
        </span>

        <span
          className={cn("absolute inset-y-0 right-0 flex items-center pointer-events-none", {
            "pr-2": size === "sm",
            "pr-3": size !== "sm",
          })}
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
        <p className="text-sm font-medium whitespace-nowrap text-gray-700 select-none dark:text-gray-200">
          {label}
        </p>
      )}

      <div className={cn(variant === "field" && "relative min-w-0 max-w-xs flex-1 sm:max-w-sm")}>
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
              initial={{ opacity: 0, y: up ? 10 : -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: up ? 10 : -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{
                position: "fixed",
                zIndex: 1000,
                ...position,
              }}
              className={cn(
                "min-w-40 w-max",
                "bg-white dark:bg-gray-900",
                "border border-gray-300 dark:border-gray-600",
                "rounded-xs shadow-lg shadow-gray-500/10 dark:shadow-black/20 ring-1 ring-gray-500/5 dark:ring-gray-500/10",
                "max-h-60 overflow-auto max-w-xs sm:max-w-sm",
              )}
            >
              <div className="flex flex-col gap-0.5 p-1.5">
                {heading && (
                  <div className="px-3 py-1.5 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
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
                        "relative flex w-full items-center gap-2 text-left font-medium",
                        "text-gray-700 dark:text-gray-200",
                        "transition-all duration-200 outline-none select-none cursor-pointer rounded-xs",
                        "active:bg-blue-100 dark:active:bg-gray-600",
                        {
                          "px-2 py-1.5 text-xs": size === "sm",
                          "px-3 py-2 text-sm": size !== "sm",
                          "bg-blue-50 text-blue-600 ring-1 ring-blue-300 dark:bg-gray-700 dark:text-blue-400":
                            isActive && !isSelected,
                          "bg-blue-100 text-blue-700 dark:bg-gray-700 dark:text-blue-300":
                            isSelected,
                        },
                      )}
                    >
                      {option.icon && (
                        <span className="flex size-4 shrink-0 items-center justify-center">
                          {option.icon}
                        </span>
                      )}
                      <span className="flex-1 truncate pr-5">{option.label}</span>
                      {isSelected && (
                        <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-blue-600 dark:text-blue-400">
                          <CheckIcon
                            className={cn({
                              "size-4": size === "sm",
                              "size-5": size !== "sm",
                            })}
                          />
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
