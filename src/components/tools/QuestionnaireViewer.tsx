import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Button, IconButton, Tooltip } from "@/components/ui";
import {
  CheckIcon,
  CloseIcon,
  ChevronIcon,
  RestartIcon,
} from "@/components/icons";
import type { QuestionnaireResponse, Question } from "@/interfaces";

interface QuestionnaireViewerProps {
  data: QuestionnaireResponse;
  className?: string;
}

interface QuestionState {
  answered: boolean;
  selectedOption: number | null;
  selectedBoolean: boolean | null;
  textAnswer: string;
  isCorrect: boolean | null;
  showExplanation: boolean;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction === 0 ? 0 : direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction === 0 ? 0 : direction < 0 ? 40 : -40,
    opacity: 0,
  }),
};

export function QuestionnaireViewer({
  data,
  className,
}: QuestionnaireViewerProps) {
  const { questions } = data;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const [questionStates, setQuestionStates] = useState<QuestionState[]>(
    questions.map(() => ({
      answered: false,
      selectedOption: null,
      selectedBoolean: null,
      textAnswer: "",
      isCorrect: null,
      showExplanation: false,
    })),
  );

  const totalQuestions = questions.length;
  const currentState = questionStates[currentIndex];

  function updateQuestionState(index: number, updates: Partial<QuestionState>) {
    setQuestionStates((prev) =>
      prev.map((state, i) => (i === index ? { ...state, ...updates } : state)),
    );
  }

  function handleMultipleChoiceSelect(optionIndex: number) {
    const question = questions[currentIndex];
    const isCorrect = optionIndex === question.correctAnswerIndex;

    updateQuestionState(currentIndex, {
      answered: true,
      selectedOption: optionIndex,
      isCorrect,
      showExplanation: true,
    });
  }

  function handleTrueFalseSelect(selected: boolean) {
    const question = questions[currentIndex];
    const isCorrect = selected === question.correctAnswerBoolean;

    updateQuestionState(currentIndex, {
      answered: true,
      selectedBoolean: selected,
      isCorrect,
      showExplanation: true,
    });
  }

  function handleShortAnswerSubmit() {
    updateQuestionState(currentIndex, {
      answered: true,
      showExplanation: true,
    });
  }

  function handleTextChange(text: string) {
    updateQuestionState(currentIndex, {
      textAnswer: text,
    });
  }

  function handleNext() {
    if (currentIndex < totalQuestions - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
    }
  }

  function calculateScore() {
    const answeredQuestions = questionStates.filter((s) => s.answered);
    const correctAnswers = questionStates.filter((s) => s.isCorrect === true);
    return {
      answered: answeredQuestions.length,
      correct: correctAnswers.length,
      total: totalQuestions,
    };
  }

  function resetQuiz() {
    setQuestionStates(
      questions.map(() => ({
        answered: false,
        selectedOption: null,
        selectedBoolean: null,
        textAnswer: "",
        isCorrect: null,
        showExplanation: false,
      })),
    );
    setShowResults(false);
    setDirection(-1);
    setCurrentIndex(0);
  }

  const score = calculateScore();
  const progressPercentage =
    score.total > 0 ? (score.answered / score.total) * 100 : 0;
  const correctPercentage =
    score.total > 0 ? (score.correct / score.total) * 100 : 0;

  if (!questions || questions.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
        No questions available
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* ── Top Bar (fixed) ── */}
      <div className="flex-shrink-0 px-6 py-4 flex flex-col gap-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Progress
              </span>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {score.answered} / {score.total}
              </span>
            </div>

            <div className="h-8 w-px bg-gray-200 dark:bg-gray-600" />

            <div className="flex flex-col">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Correct
              </span>
              <div className="flex items-center gap-1.5">
                <CheckIcon className="size-3 text-green-500" />
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {score.correct}
                </span>
              </div>
            </div>
          </div>

          {score.answered > 0 && (
            <Tooltip text="Restart quiz" position="bottom">
              <IconButton
                icon={<RestartIcon />}
                variant="ghost"
                size="xs"
                onClick={resetQuiz}
                className="text-gray-500 hover:text-blue-500"
              />
            </Tooltip>
          )}
        </div>

        {/* Progress Bar */}
        <div className="relative h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-blue-500"
            initial={false}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
          <motion.div
            className="absolute inset-y-0 left-0 bg-green-500"
            initial={false}
            animate={{ width: `${correctPercentage}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* ── Scrollable Content (middle) ── */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="px-6 py-4 max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            {showResults ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex flex-col gap-4"
              >
                <div className="p-4 rounded-xs border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      Results
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {Math.round((score.correct / score.total) * 100)}%
                      accuracy
                    </span>
                  </div>

                  <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-green-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(score.correct / score.total) * 100}%`,
                      }}
                      transition={{
                        duration: 0.6,
                        ease: "easeOut",
                        delay: 0.2,
                      }}
                    />
                  </div>

                  <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-green-500" />
                      <span className="text-gray-600 dark:text-gray-300">
                        {score.correct} correct
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-red-500" />
                      <span className="text-gray-600 dark:text-gray-300">
                        {score.answered - score.correct} incorrect
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button variant="primary" onClick={resetQuiz}>
                    Try Again
                  </Button>
                </div>
              </motion.div>
            ) : (
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { duration: 0.2, ease: "easeOut" },
                    opacity: { duration: 0.15 },
                  }}
                >
                  <QuestionContent
                    question={questions[currentIndex]}
                    questionNumber={currentIndex + 1}
                    totalQuestions={totalQuestions}
                    state={currentState}
                    onMultipleChoiceSelect={handleMultipleChoiceSelect}
                    onTrueFalseSelect={handleTrueFalseSelect}
                    onShortAnswerSubmit={handleShortAnswerSubmit}
                    onTextChange={handleTextChange}
                  />
                </motion.div>
              </AnimatePresence>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Bottom Bar (fixed) ── */}
      {!showResults && (
        <div className="flex-shrink-0 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center max-w-3xl mx-auto">
            <div className="flex justify-start">
              <Tooltip text="Previous question" position="top">
                <IconButton
                  icon={<ChevronIcon direction="left" className="size-4" />}
                  variant="ghost"
                  size="sm"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="rounded-xs border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-30 disabled:hover:border-gray-200 dark:disabled:hover:border-gray-600 disabled:hover:bg-transparent"
                />
              </Tooltip>
            </div>

            <div className="flex items-center justify-center">
              {/* Dot indicators */}
              <div className="flex gap-1 items-center">
                {questions.map((_, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => {
                      setDirection(idx > currentIndex ? 1 : -1);
                      setCurrentIndex(idx);
                    }}
                    className="group p-0.5"
                    aria-label={`Go to question ${idx + 1}`}
                  >
                    <div
                      className={cn(
                        "size-[5px] rounded-full transition-all duration-200",
                        idx === currentIndex
                          ? questionStates[idx].isCorrect === true
                            ? "bg-green-500 scale-125 ring-2 ring-green-500/30"
                            : questionStates[idx].isCorrect === false
                              ? "bg-red-500 scale-125 ring-2 ring-red-500/30"
                              : "bg-blue-500 scale-125 ring-2 ring-blue-500/30"
                          : questionStates[idx].isCorrect === true
                            ? "bg-green-500"
                            : questionStates[idx].isCorrect === false
                              ? "bg-red-500"
                              : questionStates[idx].answered
                                ? "bg-blue-500"
                                : "bg-gray-300 dark:bg-gray-600 group-hover:bg-gray-400 dark:group-hover:bg-gray-500",
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              {currentState.answered ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {score.answered === score.total ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowResults(true)}
                    >
                      Show Results
                    </Button>
                  ) : currentIndex < totalQuestions - 1 ? (
                    <Button variant="primary" size="sm" onClick={handleNext}>
                      Next
                    </Button>
                  ) : null}
                </motion.div>
              ) : (
                <Tooltip text="Next question" position="top">
                  <IconButton
                    icon={<ChevronIcon direction="right" className="size-4" />}
                    variant="ghost"
                    size="sm"
                    onClick={handleNext}
                    disabled={currentIndex === totalQuestions - 1}
                    className="rounded-xs border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-30 disabled:hover:border-gray-200 dark:disabled:hover:border-gray-600 disabled:hover:bg-transparent"
                  />
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface QuestionContentProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  state: QuestionState;
  onMultipleChoiceSelect: (optionIndex: number) => void;
  onTrueFalseSelect: (selected: boolean) => void;
  onShortAnswerSubmit: () => void;
  onTextChange: (text: string) => void;
}

function QuestionContent({
  question,
  questionNumber,
  totalQuestions,
  state,
  onMultipleChoiceSelect,
  onTrueFalseSelect,
  onShortAnswerSubmit,
  onTextChange,
}: QuestionContentProps) {
  const typeLabel = {
    multiple_choice: "Multiple Choice",
    true_false: "True/False",
    short_answer: "Short Answer",
  }[question.type];

  return (
    <div className="flex flex-col gap-4">
      {/* Question header */}
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xs text-sm font-medium transition-colors duration-200",
            state.answered
              ? state.isCorrect === true
                ? "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300"
                : state.isCorrect === false
                  ? "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300"
                  : "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300"
              : "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300",
          )}
        >
          {questionNumber}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">
              {typeLabel}
            </span>
            <span className="text-[10px] text-gray-300 dark:text-gray-600">
              •
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
              {questionNumber} of {totalQuestions}
            </span>
          </div>
          <p className="text-gray-800 dark:text-gray-100 mt-1 leading-relaxed">
            {question.question}
          </p>
        </div>
        <AnimatePresence>
          {state.answered && state.isCorrect !== null && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={cn(
                "flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-xs text-xs font-medium",
                state.isCorrect
                  ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                  : "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300",
              )}
            >
              {state.isCorrect ? (
                <>
                  <CheckIcon className="size-3" />
                  Correct
                </>
              ) : (
                <>
                  <CloseIcon className="size-3" />
                  Incorrect
                </>
              )}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Answer options */}
      <div>
        {/* Multiple choice */}
        {question.type === "multiple_choice" && question.options && (
          <div className="flex flex-col gap-2">
            {question.options.map((option, oIndex) => (
              <button
                type="button"
                key={oIndex}
                onClick={() =>
                  !state.answered && onMultipleChoiceSelect(oIndex)
                }
                disabled={state.answered}
                className={cn(
                  "text-left p-3 rounded-xs border transition-all duration-200 group/option",
                  state.answered
                    ? oIndex === question.correctAnswerIndex
                      ? "border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-900/30"
                      : oIndex === state.selectedOption
                        ? "border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/30"
                        : "border-gray-100 dark:border-gray-700 opacity-40"
                    : "border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 cursor-pointer",
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "w-6 h-6 flex items-center justify-center rounded-xs border text-xs font-medium transition-all duration-200",
                      state.answered && oIndex === question.correctAnswerIndex
                        ? "border-green-500 bg-green-500 text-white"
                        : state.answered && oIndex === state.selectedOption
                          ? "border-red-500 bg-red-500 text-white"
                          : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 group-hover/option:border-blue-400 dark:group-hover/option:border-blue-500 group-hover/option:text-blue-500",
                    )}
                  >
                    {state.answered &&
                    oIndex === question.correctAnswerIndex ? (
                      <CheckIcon className="w-3.5 h-3.5" />
                    ) : state.answered && oIndex === state.selectedOption ? (
                      <CloseIcon className="w-3.5 h-3.5" />
                    ) : (
                      String.fromCharCode(65 + oIndex)
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-sm transition-colors duration-200",
                      state.answered && oIndex === question.correctAnswerIndex
                        ? "text-green-700 dark:text-green-300 font-medium"
                        : state.answered && oIndex === state.selectedOption
                          ? "text-red-700 dark:text-red-300"
                          : "text-gray-700 dark:text-gray-200",
                    )}
                  >
                    {option}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* True/False */}
        {question.type === "true_false" && (
          <div className="flex gap-3">
            {[true, false].map((value) => (
              <button
                type="button"
                key={String(value)}
                onClick={() => !state.answered && onTrueFalseSelect(value)}
                disabled={state.answered}
                className={cn(
                  "flex-1 p-3 rounded-xs border font-medium text-sm transition-all duration-200",
                  state.answered
                    ? value === question.correctAnswerBoolean
                      ? "border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      : value === state.selectedBoolean
                        ? "border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                        : "border-gray-100 dark:border-gray-700 opacity-40 text-gray-500 dark:text-gray-400"
                    : "border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 cursor-pointer text-gray-700 dark:text-gray-200",
                )}
              >
                <div className="flex items-center justify-center gap-2">
                  {state.answered &&
                    value === question.correctAnswerBoolean && (
                      <CheckIcon className="size-3.5" />
                    )}
                  {state.answered &&
                    value === state.selectedBoolean &&
                    value !== question.correctAnswerBoolean && (
                      <CloseIcon className="size-3.5" />
                    )}
                  {value ? "True" : "False"}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Short answer */}
        {question.type === "short_answer" && (
          <div>
            <textarea
              value={state.textAnswer}
              onChange={(e) => onTextChange(e.target.value)}
              disabled={state.answered}
              placeholder="Type your answer..."
              className={cn(
                "w-full p-3 rounded-xs border resize-none text-sm transition-all duration-200",
                "bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100",
                "border-gray-200 dark:border-gray-600",
                "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                "focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-400/30 dark:focus:ring-blue-500/30",
                state.answered && "opacity-60 cursor-not-allowed",
              )}
              rows={3}
            />
            {!state.answered && (
              <div className="flex justify-end mt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onShortAnswerSubmit}
                  disabled={!state.textAnswer.trim()}
                >
                  Check Answer
                </Button>
              </div>
            )}
            <AnimatePresence>
              {state.answered && question.sampleAnswer && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 p-3 rounded-xs bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wider mb-1">
                      Sample Answer
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                      {question.sampleAnswer}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Explanation */}
      <AnimatePresence>
        {state.showExplanation && question.explanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="p-3 rounded-xs bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wider mb-1">
                Explanation
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                {question.explanation}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
