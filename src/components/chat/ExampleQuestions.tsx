import { motion, AnimatePresence } from "motion/react";
import { Alert, Button, IconButton, Tooltip, Skeleton, Spinner, Chip } from "@/components/ui";
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
    <div className="mt-6 px-4 pb-8">
      {exampleQuestionsError && !skipExampleQuestionsFetch ? (
        <div className="flex flex-col gap-3">
          <Alert
            title="Error"
            message={getHttpErrorMessage(exampleQuestionsError?.status)}
            variant="danger"
          />
          <Button
            onClick={() => refetchExampleQuestions(true)}
            disabled={isExampleQuestionsLoading}
            variant="ghost"
            size="sm"
            icon={<RestartIcon className="h-4 w-4" />}
          >
            Regenerate example questions
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-foreground text-sm font-semibold">Example questions</h4>
            {isAutoRegenerating || skipExampleQuestionsFetch || readySourcesCount === 0 ? (
              <Tooltip
                text={readySourcesCount === 0 ? "Waiting for sources..." : "Waiting for summary..."}
                position="left"
              >
                <div className="flex h-8 w-8 items-center justify-center">
                  <Spinner />
                </div>
              </Tooltip>
            ) : (
              <Tooltip
                text={isExampleQuestionsLoading ? "Refreshing questions" : "Refresh questions"}
                position="left"
              >
                <IconButton
                  icon={isExampleQuestionsLoading ? <Spinner /> : <RestartIcon />}
                  variant="ghost"
                  size="sm"
                  onClick={() => refetchExampleQuestions(true)}
                  disabled={isExampleQuestionsLoading}
                />
              </Tooltip>
            )}
          </div>
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
                  exampleQuestions.questions.map((question, index) => (
                    <Chip
                      key={index}
                      onClick={() => onQuestionSelect(question)}
                      multiline
                      className="w-full justify-start text-left"
                    >
                      {question}
                    </Chip>
                  ))
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
