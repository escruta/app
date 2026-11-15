interface KeyConcept {
  term: string;
  definition: string;
}

export interface StudyGuideResponse {
  title?: string;
  overview: string;
  keyConcepts: KeyConcept[];
  importantDetails: string[];
  connections: string[];
  reviewQuestions: string[];
}
