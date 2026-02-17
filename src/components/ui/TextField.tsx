import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

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
  maxRows?: number;
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
  maxRows,
}: TextFieldSingleLineProps | TextFieldMultiLineProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (multiline && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = "auto";

      const lineHeight =
        parseInt(getComputedStyle(textarea).lineHeight, 10) || 20;
      const maxHeight = maxRows ? lineHeight * maxRows : Infinity;

      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = newHeight + "px";
    }
  }, [value, multiline, maxRows]);

  const baseInputClassName = cn(
    "w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-xs focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 resize-none shadow-sm shadow-gray-500/5 dark:shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed",
    !disabled &&
      "hover:border-blue-400 dark:hover:border-blue-500 hover:ring-1 hover:ring-blue-300 hover:ring-offset-1 hover:ring-offset-white dark:hover:ring-offset-gray-900",
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

          const lineHeight =
            parseInt(getComputedStyle(e.target).lineHeight, 10) || 20;
          const maxHeight = maxRows ? lineHeight * maxRows : Infinity;

          const newHeight = Math.min(e.target.scrollHeight, maxHeight);
          e.target.style.height = newHeight + "px";

          (onChange as (e: React.ChangeEvent<HTMLTextAreaElement>) => void)(e);
        }}
        onKeyDown={
          onKeyDown as
            | ((e: React.KeyboardEvent<HTMLTextAreaElement>) => void)
            | undefined
        }
        className={inputClassName}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        rows={1}
        style={{ minHeight: "42px" }}
      />
    ) : (
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange as (e: React.ChangeEvent<HTMLInputElement>) => void}
        onKeyDown={
          onKeyDown as
            | ((e: React.KeyboardEvent<HTMLInputElement>) => void)
            | undefined
        }
        className={inputClassName}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
      />
    );
  }

  return (
    <div className={cn("mb-4", className)}>
      <label
        className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2 select-none"
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

            const lineHeight =
              parseInt(getComputedStyle(e.target).lineHeight, 10) || 20;
            const maxHeight = maxRows ? lineHeight * maxRows : Infinity;

            const newHeight = Math.min(e.target.scrollHeight, maxHeight);
            e.target.style.height = newHeight + "px";

            (onChange as (e: React.ChangeEvent<HTMLTextAreaElement>) => void)(
              e,
            );
          }}
          onKeyDown={
            onKeyDown as
              | ((e: React.KeyboardEvent<HTMLTextAreaElement>) => void)
              | undefined
          }
          className={baseInputClassName}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          rows={1}
          style={{ minHeight: "42px" }}
        />
      ) : (
        <input
          type={type}
          id={id}
          value={value}
          onChange={
            onChange as (e: React.ChangeEvent<HTMLInputElement>) => void
          }
          onKeyDown={
            onKeyDown as
              | ((e: React.KeyboardEvent<HTMLInputElement>) => void)
              | undefined
          }
          className={baseInputClassName}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
        />
      )}
    </div>
  );
}
