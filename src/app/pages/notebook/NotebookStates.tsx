import { motion } from "motion/react";
import { NotebookIcon, FireIcon } from "@/components/icons";

export function NotebookLoadingState() {
  return (
    <div className="flex h-screen w-full flex-col justify-center">
      <div className="border-y border-gray-200 bg-gray-50 px-6 py-5 dark:border-gray-700 dark:bg-gray-950">
        <div className="flex items-center justify-center py-12">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="mb-4 inline-block h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            />
            <p className="font-medium text-gray-600 dark:text-gray-400">Loading notebook...</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

interface ErrorProps {
  error: any;
}

export function NotebookErrorState({ error }: ErrorProps) {
  if (error.status === 404) {
    return (
      <div className="flex h-screen w-full flex-col justify-center">
        <div className="border-y border-gray-200 bg-gray-50 px-6 py-5 dark:border-gray-700 dark:bg-gray-950">
          <motion.div
            className="flex items-center justify-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xs bg-gray-100 dark:bg-gray-800">
                <div className="h-8 w-8 text-gray-400 dark:text-gray-600">
                  <NotebookIcon />
                </div>
              </div>
              <h1 className="mb-2 text-xl font-medium text-gray-700 dark:text-gray-300">
                Notebook not found
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                The notebook you're looking for doesn't exist or has been deleted.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error.status === 401) {
    return (
      <div className="flex h-screen w-full flex-col justify-center">
        <div className="border-y border-gray-200 bg-gray-50 px-6 py-5 dark:border-gray-700 dark:bg-gray-950">
          <motion.div
            className="flex items-center justify-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xs bg-yellow-50 dark:bg-yellow-950">
                <div className="h-8 w-8 text-yellow-500">
                  <NotebookIcon />
                </div>
              </div>
              <h1 className="mb-2 text-xl font-medium text-yellow-600 dark:text-yellow-400">
                Access denied
              </h1>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                You do not have permission to access this notebook.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col justify-center">
      <div className="border-y border-gray-200 bg-gray-50 px-6 py-5 dark:border-gray-700 dark:bg-gray-950">
        <motion.div
          className="flex items-center justify-center py-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xs bg-red-50 dark:bg-red-950">
              <div className="h-8 w-8 text-red-500">
                <FireIcon />
              </div>
            </div>
            <h1 className="mb-2 text-lg font-medium text-red-600 dark:text-red-400">
              Error loading notebook
            </h1>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              {error.message}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
