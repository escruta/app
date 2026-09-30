export type ChatMode = "NORMAL" | "LEARNING";

export interface Conversation {
  id: string;
  title: string;
  mode: ChatMode;
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
}

export interface ConversationMessages {
  conversationId: string;
  mode: ChatMode;
  messages: ConversationMessage[];
}

export interface ConversationsPage {
  conversations: Conversation[];
  total: number;
  hasMore: boolean;
}
