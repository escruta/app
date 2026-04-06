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
        "border-gray-200 dark:border-gray-700",
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
      <div className="relative flex h-full items-center gap-3 p-3">
        <div className="shrink-0 rounded-xs bg-blue-100 p-2 dark:bg-blue-900/50">
          {note.icon ? (
            <span className="flex size-4 items-center justify-center text-sm leading-none">
              {note.icon}
            </span>
          ) : (
            <div className="size-4 text-blue-600 dark:text-blue-400">
              <NoteIcon />
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
          <h2 className="line-clamp-1 text-sm font-medium text-gray-900 transition-colors duration-300 group-hover:text-blue-900 dark:text-gray-100 dark:group-hover:text-blue-100">
            {note.title}
          </h2>
        </div>
      </div>
    </div>
  );
}
