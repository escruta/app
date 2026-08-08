import { lazy } from "react";
import { type RouteObject } from "react-router";
import { AppLayout } from "./AppLayout";

const HomePage = lazy(() => import("./pages/HomePage"));
const NotebooksPage = lazy(() => import("./pages/NotebooksPage"));
const FolderPage = lazy(() => import("./pages/FolderPage"));
const NotebookPage = lazy(() => import("./pages/NotebookPage"));

export const AppRoutes: RouteObject[] = [
  {
    Component: AppLayout,
    children: [
      {
        index: true,
        Component: HomePage,
      },
      {
        path: "notebooks",
        Component: NotebooksPage,
      },
      {
        path: "folder/:folderId",
        loader: async ({ params }) => {
          const folderId = params.folderId;
          if (!folderId) {
            throw new Error("Folder ID is required");
          }
          return folderId;
        },
        Component: FolderPage,
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
