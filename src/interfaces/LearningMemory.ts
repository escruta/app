export type ProficiencyLevel = "AUTO" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export type LearningSignalSource = "FLASHCARD" | "QUESTIONNAIRE";
export type LearningSignalOutcome = "MASTERED" | "STRUGGLING";

export interface LearningPracticeStats {
  flashcardsReviewed: number;
  flashcardsKnown: number;
  quizQuestionsAnswered: number;
  quizQuestionsCorrect: number;
  learningTurnsCount: number;
}

export interface LearningMemory {
  notebookId: string;
  enabled: boolean;
  proficiencyLevel: ProficiencyLevel;
  learningGoal: string | null;
  masteredConcepts: string[];
  strugglingConcepts: string[];
  studyNotes: string | null;
  stats: LearningPracticeStats;
  updatedAt: string | null;
}

export interface LearningMemoryUpdatePayload {
  enabled?: boolean;
  proficiencyLevel?: ProficiencyLevel;
  learningGoal?: string;
  masteredConcepts?: string[];
  strugglingConcepts?: string[];
  studyNotes?: string;
}

export interface LearningSignalPayload {
  source: LearningSignalSource;
  outcome: LearningSignalOutcome;
  topic: string;
  detail?: string;
}
