import * as readline from 'readline';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { ConversationService } from './conversation.service';
import { OptimizePromptService } from './optimize-prompt.service';
import * as fs from 'fs';
import * as path from 'path';

async function testConversation(): Promise<void> {
  // Create a NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    // Get the services from the application context
    const conversationService = app.get(ConversationService);
    const optimizePromptService = app.get(OptimizePromptService);

    const globalPrompt = optimizePromptService.getDefaultGlobalPrompt();

    // Get the optimized prompt
    let optimizedPrompt: string;
    const optimizedPromptPath = path.join(
      __dirname,
      '../../../output/optimized-prompt.txt',
    );

    if (fs.existsSync(optimizedPromptPath)) {
      optimizedPrompt = fs.readFileSync(optimizedPromptPath, 'utf8');
      console.log('Using optimized prompt from file.');
    } else {
      optimizedPrompt = optimizePromptService.getDefaultPrompt();
      console.log('Using default prompt (no optimized prompt found).');
    }

    // Create readline interface
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Start conversation
    const conversationId = conversationService.startConversation();
    console.log(`Started conversation with ID: ${conversationId}`);
    console.log('\nEnter your request (or type "exit" to quit):');

    // Handle user input
    const askQuestion = () => {
      rl.question('> ', async (message) => {
        if (message.toLowerCase() === 'exit') {
          console.log('Exiting...');
          rl.close();
          await app.close();
          process.exit(0);
          return;
        }

        try {
          const result = await conversationService.sendMessage(
            conversationId,
            message,
            globalPrompt,
            optimizedPrompt,
          );

          console.log(`\nAssistant: ${result.response}`);

          if (result.isComplete) {
            console.log('\nOrder parameters extracted:');
            console.log(JSON.stringify(result.parameters, null, 2));
            console.log('\nConversation complete. Starting a new one...');

            // Start a new conversation
            const newConversationId = conversationService.startConversation();
            console.log(
              `Started new conversation with ID: ${newConversationId}`,
            );
          }

          console.log('\nEnter your request (or type "exit" to quit):');
          askQuestion();
        } catch (error) {
          console.error('Error:', error.message);
          askQuestion();
        }
      });
    };

    askQuestion();
  } catch (error) {
    console.error('Error:', error.message);
    await app.close();
    process.exit(1);
  }
}

// Run the test
testConversation().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
