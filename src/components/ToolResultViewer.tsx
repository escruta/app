import { useMemo } from "react";
import { RestartIcon, DotsVerticalIcon } from "@/components/icons";
import {
  Divider,
  IconButton,
  Spinner,
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  ViewerFrame,
} from "@/components/ui";
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
  regenerateCloses?: boolean;
}

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
    return { type: "error", error: "We couldn't read this content" };
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
  regenerateCloses = true,
}: ToolResultViewerProps) {
  const parsedContent = useMemo(() => parseContent(content, type), [content, type]);

  function renderContent() {
    if (isLoading) {
      return (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center">
            <Spinner size={32} className="mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Generating {title.toLowerCase()}...</p>
            <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">This may take a moment</p>
          </div>
        </div>
      );
    }

    if (!parsedContent) {
      return (
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="text-gray-500 dark:text-gray-400">Nothing to show here yet.</p>
        </div>
      );
    }

    if (parsedContent.type === "error") {
      return (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center">
            <p className="mb-2 text-red-500 dark:text-red-400">{parsedContent.error}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              We couldn't display this content properly, try regenerating it.
            </p>
          </div>
        </div>
      );
    }

    switch (parsedContent.type) {
      case "FLASHCARDS":
        return <FlashcardsViewer data={parsedContent.data} />;
      case "QUESTIONNAIRE":
        return <QuestionnaireViewer data={parsedContent.data} />;
      case "STUDY_GUIDE":
        return <StudyGuideViewer data={parsedContent.data} />;
      case "MIND_MAP":
        return <MindMapViewer data={parsedContent.data} onNodeSelect={onNodeSelect} />;
      default:
        return (
          <div className="flex flex-1 items-center justify-center p-6">
            <p className="text-gray-500 dark:text-gray-400">
              We don't recognize this content type, try regenerating.
            </p>
          </div>
        );
    }
  }

  return (
    <ViewerFrame className={className}>
      <div className="flex h-15 shrink-0 items-center px-4 pt-4 pb-3">
        <h2 className="flex min-w-0 flex-1 items-baseline gap-1.5">
          <span className="shrink-0 text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
            Tool /{" "}
          </span>
          <span className="truncate text-lg font-semibold select-text">{title}</span>
        </h2>
        <div className="flex items-center gap-1">
          {onRegenerate && (
            <Menu>
              <MenuTrigger>
                <IconButton
                  icon={<DotsVerticalIcon />}
                  variant="ghost"
                  size="sm"
                  ariaLabel="More options"
                />
              </MenuTrigger>
              <MenuContent>
                <MenuItem
                  icon={isLoading ? <Spinner size={16} /> : <RestartIcon />}
                  label="Regenerate"
                  onClick={() => {
                    onRegenerate();
                    if (regenerateCloses) onClose();
                  }}
                  disabled={isLoading}
                />
              </MenuContent>
            </Menu>
          )}
        </div>
      </div>

      <Divider className="my-0" />

      <div
        className={cn("flex-1 flex flex-col w-full mx-auto", {
          "overflow-y-auto": !(
            ["MIND_MAP", "FLASHCARDS", "QUESTIONNAIRE"] satisfies JobType[] as readonly JobType[]
          ).includes(type),
          "overflow-hidden": (
            ["MIND_MAP", "FLASHCARDS", "QUESTIONNAIRE"] satisfies JobType[] as readonly JobType[]
          ).includes(type),
        })}
      >
        {renderContent()}
      </div>
    </ViewerFrame>
  );
}
