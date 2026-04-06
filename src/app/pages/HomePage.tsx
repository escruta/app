import { useNavigate } from "react-router";
import { useState } from "react";
import { useAuth, useFetch } from "@/hooks";
import { HomeActionCard, SEOMetadata } from "@/components";
import { SimpleBackground } from "@/components/backgrounds/SimpleBackground";
import { getRouteMetadata } from "@/lib/seo";
import { NotebookIcon, NoteIcon, SettingsIcon, SendIcon } from "@/components/icons";
import { motion } from "motion/react";
import { Dropdown, TextField, IconButton } from "@/components/ui";
import type { Notebook } from "@/interfaces";

export default function HomePage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const metadata = getRouteMetadata("/");
  const [input, setInput] = useState<string>("");
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(null);

  const { data: notebooksData, loading: isLoadingNotebooks } = useFetch<Notebook[]>("/notebooks", {
    method: "GET",
  });

  const notebooks = notebooksData || [];

  const handleSendMessage = () => {
    if (!input.trim() || !selectedNotebook) return;
    navigate(`/notebook/${selectedNotebook.id}`, { state: { question: input } });
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
        <SimpleBackground />

        <div className="relative z-10 mx-auto max-w-4xl pt-32">
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
                <Dropdown<Notebook>
                  options={notebooks}
                  selectedOption={selectedNotebook}
                  onSelect={setSelectedNotebook}
                  renderOption={(n) => n?.title || ""}
                  placeholder={isLoadingNotebooks ? "Loading notebooks..." : "Select a notebook"}
                  disabled={isLoadingNotebooks || notebooks.length === 0}
                  className="w-64 max-w-[60%]"
                  size="sm"
                />
                <IconButton
                  icon={<SendIcon />}
                  onClick={handleSendMessage}
                  disabled={!input.trim() || !selectedNotebook}
                  aria-label="Send message"
                  size="sm"
                  variant="primary"
                />
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
        </div>
      </div>
    </div>
  );
}
