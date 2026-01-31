import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MindMapIcon,
  StudyIcon,
  CardIcon,
  QuestionnaireIcon,
} from "@/components/icons";
import { Card, Divider } from "@/components/ui";
import { ToolCard } from "./ToolCard";
import { ToolResultViewer } from "./ToolResultViewer";
import { useGenerationJob } from "@/hooks";
import type { JobType, GenerationJob } from "@/interfaces";

interface Tool {
  icon: React.ReactNode;
  title: string;
  description: string;
  type: JobType;
}

interface ToolsCardProps {
  notebookId: string;
  onNodeSelect?: (question: string) => void;
}

interface SelectedTool {
  tool: Tool;
  job: GenerationJob | null;
  result: string | null;
  isLoading: boolean;
  startGeneration: () => void;
}

export function ToolsCard({ notebookId, onNodeSelect }: ToolsCardProps) {
  const [selectedTool, setSelectedTool] = useState<SelectedTool | null>(null);

  const tools: Tool[] = [
    {
      icon: <MindMapIcon />,
      title: "Mind Map",
      description: "Visual map of concept connections",
      type: "MIND_MAP",
    },
    {
      icon: <StudyIcon />,
      title: "Study Guide",
      description: "Key points and questions",
      type: "STUDY_GUIDE",
    },
    {
      icon: <CardIcon />,
      title: "Flashcards",
      description: "Spaced repetition cards",
      type: "FLASHCARDS",
    },
    {
      icon: <QuestionnaireIcon />,
      title: "Questionnaire",
      description: "Test your knowledge",
      type: "QUESTIONNAIRE",
    },
  ];

  const handleSelectTool = (
    tool: Tool,
    job: GenerationJob | null,
    result: string | null,
    isLoading: boolean,
    startGeneration: () => void,
  ) => {
    setSelectedTool({ tool, job, result, isLoading, startGeneration });
  };

  const handleCloseTool = () => {
    setSelectedTool(null);
  };

  return (
    <div className="relative h-full w-full">
      <AnimatePresence>
        {selectedTool ? (
          <motion.div
            key={selectedTool.tool.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.3,
            }}
            className="absolute inset-0 z-10 h-[96%] self-end"
          >
            <ToolResultViewer
              title={selectedTool.tool.title}
              type={selectedTool.tool.type}
              content={selectedTool.result ?? ""}
              isLoading={selectedTool.isLoading}
              onClose={handleCloseTool}
              onRegenerate={selectedTool.startGeneration}
              className="h-full"
              onNodeSelect={onNodeSelect}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div
        animate={{
          opacity: selectedTool ? 0.5 : 1,
          scale: selectedTool ? 0.98 : 1,
        }}
        transition={{ duration: 0.3 }}
        className="h-full"
      >
        <Card className="h-full overflow-y-auto">
          <div className="flex flex-row justify-between items-center mb-2 flex-shrink-0">
            <h2 className="text-lg font-sans font-semibold">Tools</h2>
          </div>
          <Divider className="my-4" />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
            {tools.map((tool) => (
              <ToolItem
                key={tool.type}
                tool={tool}
                notebookId={notebookId}
                onSelect={handleSelectTool}
              />
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

interface ToolItemProps {
  tool: Tool;
  notebookId: string;
  onSelect: (
    tool: Tool,
    job: GenerationJob | null,
    result: string | null,
    isLoading: boolean,
    startGeneration: () => void,
  ) => void;
}

function ToolItem({ tool, notebookId, onSelect }: ToolItemProps) {
  const { job, isLoading, isCompleted, isFailed, result, startGeneration } =
    useGenerationJob(notebookId, tool.type);

  function handleClick() {
    if (isFailed) {
      startGeneration();
    } else if (!isLoading && !isCompleted) {
      startGeneration();
    }
  }

  function handleViewResult() {
    onSelect(tool, job, result, isLoading, startGeneration);
  }

  return (
    <ToolCard
      icon={tool.icon}
      title={tool.title}
      description={tool.description}
      onClick={handleClick}
      status={job?.status ?? null}
      hasResult={isCompleted && result !== null}
      onViewResult={handleViewResult}
    />
  );
}
