import { useMemo } from "react";
import { useNavigate } from "react-router";
import { useAuth, useFetch } from "@/hooks";
import { HomeActionCard, HomeChipProduct, SEOMetadata, TopBar } from "@/components";
import { GaussianBlurGradientBackground } from "@/components/backgrounds/GaussianBlurGradientBackground";
import { getRouteMetadata } from "@/lib/seo";
import { NotebookIcon, NoteIcon, SettingsIcon } from "@/components/icons";
import { motion } from "motion/react";
import type { Notebook, Note } from "@/interfaces";

const GREETINGS = [
  "Welcome",
  "Good to see you",
  "Glad you're here",
  "Hello",
  "Hey there",
  "Hi",
  "Great to have you back",
  "Nice to see you again",
  "Howdy",
  "Greetings",
  "Salutations",
  "Ahoy",
  "What's up",
  "Yo",
  "Hiya",
  "Good day",
  "Pleased to meet your acquaintance",
  "Look who's back",
  "Long time no see",
  "Welcome aboard",
  "Welcome back",
  "Good morning",
  "Good afternoon",
  "Good evening",
  "Bonjour",
  "Hola",
  "Ciao",
  "Aloha",
  "Cheers",
  "How goes it",
  "Top of the morning",
  "Lovely to see you",
  "Delighted to have you",
  "Fantastic to see you",
  "Wonderful to have you here",
  "Thrilled you stopped by",
  "Always a pleasure",
  "The legend returns",
  "Back in action",
  "You made it",
  "There you are",
  "Fancy seeing you here",
  "Well, well, well",
  "Welcome to the hub",
  "Let's get to work",
  "Ready for another great day",
  "Hope you're doing well",
  "It's a beautiful day",
  "Make yourself at home",
  "Step right in",
];

const SUBTITLES = [
  "What would you like to work on today?",
  "Ready to tackle something new?",
  "What's on your mind today?",
  "How can we make progress today?",
  "Pick up where you left off?",
  "What shall we dive into?",
  "What's the plan for today?",
  "Ready to create something great?",
  "Where shall we begin?",
  "What are we building today?",
  "Let's get something done today.",
  "Time to make things happen.",
  "What's your focus for today?",
  "Ready to dive back in?",
  "What deserves your attention?",
  "Let's make today productive.",
  "Something new or something familiar?",
  "Where to next?",
  "What sparks your interest today?",
  "Shall we pick up where we left off?",
  "Your next breakthrough awaits.",
  "What's the priority for today?",
  "Time to turn ideas into reality.",
  "What challenge are we tackling?",
  "Let's pick a project and run with it.",
  "What's calling your name today?",
  "The day is yours — where to first?",
  "Ready for a productive session?",
  "What do you feel like working on?",
  "What story are we writing today?",
  "Let's get those gears turning.",
  "What's the first thing on your list?",
  "Where shall we make progress?",
  "Something big or something quick?",
  "What's the mission for today?",
  "Ready to check things off the list?",
  "What would make today a win?",
  "Your dashboard awaits, captain.",
  "Let's make some magic happen.",
  "Time to roll up the sleeves.",
  "What are we conquering today?",
  "What's inspiring you today?",
  "Let's turn plans into progress.",
  "What shall we explore?",
  "What's the next move?",
  "Your workspace is ready — dive in.",
  "What are you in the mood for?",
  "Let's get the ball rolling.",
  "What's the first order of business?",
  "Pick your adventure for today.",
];

export default function HomePage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const metadata = getRouteMetadata("/");

  const greeting = useMemo(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)], []);
  const subtitle = useMemo(() => SUBTITLES[Math.floor(Math.random() * SUBTITLES.length)], []);

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
              {greeting}, {currentUser?.name?.split(" ")[0] || "User"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>
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
                        onClick={() => navigate(`/note/${note.id}`)}
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
