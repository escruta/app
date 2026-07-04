import { useEffect } from "react";
import { Outlet } from "react-router";
import { useAuth, useCookie } from "@/hooks";
import type { User } from "@/interfaces";

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
    <div className="flex h-screen flex-col bg-white text-black select-none dark:bg-black dark:text-white">
      <div className="grow overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
