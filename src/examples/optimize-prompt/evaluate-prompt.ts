import * as fs from 'fs';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { OptimizePromptService } from './optimize-prompt.service';
import { PromptEvaluatorService } from '../../agent/services/prompt-evaluator.service';

async function evaluatePrompt(): Promise<void> {
  // Create a NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    // Get the services from the application context
    const orderPlacementService = app.get(OptimizePromptService);
    const promptEvaluatorService = app.get(PromptEvaluatorService);

    console.log('Evaluating order placement prompts against test cases...');

    // Get default global prompt
    const globalPrompt = orderPlacementService.getDefaultGlobalPrompt();

    // Read test cases from file
    const outputDir = path.join(__dirname, '../../../output');
    const inputDir = path.join(__dirname, '../../../input');
    const testCasesPath = path.join(outputDir, 'test-cases.json');

    if (!fs.existsSync(testCasesPath)) {
      console.error(`Test cases file not found: ${testCasesPath}`);
      console.log(
        'Please run the optimization example first to generate test cases.',
      );
      return;
    }

    const testCases = JSON.parse(fs.readFileSync(testCasesPath, 'utf8'));

    // Read original prompt
    const originalPromptPath = path.join(inputDir, 'prompt-to-optimize.txt');
    const originalPrompt = fs.readFileSync(originalPromptPath, 'utf8');

    // Read optimized prompt
    const optimizedPromptPath = path.join(outputDir, 'optimized-prompt.txt');
    const optimizedPrompt = fs.readFileSync(optimizedPromptPath, 'utf8');

    console.log('Evaluating original prompt...');
    const originalResults = await promptEvaluatorService.evaluatePrompt(
      globalPrompt,
      originalPrompt,
      testCases,
    );

    console.log('Evaluating optimized prompt...');
    const optimizedResults = await promptEvaluatorService.evaluatePrompt(
      globalPrompt,
      optimizedPrompt,
      testCases,
    );

    // Write evaluation results to file
    const evaluationResultsPath = path.join(
      outputDir,
      'evaluation-results.json',
    );
    fs.writeFileSync(
      evaluationResultsPath,
      JSON.stringify(
        {
          original: {
            prompt: originalPrompt,
            results: originalResults,
          },
          optimized: {
            prompt: optimizedPrompt,
            results: optimizedResults,
          },
        },
        null,
        2,
      ),
      'utf8',
    );

    // Print summary
    console.log('\nEvaluation Results:');
    console.log('-------------------');
    console.log(
      `Original Prompt Pass Rate: ${(originalResults.passRate * 100).toFixed(2)}%`,
    );
    console.log(
      `Optimized Prompt Pass Rate: ${(optimizedResults.passRate * 100).toFixed(2)}%`,
    );
    console.log(
      `Improvement: ${((optimizedResults.passRate - originalResults.passRate) * 100).toFixed(2)}%`,
    );
    console.log('\nDetailed results written to:', evaluationResultsPath);
  } catch (error) {
    console.error('Error evaluating prompts:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  } finally {
    // Close the application context
    await app.close();
  }
}

// Run the evaluation
evaluatePrompt().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
