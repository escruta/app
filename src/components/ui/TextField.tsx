import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { SearchIcon, CloseIcon } from "@/components/icons";
import { IconButton } from "./IconButton";

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

  useEffect(() => {
    if (multiline && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = "auto";

      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight, 10) || 20;
      const maxHeight = maxRows ? lineHeight * maxRows : Infinity;

      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = newHeight + "px";
    }
  }, [value, multiline, minRows, maxRows]);

  const baseInputClassName = cn(
    "w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-xs focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 resize-none shadow-sm shadow-gray-500/5 dark:shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed",
    !disabled &&
      "hover:border-blue-400 dark:hover:border-blue-500 hover:ring-1 hover:ring-blue-300 hover:ring-offset-1 hover:ring-offset-white dark:hover:ring-offset-gray-900",
    search && "pl-10 pr-10",
  );

  const inputClassName = cn(baseInputClassName, className);

  if (!label) {
    return multiline ? (
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
          e.target.style.height = "auto";

          const lineHeight = parseInt(getComputedStyle(e.target).lineHeight, 10) || 20;
          const maxHeight = maxRows ? lineHeight * maxRows : Infinity;

          const newHeight = Math.min(e.target.scrollHeight, maxHeight);
          e.target.style.height = newHeight + "px";

          (onChange as (e: React.ChangeEvent<HTMLTextAreaElement>) => void)(e);
        }}
        onKeyDown={onKeyDown as ((e: React.KeyboardEvent<HTMLTextAreaElement>) => void) | undefined}
        className={inputClassName}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        rows={minRows || 1}
        style={{ minHeight: minRows && minRows > 1 ? undefined : "42px" }}
      />
    ) : (
      <div className="relative">
        {search && (
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
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
        {value && onClear && (
          <IconButton
            icon={<CloseIcon />}
            onClick={onClear}
            size="xs"
            variant="ghost"
            className="absolute top-1/2 right-3 -translate-y-1/2"
            aria-label="Clear input"
          />
        )}
      </div>
    );
  }

  return (
    <div className={cn("mb-4", className)}>
      <label
        className="mb-2 block text-base font-medium text-gray-700 select-none dark:text-gray-300"
        htmlFor={id}
      >
        {label}
      </label>
      {multiline ? (
        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
            e.target.style.height = "auto";

            const lineHeight = parseInt(getComputedStyle(e.target).lineHeight, 10) || 20;
            const maxHeight = maxRows ? lineHeight * maxRows : Infinity;

            const newHeight = Math.min(e.target.scrollHeight, maxHeight);
            e.target.style.height = newHeight + "px";

            (onChange as (e: React.ChangeEvent<HTMLTextAreaElement>) => void)(e);
          }}
          onKeyDown={
            onKeyDown as ((e: React.KeyboardEvent<HTMLTextAreaElement>) => void) | undefined
          }
          className={baseInputClassName}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          rows={minRows || 1}
          style={{ minHeight: minRows && minRows > 1 ? undefined : "42px" }}
        />
      ) : (
        <div className="relative">
          {search && (
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          )}
          <input
            type={type}
            id={id}
            value={value}
            onChange={onChange as (e: React.ChangeEvent<HTMLInputElement>) => void}
            onKeyDown={
              onKeyDown as ((e: React.KeyboardEvent<HTMLInputElement>) => void) | undefined
            }
            className={baseInputClassName}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            autoFocus={autoFocus}
            autoComplete={autoComplete}
          />
          {value && onClear && (
            <IconButton
              icon={<CloseIcon />}
              onClick={onClear}
              size="xs"
              variant="ghost"
              className="absolute top-1/2 right-3 -translate-y-1/2"
              aria-label="Clear input"
            />
          )}
        </div>
      )}
    </div>
  );
}
