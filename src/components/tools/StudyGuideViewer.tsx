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
    <div className="border border-gray-200 dark:border-gray-600 rounded-xs overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-blue-50/50 dark:hover:bg-gray-700 transition-colors duration-200"
      >
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100">
            {title}
          </h3>
          {badge !== undefined && (
            <span className="px-2 py-0.5 text-[10px] rounded-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
              {badge}
            </span>
          )}
        </div>
        <motion.div
          initial={false}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <ChevronIcon
            direction="down"
            className="size-4 text-gray-400 dark:text-gray-500"
          />
        </motion.div>
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
            <div className="p-4 bg-white dark:bg-gray-900">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function StudyGuideViewer({ data, className }: StudyGuideViewerProps) {
  const {
    overview,
    keyConcepts,
    importantDetails,
    connections,
    reviewQuestions,
  } = data;

  return (
    <div className={cn("flex flex-col gap-4 p-6 max-w-3xl mx-auto", className)}>
      {/* Overview - always visible */}
      <div className="p-4 rounded-xs bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
        <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wider mb-2">
          Overview
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
          {overview}
        </p>
      </div>

      {/* Key Concepts */}
      {keyConcepts && keyConcepts.length > 0 && (
        <CollapsibleSection
          title="Key Concepts"
          badge={keyConcepts.length}
          defaultOpen={true}
        >
          <div className="flex flex-col gap-2">
            {keyConcepts.map((concept, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:gap-4 p-3 rounded-xs bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
              >
                <dt className="font-medium text-sm text-blue-600 dark:text-blue-400 sm:min-w-[180px] sm:max-w-[180px] flex-shrink-0">
                  {concept.term}
                </dt>
                <dd className="text-sm text-gray-700 dark:text-gray-200 mt-1 sm:mt-0 leading-relaxed">
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
                <span className="flex-shrink-0 w-1.5 h-1.5 mt-[7px] rounded-full bg-blue-500" />
                <span className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
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
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-xs bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 text-[10px] font-medium">
                  {index + 1}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed pt-0.5">
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
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-xs bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300 text-xs font-medium">
                  {index + 1}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-200 pt-0.5 leading-relaxed">
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
