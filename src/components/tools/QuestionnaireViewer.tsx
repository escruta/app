import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { CheckIcon } from "@/components/icons";
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

export function QuestionnaireViewer({
  data,
  className,
}: QuestionnaireViewerProps) {
  const { title, questions } = data;

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

  const [showResults, setShowResults] = useState(false);

  function updateQuestionState(index: number, updates: Partial<QuestionState>) {
    setQuestionStates((prev) =>
      prev.map((state, i) => (i === index ? { ...state, ...updates } : state)),
    );
  }

  function handleMultipleChoiceSelect(
    questionIndex: number,
    optionIndex: number,
  ) {
    const question = questions[questionIndex];
    const isCorrect = optionIndex === question.correctAnswerIndex;

    updateQuestionState(questionIndex, {
      answered: true,
      selectedOption: optionIndex,
      isCorrect,
      showExplanation: true,
    });
  }

  function handleTrueFalseSelect(questionIndex: number, selected: boolean) {
    const question = questions[questionIndex];
    const isCorrect = selected === question.correctAnswerBoolean;

    updateQuestionState(questionIndex, {
      answered: true,
      selectedBoolean: selected,
      isCorrect,
      showExplanation: true,
    });
  }

  function handleShortAnswerSubmit(questionIndex: number) {
    updateQuestionState(questionIndex, {
      answered: true,
      showExplanation: true,
    });
  }

  function handleTextChange(questionIndex: number, text: string) {
    updateQuestionState(questionIndex, {
      textAnswer: text,
    });
  }

  function calculateScore() {
    const answeredQuestions = questionStates.filter((s) => s.answered);
    const correctAnswers = questionStates.filter((s) => s.isCorrect === true);
    return {
      answered: answeredQuestions.length,
      correct: correctAnswers.length,
      total: questions.length,
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
  }

  const score = calculateScore();

  if (!questions || questions.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
        No questions available
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4 p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {title}
        </h3>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {score.answered} / {score.total} answered
          </span>
          {score.answered > 0 && (
            <Button variant="ghost" size="sm" onClick={resetQuiz}>
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Results summary */}
      {showResults && (
        <div className="p-4 rounded-xs bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-600">
          <p className="text-lg font-medium text-blue-700 dark:text-blue-300">
            Score: {score.correct} / {score.total} correct (
            {Math.round((score.correct / score.total) * 100)}%)
          </p>
        </div>
      )}

      {/* Questions */}
      <div className="flex flex-col gap-4">
        {questions.map((question, qIndex) => (
          <QuestionCard
            key={qIndex}
            question={question}
            questionNumber={qIndex + 1}
            state={questionStates[qIndex]}
            onMultipleChoiceSelect={(optionIndex) =>
              handleMultipleChoiceSelect(qIndex, optionIndex)
            }
            onTrueFalseSelect={(selected) =>
              handleTrueFalseSelect(qIndex, selected)
            }
            onShortAnswerSubmit={() => handleShortAnswerSubmit(qIndex)}
            onTextChange={(text) => handleTextChange(qIndex, text)}
          />
        ))}
      </div>

      {/* Show results button */}
      {score.answered === score.total && !showResults && (
        <div className="flex justify-center pt-4">
          <Button variant="primary" onClick={() => setShowResults(true)}>
            Show Results
          </Button>
        </div>
      )}
    </div>
  );
}

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  state: QuestionState;
  onMultipleChoiceSelect: (optionIndex: number) => void;
  onTrueFalseSelect: (selected: boolean) => void;
  onShortAnswerSubmit: () => void;
  onTextChange: (text: string) => void;
}

function QuestionCard({
  question,
  questionNumber,
  state,
  onMultipleChoiceSelect,
  onTrueFalseSelect,
  onShortAnswerSubmit,
  onTextChange,
}: QuestionCardProps) {
  const typeLabel = {
    multiple_choice: "Multiple Choice",
    true_false: "True/False",
    short_answer: "Short Answer",
  }[question.type];

  return (
    <div className="p-4 rounded-xs border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
      {/* Question header */}
      <div className="flex items-start gap-3 mb-4">
        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xs bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 text-sm font-medium">
          {questionNumber}
        </span>
        <div className="flex-1">
          <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            {typeLabel}
          </span>
          <p className="text-gray-800 dark:text-gray-100 mt-1">
            {question.question}
          </p>
        </div>
        {state.answered && state.isCorrect !== null && (
          <span
            className={cn(
              "px-2 py-1 rounded-xs text-xs font-medium",
              state.isCorrect
                ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                : "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300",
            )}
          >
            {state.isCorrect ? "Correct" : "Incorrect"}
          </span>
        )}
      </div>

      {/* Answer options based on type */}
      {question.type === "multiple_choice" && question.options && (
        <div className="flex flex-col gap-2 ml-11">
          {question.options.map((option, oIndex) => (
            <button
              type="button"
              key={oIndex}
              onClick={() => !state.answered && onMultipleChoiceSelect(oIndex)}
              disabled={state.answered}
              className={cn(
                "text-left p-3 rounded-xs border transition-colors",
                state.answered
                  ? oIndex === question.correctAnswerIndex
                    ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                    : oIndex === state.selectedOption
                      ? "border-red-500 bg-red-50 dark:bg-red-900/30"
                      : "border-gray-200 dark:border-gray-600 opacity-50"
                  : "border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer",
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "w-6 h-6 flex items-center justify-center rounded-xs border text-sm",
                    state.answered && oIndex === question.correctAnswerIndex
                      ? "border-green-500 bg-green-500 text-white"
                      : state.answered && oIndex === state.selectedOption
                        ? "border-red-500 bg-red-500 text-white"
                        : "border-gray-300 dark:border-gray-600",
                  )}
                >
                  {state.answered && oIndex === question.correctAnswerIndex ? (
                    <CheckIcon className="w-4 h-4" />
                  ) : (
                    String.fromCharCode(65 + oIndex)
                  )}
                </span>
                <span className="text-gray-700 dark:text-gray-200">
                  {option}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {question.type === "true_false" && (
        <div className="flex gap-3 ml-11">
          {[true, false].map((value) => (
            <button
              type="button"
              key={String(value)}
              onClick={() => !state.answered && onTrueFalseSelect(value)}
              disabled={state.answered}
              className={cn(
                "flex-1 p-3 rounded-xs border font-medium transition-colors",
                state.answered
                  ? value === question.correctAnswerBoolean
                    ? "border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                    : value === state.selectedBoolean
                      ? "border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                      : "border-gray-200 dark:border-gray-600 opacity-50"
                  : "border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer",
              )}
            >
              {value ? "True" : "False"}
            </button>
          ))}
        </div>
      )}

      {question.type === "short_answer" && (
        <div className="ml-11">
          <textarea
            value={state.textAnswer}
            onChange={(e) => onTextChange(e.target.value)}
            disabled={state.answered}
            placeholder="Type your answer..."
            className={cn(
              "w-full p-3 rounded-xs border resize-none",
              "bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100",
              "border-gray-200 dark:border-gray-600",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900",
              state.answered && "opacity-70",
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
          {state.answered && question.sampleAnswer && (
            <div className="mt-3 p-3 rounded-xs bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-600">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                Sample Answer:
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-200">
                {question.sampleAnswer}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Explanation */}
      {state.showExplanation && question.explanation && (
        <div className="mt-4 ml-11 p-3 rounded-xs bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-600">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
            Explanation:
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-200">
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
