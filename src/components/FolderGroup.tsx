import type { ReactNode } from "react";
import type { Folder } from "@/interfaces";
import { IconButton, Menu, MenuContent, MenuItem, MenuTrigger, Tooltip } from "@/components/ui";
import {
  ChevronIcon,
  DeleteIcon,
  DotsVerticalIcon,
  EditIcon,
  FolderIcon,
} from "@/components/icons";
import { AnimatePresence, motion } from "motion/react";

interface FolderGroupProps {
  folder: Folder;
  itemCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onEditFolder: () => void;
  onDeleteFolder: () => void;
  children: ReactNode;
}

export function FolderGroup({
  folder,
  itemCount,
  isCollapsed,
  onToggleCollapse,
  onEditFolder,
  onDeleteFolder,
  children,
}: FolderGroupProps) {
  return (
    <div className="flex flex-col rounded-xs border border-gray-400/60 bg-gray-50/40 transition-colors duration-200 dark:border-gray-600/30 dark:bg-gray-900/30">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleCollapse}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleCollapse();
          }
        }}
        className="flex w-full cursor-pointer items-center gap-2 rounded-xs px-2.5 py-2 text-left transition-colors duration-200 hover:bg-blue-100/30 dark:hover:bg-blue-900/10"
        aria-expanded={!isCollapsed}
      >
        <ChevronIcon
          direction={isCollapsed ? "right" : "down"}
          className="size-3.5 text-gray-400 transition-transform duration-200 dark:text-gray-500"
        />
        <FolderIcon className="size-3.5 text-blue-500 dark:text-blue-400" />
        <h4 className="flex-1 text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          {folder.title}
        </h4>
        <span className="text-xs font-normal text-gray-400 dark:text-gray-500">{itemCount}</span>
        <span onClick={(e) => e.stopPropagation()} className="flex items-center">
          <Menu>
            <Tooltip text="Folder options" position="top">
              <MenuTrigger>
                <IconButton
                  variant="ghost"
                  icon={<DotsVerticalIcon className="size-3" />}
                  size="xs"
                  ariaLabel="Folder options"
                />
              </MenuTrigger>
            </Tooltip>
            <MenuContent align="right">
              <MenuItem
                icon={<EditIcon className="size-4" />}
                label="Rename folder"
                onClick={onEditFolder}
              />
              <MenuItem
                icon={<DeleteIcon className="size-4" />}
                label="Delete folder"
                variant="danger"
                onClick={onDeleteFolder}
              />
            </MenuContent>
          </Menu>
        </span>
      </div>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-2.5 pt-1 pb-2.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
