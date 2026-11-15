export type JobType = "MIND_MAP" | "STUDY_GUIDE" | "FLASHCARDS" | "QUESTIONNAIRE";

export type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export type ToolDifficulty = "EASY" | "MEDIUM" | "HARD";

export type ToolDetailLevel = "CONCISE" | "STANDARD" | "DETAILED";

export type QuestionType = "multiple_choice" | "true_false" | "short_answer";

export type StudyGuideSection =
  | "keyConcepts"
  | "importantDetails"
  | "connections"
  | "reviewQuestions";

export interface GenerationOptions {
  difficulty?: ToolDifficulty | null;
  detailLevel?: ToolDetailLevel | null;
  itemCount?: number | null;
  maxDepth?: number | null;
  branchCount?: number | null;
  questionTypes?: QuestionType[] | null;
  sections?: StudyGuideSection[] | null;
  focusTopic?: string | null;
  selectedSourceIds?: string[] | null;
  sourceCount?: number | null;
}

export interface GenerationRequestPayload {
  type: JobType;
  title?: string | null;
  options?: GenerationOptions | null;
}

export interface GenerationJob {
  id: string;
  notebookId: string;
  type: JobType;
  title: string;
  status: JobStatus;
  options?: GenerationOptions | null;
  result: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt?: string | null;
  completedAt: string | null;
}
