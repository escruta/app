export interface Question {
  type: "multiple_choice" | "true_false" | "short_answer";
  question: string;
  options: string[] | null;
  correctAnswerIndex: number | null;
  correctAnswerBoolean: boolean | null;
  sampleAnswer: string | null;
  explanation: string;
}

export interface QuestionnaireResponse {
  title: string;
  questions: Question[];
}
