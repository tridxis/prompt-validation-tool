import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../../shared/services/ai.service';
import { TestCase } from '../../core/models/optimization-result.type';

interface EvaluationResult {
  passed: boolean;
  actualOutput: string;
  similarity: number;
}

@Injectable()
export class PromptEvaluatorService {
  private readonly logger = new Logger(PromptEvaluatorService.name);

  constructor(private readonly aiService: AiService) {}

  /**
   * Evaluates a prompt against a set of test cases
   * @param globalPrompt The global context prompt
   * @param promptToEvaluate The prompt to evaluate
   * @param testCases The test cases to evaluate against
   * @returns The evaluation results with pass/fail status for each test case
   */
  public async evaluatePrompt(
    globalPrompt: string,
    promptToEvaluate: string,
    testCases: TestCase[],
  ): Promise<{ results: Record<string, EvaluationResult>; passRate: number }> {
    const results: Record<string, EvaluationResult> = {};
    let passedCount = 0;

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      this.logger.log(`Evaluating test case ${i + 1}/${testCases.length}`);

      // Get AI response for this test case
      const actualOutput = await this.getResponseForTestCase(
        globalPrompt,
        promptToEvaluate,
        testCase.input,
      );

      console.log('Actual output:', actualOutput);

      // Calculate similarity between actual and expected output
      const similarity = this.calculateSimilarity(
        actualOutput,
        testCase.expectedOutput,
      );

      // Consider it passed if similarity is above threshold
      const passed = similarity > 0.7;
      if (passed) passedCount++;

      results[`test_${i + 1}`] = {
        passed,
        actualOutput,
        similarity,
      };
    }

    const passRate = testCases.length > 0 ? passedCount / testCases.length : 0;
    return { results, passRate };
  }

  /**
   * Gets an AI response for a test case input
   * @param globalPrompt The global context prompt
   * @param promptToEvaluate The prompt to evaluate
   * @param userInput The user input from the test case
   * @returns The AI response
   */
  private async getResponseForTestCase(
    globalPrompt: string,
    promptToEvaluate: string,
    userInput: string,
  ): Promise<string> {
    const systemPrompt = `
      ${globalPrompt}
      
      ${promptToEvaluate}
    `;

    return this.aiService.getCompletion(systemPrompt, userInput);
  }

  /**
   * Calculates the similarity between two strings
   * @param str1 The first string
   * @param str2 The second string
   * @returns A value between 0 and 1 representing similarity
   */
  private calculateSimilarity(str1: string, str2: string): number {
    // Normalize strings for comparison
    const normalize = (s: string): string =>
      s.toLowerCase().replace(/\s+/g, ' ').trim();

    const s1 = normalize(str1);
    const s2 = normalize(str2);

    // This is a simple implementation using Levenshtein distance
    const maxLength = Math.max(s1.length, s2.length);
    if (maxLength === 0) return 1.0;

    const distance = this.levenshteinDistance(s1, s2);
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
}
