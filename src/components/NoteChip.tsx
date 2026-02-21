import { cn } from "@/lib/utils";
import type { Note } from "@/interfaces";
import { NoteIcon } from "@/components/icons";

interface NoteChipProps {
  note: Note;
  className?: string;
  onSelect?: (note: Note) => void;
}

export function NoteChip({ note, className, onSelect }: NoteChipProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xs border cursor-pointer",
        "transition-all duration-300 ease-out select-none",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
        "dark:focus:ring-offset-gray-900",
        "bg-white dark:bg-gray-900",
        "border-gray-200 dark:border-gray-600",
        "hover:bg-blue-50 dark:hover:bg-gray-800",
        "hover:border-blue-300 dark:hover:border-gray-500",
        className,
      )}
      onClick={() => onSelect?.(note)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(note);
        }
      }}
      tabIndex={0}
      role="button"
    >
      <div className="relative p-3 h-full flex items-center gap-3">
        <div className="shrink-0 p-2 rounded-xs transition-all duration-300 bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-800">
          {note.icon ? (
            <span className="text-sm leading-none flex items-center justify-center size-4">
              {note.icon}
            </span>
          ) : (
            <div className="size-4 transition-all duration-300 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              <NoteIcon />
            </div>
          )}
        </div>
        <div className="flex flex-col flex-1 justify-center gap-0.5 min-w-0">
          <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-blue-900 dark:group-hover:text-blue-100 transition-colors duration-300">
            {note.title}
          </h2>
        </div>
      </div>
    </div>
  );
}
