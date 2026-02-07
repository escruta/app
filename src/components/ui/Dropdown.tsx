import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { CheckIcon, ChevronIcon } from "@/components/icons";

type DropdownProps<T extends string> = {
  options: T[];
  selectedOption: T;
  onSelect: (option: T) => void;
  label?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
};

export function Dropdown<T extends string>({
  options,
  selectedOption,
  onSelect,
  label,
  className = "",
  placeholder = "Select an option",
  disabled = false,
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: T) => {
    onSelect(option);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen(!isOpen);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {label && (
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 select-none whitespace-nowrap">
          {label}
        </p>
      )}

      <div className="relative" ref={dropdownRef}>
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            "relative w-full min-w-[160px] h-10 px-3 pr-10 text-left",
            "bg-white dark:bg-gray-900",
            "border border-gray-300 dark:border-gray-600",
            "rounded-xs",
            "text-gray-900 dark:text-gray-100 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900",
            "transition-all duration-200 ease-in-out",
            "select-none",
            {
              "hover:border-blue-500 hover:ring-1 hover:ring-blue-300 hover:ring-offset-1 hover:ring-offset-white dark:hover:ring-offset-gray-900 dark:hover:border-blue-400 cursor-pointer":
                !disabled,
              "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900 hover:ring-0":
                disabled,
              "ring-2 ring-blue-500 dark:ring-blue-400 border-blue-500 dark:border-blue-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-900":
                isOpen && !disabled,
            },
          )}
        >
          <span className="block truncate">
            {selectedOption || placeholder}
          </span>

          {/* Chevron Icon */}
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronIcon
              direction={isOpen ? "up" : "down"}
              className="size-5 text-gray-400 dark:text-gray-400 transition-transform duration-200"
            />
          </span>
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && !disabled && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{
                duration: 0.2,
                ease: "easeOut",
              }}
              className={cn(
                "absolute z-50 w-full mt-1.5",
                "bg-white dark:bg-gray-900",
                "border border-gray-300 dark:border-gray-600",
                "rounded-xs shadow-lg shadow-gray-500/10 dark:shadow-black/20 ring-1 ring-gray-500/5 dark:ring-gray-500/10",
                "max-h-60 overflow-auto",
              )}
            >
              <div className="py-1">
                {options.map((option, index) => (
                  <motion.button
                    key={option}
                    type="button"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.15,
                      delay: index * 0.05,
                      ease: "easeOut",
                    }}
                    onClick={() => handleSelect(option)}
                    className={cn(
                      "relative w-full px-3 py-2 text-left text-sm",
                      "text-gray-900 dark:text-gray-100",
                      "transition-colors duration-150",
                      "hover:bg-blue-50 dark:hover:bg-gray-800",
                      "focus:outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-300 dark:focus:bg-gray-800",
                      "cursor-pointer select-none rounded-xs",
                      {
                        "bg-blue-100 dark:bg-gray-800 text-blue-700 dark:text-blue-300":
                          selectedOption === option,
                      },
                    )}
                  >
                    <span className="block truncate">{option}</span>
                    {selectedOption === option && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-600 dark:text-blue-400">
                        <CheckIcon className="w-5 h-5" />
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
