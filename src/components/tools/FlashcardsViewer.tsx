import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { IconButton, Tooltip, Button } from "@/components/ui";
import { ChevronIcon, CheckIcon, RestartIcon } from "@/components/icons";
import type { FlashcardsResponse } from "@/interfaces";

interface FlashcardsViewerProps {
  data: FlashcardsResponse;
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

export function FlashcardsViewer({ data, className }: FlashcardsViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(0);
  const [knownCards, setKnownCards] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const { flashcards } = data;
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
    setKnownCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(currentIndex)) {
        newSet.delete(currentIndex);
      } else {
        newSet.add(currentIndex);
      }
      return newSet;
    });
  }

  function handleRestart() {
    setCurrentIndex(0);
    setIsFlipped(false);
    setDirection(-1);
    setKnownCards(new Set());
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case " ":
      case "Enter":
        e.preventDefault();
        handleFlip();
        break;
      case "ArrowRight":
        handleNext();
        break;
      case "ArrowLeft":
        handlePrev();
        break;
      case "k":
        handleMarkKnown();
        break;
    }
  }

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
        No flashcards available
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
      {/* ── Top Bar (fixed) ── */}
      <div className="flex-shrink-0 px-6 py-4 flex flex-col gap-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Progress
              </span>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {currentIndex + 1} / {totalCards}
              </span>
            </div>

            <div className="h-8 w-px bg-gray-200 dark:bg-gray-600" />

            <div className="flex flex-col">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Learned
              </span>
              <div className="flex items-center gap-1.5">
                <CheckIcon className="size-3 text-green-500" />
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {knownCount}
                </span>
              </div>
            </div>
          </div>

          {knownCount > 0 && (
            <Tooltip text="Restart deck" position="bottom">
              <IconButton
                icon={<RestartIcon />}
                variant="ghost"
                size="xs"
                onClick={handleRestart}
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
            animate={{ width: `${knownPercentage}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* ── Scrollable Content (middle) ── */}
      <div className="flex-1 min-h-0 overflow-hidden flex items-center justify-center">
        <div className="px-6 py-6 w-full max-w-2xl mx-auto">
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
              className="cursor-pointer perspective-[1000px]"
              onClick={handleFlip}
            >
              <motion.div
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                style={{ transformStyle: "preserve-3d" }}
                className="relative w-full h-56"
              >
                {/* Front - Question */}
                <div
                  className={cn(
                    "absolute inset-0 backface-hidden rounded-xs border-2 p-6",
                    "bg-white dark:bg-gray-800",
                    "flex flex-col items-center justify-center text-center",
                    knownCards.has(currentIndex)
                      ? "border-green-400 dark:border-green-500"
                      : "border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500",
                  )}
                >
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-xs text-[10px] font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
                      Question
                    </span>
                    {knownCards.has(currentIndex) && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="px-2 py-0.5 rounded-xs text-[10px] font-medium flex items-center gap-1 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300"
                      >
                        <CheckIcon className="size-3" />
                        Learned
                      </motion.span>
                    )}
                  </div>
                  <span className="absolute bottom-3 text-[10px] text-gray-400 dark:text-gray-500">
                    Click to flip
                  </span>
                  <p className="font-semibold text-gray-800 dark:text-gray-100 leading-relaxed max-w-xl text-base">
                    {currentCard.front}
                  </p>
                </div>

                {/* Back - Answer */}
                <div
                  className={cn(
                    "absolute inset-0 backface-hidden rounded-xs rotate-y-180 border-2 p-6",
                    "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600",
                    "flex flex-col items-center justify-center text-center",
                  )}
                >
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded-xs text-[10px] font-medium bg-blue-200 dark:bg-blue-800/50 text-blue-700 dark:text-blue-200">
                    Answer
                  </span>
                  <span className="absolute bottom-3 text-[10px] text-blue-400 dark:text-blue-500">
                    Click to flip back
                  </span>
                  <p className="text-gray-700 dark:text-gray-200 leading-relaxed max-w-xl text-sm">
                    {currentCard.back}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Bottom Bar (fixed) ── */}
      <div className="flex-shrink-0 px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex flex-col items-center gap-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full max-w-2xl mx-auto">
          <div className="flex justify-start">
            <Tooltip text="Previous card" position="top">
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
            <Button
              onClick={handleMarkKnown}
              variant={knownCards.has(currentIndex) ? "success" : "primary"}
              size="sm"
              icon={knownCards.has(currentIndex) ? <CheckIcon /> : undefined}
              className="min-w-[130px]"
            >
              {knownCards.has(currentIndex) ? "Learned" : "Mark as learned"}
            </Button>
          </div>

          <div className="flex justify-end">
            <Tooltip text="Next card" position="top">
              <IconButton
                icon={<ChevronIcon direction="right" className="size-4" />}
                variant="ghost"
                size="sm"
                onClick={handleNext}
                disabled={currentIndex === totalCards - 1}
                className="rounded-xs border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-30 disabled:hover:border-gray-200 dark:disabled:hover:border-gray-600 disabled:hover:bg-transparent"
              />
            </Tooltip>
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex gap-1 items-center">
          {flashcards.map((_, idx) => (
            <button
              type="button"
              key={idx}
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
                setIsFlipped(false);
              }}
              className="group p-0.5"
              aria-label={`Go to card ${idx + 1}`}
            >
              <div
                className={cn(
                  "size-[5px] rounded-full transition-all duration-200",
                  idx === currentIndex
                    ? knownCards.has(idx)
                      ? "bg-green-500 scale-125 ring-2 ring-green-500/30"
                      : "bg-blue-500 scale-125 ring-2 ring-blue-500/30"
                    : knownCards.has(idx)
                      ? "bg-green-500"
                      : "bg-gray-300 dark:bg-gray-600 group-hover:bg-gray-400 dark:group-hover:bg-gray-500",
                )}
              />
            </button>
          ))}
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex gap-4 text-[10px] text-gray-400 dark:text-gray-500 font-medium">
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded-xs border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-[10px] font-mono">
              ←→
            </kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded-xs border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-[10px] font-mono">
              Space
            </kbd>
            <span>Flip</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded-xs border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-[10px] font-mono">
              K
            </kbd>
            <span>Learn</span>
          </div>
        </div>
      </div>
    </div>
  );
}
