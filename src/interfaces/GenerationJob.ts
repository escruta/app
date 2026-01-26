export type JobType =
  // | "AUDIO_SUMMARY"
  "MIND_MAP" | "STUDY_GUIDE" | "FLASHCARDS" | "QUESTIONNAIRE";

export type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export default interface GenerationJob {
  id: string;
  notebookId: string;
  type: JobType;
  status: JobStatus;
  result: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}
