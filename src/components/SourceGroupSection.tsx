import { useState } from "react";
import type { SourceGroup } from "@/interfaces";
import { useCookie, useFetch } from "@/hooks";
import {
  Button,
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Modal,
  Spinner,
  TextField,
  Tooltip,
} from "@/components/ui";
import {
  ChevronIcon,
  DeleteIcon,
  DotsVerticalIcon,
  EditIcon,
  FolderIcon,
} from "@/components/icons";

interface SourceGroupSectionProps {
  notebookId: string;
  group: SourceGroup;
  children: React.ReactNode;
  onChanged?: () => void;
}

export function SourceGroupSection({
  notebookId,
  group,
  children,
  onChanged,
}: SourceGroupSectionProps) {
  const [collapsed, setCollapsed] = useCookie<boolean>(
    `sourceGroupCollapsed-${notebookId}-${group.id}`,
    false,
  );
  const [isRenameModalOpen, setIsRenameModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>(group.title);

  const groupEndpoint = `notebooks/${notebookId}/source-groups/${group.id}`;

  const { loading: renamingGroup, refetch: renameGroup } = useFetch<SourceGroup>(
    groupEndpoint,
    {
      method: "PATCH",
      data: { title: newTitle },
      onSuccess: () => {
        useFetch.clearCache();
        setIsRenameModalOpen(false);
        onChanged?.();
      },
      onError: (error) => {
        console.error("Error renaming source group:", error.message);
      },
    },
    false,
  );

  const { loading: deletingGroup, refetch: deleteGroup } = useFetch<void>(
    groupEndpoint,
    {
      method: "DELETE",
      onSuccess: () => {
        useFetch.clearCache();
        setIsDeleteModalOpen(false);
        onChanged?.();
      },
      onError: (error) => {
        console.error("Error deleting source group:", error.message);
      },
    },
    false,
  );

  async function handleRenameGroup() {
    if (!newTitle.trim() || newTitle.trim() === group.title) {
      setIsRenameModalOpen(false);
      setNewTitle(group.title);
      return;
    }
    await renameGroup();
  }

  return (
    <div className="flex flex-col">
      <div className="group flex items-center gap-1 rounded-xs">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-xs px-1 py-1.5 text-left outline-none"
          aria-expanded={!collapsed}
        >
          <span className="shrink-0 text-gray-400 dark:text-gray-500">
            <ChevronIcon className="size-4" direction={collapsed ? "right" : "down"} />
          </span>
          <span className="shrink-0 text-blue-500 dark:text-blue-400">
            <FolderIcon className="size-4" />
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-700 dark:text-gray-200">
            {group.title}
          </span>
        </button>
        <div onClick={(e) => e.stopPropagation()}>
          <Menu>
            <Tooltip text="Group options" position="top">
              <MenuTrigger>
                <IconButton
                  icon={<DotsVerticalIcon className="size-3.5" />}
                  size="sm"
                  ariaLabel="Group options"
                  variant="ghost"
                  className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                />
              </MenuTrigger>
            </Tooltip>
            <MenuContent align="right">
              <MenuItem
                icon={<EditIcon className="size-4" />}
                label="Rename group"
                onClick={() => {
                  setNewTitle(group.title);
                  setIsRenameModalOpen(true);
                }}
              />
              <MenuItem
                icon={<DeleteIcon className="size-4" />}
                label="Delete group"
                variant="danger"
                onClick={() => setIsDeleteModalOpen(true)}
              />
            </MenuContent>
          </Menu>
        </div>
      </div>

      {!collapsed && <div className="flex flex-col gap-2 pt-1">{children}</div>}

      <Modal
        isOpen={isRenameModalOpen}
        onClose={() => {
          setIsRenameModalOpen(false);
          setNewTitle(group.title);
        }}
        title="Rename group"
        onSubmit={() => {
          if (newTitle.trim() && !renamingGroup) handleRenameGroup();
        }}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsRenameModalOpen(false);
                setNewTitle(group.title);
              }}
              disabled={renamingGroup}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRenameGroup}
              disabled={!newTitle.trim() || renamingGroup || newTitle.trim() === group.title}
              icon={renamingGroup ? <Spinner className="size-4" /> : undefined}
            >
              {renamingGroup ? "Saving..." : "Save"}
            </Button>
          </>
        }
      >
        <TextField
          id={`source-group-rename-${group.id}`}
          label="Name your group"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="e.g., Background, Methods, Results…"
          autoFocus
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete group"
        actions={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteGroup()}
              disabled={deletingGroup}
              icon={deletingGroup ? <Spinner className="size-4" /> : undefined}
            >
              {deletingGroup ? "Deleting..." : "Delete"}
            </Button>
          </>
        }
      >
        <p className="text-gray-600 dark:text-gray-300">
          You&apos;re about to delete <span className="font-semibold">{group.title}</span>. This
          can&apos;t be undone, any sources inside will stay in your notebook, just ungrouped.
        </p>
      </Modal>
    </div>
  );
}
