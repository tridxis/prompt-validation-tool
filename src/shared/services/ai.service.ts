import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from './config.service';
import axios from 'axios';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAICompletionRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface OpenAICompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: OpenAIMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Gets a completion from the OpenAI API
   * @param systemPrompt The system prompt providing context and instructions
   * @param userPrompt The user prompt with the specific query
   * @returns The AI model's completion
   */
  public async getCompletion(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string> {
    const apiKey = this.configService.get('AI_API_KEY');
    const apiUrl = this.configService.get(
      'AI_API_URL',
      'https://api.openai.com/v1/chat/completions',
    );
    const model = this.configService.get('AI_MODEL', 'gpt-4o-mini');

    if (!apiKey) {
      this.logger.warn('No API key provided. Using mock response.');
      return '';
    }

    try {
      const messages: OpenAIMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      const requestData: OpenAICompletionRequest = {
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      };

      const response = await axios.post<OpenAICompletionResponse>(
        apiUrl,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
        },
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      this.logger.error(`Error calling OpenAI API: ${error.message}`);
      if (error.response) {
        this.logger.error(`Response status: ${error.response.status}`);
        this.logger.error(
          `Response data: ${JSON.stringify(error.response.data)}`,
        );
      }

      // Fallback to mock response in case of error
      this.logger.warn('Falling back to mock response due to API error');
      return '';
    }
  }
}
