export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface CitedSource {
  id: string;
  documentId: string;
  title: string;
  text?: string;
}

export interface ConversationMessage {
  content: string;
  type: "USER" | "ASSISTANT";
  citedSources?: CitedSource[];
  selectedSourcesCount?: number;
}

export interface ConversationMessages {
  conversationId: string;
  messages: ConversationMessage[];
}

export interface ConversationsPage {
  conversations: Conversation[];
  total: number;
  hasMore: boolean;
}
