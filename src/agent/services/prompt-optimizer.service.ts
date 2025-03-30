import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../../shared/services/ai.service';
import { TestCase } from '../../core/models/optimization-result.type';
import { StepEvaluation } from '../../core/models/optimization-result.type';

@Injectable()
export class PromptOptimizerService {
  private readonly logger = new Logger(PromptOptimizerService.name);

  constructor(private readonly aiService: AiService) {}

  /**
   * Optimizes a prompt based on test cases
   * @param globalPrompt The global context prompt
   * @param promptToOptimize The prompt to optimize
   * @param testCases The test cases to use for optimization
   * @param iteration The current iteration number
   * @returns The optimized prompt and evaluation
   */
  public async optimizePrompt(
    globalPrompt: string,
    promptToOptimize: string,
    testCases: TestCase[],
    iteration: number,
  ): Promise<{ optimizedPrompt: string; evaluation: StepEvaluation }> {
    this.logger.log(`Optimizing prompt (iteration ${iteration})...`);

    const systemPrompt = `
      You are an expert prompt engineer. Your task is to optimize a prompt based on test cases.
      
      The prompt is used in a conversational AI system where:
      1. The user provides some input
      2. The AI responds based on the prompt
      3. The conversation continues until all required information is collected
      
      Your goal is to improve the prompt so that:
      1. The AI correctly understands the user's intent
      2. The AI asks for any missing information in a natural, conversational way
      3. The AI provides the expected output format when all information is collected
      
      Analyze the test cases to identify patterns and issues with the current prompt.
      Then, provide an improved version of the prompt that addresses these issues.
    `;

    const userPrompt = `
      Global Context: ${globalPrompt}
      
      Original Prompt: 
      ${promptToOptimize}
      
      Test Cases:
      ${JSON.stringify(testCases, null, 2)}
      
      
       Please optimize the prompt to better handle these test cases. The prompt should guide the assistant to:
       1. Identify missing information
       2. Ask for missing information in a conversational way
       3. Confirm all details before finalizing
       4. Output a JSON object with all parameters when confirmed
       
       Also provide an evaluation of the current prompt with:
       1. Pass rate (percentage of test cases handled correctly)
       2. List of improvements made in this iteration
       3. List of remaining issues to address
       
       Format your response as:
       
       EVALUATION:
       {
         "passRate": 70,
         "improvements": ["Improved handling of partial information", "Better confirmation step"],
         "issues": ["Doesn't handle ambiguous inputs well"]
       }
       
       OPTIMIZED_PROMPT:
       Your optimized prompt here...
    `;

    const response = await this.aiService.getCompletion(
      systemPrompt,
      userPrompt,
    );

    // Extract evaluation and optimized prompt from response
    let evaluation: StepEvaluation = {
      passRate: 0,
      improvements: [],
      issues: [],
    };

    let optimizedPrompt = promptToOptimize;

    try {
      // Extract evaluation JSON
      if (
        response.includes('EVALUATION:') &&
        response.includes('OPTIMIZED_PROMPT:')
      ) {
        const evaluationText = response
          .substring(
            response.indexOf('EVALUATION:') + 11,
            response.indexOf('OPTIMIZED_PROMPT:'),
          )
          .trim();

        // Find JSON object in evaluation text
        const jsonMatch = evaluationText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          evaluation = JSON.parse(jsonMatch[0]);
        }

        // Extract optimized prompt
        optimizedPrompt = response
          .substring(response.indexOf('OPTIMIZED_PROMPT:') + 17)
          .trim();
      } else {
        // Fallback if format is not followed
        optimizedPrompt = response;
      }
    } catch (error) {
      this.logger.warn(`Failed to parse evaluation: ${error.message}`);
      optimizedPrompt = response;
    }

    return { optimizedPrompt, evaluation };
  }

  /**
   * Evaluates if the optimized prompt is better than the original
   * @param globalPrompt The global context prompt
   * @param originalPrompt The original prompt
   * @param optimizedPrompt The optimized prompt
   * @param testCases The test cases to evaluate against
   * @returns Whether the agents agree the optimized prompt is better
   */
  public async evaluateOptimization(
    globalPrompt: string,
    originalPrompt: string,
    optimizedPrompt: string,
    testCases: TestCase[],
  ): Promise<boolean> {
    const systemPrompt = `
      You are an impartial judge evaluating prompt quality. Compare the original and 
      optimized prompts based on how well they would handle the provided test cases.
      
      Consider clarity, specificity, robustness, and effectiveness.
    `;

    const userPrompt = `
      Global Context: ${globalPrompt}
      
      Original Prompt: ${originalPrompt}
      
      Optimized Prompt: ${optimizedPrompt}
      
      Test Cases:
      ${JSON.stringify(testCases, null, 2)}
      
      Is the optimized prompt better than the original? Answer with ONLY "yes" or "no".
    `;

    const response = await this.aiService.getCompletion(
      systemPrompt,
      userPrompt,
    );
    return response.toLowerCase().trim() === 'yes';
  }
}
