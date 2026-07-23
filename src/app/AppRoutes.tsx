import { lazy } from "react";
import { type RouteObject } from "react-router";
import { AppLayout } from "./AppLayout";

const HomePage = lazy(() => import("./pages/HomePage"));
const NotebooksPage = lazy(() => import("./pages/NotebooksPage"));
const NotesPage = lazy(() => import("./pages/NotesPage"));
const NotePage = lazy(() => import("./pages/NotePage"));
const FolderPage = lazy(() => import("./pages/FolderPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
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
        path: "notes",
        Component: NotesPage,
      },
      {
        path: "note/:noteId",
        loader: async ({ params }) => {
          const noteId = params.noteId;
          if (!noteId) {
            throw new Error("Note ID is required");
          }
          return noteId;
        },
        Component: NotePage,
      },
      {
        path: "settings",
        Component: SettingsPage,
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
