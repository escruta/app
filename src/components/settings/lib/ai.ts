import type { ChatMode } from "@/interfaces";

export type ResponseDetail = "concise" | "balanced" | "detailed";

export const AI_DEFAULT_CHAT_MODE_COOKIE_KEY = "aiDefaultChatMode";
export const AI_RESPONSE_DETAIL_COOKIE_KEY = "aiResponseDetail";
export const AI_CUSTOM_INSTRUCTIONS_COOKIE_KEY = "aiCustomInstructions";
export const AI_SHOW_EXAMPLE_QUESTIONS_COOKIE_KEY = "aiShowExampleQuestions";
export const AI_SHOW_CITED_SOURCES_COOKIE_KEY = "aiShowCitedSources";
export const AI_AUTO_OVERVIEW_COOKIE_KEY = "aiAutoOverview";
export const AI_AUTO_ADVANCE_FLASHCARDS_COOKIE_KEY = "aiAutoAdvanceFlashcards";

export const AI_MAX_CUSTOM_INSTRUCTIONS_LENGTH = 500;

export const CHAT_MODE_OPTIONS: {
  value: ChatMode;
  label: string;
  description: string;
}[] = [
  {
    value: "NORMAL",
    label: "Normal",
    description: "Direct, clear answers grounded in your sources",
  },
  {
    value: "LEARNING",
    label: "Learning",
    description: "Socratic tutor that guides you step by step",
  },
];

export const RESPONSE_DETAIL_OPTIONS: { value: ResponseDetail; label: string }[] = [
  { value: "concise", label: "Concise" },
  { value: "balanced", label: "Balanced" },
  { value: "detailed", label: "Detailed" },
];

export const DEFAULT_AI_SETTINGS = {
  defaultChatMode: "NORMAL" as ChatMode,
  responseDetail: "balanced" as ResponseDetail,
  customInstructions: "",
  showExampleQuestions: true,
  showCitedSources: true,
  autoGenerateOverview: true,
  autoAdvanceFlashcards: true,
};
