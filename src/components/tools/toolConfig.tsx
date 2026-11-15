import type { ReactNode } from "react";
import { MindMapIcon, StudyIcon, CardIcon, QuestionnaireIcon } from "@/components/icons";
import type {
  GenerationJob,
  GenerationOptions,
  JobType,
  QuestionType,
  StudyGuideSection,
  ToolDetailLevel,
  ToolDifficulty,
} from "@/interfaces";

export interface ToolDefinition {
  type: JobType;
  title: string;
  shortDescription: string;
  description: string;
  focusPlaceholder: string;
  icon: ReactNode;
}

export const TOOL_DEFINITIONS: Record<JobType, ToolDefinition> = {
  MIND_MAP: {
    type: "MIND_MAP",
    title: "Mind Map",
    shortDescription: "Concept hierarchy",
    description: "Interactive visual map of concept connections",
    focusPlaceholder:
      "e.g., Center the map around architectural trade-offs or compare chapters 2 and 3...",
    icon: <MindMapIcon />,
  },
  STUDY_GUIDE: {
    type: "STUDY_GUIDE",
    title: "Study Guide",
    shortDescription: "Structured notes",
    description: "Structured summary, key terms, details, and review questions",
    focusPlaceholder:
      "e.g., Prepare me for a midterm exam focusing on formulas and core theorems...",
    icon: <StudyIcon />,
  },
  FLASHCARDS: {
    type: "FLASHCARDS",
    title: "Flashcards",
    shortDescription: "Active recall",
    description: "Practice cards for spaced repetition and memorization",
    focusPlaceholder: "e.g., Focus on key vocabulary, dates, and definitions from lecture notes...",
    icon: <CardIcon />,
  },
  QUESTIONNAIRE: {
    type: "QUESTIONNAIRE",
    title: "Questionnaire",
    shortDescription: "Knowledge check",
    description: "Interactive quiz with explanations to test comprehension",
    focusPlaceholder: "e.g., Test practical application scenarios and common misconceptions...",
    icon: <QuestionnaireIcon />,
  },
};

export const TOOL_LIST: ToolDefinition[] = [
  TOOL_DEFINITIONS.MIND_MAP,
  TOOL_DEFINITIONS.STUDY_GUIDE,
  TOOL_DEFINITIONS.FLASHCARDS,
  TOOL_DEFINITIONS.QUESTIONNAIRE,
];

export const ALL_QUESTION_TYPES: { value: QuestionType; label: string; shortLabel: string }[] = [
  { value: "multiple_choice", label: "Multiple choice", shortLabel: "MCQ" },
  { value: "true_false", label: "True / False", shortLabel: "T/F" },
  { value: "short_answer", label: "Short answer", shortLabel: "Short" },
];

export const ALL_STUDY_GUIDE_SECTIONS: {
  value: StudyGuideSection;
  label: string;
}[] = [
  { value: "keyConcepts", label: "Key concepts" },
  { value: "importantDetails", label: "Important details" },
  { value: "connections", label: "Connections & relationships" },
  { value: "reviewQuestions", label: "Review questions" },
];

export const DIFFICULTY_LABELS: Record<ToolDifficulty, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

export const AUDIENCE_DIFFICULTY_LABELS: Record<ToolDifficulty, string> = {
  EASY: "Introductory",
  MEDIUM: "Intermediate",
  HARD: "Advanced",
};

export const DETAIL_LABELS: Record<ToolDetailLevel, string> = {
  CONCISE: "Concise",
  STANDARD: "Standard",
  DETAILED: "Detailed",
};

export const MAX_FOCUS_TOPIC_LENGTH = 500;

export function getDefaultGenerationOptions(
  type: JobType,
  selectedReadySourceIds?: string[],
  totalReadySources?: number,
): GenerationOptions {
  const hasSubset =
    selectedReadySourceIds &&
    selectedReadySourceIds.length > 0 &&
    (totalReadySources === undefined || selectedReadySourceIds.length < totalReadySources);

  const base: GenerationOptions = {
    difficulty: "MEDIUM",
    detailLevel: "STANDARD",
    focusTopic: "",
    selectedSourceIds: hasSubset ? selectedReadySourceIds : null,
  };

  switch (type) {
    case "MIND_MAP":
      return {
        ...base,
        branchCount: 6,
        maxDepth: 3,
      };
    case "STUDY_GUIDE":
      return {
        ...base,
        sections: ALL_STUDY_GUIDE_SECTIONS.map((s) => s.value),
      };
    case "FLASHCARDS":
      return {
        ...base,
        itemCount: 15,
      };
    case "QUESTIONNAIRE":
      return {
        ...base,
        itemCount: 10,
        questionTypes: ALL_QUESTION_TYPES.map((q) => q.value),
      };
  }
}

export function getToolMetricBadges(job: Pick<GenerationJob, "type" | "options">): string[] {
  const opts = job.options;
  if (!opts) return [];

  const badges: string[] = [];

  switch (job.type) {
    case "FLASHCARDS": {
      if (opts.itemCount) {
        badges.push(`${opts.itemCount} cards`);
      }
      if (opts.difficulty) {
        badges.push(DIFFICULTY_LABELS[opts.difficulty] ?? opts.difficulty);
      }
      if (opts.detailLevel && opts.detailLevel !== "STANDARD") {
        badges.push(DETAIL_LABELS[opts.detailLevel] ?? opts.detailLevel);
      }
      break;
    }
    case "QUESTIONNAIRE": {
      if (opts.itemCount) {
        badges.push(`${opts.itemCount} questions`);
      }
      if (opts.difficulty) {
        badges.push(DIFFICULTY_LABELS[opts.difficulty] ?? opts.difficulty);
      }
      if (opts.questionTypes && opts.questionTypes.length > 0 && opts.questionTypes.length < 3) {
        const labels = opts.questionTypes.map(
          (qt) => ALL_QUESTION_TYPES.find((item) => item.value === qt)?.shortLabel ?? qt,
        );
        badges.push(labels.join(" + "));
      }
      if (opts.detailLevel && opts.detailLevel !== "STANDARD") {
        badges.push(DETAIL_LABELS[opts.detailLevel] ?? opts.detailLevel);
      }
      break;
    }
    case "STUDY_GUIDE": {
      if (opts.detailLevel) {
        badges.push(DETAIL_LABELS[opts.detailLevel] ?? opts.detailLevel);
      }
      if (opts.difficulty) {
        badges.push(AUDIENCE_DIFFICULTY_LABELS[opts.difficulty] ?? opts.difficulty);
      }
      if (opts.sections && opts.sections.length > 0 && opts.sections.length < 4) {
        badges.push(`${opts.sections.length} sections`);
      }
      break;
    }
    case "MIND_MAP": {
      if (opts.branchCount) {
        badges.push(`${opts.branchCount} branches`);
      }
      if (opts.maxDepth) {
        badges.push(`${opts.maxDepth} levels`);
      }
      if (opts.difficulty && opts.difficulty !== "MEDIUM") {
        badges.push(AUDIENCE_DIFFICULTY_LABELS[opts.difficulty] ?? opts.difficulty);
      }
      break;
    }
  }

  if (typeof opts.sourceCount === "number" && opts.sourceCount > 0) {
    badges.push(`${opts.sourceCount} ${opts.sourceCount === 1 ? "source" : "sources"}`);
  }

  return badges;
}

export function formatToolMetricsSummary(job: Pick<GenerationJob, "type" | "options">): string {
  const badges = getToolMetricBadges(job);
  return badges.join(" · ");
}

export function isLegacyToolTabRef(refId: string): refId is JobType {
  return (
    refId === "MIND_MAP" ||
    refId === "STUDY_GUIDE" ||
    refId === "FLASHCARDS" ||
    refId === "QUESTIONNAIRE"
  );
}
