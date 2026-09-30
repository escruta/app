import { motion, AnimatePresence } from "motion/react";
import { Alert, Button, Skeleton } from "@/components/ui";
import { RestartIcon, StarsIcon } from "@/components/icons";
import { getHttpErrorMessage } from "@/lib/utils";

interface ExampleQuestionsProps {
  exampleQuestionsError: any;
  skipExampleQuestionsFetch: boolean;
  isExampleQuestionsLoading: boolean;
  isAutoRegenerating: boolean;
  readySourcesCount: number;
  exampleQuestions?: { questions: string[] } | null;
  refetchExampleQuestions: (forcedUpdate?: boolean) => void;
  onQuestionSelect: (question: string) => void;
}

export function ExampleQuestions({
  exampleQuestionsError,
  skipExampleQuestionsFetch,
  isExampleQuestionsLoading,
  isAutoRegenerating,
  readySourcesCount,
  exampleQuestions,
  refetchExampleQuestions,
  onQuestionSelect,
}: ExampleQuestionsProps) {
  const showPlaceholder =
    isExampleQuestionsLoading ||
    isAutoRegenerating ||
    skipExampleQuestionsFetch ||
    readySourcesCount === 0;

  const questions = exampleQuestions?.questions ?? [];

  return (
    <div className="mb-1.5 flex flex-col">
      {exampleQuestionsError && !skipExampleQuestionsFetch ? (
        <div className="flex flex-col items-start gap-2 px-1 py-1">
          <Alert message={getHttpErrorMessage(exampleQuestionsError?.status)} variant="danger" />
          <Button
            onClick={() => refetchExampleQuestions(true)}
            disabled={isExampleQuestionsLoading}
            variant="ghost"
            size="sm"
            icon={<RestartIcon className="size-4" />}
          >
            Try generating questions again
          </Button>
        </div>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={showPlaceholder ? "loading" : "questions"}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            className="flex flex-col"
          >
            {showPlaceholder ? (
              <div className="space-y-1">
                <Skeleton variant="rectangle" height={30} />
                <Skeleton variant="rectangle" height={30} />
                <Skeleton variant="rectangle" height={30} />
              </div>
            ) : questions.length > 0 ? (
              questions.map((question, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => onQuestionSelect(question)}
                  className="group flex w-full items-center gap-2 rounded-sm px-1 py-1.5 text-left transition-colors hover:bg-gray-100/70 dark:hover:bg-gray-800/50"
                >
                  <StarsIcon className="size-3.5 shrink-0 text-gray-300 transition-colors group-hover:text-blue-400 dark:text-gray-600 dark:group-hover:text-blue-400" />
                  <span className="text-[13px] leading-relaxed text-gray-500 transition-colors group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200">
                    {question}
                  </span>
                </button>
              ))
            ) : null}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
