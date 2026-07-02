import { useNavigate } from "react-router";
import { useAuth, useFetch } from "@/hooks";
import { HomeActionCard, HomeChipProduct, SEOMetadata, TopBar } from "@/components";
import { GaussianBlurGradientBackground } from "@/components/backgrounds/GaussianBlurGradientBackground";
import { getRouteMetadata } from "@/lib/seo";
import { NotebookIcon, NoteIcon, SettingsIcon } from "@/components/icons";
import { motion } from "motion/react";
import type { Notebook, Note } from "@/interfaces";

export default function HomePage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const metadata = getRouteMetadata("/");

  const { data: notebooksData } = useFetch<Notebook[]>("/notebooks", {
    method: "GET",
  });
  const { data: notesData } = useFetch<Note[]>("/notes", {
    method: "GET",
  });

  const notebooks = notebooksData || [];
  const notes = notesData || [];

  const recentNotebooks = [...notebooks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);
  const recentNotes = [...notes]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  const formatDate = (dateValue: string | Date) => {
    return new Date(dateValue).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex h-screen max-h-full w-full flex-col">
      <SEOMetadata
        title={metadata?.title || "Home"}
        description={metadata?.description || "Dashboard"}
        url={metadata?.url || "/"}
        image={metadata?.image}
        twitterCard={metadata?.twitterCard}
      />
      <TopBar />
      <div className="relative flex-1 overflow-auto p-4 md:p-8">
        <GaussianBlurGradientBackground />

        <div className="relative z-10 mx-auto max-w-5xl pt-8 md:pt-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
              Welcome, {currentUser?.name?.split(" ")[0] || "User"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              What would you like to work on today?
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
          >
            <HomeActionCard
              title="Notebooks"
              description="Manage your projects"
              icon={<NotebookIcon />}
              onClick={() => navigate("/notebooks")}
            />
            <HomeActionCard
              title="Notes"
              description="Review and write notes"
              icon={<NoteIcon />}
              onClick={() => navigate("/notes")}
            />
            <HomeActionCard
              title="Settings"
              description="Adjust app preferences"
              icon={<SettingsIcon />}
              onClick={() => navigate("/settings")}
            />
          </motion.div>

          {(recentNotebooks.length > 0 || recentNotes.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mt-12 grid grid-cols-1 gap-2 md:grid-cols-2"
            >
              {recentNotebooks.length > 0 && (
                <div className="mb-6 md:mb-0">
                  <h3 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Recent notebooks
                  </h3>
                  <div className="flex flex-col gap-2">
                    {recentNotebooks.map((notebook) => (
                      <HomeChipProduct
                        key={notebook.id}
                        title={notebook.title}
                        icon={<NotebookIcon className="size-4 text-blue-500 dark:text-blue-400" />}
                        onClick={() => navigate(`/notebook/${notebook.id}`)}
                        date={formatDate(notebook.updatedAt)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {recentNotes.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Recent notes
                  </h3>
                  <div className="flex flex-col gap-2">
                    {recentNotes.map((note) => (
                      <HomeChipProduct
                        key={note.id}
                        title={note.title}
                        icon={<NoteIcon className="size-4 text-blue-500 dark:text-blue-400" />}
                        onClick={() => navigate("/notes", { state: { noteId: note.id } })}
                        date={formatDate(note.updatedAt)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
