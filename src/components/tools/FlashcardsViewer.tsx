import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useShortcuts, useAccessibility, useCookie, useLearningSignal } from "@/hooks";
import {
  AI_AUTO_ADVANCE_FLASHCARDS_COOKIE_KEY,
  DEFAULT_AI_SETTINGS,
} from "@/components/settings/lib/ai";
import { cn } from "@/lib/utils";
import { IconButton, Tooltip, Button } from "@/components/ui";
import { ChevronIcon, CheckIcon, RestartIcon } from "@/components/icons";
import type { FlashcardsResponse } from "@/interfaces";

interface FlashcardsViewerProps {
  data: FlashcardsResponse;
  notebookId?: string;
  className?: string;
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

export function FlashcardsViewer({ data, notebookId, className }: FlashcardsViewerProps) {
  const { effectiveReducedMotion } = useAccessibility();
  const { recordSignal } = useLearningSignal(notebookId);
  const { value: autoAdvanceFlashcards } = useCookie<boolean>(
    AI_AUTO_ADVANCE_FLASHCARDS_COOKIE_KEY,
    DEFAULT_AI_SETTINGS.autoAdvanceFlashcards,
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(0);
  const [knownCards, setKnownCards] = useState<Set<number>>(new Set());
  const [reviewCards, setReviewCards] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const { flashcards = [] } = data;
  const currentCard = flashcards[currentIndex];
  const totalCards = flashcards.length;
  const knownCount = knownCards.size;

  function handleFlip() {
    setIsFlipped((prev) => !prev);
  }

  function handleNext() {
    if (currentIndex < totalCards - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  }

  function handleMarkKnown() {
    const isCurrentlyKnown = knownCards.has(currentIndex);
    setKnownCards((prev) => {
      const newSet = new Set(prev);
      if (isCurrentlyKnown) {
        newSet.delete(currentIndex);
      } else {
        newSet.add(currentIndex);
      }
      return newSet;
    });
    if (!isCurrentlyKnown) {
      setReviewCards((prev) => {
        if (!prev.has(currentIndex)) return prev;
        const next = new Set(prev);
        next.delete(currentIndex);
        return next;
      });
      if (currentCard?.front) {
        void recordSignal({
          source: "FLASHCARD",
          outcome: "MASTERED",
          topic: currentCard.front,
        });
      }
      if (autoAdvanceFlashcards && currentIndex < totalCards - 1) {
        setDirection(1);
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
      }
    }
  }

  function handleMarkNeedsReview() {
    const isCurrentlyReview = reviewCards.has(currentIndex);
    setReviewCards((prev) => {
      const next = new Set(prev);
      if (isCurrentlyReview) {
        next.delete(currentIndex);
      } else {
        next.add(currentIndex);
      }
      return next;
    });
    if (!isCurrentlyReview) {
      setKnownCards((prev) => {
        if (!prev.has(currentIndex)) return prev;
        const next = new Set(prev);
        next.delete(currentIndex);
        return next;
      });
      if (currentCard?.front) {
        void recordSignal({
          source: "FLASHCARD",
          outcome: "STRUGGLING",
          topic: currentCard.front,
        });
      }
      if (autoAdvanceFlashcards && currentIndex < totalCards - 1) {
        setDirection(1);
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
      }
    }
  }

  function handleRestart() {
    setCurrentIndex(0);
    setIsFlipped(false);
    setDirection(-1);
    setKnownCards(new Set());
    setReviewCards(new Set());
  }

  const handleKeyDown = useShortcuts([
    { id: "flashcards-flip", handler: handleFlip },
    { id: "flashcards-next", handler: handleNext },
    { id: "flashcards-previous", handler: handlePrev },
    { id: "flashcards-known", handler: handleMarkKnown },
  ]);

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
        No flashcards to show yet.
      </div>
    );
  }

  const progressPercentage = ((currentIndex + 1) / totalCards) * 100;
  const knownPercentage = (knownCount / totalCards) * 100;

  return (
    <div
      role="application"
      aria-label="Flashcards viewer"
      className={cn("flex flex-col h-full focus:outline-none", className)}
      ref={containerRef}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="flex shrink-0 flex-col gap-3 border-b border-gray-200 px-6 py-4 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Progress</span>
              <span className="text-sm font-semibold text-gray-900 tabular-nums dark:text-gray-100">
                {currentIndex + 1} / {totalCards}
              </span>
            </div>

            <div className="h-8 w-px bg-gray-200 dark:bg-gray-800" />

            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Learned</span>
              <div className="flex items-center gap-1.5">
                <CheckIcon className="size-3 text-green-600 dark:text-green-400" />
                <span className="text-sm font-semibold text-green-600 tabular-nums dark:text-green-400">
                  {knownCount}
                </span>
              </div>
            </div>
          </div>

          {(knownCount > 0 || reviewCards.size > 0) && (
            <Tooltip text="Restart deck" position="bottom">
              <IconButton
                icon={<RestartIcon />}
                variant="ghost"
                size="xs"
                onClick={handleRestart}
                ariaLabel="Restart deck"
              />
            </Tooltip>
          )}
        </div>

        <div className="relative h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <motion.div
            className="absolute inset-y-0 left-0 bg-blue-500"
            initial={false}
            animate={{ width: `${progressPercentage}%` }}
            transition={
              effectiveReducedMotion ? { duration: 0 } : { duration: 0.3, ease: "easeOut" }
            }
          />
          <motion.div
            className="absolute inset-y-0 left-0 bg-green-500"
            initial={false}
            animate={{ width: `${knownPercentage}%` }}
            transition={
              effectiveReducedMotion ? { duration: 0 } : { duration: 0.3, ease: "easeOut" }
            }
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        <div className="mx-auto w-full max-w-2xl px-6 py-6">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={effectiveReducedMotion ? undefined : slideVariants}
              initial={effectiveReducedMotion ? false : "enter"}
              animate={effectiveReducedMotion ? { opacity: 1, x: 0 } : "center"}
              exit={effectiveReducedMotion ? undefined : "exit"}
              transition={
                effectiveReducedMotion
                  ? { duration: 0 }
                  : {
                      x: { duration: 0.2, ease: "easeOut" },
                      opacity: { duration: 0.15 },
                    }
              }
              className="cursor-pointer perspective-[1000px]"
              onClick={handleFlip}
            >
              <motion.div
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={
                  effectiveReducedMotion ? { duration: 0 } : { duration: 0.25, ease: "easeInOut" }
                }
                style={{ transformStyle: "preserve-3d" }}
                className="relative h-56 w-full"
              >
                <div
                  className={cn(
                    "absolute inset-0 rounded-xs border bg-white p-6 transition-colors duration-150 backface-hidden dark:bg-gray-900",
                    "flex flex-col items-center justify-center text-center shadow-xs",
                    knownCards.has(currentIndex)
                      ? "border-green-500 dark:border-green-500"
                      : reviewCards.has(currentIndex)
                        ? "border-orange-400 dark:border-orange-500"
                        : "border-gray-200 hover:border-blue-300 dark:border-gray-700 dark:hover:border-blue-500",
                  )}
                >
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="rounded-xs bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-900/50 dark:text-blue-300">
                      Question
                    </span>
                    {knownCards.has(currentIndex) && (
                      <motion.span
                        initial={effectiveReducedMotion ? false : { opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={
                          effectiveReducedMotion
                            ? { duration: 0 }
                            : { duration: 0.2, ease: "easeOut" }
                        }
                        className="flex items-center gap-1 rounded-xs bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-600 dark:bg-green-900/50 dark:text-green-300"
                      >
                        <CheckIcon className="size-3" />
                        Learned
                      </motion.span>
                    )}
                    {reviewCards.has(currentIndex) && (
                      <motion.span
                        initial={effectiveReducedMotion ? false : { opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={
                          effectiveReducedMotion
                            ? { duration: 0 }
                            : { duration: 0.2, ease: "easeOut" }
                        }
                        className="flex items-center gap-1 rounded-xs bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-900/50 dark:text-orange-300"
                      >
                        Needs review
                      </motion.span>
                    )}
                  </div>
                  <span className="absolute bottom-3 text-[10px] text-gray-400 dark:text-gray-500">
                    Click to flip
                  </span>
                  <p className="max-w-xl text-base leading-relaxed font-semibold text-gray-800 dark:text-gray-100">
                    {currentCard.front}
                  </p>
                </div>

                <div
                  className={cn(
                    "absolute inset-0 rotate-y-180 rounded-xs border p-6 backface-hidden shadow-xs",
                    "border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/30",
                    "flex flex-col items-center justify-center text-center",
                  )}
                >
                  <span className="absolute top-3 left-3 rounded-xs bg-blue-200 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-800/50 dark:text-blue-200">
                    Answer
                  </span>
                  <span className="absolute bottom-3 text-[10px] text-blue-400 dark:text-blue-500">
                    Click to flip back
                  </span>
                  <p className="max-w-xl text-sm leading-relaxed text-gray-700 dark:text-gray-200">
                    {currentCard.back}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-center gap-3 border-t border-gray-200 px-6 py-3 dark:border-gray-800">
        <div className="mx-auto grid w-full max-w-2xl grid-cols-[1fr_auto_1fr] items-center">
          <div className="flex justify-start">
            <Tooltip text="Previous card" position="top">
              <IconButton
                icon={<ChevronIcon direction="left" className="size-4" />}
                variant="secondary"
                size="sm"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                ariaLabel="Previous card"
              />
            </Tooltip>
          </div>

          <div className="flex items-center justify-center gap-2">
            <Button
              onClick={handleMarkNeedsReview}
              variant="secondary"
              size="sm"
              className={cn(
                reviewCards.has(currentIndex) &&
                  "border-orange-400 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:border-orange-600 dark:bg-orange-950/40 dark:text-orange-300 dark:hover:bg-orange-950/60",
              )}
            >
              Needs review
            </Button>
            <Button
              onClick={handleMarkKnown}
              variant={knownCards.has(currentIndex) ? "success" : "primary"}
              size="sm"
              icon={knownCards.has(currentIndex) ? <CheckIcon /> : undefined}
              className="min-w-32.5"
            >
              {knownCards.has(currentIndex) ? "Learned" : "Mark as learned"}
            </Button>
          </div>

          <div className="flex justify-end">
            <Tooltip text="Next card" position="top">
              <IconButton
                icon={<ChevronIcon direction="right" className="size-4" />}
                variant="secondary"
                size="sm"
                onClick={handleNext}
                disabled={currentIndex === totalCards - 1}
                ariaLabel="Next card"
              />
            </Tooltip>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {flashcards.map((_, idx) => (
            <button
              type="button"
              key={idx}
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
                setIsFlipped(false);
              }}
              className="group cursor-pointer rounded-xs p-0.5 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:focus-visible:ring-blue-400"
              aria-label={`Go to card ${idx + 1}`}
            >
              <div
                className={cn(
                  "size-1.25 rounded-full transition-all duration-200",
                  idx === currentIndex
                    ? knownCards.has(idx)
                      ? "bg-green-500 scale-125 ring-2 ring-green-500/30"
                      : reviewCards.has(idx)
                        ? "bg-orange-500 scale-125 ring-2 ring-orange-500/30"
                        : "bg-blue-500 scale-125 ring-2 ring-blue-500/30"
                    : knownCards.has(idx)
                      ? "bg-green-500"
                      : reviewCards.has(idx)
                        ? "bg-orange-500"
                        : "bg-gray-300 dark:bg-gray-600 group-hover:bg-gray-400 dark:group-hover:bg-gray-500",
                )}
              />
            </button>
          ))}
        </div>

        <div className="flex gap-4 text-[10px] font-medium text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-1.5">
            <kbd className="rounded-xs border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-[10px] dark:border-gray-700 dark:bg-gray-800">
              ←→
            </kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="rounded-xs border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-[10px] dark:border-gray-700 dark:bg-gray-800">
              Space
            </kbd>
            <span>Flip</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="rounded-xs border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-[10px] dark:border-gray-700 dark:bg-gray-800">
              K
            </kbd>
            <span>Learn</span>
          </div>
        </div>
      </div>
    </div>
  );
}
