import { useState } from "react";
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
        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">
            {title}
          </h3>
          {badge !== undefined && (
            <span className="px-2 py-0.5 text-xs rounded-xs bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
              {badge}
            </span>
          )}
        </div>
        <ChevronIcon
          direction={isOpen ? "up" : "down"}
          className="size-5 text-gray-500 transition-transform duration-200"
        />
      </button>
      <div
        className={cn(
          "transition-all duration-200 ease-in-out overflow-hidden",
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="p-4 bg-white dark:bg-gray-900">{children}</div>
      </div>
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
    <div className={cn("flex flex-col gap-4 p-6", className)}>
      {/* Overview - always visible */}
      <div className="p-4 rounded-xs bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-600">
        <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
          Overview
        </h3>
        <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
          {overview}
        </p>
      </div>

      {/* Key Concepts */}
      {keyConcepts && keyConcepts.length > 0 && (
        <CollapsibleSection
          title="Key concepts"
          badge={keyConcepts.length}
          defaultOpen={true}
        >
          <div className="flex flex-col gap-3">
            {keyConcepts.map((concept, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:gap-4 p-3 rounded-xs bg-gray-50 dark:bg-gray-800"
              >
                <dt className="font-medium text-blue-600 dark:text-blue-400 sm:min-w-[200px] sm:max-w-[200px]">
                  {concept.term}
                </dt>
                <dd className="text-gray-700 dark:text-gray-200 mt-1 sm:mt-0">
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
                <span className="flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-blue-500" />
                <span className="text-gray-700 dark:text-gray-200">
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
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-xs bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 text-xs">
                  {index + 1}
                </span>
                <span className="text-gray-700 dark:text-gray-200">
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
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-xs bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300 text-sm font-medium">
                  {index + 1}
                </span>
                <span className="text-gray-700 dark:text-gray-200 pt-0.5">
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
