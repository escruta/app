import { useState, useRef, useEffect, useCallback, useLayoutEffect, useId } from "react";
import { createPortal } from "react-dom";
import { useShortcut, useAccessibility } from "@/hooks";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { CheckIcon, ChevronIcon } from "@/components/icons";

type DropdownProps<T> = {
  options: T[];
  selectedOption: T | null | undefined;
  onSelect: (option: T) => void;
  label?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  onOpenChange?: (isOpen: boolean) => void;
  align?: "left" | "right";
  up?: boolean;
  ariaLabel?: string;
  renderOption?: (option: T) => React.ReactNode;
};

export function Dropdown<T>({
  options,
  selectedOption,
  onSelect,
  label,
  className = "",
  placeholder = "Choose an option",
  disabled = false,
  size = "md",
  up = false,
  onOpenChange,
  align = "left",
  ariaLabel,
  renderOption = (opt) => String(opt),
}: DropdownProps<T>) {
  const { effectiveReducedMotion } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [placedUp, setPlacedUp] = useState(up);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const typeaheadRef = useRef("");
  const typeaheadTimeoutRef = useRef<number | null>(null);
  const listboxId = `dropdown-${useId().replace(/:/g, "")}-listbox`;
  const optionId = (index: number) => `${listboxId}-option-${index}`;
  const [position, setPosition] = useState<{
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    minWidth?: number;
  }>({});

  const selectedIndex = options.findIndex((option) => option === selectedOption);

  const handleOpenChange = useCallback(
    (newIsOpen: boolean) => {
      setIsOpen(newIsOpen);
      onOpenChange?.(newIsOpen);
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

  const handleSelect = useCallback(
    (option: T) => {
      onSelect(option);
      close(true);
    },
    [close, onSelect],
  );

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const gap = 6;
    const estimatedMenuHeight = 240;
    const pos: typeof position = { minWidth: rect.width };
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;

    let resolvedUp = false;
    if (up) {
      if (spaceAbove >= estimatedMenuHeight || spaceAbove >= spaceBelow) {
        pos.bottom = window.innerHeight - rect.top + gap;
        resolvedUp = true;
      } else {
        pos.top = rect.bottom + gap;
      }
    } else {
      if (spaceBelow >= estimatedMenuHeight || spaceBelow >= spaceAbove) {
        pos.top = rect.bottom + gap;
      } else {
        pos.bottom = window.innerHeight - rect.top + gap;
        resolvedUp = true;
      }
    }

    if (align === "right") {
      pos.right = Math.max(0, window.innerWidth - rect.right);
    } else {
      pos.left = Math.max(0, rect.left);
    }

    setPlacedUp(resolvedUp);
    setPosition(pos);
  }, [up, align]);

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
      const insideMenu = menuRef.current?.contains(target);
      if (!insideTrigger && !insideMenu) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, close]);

  useEffect(() => {
    if (!isOpen || activeIndex < 0 || !menuRef.current) return;
    const option = menuRef.current.querySelector<HTMLElement>(
      `[data-dropdown-index="${activeIndex}"]`,
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
    const getOptionText = (option: T) => {
      const rendered = renderOption(option);
      return typeof rendered === "string" || typeof rendered === "number"
        ? String(rendered).toLowerCase()
        : String(option).toLowerCase();
    };

    let match = options.findIndex((option) => getOptionText(option).startsWith(query));

    if (match < 0 && query.length > 1) {
      query = character;
      match = options.findIndex((option) => getOptionText(option).startsWith(query));
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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
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
          if (option !== undefined) handleSelect(option);
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

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {label && (
        <p className="text-sm font-medium whitespace-nowrap text-gray-700 select-none dark:text-gray-200">
          {label}
        </p>
      )}

      <div className="relative max-w-xs min-w-0 flex-1 sm:max-w-sm">
        <button
          ref={triggerRef}
          type="button"
          onClick={toggle}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          role="combobox"
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listboxId : undefined}
          aria-activedescendant={isOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined}
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
          <span
            className={cn(
              "block truncate [&_svg]:inline-block [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:align-middle",
              {
                "text-gray-500 dark:text-gray-400 font-normal": selectedOption == null,
              },
            )}
          >
            {selectedOption != null ? renderOption(selectedOption as T) : placeholder}
          </span>

          <span
            className={cn("pointer-events-none absolute inset-y-0 right-0 flex items-center", {
              "pr-2": size === "sm",
              "pr-3": size !== "sm",
            })}
          >
            <ChevronIcon
              direction={isOpen !== up ? "up" : "down"}
              className={cn("text-gray-400 transition-transform duration-200 dark:text-gray-400", {
                "size-4": size === "sm",
                "size-5": size !== "sm",
              })}
            />
          </span>
        </button>

        {createPortal(
          <AnimatePresence>
            {isOpen && !disabled && (
              <motion.div
                ref={menuRef}
                id={listboxId}
                role="listbox"
                aria-label={ariaLabel ?? label}
                aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
                initial={effectiveReducedMotion ? false : { opacity: 0, y: placedUp ? 10 : -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={effectiveReducedMotion ? undefined : { opacity: 0, y: placedUp ? 10 : -10 }}
                transition={
                  effectiveReducedMotion
                    ? { duration: 0 }
                    : {
                        duration: 0.2,
                        ease: "easeOut",
                      }
                }
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
                  {options.map((option, index) => {
                    const isSelected = selectedOption === option;
                    const isActive = index === activeIndex;
                    return (
                      <button
                        key={index}
                        id={optionId(index)}
                        data-dropdown-index={index}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        tabIndex={-1}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => handleSelect(option)}
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
                        <span className="flex-1 truncate pr-5 [&_svg]:inline-block [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:align-middle">
                          {renderOption(option)}
                        </span>
                        {isSelected && (
                          <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-blue-600 dark:text-blue-400">
                            <CheckIcon
                              className={cn({ "size-4": size === "sm", "size-5": size !== "sm" })}
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
    </div>
  );
}
