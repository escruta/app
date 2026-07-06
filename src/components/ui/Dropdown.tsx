import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
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
  renderOption = (opt) => String(opt),
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    minWidth?: number;
  }>({});

  const handleOpenChange = (newIsOpen: boolean) => {
    setIsOpen(newIsOpen);
    if (onOpenChange) {
      onOpenChange(newIsOpen);
    }
  };

  const calculatePosition = useCallback(() => {
    if (!dropdownRef.current) return;
    const rect = dropdownRef.current.getBoundingClientRect();
    const gap = 6;
    const estimatedMenuHeight = 240;
    const pos: typeof position = { minWidth: rect.width };
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;

    if (up) {
      if (spaceAbove >= estimatedMenuHeight || spaceAbove >= spaceBelow) {
        pos.bottom = window.innerHeight - rect.top + gap;
      } else {
        pos.top = rect.bottom + gap;
      }
    } else {
      if (spaceBelow >= estimatedMenuHeight || spaceBelow >= spaceAbove) {
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
  }, [up, align]);

  useLayoutEffect(() => {
    if (isOpen && !disabled) {
      calculatePosition();
    }
  }, [isOpen, disabled, calculatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => {
      calculatePosition();
    };
    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: true });
      window.removeEventListener("resize", handleScroll);
    };
  }, [isOpen, calculatePosition]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const insideTrigger = dropdownRef.current?.contains(target);
      const insideMenu = menuRef.current?.contains(target);
      if (!insideTrigger && !insideMenu) {
        handleOpenChange(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelect = (option: T) => {
    onSelect(option);
    handleOpenChange(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpenChange(!isOpen);
    } else if (event.key === "Escape") {
      handleOpenChange(false);
    }
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {label && (
        <p className="text-sm font-medium whitespace-nowrap text-gray-700 select-none dark:text-gray-200">
          {label}
        </p>
      )}

      <div className="relative max-w-xs min-w-0 flex-1 sm:max-w-sm" ref={dropdownRef}>
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => !disabled && handleOpenChange(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            "relative w-full text-left",
            size === "sm" && "h-8 px-2 pr-7 text-xs",
            size === "md" && "h-10 px-3 pr-10 text-sm",
            "bg-white dark:bg-gray-900",
            "border border-gray-300 dark:border-gray-600",
            "rounded-xs",
            "text-gray-900 dark:text-gray-100",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900",
            "transition-all duration-200 ease-in-out",
            "select-none",
            {
              "hover:border-blue-500 hover:ring-1 hover:ring-blue-300 hover:ring-offset-1 hover:ring-offset-white dark:hover:ring-offset-gray-900 dark:hover:border-blue-400 cursor-pointer":
                !disabled,
              "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900 hover:ring-0": disabled,
              "ring-2 ring-blue-500 dark:ring-blue-400 border-blue-500 dark:border-blue-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-900":
                isOpen && !disabled,
            },
          )}
        >
          <span
            className={cn("block truncate", {
              "text-gray-500 dark:text-gray-400 font-normal": selectedOption == null,
            })}
          >
            {selectedOption != null ? renderOption(selectedOption as T) : placeholder}
          </span>

          {/* Chevron Icon */}
          <span
            className={cn(
              "absolute inset-y-0 right-0 flex items-center pointer-events-none",
              size === "sm" ? "pr-2" : "pr-3",
            )}
          >
            <ChevronIcon
              direction={isOpen !== up ? "up" : "down"}
              className={cn(
                "text-gray-400 dark:text-gray-400 transition-transform duration-200",
                size === "sm" ? "size-4" : "size-5",
              )}
            />
          </span>
        </button>

        {/* Dropdown Menu */}
        {createPortal(
          <AnimatePresence>
            {isOpen && !disabled && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, y: up ? 10 : -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: up ? 10 : -10 }}
                transition={{
                  duration: 0.2,
                  ease: "easeOut",
                }}
                style={{
                  position: "fixed",
                  ...position,
                }}
                className={cn(
                  "z-40 w-max",
                  "bg-white dark:bg-gray-900",
                  "border border-gray-300 dark:border-gray-600",
                  "rounded-xs shadow-lg shadow-gray-500/10 dark:shadow-black/20 ring-1 ring-gray-500/5 dark:ring-gray-500/10",
                  "max-h-60 overflow-auto max-w-xs sm:max-w-sm",
                )}
              >
                <div className="flex flex-col gap-0.5 p-1.5">
                  {options.map((option, index) => (
                    <motion.button
                      key={String(option)}
                      type="button"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        duration: 0.05,
                        delay: index * 0.015,
                        ease: "easeOut",
                      }}
                      onClick={() => handleSelect(option)}
                      className={cn(
                        "relative flex w-full items-center text-left font-medium",
                        size === "sm" ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm",
                        "text-gray-700 dark:text-gray-200",
                        "transition-all duration-200 outline-none select-none cursor-pointer rounded-xs",
                        "hover:bg-blue-50 hover:ring-1 hover:ring-blue-300 focus:bg-blue-50 dark:hover:bg-gray-700 dark:focus:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 active:bg-blue-100 dark:active:bg-gray-600",
                        "focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900",
                        {
                          "bg-blue-100 dark:bg-gray-700 text-blue-700 dark:text-blue-300":
                            selectedOption === option,
                        },
                      )}
                    >
                      <span className="flex-1 truncate pr-6">{renderOption(option)}</span>
                      {selectedOption === option && (
                        <span
                          className={cn(
                            "absolute inset-y-0 right-0 flex items-center text-blue-600 dark:text-blue-400",
                            size === "sm" ? "pr-2" : "pr-3",
                          )}
                        >
                          <CheckIcon className={size === "sm" ? "size-4" : "size-5"} />
                        </span>
                      )}
                    </motion.button>
                  ))}
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
