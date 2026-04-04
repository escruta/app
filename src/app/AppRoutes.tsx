import { lazy } from "react";
import { Navigate, type RouteObject } from "react-router";
import { AppLayout } from "./AppLayout";

const NotebooksPage = lazy(() => import("./pages/NotebooksPage"));
const NotesPage = lazy(() => import("./pages/NotesPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const NotebookPage = lazy(() => import("./pages/NotebookPage"));

export const AppRoutes: RouteObject[] = [
  {
    Component: AppLayout,
    children: [
      {
        index: true,
        element: <Navigate to="/notebooks" replace />,
      },
      {
        path: "notebooks",
        Component: NotebooksPage,
      },
      {
        path: "notes",
        Component: NotesPage,
      },
      {
        path: "settings",
        Component: SettingsPage,
      },
      {
        path: "notebook/:notebookId",
        loader: async ({ params }) => {
          const notebookId = params.notebookId;
          if (!notebookId) {
            throw new Error("Notebook ID is required");
          }
          return notebookId;
        },
        Component: NotebookPage,
      },
    ],
  },
];
