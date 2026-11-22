import { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { SearchIcon, CloseIcon } from "@/components/icons";
import { IconButton } from "./IconButton";
import { Tooltip } from "./Tooltip";

interface TextFieldBaseProps {
  id: string;
  label?: string;
  value: string;
  className?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
  minRows?: number;
  maxRows?: number;
  search?: boolean;
  onClear?: () => void;
}

interface TextFieldSingleLineProps extends TextFieldBaseProps {
  multiline?: false;
  type?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

interface TextFieldMultiLineProps extends TextFieldBaseProps {
  multiline: true;
  type?: never;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export function TextField({
  id,
  label,
  type = "text",
  value,
  onChange,
  onKeyDown,
  className = "",
  placeholder,
  required = false,
  disabled = false,
  autoFocus = false,
  autoComplete,
  multiline = false,
  minRows,
  maxRows,
  search = false,
  onClear,
}: TextFieldSingleLineProps | TextFieldMultiLineProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";

    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight, 10) || 20;
    const maxHeight = maxRows ? lineHeight * maxRows : Infinity;

    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = newHeight + "px";
  }, [maxRows]);

  useEffect(() => {
    if (!multiline) return;
    resizeTextarea();
  }, [value, multiline, minRows, resizeTextarea]);

  useEffect(() => {
    if (!multiline) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        resizeTextarea();
      }
    });
    observer.observe(textarea);
    return () => observer.disconnect();
  }, [multiline, resizeTextarea]);

  const baseInputClassName = cn(
    "w-full rounded-xs border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-xs transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/20 dark:disabled:bg-gray-950",
    !disabled && "hover:border-gray-400 dark:hover:border-gray-600",
    multiline ? "resize-none leading-6" : "h-10",
    multiline && !(minRows && minRows > 1) && "min-h-10",
    !multiline && search && "pl-9",
    !multiline && Boolean(value && onClear && !disabled) && "pr-9",
  );

  const inputClassName = label ? baseInputClassName : cn(baseInputClassName, className);

  const field = multiline ? (
    <textarea
      ref={textareaRef}
      id={id}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
        resizeTextarea();
        (onChange as (e: React.ChangeEvent<HTMLTextAreaElement>) => void)(e);
      }}
      onKeyDown={onKeyDown as ((e: React.KeyboardEvent<HTMLTextAreaElement>) => void) | undefined}
      className={inputClassName}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      autoFocus={autoFocus}
      rows={minRows || 1}
    />
  ) : (
    <div className="relative">
      {search && (
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
        />
      )}
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange as (e: React.ChangeEvent<HTMLInputElement>) => void}
        onKeyDown={onKeyDown as ((e: React.KeyboardEvent<HTMLInputElement>) => void) | undefined}
        className={inputClassName}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
      />
      {value && onClear && !disabled && (
        <Tooltip
          text="Clear input"
          position="top"
          className="absolute top-1/2 right-2 -translate-y-1/2"
        >
          <IconButton
            icon={<CloseIcon className="size-3.5" />}
            onClick={onClear}
            size="xs"
            variant="ghost"
            ariaLabel="Clear input"
          />
        </Tooltip>
      )}
    </div>
  );

  if (!label) {
    return field;
  }

  return (
    <div className={cn("mb-4", className)}>
      <label
        className="mb-1.5 block text-sm font-medium text-gray-700 select-none dark:text-gray-300"
        htmlFor={id}
      >
        {label}
      </label>
      {field}
    </div>
  );
}
