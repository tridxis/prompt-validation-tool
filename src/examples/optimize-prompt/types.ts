export type Parameters = Record<string, number | string | null>;

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Conversation {
  id: string;
  messages: Message[];
  parameters?: Parameters;
  isComplete: boolean;
}
