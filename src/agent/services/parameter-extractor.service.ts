import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../../shared/services/ai.service';

@Injectable()
export class ParameterExtractorService {
  private readonly logger = new Logger(ParameterExtractorService.name);

  constructor(private readonly aiService: AiService) {}

  /**
   * Extracts order parameters from a conversation
   * @param globalPrompt The global context prompt
   * @param jsonExtractionPrompt The prompt for parameter extraction
   * @param userInput The user input
   * @returns The extracted order parameters as a JSON object
   */
  public async extractParameters(
    globalPrompt: string,
    jsonExtractionPrompt: string,
    userInput: string,
  ) {
    this.logger.log('Extracting parameters from user input...');

    const systemPrompt = `
      ${globalPrompt}
      
      ${jsonExtractionPrompt}
      
      Extract parameters from the user input and return a JSON object.
      If you can't extract all parameters, return what you can and indicate what's missing.
    `;

    const response = await this.aiService.getCompletion(
      systemPrompt,
      userInput,
    );

    try {
      // Try to parse the response as JSON
      if (response.trim().startsWith('{') && response.trim().endsWith('}')) {
        return JSON.parse(response);
      }
    } catch (error) {
      this.logger.warn(`Failed to parse response as JSON: ${error.message}`);
    }

    return {};
  }
}
