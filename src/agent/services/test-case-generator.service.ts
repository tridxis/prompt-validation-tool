import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../../shared/services/ai.service';
import { TestCase } from '../../core/models/optimization-result.type';
import { TestCaseOptions } from 'src/core/models/optimize-prompt.dto';

@Injectable()
export class TestCaseGeneratorService {
  private readonly logger = new Logger(TestCaseGeneratorService.name);

  constructor(private readonly aiService: AiService) {}

  /**
   * Generates test cases for prompt optimization
   * @param globalPrompt The global context prompt
   * @param promptToOptimize The prompt to optimize
   * @param options Additional options for test case generation
   * @returns An array of test cases
   */
  public async generateTestCases(
    globalPrompt: string,
    promptToOptimize: string,
    options?: TestCaseOptions,
  ): Promise<TestCase[]> {
    this.logger.log('Generating test cases...');

    const { exampleTestCases, testCasePrompt = '' } = options || {};

    // Build the system prompt based on the provided options
    const systemPrompt = `      
      ${testCasePrompt}
      
       Create 5 diverse test cases that simulate real user conversations. Each test case should:
       1. Start with a user message that contains partial information
       2. Include expected assistant responses that ask for missing information
       3. Include follow-up user messages that provide the missing information
       4. End with a final JSON output containing all parameters
       
       Format each test case as a conversation with multiple turns, ending with the JSON output.
       
       IMPORTANT: Return your response as a valid JSON array of test cases. Make sure the JSON is properly formatted and can be parsed.
      
      ${
        exampleTestCases && exampleTestCases.length > 0
          ? `Example test case:
      [${JSON.stringify(exampleTestCases[0], null, 2)}]`
          : ''
      }
    `;

    const userPrompt = `
      Create test cases for this trading assistant prompt:
      
      ${promptToOptimize}
      
      Return ONLY a valid JSON array of test cases. Do not include any explanations or additional text.
    `;

    try {
      const response = await this.aiService.getCompletion(
        systemPrompt,
        userPrompt,
      );

      // Try to extract JSON array from the response
      let jsonStr = response;

      // If the response contains text before or after the JSON array, extract just the array
      if (response.includes('[') && response.includes(']')) {
        const startIndex = response.indexOf('[');
        const endIndex = response.lastIndexOf(']') + 1;
        jsonStr = response.substring(startIndex, endIndex);
      }

      // Try to parse the JSON
      try {
        const testCases = JSON.parse(jsonStr);
        if (Array.isArray(testCases) && testCases.length > 0) {
          this.logger.log(
            `Successfully generated ${testCases.length} test cases`,
          );

          return testCases;
        }
      } catch (parseError) {
        this.logger.warn(`Failed to parse JSON: ${parseError.message}`);
        // Try to fix common JSON issues
        const fixedJson = this.attemptToFixJson(jsonStr);
        if (fixedJson) {
          const testCases = JSON.parse(fixedJson);
          if (Array.isArray(testCases) && testCases.length > 0) {
            this.logger.log(
              `Successfully parsed fixed JSON with ${testCases.length} test cases`,
            );

            return testCases;
          }
        }
      }

      // If we couldn't parse the JSON, create default test cases
      this.logger.warn(
        'Could not parse response as valid test cases, using default test cases',
      );
    } catch (error) {
      this.logger.error(`Error generating test cases: ${error.message}`);
    }

    return exampleTestCases || [];
  }

  /**
   * Attempts to fix common JSON formatting issues
   * @param jsonStr The JSON string to fix
   * @returns The fixed JSON string, or null if it couldn't be fixed
   */
  private attemptToFixJson(jsonStr: string): string | null {
    try {
      // Replace single quotes with double quotes
      let fixed = jsonStr.replace(/'/g, '"');

      // Fix unescaped quotes in strings
      fixed = fixed.replace(
        /([,{[]\s*)"([^"]+)":(\s*)"([^"]+)([^\\])"([,}\]])/g,
        '$1"$2":$3"$4$5\\"$6',
      );

      // Fix missing quotes around property names
      fixed = fixed.replace(/([,{]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');

      // Fix trailing commas in objects and arrays
      fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

      return fixed;
    } catch (error) {
      this.logger.warn(`Failed to fix JSON: ${error.message}`);
      return null;
    }
  }
}
