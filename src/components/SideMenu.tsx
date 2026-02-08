import { NavLink, useLocation, useNavigate } from "react-router";
import { useAuth, useIsMobile } from "@/hooks";
import { Tooltip, Button, Modal } from "@/components/ui";
import { HomeIcon, SettingsIcon, SignOutIcon } from "@/components/icons";
import { useState } from "react";
import { AppIcon } from "./AppIcon";
import { cn } from "@/lib/utils";

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
      <button
        onClick={onClick}
        className={cn(
          "w-10 h-10 p-2.5 rounded-xs flex items-center justify-center transition-all duration-200 select-none focus:outline-none cursor-pointer",
          {
            "bg-blue-500 border-2 border-blue-600 text-white shadow-sm shadow-blue-500/30 hover:shadow-md hover:shadow-blue-500/40 hover:ring-2 hover:ring-blue-300 hover:ring-offset-1 hover:ring-offset-white dark:hover:ring-offset-gray-900 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 dark:bg-blue-600 dark:border-blue-500 dark:hover:ring-blue-500/50":
              isActive,
            "bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:ring-1 hover:ring-gray-200 hover:ring-offset-1 hover:ring-offset-white dark:hover:ring-offset-gray-900 focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 dark:bg-gray-900/50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/50 dark:hover:border-gray-600":
              !isActive,
          },
        )}
        aria-label={label}
        type="button"
      >
        {icon}
      </button>
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
    navigate("/", { replace: true });
    setShowSignOutModal(false);
  };

  return (
    <div className="flex h-auto md:h-screen flex-row md:flex-col justify-between items-center border-b md:border-b-0 md:border-e border-gray-200 dark:border-gray-800 transition-all duration-300 w-full md:w-16 md:min-w-16 md:max-w-16 bg-white dark:bg-black z-10">
      <NavLink
        to="/"
        className="w-16 h-16 grid place-items-center group shrink-0"
      >
        <AppIcon className="h-10 w-10 fill-gray-800 dark:fill-gray-50 transition-all duration-300 group-hover:fill-blue-500 dark:group-hover:fill-blue-400" />
      </NavLink>

      <div className="flex flex-row md:flex-col items-center justify-center gap-3 mr-4 md:mr-0 md:mb-6">
        <SideItemMenu
          icon={<HomeIcon />}
          label="Notebooks"
          onClick={() => navigate("/")}
          isActive={location.pathname === "/"}
          position={isMobile ? "bottom" : "right"}
        />
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

      <Modal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        title="Sign out"
        width="sm"
        actions={
          <>
            <Button
              onClick={() => setShowSignOutModal(false)}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button onClick={handleSignOut} variant="danger">
              Sign out
            </Button>
          </>
        }
      >
        <p className="text-gray-700 dark:text-gray-300">
          Are you sure you want to sign out?
        </p>
      </Modal>
    </div>
  );
}
