import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAccessibility } from "@/hooks";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ChevronIcon } from "@/components/icons";
import type { StudyGuideResponse } from "@/interfaces";

interface StudyGuideViewerProps {
  data: StudyGuideResponse;
  className?: string;
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
}

function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  badge,
}: CollapsibleSectionProps) {
  const { effectiveReducedMotion } = useAccessibility();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-xs border border-gray-200 dark:border-gray-800">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full cursor-pointer items-center justify-between bg-gray-50 p-4 text-left transition-colors duration-150 select-none hover:bg-blue-50/50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none focus-visible:ring-inset dark:bg-gray-900 dark:hover:bg-gray-800/80 dark:focus-visible:ring-blue-400"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          {badge !== undefined && (
            <span className="rounded-xs bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600 tabular-nums dark:bg-blue-900/50 dark:text-blue-300">
              {badge}
            </span>
          )}
        </div>

        <ChevronIcon
          aria-hidden="true"
          direction={isOpen ? "up" : "down"}
          className="size-4 text-gray-400 transition-transform duration-150 dark:text-gray-500"
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={effectiveReducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={effectiveReducedMotion ? undefined : { height: 0, opacity: 0 }}
            transition={
              effectiveReducedMotion ? { duration: 0 } : { duration: 0.2, ease: EASE_OUT }
            }
            className="overflow-hidden border-t border-gray-200 dark:border-gray-800"
          >
            <div className="bg-white p-4 dark:bg-gray-950">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function StudyGuideViewer({ data, className }: StudyGuideViewerProps) {
  const { overview, keyConcepts, importantDetails, connections, reviewQuestions } = data;

  return (
    <div className={cn("flex flex-col gap-4 p-6 max-w-3xl mx-auto", className)}>
      <div className="rounded-xs border border-blue-200 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-900/20">
        <p className="mb-2 text-xs font-medium tracking-wider text-blue-600 uppercase dark:text-blue-400">
          Overview
        </p>
        <p className="text-base leading-relaxed text-gray-700 select-text dark:text-gray-200">
          {overview}
        </p>
      </div>

      {keyConcepts && keyConcepts.length > 0 && (
        <CollapsibleSection title="Key concepts" badge={keyConcepts.length} defaultOpen={true}>
          <div className="flex flex-col gap-2">
            {keyConcepts.map((concept, index) => (
              <div
                key={index}
                className="flex flex-col rounded-xs border border-gray-200 bg-gray-50/60 p-3 sm:flex-row sm:gap-4 dark:border-gray-800 dark:bg-gray-900"
              >
                <dt className="shrink-0 text-base font-medium text-blue-600 select-text sm:max-w-45 sm:min-w-45 dark:text-blue-400">
                  {concept.term}
                </dt>
                <dd className="mt-1 text-base leading-relaxed text-gray-700 select-text sm:mt-0 dark:text-gray-200">
                  {concept.definition}
                </dd>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {importantDetails && importantDetails.length > 0 && (
        <CollapsibleSection
          title="Important details"
          badge={importantDetails.length}
          defaultOpen={true}
        >
          <ul className="flex flex-col gap-2">
            {importantDetails.map((detail, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="mt-1.75 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                <span className="text-base leading-relaxed text-gray-700 select-text dark:text-gray-200">
                  {detail}
                </span>
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {connections && connections.length > 0 && (
        <CollapsibleSection
          title="Connections & relationships"
          badge={connections.length}
          defaultOpen={false}
        >
          <ul className="flex flex-col gap-2">
            {connections.map((connection, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-xs bg-blue-100 text-xs font-medium text-blue-600 tabular-nums dark:bg-blue-900/50 dark:text-blue-300">
                  {index + 1}
                </span>
                <span className="pt-0.5 text-base leading-relaxed text-gray-700 select-text dark:text-gray-200">
                  {connection}
                </span>
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {reviewQuestions && reviewQuestions.length > 0 && (
        <CollapsibleSection
          title="Review questions"
          badge={reviewQuestions.length}
          defaultOpen={false}
        >
          <ol className="flex flex-col gap-3">
            {reviewQuestions.map((question, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-xs bg-green-100 text-xs font-medium text-green-600 tabular-nums dark:bg-green-900/50 dark:text-green-300">
                  {index + 1}
                </span>
                <span className="pt-0.5 text-base leading-relaxed text-gray-700 select-text dark:text-gray-200">
                  {question}
                </span>
              </li>
            ))}
          </ol>
        </CollapsibleSection>
      )}
    </div>
  );
}
