export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
};
