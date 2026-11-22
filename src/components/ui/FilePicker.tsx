import { cn } from "@/lib/utils";
import { useState } from "react";
import { UploadIcon, FileIcon, CheckIcon } from "@/components/icons";

type FilePickerProps = {
  id: string;
  label?: string;
  onChange: (file: File | null) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  accept?: string;
  multiple?: boolean;
  value?: File | null;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function FilePicker({
  id,
  label,
  onChange,
  className,
  placeholder = "Choose a file...",
  disabled = false,
  accept,
  multiple = false,
  value,
}: FilePickerProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onChange(files[0]);
    } else {
      onChange(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onChange(files[0]);
    }
  };

  const dropzoneClassName = cn(
    "relative w-full rounded-xs border transition-[background-color,border-color,box-shadow] duration-150",
    "border-gray-300 bg-gray-50/60 dark:border-gray-700 dark:bg-gray-900/60",
    "focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 dark:focus-within:border-blue-400 dark:focus-within:ring-blue-400/20",
    !disabled &&
      "cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 dark:hover:border-blue-500 dark:hover:bg-gray-800/60",
    !value && "border-dashed",
    Boolean(value) &&
      "border-solid border-blue-500 bg-blue-50/40 dark:border-blue-400 dark:bg-blue-950/20",
    dragOver &&
      "border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/20 dark:border-blue-400 dark:bg-blue-950/30 dark:ring-blue-400/20",
    disabled && "cursor-not-allowed opacity-50",
    className,
  );

  return (
    <div className={cn(label && "mb-4")}>
      {label && (
        <label
          className="mb-1.5 block text-sm font-medium text-gray-700 select-none dark:text-gray-300"
          htmlFor={id}
        >
          {label}
        </label>
      )}

      <div
        className={dropzoneClassName}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id={id}
          onChange={handleFileChange}
          className={cn(
            "absolute inset-0 z-10 h-full w-full opacity-0",
            disabled ? "cursor-not-allowed" : "cursor-pointer",
          )}
          disabled={disabled}
          accept={accept}
          multiple={multiple}
        />

        <div className="pointer-events-none flex h-full min-h-48 flex-col items-center justify-center p-10 text-center select-none">
          <div className="relative mb-3">
            {value ? (
              <div className="relative inline-flex">
                <FileIcon aria-hidden="true" className="size-10 text-blue-500 dark:text-blue-400" />
                <div className="absolute -right-1 -bottom-1 rounded-full border border-gray-200 bg-white p-0.5 shadow-xs dark:border-gray-700 dark:bg-gray-900">
                  <CheckIcon
                    aria-hidden="true"
                    className="size-3.5 text-green-600 dark:text-green-400"
                  />
                </div>
              </div>
            ) : (
              <UploadIcon
                aria-hidden="true"
                className="mx-auto size-10 text-gray-400 dark:text-gray-500"
              />
            )}
          </div>

          {value ? (
            <div className="text-sm">
              <div className="max-w-64 truncate font-semibold text-gray-900 dark:text-gray-100">
                {value.name}
              </div>
              <div className="mt-1 text-xs text-gray-500 tabular-nums dark:text-gray-400">
                {formatFileSize(value.size)}
              </div>
            </div>
          ) : (
            <div className="text-sm">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                Click to upload or drag and drop
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{placeholder}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
