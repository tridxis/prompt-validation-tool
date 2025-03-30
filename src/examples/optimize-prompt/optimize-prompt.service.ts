import { Injectable, Logger } from '@nestjs/common';
import { OptimizationService } from '../../core/services/optimization.service';
import {
  OptimizePromptDto,
  TestCaseOptions,
} from '../../core/models/optimize-prompt.dto';
import { OptimizationResult } from '../../core/models/optimization-result.type';
import { PromptEvaluatorService } from '../../agent/services/prompt-evaluator.service';
import { ParameterExtractorService } from '../../agent/services/parameter-extractor.service';
import * as path from 'path';
import {
  readPromptFromFile,
  getInputFilePath,
} from '../../shared/utils/file-utils';

@Injectable()
export class OptimizePromptService {
  private readonly logger = new Logger(OptimizePromptService.name);
  private readonly globalPromptPath = getInputFilePath('global-prompt.txt');
  private readonly promptPath = getInputFilePath('prompt-to-optimize.txt');
  private readonly testCasePromptPath = getInputFilePath(
    'test-case-prompt.txt',
  );
  private readonly exampleTestCasesPath = getInputFilePath(
    'example-test-cases.json',
  );

  constructor(
    private readonly optimizationService: OptimizationService,
    private readonly promptEvaluatorService: PromptEvaluatorService,
  ) {}

  public async optimizePrompt(
    optimizePromptDto: OptimizePromptDto,
  ): Promise<OptimizationResult> {
    this.logger.log('Optimizing prompt...');

    // Optimize the prompt
    const result =
      await this.optimizationService.optimizePrompt(optimizePromptDto);

    this.logger.log('Prompt optimized successfully');
    return result;
  }

  public getTestCaseOptions(): TestCaseOptions {
    const exampleTestCases = readPromptFromFile(this.exampleTestCasesPath);

    const testCasePrompt = readPromptFromFile(this.testCasePromptPath);
    const options = {
      testCasePrompt,
      exampleTestCases: JSON.parse(exampleTestCases),
    };

    return options;
  }
  /**
   * Gets the default global prompt for order placement
   * @returns The default global prompt
   */
  public getDefaultGlobalPrompt(): string {
    return readPromptFromFile(this.globalPromptPath);
  }

  /**
   * Gets the default order prompt for order placement
   * @returns The default order prompt
   */
  public getDefaultPrompt(): string {
    return readPromptFromFile(this.promptPath);
  }

  /**
   * Evaluates a prompt against test cases
   * @param prompt The prompt to evaluate
   * @param testCases The test cases to evaluate against
   * @returns The evaluation results
   */
  public async evaluatePrompt(prompt: string, testCases: any[]): Promise<any> {
    const globalPrompt = this.getDefaultGlobalPrompt();
    return this.promptEvaluatorService.evaluatePrompt(
      globalPrompt,
      prompt,
      testCases,
    );
  }
}
