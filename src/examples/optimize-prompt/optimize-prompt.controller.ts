import { Body, Controller, Post, Get, Param } from '@nestjs/common';
import { OptimizePromptService } from './optimize-prompt.service';
import { OptimizationResult } from '../../core/models/optimization-result.type';
import * as fs from 'fs';
import * as path from 'path';
import { ConversationService } from './conversation.service';
import { OptimizePromptDto } from '../../core/models/optimize-prompt.dto';
import { Parameters } from './types';

@Controller('optimize-prompt')
export class OptimizePromptController {
  constructor(
    private readonly optimizePromptService: OptimizePromptService,
    private readonly conversationService: ConversationService,
  ) {}

  /**
   * Optimizes the order placement prompt
   * @param optimizeOrderPromptDto The DTO containing the global prompt and the prompt to optimize
   * @returns The optimization result with the improved prompt
   */
  @Post('optimize')
  public async optimizeOrderPrompt(
    @Body() optimizePromptDto: OptimizePromptDto,
  ): Promise<OptimizationResult> {
    const result =
      await this.optimizePromptService.optimizePrompt(optimizePromptDto);

    // Write test cases and optimized prompt to files
    this.writeResultsToFiles(result);

    return result;
  }

  /**
   * Gets the default order placement prompt
   * @returns The default order placement prompt
   */
  @Get('default-prompt')
  public getDefaultPrompt(): { prompt: string } {
    return {
      prompt: this.optimizePromptService.getDefaultPrompt(),
    };
  }

  /**
   * Writes the optimization results to files
   * @param result The optimization result
   */
  private writeResultsToFiles(result: OptimizationResult): void {
    const outputDir = path.join(__dirname, '../../../output');

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write test cases to file
    const testCasesPath = path.join(
      outputDir,
      'order-placement-test-cases.json',
    );
    fs.writeFileSync(
      testCasesPath,
      JSON.stringify(result.testCases, null, 2),
      'utf8',
    );

    // Write optimized prompt to file
    const optimizedPromptPath = path.join(
      outputDir,
      'order-placement-optimized-prompt.txt',
    );
    fs.writeFileSync(optimizedPromptPath, result.optimizedPrompt, 'utf8');

    console.log(`Test cases written to: ${testCasesPath}`);
    console.log(`Optimized prompt written to: ${optimizedPromptPath}`);
  }

  /**
   * Starts a new conversation
   * @returns The conversation ID
   */
  @Post('conversation/start')
  public startConversation(): { conversationId: string } {
    const conversationId = this.conversationService.startConversation();
    return { conversationId };
  }

  /**
   * Sends a message to a conversation
   * @param conversationId The conversation ID
   * @param body The message body
   * @returns The assistant's response
   */
  @Post('conversation/:conversationId/message')
  public async sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() body: { message: string },
  ): Promise<{
    response: string;
    isComplete: boolean;
    parameters?: Parameters;
  }> {
    const optimizedPrompt = this.optimizePromptService.getDefaultPrompt();

    const globalPrompt = this.optimizePromptService.getDefaultGlobalPrompt();

    if (!optimizedPrompt || !globalPrompt) {
      throw new Error('No prompt found');
    }

    return this.conversationService.sendMessage(
      conversationId,
      body.message,
      globalPrompt,
      optimizedPrompt,
    );
  }

  /**
   * Gets a conversation by ID
   * @param conversationId The conversation ID
   * @returns The conversation
   */
  @Get('conversation/:conversationId')
  public getConversation(@Param('conversationId') conversationId: string): any {
    return this.conversationService.getConversation(conversationId);
  }
}
