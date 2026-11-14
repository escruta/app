import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  AccessibilityProvider,
  AuthProvider,
  ThemeProvider,
  DensityProvider,
  RealtimeProvider,
} from "./providers";
import { WindowChrome } from "./components/ui";
import { isDesktop } from "./lib/desktop";

import { WelcomePage } from "./auth/WelcomePage";
import { AppRoutes } from "./app/AppRoutes";
import { ProtectedRoute } from "./auth/ProtectedRoute";

import { NotFound } from "./NotFound";

import "./index.css";

const router = createHashRouter([
  {
    path: "welcome",
    Component: WelcomePage,
  },
  {
    Component: ProtectedRoute,
    children: AppRoutes,
  },
  {
    path: "*",
    Component: NotFound,
  },
]);

function WindowRevealer() {
  useEffect(() => {
    if (!isDesktop) return;

    void getCurrentWindow()
      .show()
      .catch(() => {});
  }, []);

  return null;
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

createRoot(root).render(
  <AuthProvider>
    <RealtimeProvider>
      <ThemeProvider>
        <DensityProvider>
          <AccessibilityProvider>
            <RouterProvider router={router} />
            <WindowChrome />
            <WindowRevealer />
          </AccessibilityProvider>
        </DensityProvider>
      </ThemeProvider>
    </RealtimeProvider>
  </AuthProvider>,
);
