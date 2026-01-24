import { useEffect } from "react";
import { Outlet } from "react-router";
import { useAuth, useCookie } from "@/hooks";
import type { User } from "@/interfaces";
import { SideMenu } from "@/components";

export default function AppLayout() {
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
    <div className="flex flex-col md:flex-row h-screen bg-white text-black dark:bg-black dark:text-white select-none">
      <SideMenu />
      <div className="flex-grow overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
