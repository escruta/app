import { EditIcon, ShareIcon, DotsVerticalIcon } from "@/components/icons";
import {
  Tooltip,
  IconButton,
  Button,
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  Divider,
} from "@/components/ui";
import { motion } from "motion/react";

interface NotebookHeaderProps {
  title?: string;
  isTablet: boolean;
  onRenameClick: () => void;
  onShareClick: () => void;
}

export function NotebookHeader({
  title,
  isTablet,
  onRenameClick,
  onShareClick,
}: NotebookHeaderProps) {
  return (
    <div className="z-10 border-b border-gray-200 bg-white px-4 py-4 md:px-6 dark:border-gray-700 dark:bg-black">
      <div className="flex items-center justify-between gap-2">
        <h1 className="flex min-w-0 flex-1 items-baseline gap-1.5 text-gray-900 select-text dark:text-white">
          <span className="hidden shrink-0 text-xs font-medium tracking-wide text-gray-500 uppercase md:block dark:text-gray-400">
            Notebook /{" "}
          </span>
          <span className="truncate text-2xl font-bold">{title}</span>
        </h1>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex gap-3"
        >
          {isTablet ? (
            <Menu>
              <MenuTrigger>
                <IconButton
                  icon={<DotsVerticalIcon />}
                  variant="ghost"
                  size="sm"
                  className="shrink-0 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                />
              </MenuTrigger>
              <MenuContent align="right">
                <MenuItem label="Edit title" icon={<EditIcon />} onClick={onRenameClick} />
                <Divider />
                <MenuItem label="Share notebook" icon={<ShareIcon />} onClick={onShareClick} />
              </MenuContent>
            </Menu>
          ) : (
            <>
              <Button onClick={onShareClick} size="sm" icon={<ShareIcon />}>
                Share notebook
              </Button>
              <Tooltip text="Edit title" position="bottom">
                <IconButton
                  icon={<EditIcon />}
                  variant="ghost"
                  size="sm"
                  className="shrink-0 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={onRenameClick}
                />
              </Tooltip>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
