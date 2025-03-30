import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { AiService } from '../../shared/services/ai.service';

async function testOpenAI(): Promise<void> {
  // Create a NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    // Get the AiService from the application context
    const aiService = app.get(AiService);

    console.log('Testing OpenAI integration...');

    // Simple test prompt
    const systemPrompt = 'You are a helpful assistant.';
    const userPrompt = 'Write a short poem about AI prompt optimization.';

    console.log('System prompt:', systemPrompt);
    console.log('User prompt:', userPrompt);
    console.log('Waiting for OpenAI response...');

    // Get completion from OpenAI
    const response = await aiService.getCompletion(systemPrompt, userPrompt);

    console.log('\nOpenAI Response:');
    console.log('----------------');
    console.log(response);
    console.log('----------------');

    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error testing OpenAI integration:', error.message);
  } finally {
    // Close the application context
    await app.close();
  }
}

// Run the test
testOpenAI().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
