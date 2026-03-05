import { useEffect } from "react";
import { Outlet } from "react-router";
import { useAuth, useCookie } from "@/hooks";
import type { User } from "@/interfaces";
import { SideMenu } from "@/components";

export function AppLayout() {
  const { currentUser, fetchUserData } = useAuth();
  const [, setUserData] = useCookie<User | null>("user", null);

  useEffect(() => {
    if (currentUser) {
      setUserData(currentUser);
    }
  }, [currentUser, setUserData]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return (
    <div className="flex h-screen flex-col bg-white text-black select-none md:flex-row dark:bg-black dark:text-white">
      <SideMenu />
      <div className="flex-grow overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
