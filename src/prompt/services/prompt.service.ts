import { Injectable, Logger } from '@nestjs/common';
import { PromptHistory } from '../models/prompt-history.type';

@Injectable()
export class PromptService {
  private readonly promptHistories: Map<string, PromptHistory> = new Map();
  private readonly logger = new Logger(PromptService.name);

  /**
   * Saves a prompt optimization history
   * @param id The unique identifier for the optimization session
   * @param history The prompt optimization history
   */
  public savePromptHistory(id: string, history: PromptHistory): void {
    this.promptHistories.set(id, history);
    this.logger.log(`Saved prompt history for session ${id}`);
  }

  /**
   * Retrieves a prompt optimization history
   * @param id The unique identifier for the optimization session
   * @returns The prompt optimization history or undefined if not found
   */
  public getPromptHistory(id: string): PromptHistory | undefined {
    return this.promptHistories.get(id);
  }

  /**
   * Lists all prompt optimization history IDs
   * @returns An array of history IDs
   */
  public listPromptHistoryIds(): string[] {
    return Array.from(this.promptHistories.keys());
  }
}
