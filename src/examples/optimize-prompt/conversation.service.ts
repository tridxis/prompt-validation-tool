import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../../shared/services/ai.service';
import { v4 as uuidv4 } from 'uuid';
import { Conversation, Parameters } from './types';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);
  private readonly conversations: Map<string, Conversation> = new Map();

  constructor(private readonly aiService: AiService) {}

  /**
   * Starts a new conversation
   * @returns The conversation ID
   */
  public startConversation(): string {
    const id = uuidv4();
    this.conversations.set(id, {
      id,
      messages: [],
      isComplete: false,
    });
    return id;
  }

  /**
   * Sends a message to the conversation
   * @param conversationId The conversation ID
   * @param message The user message
   * @param prompt The prompt to use
   * @returns The assistant's response
   */
  public async sendMessage(
    conversationId: string,
    message: string,
    globalPrompt: string,
    prompt: string,
  ): Promise<{
    response: string;
    isComplete: boolean;
    parameters?: Parameters;
  }> {
    const conversation = this.conversations.get(conversationId);

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Add user message to conversation
    conversation.messages.push({
      role: 'user',
      content: message,
    });

    // Create system prompt
    const systemPrompt = `
      ${globalPrompt}
      
      ${prompt}
    `;

    // Get all messages for context
    const messages = conversation.messages.map((m) => m.content).join('\n\n');

    // Get AI response
    const response = await this.aiService.getCompletion(systemPrompt, messages);

    // Add assistant message to conversation
    conversation.messages.push({
      role: 'assistant',
      content: response,
    });

    // Check if response is a JSON object
    let parameters: Parameters | undefined;
    let isComplete = false;

    try {
      if (response.trim().startsWith('{') && response.trim().endsWith('}')) {
        parameters = JSON.parse(response);
      }
    } catch (error) {
      this.logger.warn(`Failed to parse response as JSON: ${error.message}`);
    }

    return {
      response,
      isComplete,
      parameters,
    };
  }

  /**
   * Gets a conversation by ID
   * @param conversationId The conversation ID
   * @returns The conversation
   */
  public getConversation(conversationId: string): Conversation | undefined {
    return this.conversations.get(conversationId);
  }
}
