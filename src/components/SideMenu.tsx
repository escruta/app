import { NavLink, useLocation, useNavigate } from "react-router";
import { useAuth, useIsMobile } from "@/hooks";
import { Tooltip, Button, Modal, IconButton } from "@/components/ui";
import { SettingsIcon, SignOutIcon, NoteIcon, NotebookIcon } from "@/components/icons";
import { useState } from "react";
import { AppIcon } from "./AppIcon";

interface SideItemMenuProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  position?: "right" | "bottom";
}

function SideItemMenu({
  icon,
  label,
  onClick,
  isActive = false,
  position = "right",
}: SideItemMenuProps) {
  return (
    <Tooltip text={label} position={position}>
      <IconButton
        icon={icon}
        onClick={onClick}
        variant={isActive ? "primary" : "ghost"}
        ariaLabel={label}
      />
    </Tooltip>
  );
}

export function SideMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const isMobile = useIsMobile();

  const handleSignOut = () => {
    signOut();
    navigate("/notebooks", { replace: true });
    setShowSignOutModal(false);
  };

  return (
    <div className="z-10 order-last flex w-full shrink-0 flex-row items-center justify-between border-t border-gray-200 bg-white p-2 md:order-first md:h-screen md:w-16 md:flex-col md:border-t-0 md:border-r md:py-4 dark:border-gray-800 dark:bg-black">
      <NavLink to="/" className="group grid h-12 w-12 shrink-0 place-items-center md:mb-4">
        <AppIcon className="h-10 w-10 fill-gray-800 transition-all duration-300 group-hover:fill-blue-500 dark:fill-gray-50 dark:group-hover:fill-blue-400" />
      </NavLink>

      <div className="flex flex-row items-center justify-center gap-1 md:w-full md:flex-col md:gap-4">
        <div className="flex flex-row items-center gap-1 md:flex-col md:gap-3">
          <SideItemMenu
            icon={<NotebookIcon />}
            label="Notebooks"
            onClick={() => navigate("/notebooks")}
            isActive={location.pathname === "/notebooks"}
            position={isMobile ? "bottom" : "right"}
          />
          <SideItemMenu
            icon={<NoteIcon />}
            label="Notes"
            onClick={() => navigate("/notes")}
            isActive={location.pathname === "/notes"}
            position={isMobile ? "bottom" : "right"}
          />
        </div>

        <div className="mx-2 h-8 w-px bg-gray-200 md:mx-0 md:my-1 md:h-px md:w-8 dark:bg-gray-800" />

        <div className="flex flex-row items-center gap-1 md:flex-col md:gap-3">
          <SideItemMenu
            icon={<SettingsIcon />}
            label="Settings"
            onClick={() => navigate("/settings")}
            isActive={location.pathname === "/settings"}
            position={isMobile ? "bottom" : "right"}
          />
          <SideItemMenu
            icon={<SignOutIcon />}
            label="Sign out"
            onClick={() => setShowSignOutModal(true)}
            position={isMobile ? "bottom" : "right"}
          />
        </div>
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
