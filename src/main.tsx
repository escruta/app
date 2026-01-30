import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { AuthProvider, ThemeProvider, ToastProvider } from "./providers";

import AuthLayout from "./auth/AuthLayout";
import { SignInPage } from "./auth/pages/SignInPage";
import { SignUpPage } from "./auth/pages/SignUpPage";
import AppRoutes from "./app/AppRoutes";
import { ProtectedRoute } from "./auth/ProtectedRoute";

import NotFound from "./NotFound";

import "./index.css";

const router = createBrowserRouter([
  {
    path: "signin",
    Component: AuthLayout,
    children: [{ index: true, Component: SignInPage }],
  },
  {
    path: "signup",
    Component: AuthLayout,
    children: [{ index: true, Component: SignUpPage }],
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
    <ThemeProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </ThemeProvider>
  </AuthProvider>,
);
