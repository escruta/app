import { NavLink, useLocation, useNavigate } from "react-router";
import { useAuth } from "@/hooks";
import {
  Tooltip,
  Button,
  Modal,
  IconButton,
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  MenuSeparator,
} from "@/components/ui";
import { ChevronIcon, SettingsIcon, SignOutIcon, DotsVerticalIcon } from "@/components/icons";
import { useState } from "react";
import { AppIcon } from "./AppIcon";

interface TopBarProps {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  extraMenuItems?: React.ReactNode;
}

export function TopBar({ title, actions, extraMenuItems }: TopBarProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const handleSignOut = () => {
    signOut();
    navigate("/notebooks", { replace: true });
    setShowSignOutModal(false);
  };

  return (
    <div className="z-50 flex w-full shrink-0 flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-2 md:px-6 dark:border-gray-800 dark:bg-black">
      <div className="flex items-center gap-4">
        {location.pathname !== "/" ? (
          <Tooltip
            text="Previous page"
            position="right"
            className="group relative grid size-10 shrink-0 place-items-center"
          >
            <AppIcon className="col-start-1 row-start-1 size-8 fill-gray-800 transition-opacity duration-200 group-hover:opacity-0 dark:fill-gray-50" />
            <IconButton
              icon={<ChevronIcon direction="left" className="size-5" />}
              onClick={() => navigate(-1)}
              variant="ghost"
              size="sm"
              className="col-start-1 row-start-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              ariaLabel="Previous page"
            />
          </Tooltip>
        ) : (
          <NavLink to="/" className="group grid h-10 w-10 shrink-0 place-items-center">
            <AppIcon className="size-8 fill-gray-800 transition-all duration-300 group-hover:fill-blue-500 dark:fill-gray-50 dark:group-hover:fill-blue-400" />
          </NavLink>
        )}

        {title && (
          <>
            <div className="mx-2 h-6 w-px bg-gray-200 dark:bg-gray-800" />
            <div className="flex min-w-0 items-center">
              <h1 className="truncate text-lg font-bold text-gray-900 dark:text-white">{title}</h1>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-row items-center gap-2">
        {actions && (
          <div className="mr-2 flex items-center gap-2">
            {actions}
            <div className="ml-2 h-6 w-px bg-gray-200 dark:bg-gray-800" />
          </div>
        )}

        <Menu>
          <Tooltip text="Options" position="bottom">
            <MenuTrigger>
              <IconButton
                size="sm"
                icon={<DotsVerticalIcon className="size-5" />}
                variant="ghost"
                ariaLabel="Options"
              />
            </MenuTrigger>
          </Tooltip>
          <MenuContent align="right" className="z-60">
            {extraMenuItems}
            {extraMenuItems && <MenuSeparator />}
            <MenuItem
              label="Settings"
              icon={<SettingsIcon className="size-4" />}
              onClick={() => navigate("/settings")}
            />
            <MenuSeparator />
            <MenuItem
              label="Sign out"
              icon={<SignOutIcon className="size-4" />}
              onClick={() => setShowSignOutModal(true)}
              variant="danger"
            />
          </MenuContent>
        </Menu>
      </div>

      <Modal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        title="Sign out"
        width="sm"
        actions={
          <>
            <Button onClick={() => setShowSignOutModal(false)} variant="secondary">
              Cancel
            </Button>
            <Button onClick={handleSignOut} variant="danger">
              Sign out
            </Button>
          </>
        }
      >
        <p className="text-gray-700 dark:text-gray-300">Are you sure you want to sign out?</p>
      </Modal>
    </div>
  );
}
