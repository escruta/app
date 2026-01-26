export interface KeyConcept {
  term: string;
  definition: string;
}

export interface StudyGuideResponse {
  overview: string;
  keyConcepts: KeyConcept[];
  importantDetails: string[];
  connections: string[];
  reviewQuestions: string[];
}
