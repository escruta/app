import { useNavigate } from "react-router";
import { useState } from "react";
import { useAuth, useFetch } from "@/hooks";
import { HomeActionCard, HomeChipProduct, SEOMetadata } from "@/components";
import { GaussianBlurGradientBackground } from "@/components/backgrounds/GaussianBlurGradientBackground";
import { getRouteMetadata } from "@/lib/seo";
import { NotebookIcon, NoteIcon, SettingsIcon, SendIcon } from "@/components/icons";
import { motion } from "motion/react";
import { Dropdown, TextField, IconButton, Tooltip } from "@/components/ui";
import type { Notebook, Note } from "@/interfaces";

export default function HomePage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const metadata = getRouteMetadata("/");
  const [input, setInput] = useState<string>("");
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(null);

  const { data: notebooksData, loading: isLoadingNotebooks } = useFetch<Notebook[]>("/notebooks", {
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

  const handleSendMessage = () => {
    if (!input.trim() || !selectedNotebook) return;
    navigate(`/notebook/${selectedNotebook.id}`, { state: { question: input } });
  };

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
      <div className="relative flex-1 overflow-auto p-4 md:p-8">
        <GaussianBlurGradientBackground />

        <div className="relative z-10 mx-auto max-w-4xl pt-8 md:pt-24">
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
            transition={{ duration: 0.35, delay: 0.05 }}
            className="mb-8"
          >
            <div className="relative flex flex-col rounded-xs border border-gray-300 bg-white shadow-sm transition-all focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:focus-within:border-blue-400 dark:focus-within:ring-blue-400">
              <TextField
                id="home-chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && input.trim()) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask a question..."
                className="w-full rounded-t-xs border-0 bg-transparent py-3 pr-12 pl-4 shadow-none hover:border-transparent hover:ring-0 hover:ring-offset-0 focus:border-transparent focus:ring-0 focus:ring-offset-0 dark:hover:ring-offset-0 dark:focus:ring-0 dark:focus:ring-offset-0"
                autoFocus
                maxRows={5}
                multiline
              />
              <div className="flex items-center justify-between border-t border-gray-100 p-2 dark:border-gray-800">
                <Tooltip text="Select a notebook" position="right">
                  <Dropdown<Notebook>
                    options={notebooks}
                    selectedOption={selectedNotebook}
                    onSelect={setSelectedNotebook}
                    renderOption={(n) => n?.title || ""}
                    placeholder={isLoadingNotebooks ? "Loading notebooks..." : "Select a notebook"}
                    disabled={isLoadingNotebooks || notebooks.length === 0}
                    size="sm"
                  />
                </Tooltip>
                <Tooltip text="Send message" position="left">
                  <IconButton
                    icon={<SendIcon />}
                    onClick={handleSendMessage}
                    disabled={!input.trim() || !selectedNotebook}
                    aria-label="Send message"
                    size="sm"
                    variant="primary"
                  />
                </Tooltip>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
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
              className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2"
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
                        icon={
                          note.icon ? (
                            <span className="flex size-4 items-center justify-center text-sm leading-none">
                              {note.icon}
                            </span>
                          ) : (
                            <NoteIcon className="size-4 text-blue-500 dark:text-blue-400" />
                          )
                        }
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
