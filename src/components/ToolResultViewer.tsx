import { useState, useMemo } from "react";
import {
  CloseIcon,
  RestartIcon,
  ExpandIcon,
  CompressIcon,
  MindMapIcon,
  StudyIcon,
  CardIcon,
  QuestionnaireIcon,
} from "@/components/icons";
import { Card, IconButton, Tooltip, Divider, Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";
import type {
  JobType,
  FlashcardsResponse,
  QuestionnaireResponse,
  StudyGuideResponse,
  MindMapResponse,
} from "@/interfaces";
import {
  FlashcardsViewer,
  QuestionnaireViewer,
  StudyGuideViewer,
  MindMapViewer,
} from "@/components/tools";

interface ToolResultViewerProps {
  title: string;
  type: JobType;
  content: string;
  isLoading?: boolean;
  onClose: () => void;
  onRegenerate?: () => void;
  className?: string;
  onNodeSelect?: (question: string) => void;
}

const toolIcons: Record<JobType, React.ReactNode> = {
  MIND_MAP: <MindMapIcon />,
  STUDY_GUIDE: <StudyIcon />,
  FLASHCARDS: <CardIcon />,
  QUESTIONNAIRE: <QuestionnaireIcon />,
};

type ParsedContent =
  | { type: "FLASHCARDS"; data: FlashcardsResponse }
  | { type: "QUESTIONNAIRE"; data: QuestionnaireResponse }
  | { type: "STUDY_GUIDE"; data: StudyGuideResponse }
  | { type: "MIND_MAP"; data: MindMapResponse }
  | { type: "error"; error: string }
  | null;

function parseContent(content: string, type: JobType): ParsedContent {
  if (!content) return null;

  try {
    const data = JSON.parse(content);
    return { type, data } as ParsedContent;
  } catch {
    return { type: "error", error: "Failed to parse content" };
  }
}

export function ToolResultViewer({
  title,
  type,
  content,
  isLoading = false,
  onClose,
  onRegenerate,
  className,
  onNodeSelect,
}: ToolResultViewerProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const parsedContent = useMemo(
    () => parseContent(content, type),
    [content, type],
  );

  function renderContent() {
    if (isLoading) {
      return (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <Spinner size={32} className="mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Generating {title.toLowerCase()}...
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              This may take a moment
            </p>
          </div>
        </div>
      );
    }

    if (!parsedContent) {
      return (
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-gray-500 dark:text-gray-400">
            No content available
          </p>
        </div>
      );
    }

    if (parsedContent.type === "error") {
      return (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <p className="text-red-500 dark:text-red-400 mb-2">
              {parsedContent.error}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              The content could not be displayed properly
            </p>
          </div>
        </div>
      );
    }

    switch (parsedContent.type) {
      case "FLASHCARDS":
        return (
          <FlashcardsViewer data={parsedContent.data} isExpanded={isExpanded} />
        );
      case "QUESTIONNAIRE":
        return <QuestionnaireViewer data={parsedContent.data} />;
      case "STUDY_GUIDE":
        return <StudyGuideViewer data={parsedContent.data} />;
      case "MIND_MAP":
        return (
          <MindMapViewer
            data={parsedContent.data}
            onNodeSelect={onNodeSelect}
          />
        );
      default:
        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <p className="text-gray-500 dark:text-gray-400">
              Unknown content type
            </p>
          </div>
        );
    }
  }

  return (
    <Card
      isExpanded={isExpanded}
      setIsExpanded={setIsExpanded}
      className={cn(
        "flex flex-col overflow-y-auto p-0 dark:bg-gray-800",
        className,
      )}
    >
      <div className="sticky h-20 top-0 z-10">
        <div className="h-6 bg-gray-50 dark:bg-gray-800 w-full flex-shrink-0" />
        <div className="h-14 px-6 bg-gray-50 dark:bg-gray-800">
          <div className="h-12 px-2 gap-3 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="text-gray-600 dark:text-gray-300 flex-shrink-0 w-5 h-5">
                {toolIcons[type]}
              </div>
              <h2 className="truncate font-semibold">{title}</h2>
            </div>
            <div className="flex gap-2">
              {onRegenerate && (
                <Tooltip text="Regenerate" position="bottom">
                  <IconButton
                    icon={isLoading ? <Spinner size={16} /> : <RestartIcon />}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onRegenerate();
                      onClose();
                    }}
                    disabled={isLoading}
                  />
                </Tooltip>
              )}
              <Tooltip
                text={isExpanded ? "Restore size" : "Expand"}
                position="bottom"
              >
                <IconButton
                  icon={isExpanded ? <CompressIcon /> : <ExpandIcon />}
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded((s) => !s)}
                />
              </Tooltip>
              <Tooltip text="Close" position="bottom">
                <IconButton
                  icon={<CloseIcon />}
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                />
              </Tooltip>
            </div>
          </div>
          <Divider />
        </div>
      </div>

      <div
        className={cn("flex-1 flex flex-col w-full mx-auto", {
          "max-w-5xl overflow-y-auto": !(
            ["MIND_MAP", "FLASHCARDS"] satisfies JobType[] as readonly JobType[]
          ).includes(type),
          "overflow-hidden px-6": (
            ["MIND_MAP", "FLASHCARDS"] satisfies JobType[] as readonly JobType[]
          ).includes(type),
        })}
      >
        {renderContent()}
      </div>
    </Card>
  );
}
