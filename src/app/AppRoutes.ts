import { lazy } from "react";
import type { RouteObject } from "react-router";
import AppLayout from "./AppLayout";

const HomePage = lazy(() => import("./pages/HomePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const NotebookPage = lazy(() => import("./pages/NotebookPage"));

export default (<RouteObject[]>[
  {
    Component: AppLayout,
    children: [
      {
        index: true,
        Component: HomePage,
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
]);
