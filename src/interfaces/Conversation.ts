export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  content: string;
  type: "USER" | "ASSISTANT";
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
