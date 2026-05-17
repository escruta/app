import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { Note } from "@/interfaces";
import { NoteIcon, NotebookIcon } from "@/components/icons";
import { Checkbox } from "@/components/ui/Checkbox";
import { Chip } from "@/components/ui/Chip";
import { Tooltip } from "@/components/ui/Tooltip";
import { useNavigate } from "react-router";

interface CanvasNoteCardProps {
  note: Note;
  notebookId?: string;
  notebookName?: string;
  onSelect?: (note: Note) => void;
  className?: string;
  initialX?: number;
  initialY?: number;
  selected?: boolean;
  onSelectionChange?: (selected: boolean) => void;
}

export function CanvasNoteCard({
  note,
  notebookId,
  notebookName,
  onSelect,
  className,
  initialX = 0,
  initialY = 0,
  selected = false,
  onSelectionChange,
}: CanvasNoteCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ x: initialX, y: initialY, opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "no-drag absolute w-56 p-3 rounded-xs cursor-pointer select-none overflow-hidden",
        "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700",
        "ring-1 ring-gray-500/5 dark:ring-gray-500/10",
        "transition-all duration-200",
        "hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50",
        "hover:ring-1 hover:ring-gray-200 dark:hover:ring-gray-700 hover:ring-offset-1 hover:ring-offset-white dark:hover:ring-offset-gray-950",
        "group",
        selected && "ring-2 ring-blue-500 border-blue-500 dark:ring-blue-400 dark:border-blue-400",
        className,
      )}
      onClick={() => onSelect?.(note)}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
            <div className="shrink-0 rounded-xs bg-blue-100 p-1.5 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
              <div className="size-3.5">
                <NoteIcon />
              </div>
            </div>
            <h3 className="truncate font-sans text-sm font-semibold text-gray-900 dark:text-gray-100">
              {note.title}
            </h3>
          </div>
          <div
            className="flex shrink-0 items-center gap-2"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {note.notebookId && notebookName && (
              <Tooltip text={notebookName} position="top">
                <Chip
                  size="sm"
                  icon={<NotebookIcon className="size-2.5" />}
                  onClick={() => navigate(`/notebook/${notebookId}`)}
                  className="border-none bg-gray-50/40 opacity-40 transition-opacity hover:opacity-100 dark:bg-gray-800/40"
                />
              </Tooltip>
            )}
            {onSelectionChange && <Checkbox checked={selected} onChange={onSelectionChange} />}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
