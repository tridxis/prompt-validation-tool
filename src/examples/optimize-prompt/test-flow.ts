import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { OptimizePromptService } from './optimize-prompt.service';
import { ConversationService } from './conversation.service';
import * as fs from 'fs';
import * as path from 'path';

async function testOrderPlacementFlow(): Promise<void> {
  // Create a NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log('Testing flow...');

    // Get the services
    const optimizePromptService = app.get(OptimizePromptService);
    const conversationService = app.get(ConversationService);

    const globalPrompt = optimizePromptService.getDefaultGlobalPrompt();

    const testCaseOptions = optimizePromptService.getTestCaseOptions();

    // Step 1: Generate test cases and optimize prompt
    console.log('\nStep 1: Generating test cases and optimizing prompt...');
    const optimizeResult = await optimizePromptService.optimizePrompt({
      globalPrompt,
      promptToOptimize: optimizePromptService.getDefaultPrompt(),
      testCaseOptions,
    });

    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, '../../../output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write test cases to file
    const testCasesPath = path.join(outputDir, 'test-cases.json');
    fs.writeFileSync(
      testCasesPath,
      JSON.stringify(optimizeResult.testCases, null, 2),
      'utf8',
    );

    // Write optimized prompt to file
    const optimizedPromptPath = path.join(outputDir, 'optimized-prompt.txt');
    fs.writeFileSync(
      optimizedPromptPath,
      optimizeResult.optimizedPrompt,
      'utf8',
    );

    console.log(`Generated ${optimizeResult.testCases.length} test cases`);
    console.log(`Optimized prompt saved to: ${optimizedPromptPath}`);

    // Step 2: Test the optimized prompt with a sample conversation
    console.log(
      '\nStep 2: Testing optimized prompt with sample conversations...',
    );

    // Use the first test case from the generated test cases
    const testCase = optimizeResult.testCases[0];

    // Start a new conversation
    const conversationId = conversationService.startConversation();
    console.log(`Started conversation with ID: ${conversationId}`);

    // Simulate the conversation
    console.log('\nSimulating conversation:');

    for (let i = 0; i < testCase.conversation.length; i += 2) {
      const userMessage = testCase.conversation[i].content;
      console.log(`\nUser: ${userMessage}`);

      // Send the message to the conversation service
      const result = await conversationService.sendMessage(
        conversationId,
        userMessage,
        globalPrompt,
        optimizeResult.optimizedPrompt,
      );

      console.log(`Assistant: ${result.response}`);

      // Check if the conversation is complete
      if (result.isComplete) {
        console.log('\nOrder parameters extracted:');
        console.log(JSON.stringify(result.parameters, null, 2));

        // Compare with expected parameters
        console.log('\nExpected parameters:');
        console.log(JSON.stringify(testCase.finalOutput, null, 2));

        // Check if parameters match
        const parametersMatch =
          JSON.stringify(result.parameters) ===
          JSON.stringify(testCase.finalOutput);

        console.log(`\nParameters match: ${parametersMatch ? 'Yes' : 'No'}`);
        break;
      }

      // If there's another user message in the conversation, continue
      if (i + 2 < testCase.conversation.length) {
        // Skip the assistant's message in the test case
        continue;
      }
    }

    console.log('\nTest completed successfully!');
    console.log('\nTo test the conversational flow interactively, run:');
    console.log('npm run example:test-conversation');
  } catch (error) {
    console.error('Error testing flow:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  } finally {
    await app.close();
  }
}

// Run the test
testOrderPlacementFlow().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
