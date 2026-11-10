import { createRoot } from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router";
import { AuthProvider, ThemeProvider, DensityProvider, RealtimeProvider } from "./providers";
import { WindowChrome } from "./components/ui";

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

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

createRoot(root).render(
  <AuthProvider>
    <RealtimeProvider>
      <ThemeProvider>
        <DensityProvider>
          <RouterProvider router={router} />
          <WindowChrome />
        </DensityProvider>
      </ThemeProvider>
    </RealtimeProvider>
  </AuthProvider>,
);
