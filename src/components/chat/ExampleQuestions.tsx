import { motion, AnimatePresence } from "motion/react";
import { Alert, Button, Skeleton } from "@/components/ui";
import { RestartIcon } from "@/components/icons";
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
  return (
    <div className="mt-6 px-4">
      {exampleQuestionsError && !skipExampleQuestionsFetch ? (
        <div className="flex flex-col gap-3">
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
        <div className="flex flex-col gap-2">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={
                isExampleQuestionsLoading ||
                isAutoRegenerating ||
                skipExampleQuestionsFetch ||
                readySourcesCount === 0
                  ? "loading"
                  : "questions"
              }
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className="flex flex-col gap-2"
            >
              {isExampleQuestionsLoading ||
              isAutoRegenerating ||
              skipExampleQuestionsFetch ||
              readySourcesCount === 0 ? (
                <>
                  <Skeleton variant="rectangle" height={34} />
                  <Skeleton variant="rectangle" height={34} />
                  <Skeleton variant="rectangle" height={34} />
                </>
              ) : exampleQuestions?.questions && exampleQuestions.questions.length > 0 ? (
                <>
                  {exampleQuestions.questions.map((question, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => onQuestionSelect(question)}
                      className="group flex w-full items-start gap-2 text-left"
                    >
                      <span className="mt-0.5 shrink-0 font-medium text-gray-400 transition-colors group-hover:text-blue-500 dark:text-gray-500 dark:group-hover:text-blue-400">
                        +
                      </span>
                      <span className="text-sm leading-relaxed text-gray-600 transition-colors group-hover:text-blue-600 dark:text-gray-300 dark:group-hover:text-blue-400">
                        {question}
                      </span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => refetchExampleQuestions(true)}
                    className="group flex w-full items-center gap-2 text-left"
                  >
                    <RestartIcon className="size-4 shrink-0 text-gray-400 transition-colors group-hover:text-blue-500 dark:text-gray-500 dark:group-hover:text-blue-400" />
                    <span className="text-sm font-medium text-gray-500 transition-colors group-hover:text-blue-600 dark:text-gray-400 dark:group-hover:text-blue-400">
                      Refresh questions
                    </span>
                  </button>
                </>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
