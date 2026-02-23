import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-xs border border-gray-200 dark:border-gray-600">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between bg-gray-50 p-4 transition-colors duration-200 hover:bg-blue-50/50 dark:bg-gray-800 dark:hover:bg-gray-700"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
          {badge !== undefined && (
            <span className="rounded-xs bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/50 dark:text-blue-300">
              {badge}
            </span>
          )}
        </div>

        <ChevronIcon
          direction={isOpen ? "up" : "down"}
          className="size-3.5 text-gray-400 transition-transform duration-200 dark:text-gray-500"
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="bg-white p-4 dark:bg-gray-900">{children}</div>
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
      {/* Overview - always visible */}
      <div className="rounded-xs border border-blue-200 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-900/20">
        <p className="mb-2 text-xs font-medium tracking-wider text-blue-600 uppercase dark:text-blue-400">
          Overview
        </p>
        <p className="text-base leading-relaxed text-gray-700 select-text dark:text-gray-200">
          {overview}
        </p>
      </div>

      {/* Key Concepts */}
      {keyConcepts && keyConcepts.length > 0 && (
        <CollapsibleSection title="Key Concepts" badge={keyConcepts.length} defaultOpen={true}>
          <div className="flex flex-col gap-2">
            {keyConcepts.map((concept, index) => (
              <div
                key={index}
                className="flex flex-col rounded-xs border border-gray-100 bg-gray-50 p-3 sm:flex-row sm:gap-4 dark:border-gray-700 dark:bg-gray-800"
              >
                <dt className="flex-shrink-0 text-base font-medium text-blue-600 select-text sm:max-w-[180px] sm:min-w-[180px] dark:text-blue-400">
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

      {/* Important Details */}
      {importantDetails && importantDetails.length > 0 && (
        <CollapsibleSection
          title="Important Details"
          badge={importantDetails.length}
          defaultOpen={true}
        >
          <ul className="flex flex-col gap-2">
            {importantDetails.map((detail, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                <span className="text-base leading-relaxed text-gray-700 select-text dark:text-gray-200">
                  {detail}
                </span>
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {/* Connections */}
      {connections && connections.length > 0 && (
        <CollapsibleSection
          title="Connections & Relationships"
          badge={connections.length}
          defaultOpen={false}
        >
          <ul className="flex flex-col gap-2">
            {connections.map((connection, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-xs bg-blue-100 text-xs font-medium text-blue-600 dark:bg-blue-900/50 dark:text-blue-300">
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

      {/* Review Questions */}
      {reviewQuestions && reviewQuestions.length > 0 && (
        <CollapsibleSection
          title="Review Questions"
          badge={reviewQuestions.length}
          defaultOpen={false}
        >
          <ol className="flex flex-col gap-3">
            {reviewQuestions.map((question, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-xs bg-green-100 text-xs font-medium text-green-600 dark:bg-green-900/50 dark:text-green-300">
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
