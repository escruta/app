import { Outlet, Link, Navigate } from "react-router";
import { motion } from "motion/react";
import { Logotype } from "@/components";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks";
import { websiteUrl } from "@/config";

export function AuthLayout() {
  const { isAuthenticated } = useAuth();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsKeyboardOpen(window.innerHeight < window.screen.height * 0.75);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isAuthenticated()) {
    return <Navigate to="/" />;
  }

  return (
    <main>
      <div className="flex h-dvh justify-center sm:h-screen">
        <div className="z-10 flex flex-1 justify-center bg-white p-8 pt-12 sm:items-center sm:pt-8 dark:bg-gray-900">
          <div className="w-full max-w-sm">
            <Outlet />
          </div>
        </div>
      </div>

      {isKeyboardOpen ? null : (
        <div className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 transform lg:top-8 lg:left-8 lg:translate-x-0 lg:transform-none">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center"
          >
            <Link to={websiteUrl} className="flex items-center p-4">
              <Logotype className="h-4 w-auto fill-black dark:fill-white" />
            </Link>
          </motion.div>
        </div>
      )}
    </main>
  );
}
