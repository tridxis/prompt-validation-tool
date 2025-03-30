import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { TestCaseGeneratorService } from '../../agent/services/test-case-generator.service';
import { PromptOptimizerService } from '../../agent/services/prompt-optimizer.service';
import { PromptService } from '../../prompt/services/prompt.service';
import { OptimizePromptDto } from '../models/optimize-prompt.dto';
import {
  OptimizationResult,
  TestCase,
  OptimizationStep,
} from '../models/optimization-result.type';
import {
  PromptHistory,
  PromptIteration,
} from '../../prompt/models/prompt-history.type';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class OptimizationService {
  private readonly MAX_ITERATIONS = 5;
  private readonly CONVERGENCE_THRESHOLD = 0.9;
  private readonly logger = new Logger(OptimizationService.name);

  constructor(
    private readonly testCaseGeneratorService: TestCaseGeneratorService,
    private readonly promptOptimizerService: PromptOptimizerService,
    private readonly promptService: PromptService,
  ) {}

  /**
   * Optimizes a prompt using the two-agent approach
   * @param optimizePromptDto The DTO containing the global prompt and the prompt to optimize
   * @returns The optimization result with the improved prompt
   */
  public async optimizePrompt(
    optimizePromptDto: OptimizePromptDto,
  ): Promise<OptimizationResult> {
    const { globalPrompt, promptToOptimize, testCaseOptions } =
      optimizePromptDto;
    const sessionId = uuidv4();

    this.logger.log(`Starting optimization session ${sessionId}`);

    let currentPrompt = promptToOptimize;
    let iterations = 0;
    let allTestCases: TestCase[] = [];
    let convergenceReason = 'Maximum iterations reached';
    const optimizationSteps: OptimizationStep[] = [];

    const promptHistory: PromptHistory = {
      id: sessionId,
      createdAt: new Date(),
      globalPrompt,
      originalPrompt: promptToOptimize,
      iterations: [],
      finalPrompt: '',
      completedAt: null,
    };

    try {
      // Generate test cases
      this.logger.log('Generating test cases...');
      const testCases = await this.testCaseGeneratorService.generateTestCases(
        globalPrompt,
        currentPrompt,
        testCaseOptions,
      );

      allTestCases = [...allTestCases, ...testCases];
      this.logger.log(`Generated ${testCases.length} test cases`);

      // Optimize the prompt
      this.logger.log('Optimizing prompt...');
      const { optimizedPrompt, evaluation } =
        await this.promptOptimizerService.optimizePrompt(
          globalPrompt,
          currentPrompt,
          testCases,
          iterations + 1,
        );

      // Store optimization step
      const step: OptimizationStep = {
        iteration: iterations + 1,
        prompt: optimizedPrompt,
        evaluation,
        timestamp: new Date().toISOString(),
      };

      optimizationSteps.push(step);

      // Save step to file
      this.saveOptimizationStep(step);

      // Record this iteration
      const iteration: PromptIteration = {
        iterationNumber: iterations + 1,
        prompt: optimizedPrompt,
        testCases,
        timestamp: new Date(),
      };

      promptHistory.iterations.push(iteration);

      // Check if the optimized prompt is better
      this.logger.log('Evaluating optimization...');
      const isBetter = await this.promptOptimizerService.evaluateOptimization(
        globalPrompt,
        currentPrompt,
        optimizedPrompt,
        testCases,
      );

      if (!isBetter) {
        this.logger.log('Agents agree no further improvements needed');
        convergenceReason = 'No further improvement';
      } else if (evaluation.passRate >= this.CONVERGENCE_THRESHOLD * 100) {
        this.logger.log('Reached convergence threshold');
        convergenceReason = 'Reached convergence threshold';
        currentPrompt = optimizedPrompt;
      } else {
        currentPrompt = optimizedPrompt;
        iterations++;
      }
    } catch (error) {
      this.logger.error(`Error during optimization: ${error.message}`);

      // Save the partial prompt history in case of error
      const errorPromptHistory = {
        ...promptHistory,
        finalPrompt: currentPrompt,
        completedAt: new Date(),
      };

      this.promptService.savePromptHistory(sessionId, errorPromptHistory);

      throw error;
    }

    // Create a new object for the updated prompt history
    const updatedPromptHistory = {
      ...promptHistory,
      finalPrompt: currentPrompt,
      completedAt: new Date(),
    };

    // Save the prompt history
    this.promptService.savePromptHistory(sessionId, updatedPromptHistory);

    this.logger.log(`Optimization completed: ${convergenceReason}`);

    return {
      originalPrompt: promptToOptimize,
      optimizedPrompt: currentPrompt,
      iterations: iterations + 1,
      testCases: allTestCases,
      convergenceReason,
      optimizationSteps,
    };
  }

  /**
   * Saves an optimization step to a file
   * @param step The optimization step to save
   */
  private saveOptimizationStep(step: OptimizationStep): void {
    try {
      // Create output directory if it doesn't exist
      const outputDir = path.join(
        process.cwd(),
        'output',
        'optimization-steps',
      );
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Create filename with timestamp and iteration
      const filename = `step-${step.iteration}-${new Date().getTime()}.json`;
      const filePath = path.join(outputDir, filename);

      // Write step to file
      fs.writeFileSync(filePath, JSON.stringify(step, null, 2), 'utf8');

      this.logger.log(
        `Saved optimization step ${step.iteration} to ${filePath}`,
      );
    } catch (error) {
      this.logger.error(`Failed to save optimization step: ${error.message}`);
    }
  }

  /**
   * Calculates the similarity between two strings
   * @param str1 The first string
   * @param str2 The second string
   * @returns A value between 0 and 1 representing similarity
   */
  private calculateSimilarity(str1: string, str2: string): number {
    // This is a simple implementation using Levenshtein distance
    // In a real application, you might want a more sophisticated algorithm
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1.0;

    const distance = this.levenshteinDistance(str1, str2);
    return 1.0 - distance / maxLength;
  }

  /**
   * Calculates the Levenshtein distance between two strings
   * @param str1 The first string
   * @param str2 The second string
   * @returns The Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;

    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) {
      dp[i][0] = i;
    }

    for (let j = 0; j <= n; j++) {
      dp[0][j] = j;
    }

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost,
        );
      }
    }

    return dp[m][n];
  }

  /**
   * Optimizes a prompt using the two-agent approach with custom challenges
   * @param optimizePromptDto The DTO containing the global prompt and the prompt to optimize
   * @param customChallengesPath Path to the custom challenges file
   * @returns The optimization result with the improved prompt
   */
  public async optimizePromptWithChallenges(
    optimizePromptDto: OptimizePromptDto,
  ): Promise<OptimizationResult> {
    const { globalPrompt, promptToOptimize, testCaseOptions } =
      optimizePromptDto;
    const sessionId = uuidv4();

    this.logger.log(
      `Starting optimization session ${sessionId} with custom challenges`,
    );

    let currentPrompt = promptToOptimize;
    let iterations = 0;
    let allTestCases: TestCase[] = [];
    let convergenceReason = 'Maximum iterations reached';
    const optimizationSteps: OptimizationStep[] = [];

    const promptHistory: PromptHistory = {
      id: sessionId,
      globalPrompt,
      originalPrompt: promptToOptimize,
      iterations: [],
      finalPrompt: promptToOptimize,
      createdAt: new Date(),
    };

    try {
      while (iterations < this.MAX_ITERATIONS) {
        this.logger.log(
          `Iteration ${iterations + 1} of ${this.MAX_ITERATIONS}`,
        );

        // Generate test cases with custom challenges
        this.logger.log('Generating test cases with custom challenges...');
        const testCases = await this.testCaseGeneratorService.generateTestCases(
          globalPrompt,
          currentPrompt,
          testCaseOptions,
        );

        allTestCases = [...allTestCases, ...testCases];
        this.logger.log(`Generated ${testCases.length} test cases`);

        // Optimize the prompt
        this.logger.log('Optimizing prompt...');
        const { optimizedPrompt, evaluation } =
          await this.promptOptimizerService.optimizePrompt(
            globalPrompt,
            currentPrompt,
            testCases,
            iterations + 1,
          );

        // Store optimization step
        const step: OptimizationStep = {
          iteration: iterations + 1,
          prompt: optimizedPrompt,
          evaluation,
          timestamp: new Date().toISOString(),
        };

        optimizationSteps.push(step);

        // Save step to file
        this.saveOptimizationStep(step);

        // Record this iteration
        const iteration: PromptIteration = {
          iterationNumber: iterations + 1,
          prompt: optimizedPrompt,
          testCases,
          timestamp: new Date(),
        };

        promptHistory.iterations.push(iteration);

        // Check if the optimized prompt is better
        this.logger.log('Evaluating optimization...');
        const isBetter = await this.promptOptimizerService.evaluateOptimization(
          globalPrompt,
          currentPrompt,
          optimizedPrompt,
          testCases,
        );

        if (!isBetter) {
          this.logger.log('Agents agree no further improvements needed');
          convergenceReason = 'No further improvement';
          break;
        }

        // Check if we've reached the convergence threshold
        if (evaluation.passRate >= this.CONVERGENCE_THRESHOLD * 100) {
          this.logger.log('Reached convergence threshold');
          convergenceReason = 'Reached convergence threshold';
          currentPrompt = optimizedPrompt;
          break;
        }

        currentPrompt = optimizedPrompt;
        iterations++;
      }

      // Create a new object for the updated prompt history
      const updatedPromptHistory = {
        ...promptHistory,
        finalPrompt: currentPrompt,
        completedAt: new Date(),
      };

      // Save the prompt history
      this.promptService.savePromptHistory(sessionId, updatedPromptHistory);

      this.logger.log(`Optimization completed: ${convergenceReason}`);

      return {
        originalPrompt: promptToOptimize,
        optimizedPrompt: currentPrompt,
        iterations: iterations + 1,
        testCases: allTestCases,
        convergenceReason,
        optimizationSteps,
      };
    } catch (error) {
      this.logger.error(`Error during optimization: ${error.message}`);

      // Save the partial prompt history in case of error
      const errorPromptHistory = {
        ...promptHistory,
        finalPrompt: currentPrompt,
        completedAt: new Date(),
      };

      this.promptService.savePromptHistory(sessionId, errorPromptHistory);

      throw error;
    }
  }
}
