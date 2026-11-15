export type ChatMode = "NORMAL" | "LEARNING";
export type ConversationStatus = "IDLE" | "GENERATING" | "FAILED";

export type AgentStepType =
  | "analyze"
  | "thought"
  | "search"
  | "read"
  | "context"
  | "synthesize"
  | "text";
export type AgentStepStatus = "running" | "done" | "error";

export interface AgentStep {
  id: string;
  type: AgentStepType;
  title: string;
  detail?: string | null;
  rationale?: string | null;
  result?: string | null;
  sources?: string[] | null;
  status: AgentStepStatus;
  durationMs?: number | null;
}

export interface Conversation {
  id: string;
  title: string;
  mode: ChatMode;
  status: ConversationStatus;
  hasUnseenReply: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CitedSource {
  id: string;
  documentId: string;
  title: string;
  text?: string;
}

interface ConversationMessage {
  content: string;
  type: "USER" | "ASSISTANT";
  citedSources?: CitedSource[];
  selectedSourcesCount?: number;
  thinkingSteps?: AgentStep[];
  thinkingDurationMs?: number;
}

export interface ConversationMessages {
  conversationId: string;
  mode: ChatMode;
  status: ConversationStatus;
  hasUnseenReply: boolean;
  messages: ConversationMessage[];
}

export interface ConversationsPage {
  conversations: Conversation[];
  total: number;
  hasMore: boolean;
}
