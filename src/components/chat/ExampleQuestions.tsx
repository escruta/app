import { motion, AnimatePresence } from "motion/react";
import { Alert, Button, Skeleton } from "@/components/ui";
import { RestartIcon, StarsIcon } from "@/components/icons";
import { useAccessibility } from "@/hooks";
import { EASE_OUT } from "@/lib/motion";
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
  const { effectiveReducedMotion } = useAccessibility();
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
            initial={effectiveReducedMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={effectiveReducedMotion ? undefined : { opacity: 0, y: 4 }}
            transition={
              effectiveReducedMotion ? { duration: 0 } : { duration: 0.15, ease: EASE_OUT }
            }
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
                  className="group flex w-full cursor-pointer items-center gap-2 rounded-xs px-1.5 py-1.5 text-left transition-colors duration-150 hover:bg-gray-100/70 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none focus-visible:ring-inset dark:hover:bg-gray-800/60 dark:focus-visible:ring-blue-400"
                >
                  <StarsIcon className="size-3.5 shrink-0 text-gray-300 transition-colors duration-150 group-hover:text-blue-500 dark:text-gray-600 dark:group-hover:text-blue-400" />
                  <span className="text-[13px] leading-relaxed text-gray-500 transition-colors duration-150 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-gray-100">
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
