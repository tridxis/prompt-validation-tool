import * as fs from 'fs';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { OptimizePromptService } from './optimize-prompt.service';
import { OptimizePromptDto } from '../../core/models/optimize-prompt.dto';

async function runOrderPlacementExample(): Promise<void> {
  // Create a NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    // Get the OrderPlacementService from the application context
    const optimizePromptService = app.get(OptimizePromptService);

    console.log('Running order placement example...');

    const globalPrompt = optimizePromptService.getDefaultGlobalPrompt();
    const promptToOptimize = optimizePromptService.getDefaultPrompt();
    const testCaseOptions = optimizePromptService.getTestCaseOptions();

    if (!globalPrompt || !promptToOptimize || !testCaseOptions) {
      throw new Error('No prompt found');
    }

    // Create the DTO with default prompts
    const optimizePromptDto: OptimizePromptDto = {
      globalPrompt,
      promptToOptimize,
      testCaseOptions,
      // No need to specify testCaseOptions here, they will be added by the OrderPlacementService
    };

    // Optimize the prompt
    const result =
      await optimizePromptService.optimizePrompt(optimizePromptDto);

    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, '../../../output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write test cases to file
    const testCasesPath = path.join(outputDir, 'test-cases.json');
    fs.writeFileSync(
      testCasesPath,
      JSON.stringify(result.testCases, null, 2),
      'utf8',
    );

    // Write optimized prompt to file
    const optimizedPromptPath = path.join(outputDir, 'optimized-prompt.txt');
    fs.writeFileSync(optimizedPromptPath, result.optimizedPrompt, 'utf8');

    console.log(`Test cases written to: ${testCasesPath}`);
    console.log(`Optimized prompt written to: ${optimizedPromptPath}`);
    console.log('\nOptimization complete!');
    console.log('\nTo test the conversational flow, run:');
    console.log('npm run example:test-conversation');
  } catch (error) {
    console.error('Error optimizing prompt:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  } finally {
    // Close the application context
    await app.close();
  }
}

// Run the example
runOrderPlacementExample().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
