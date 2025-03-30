import * as fs from 'fs';
import * as path from 'path';
import { OptimizationStep } from '../../core/models/optimization-result.type';

function viewOptimizationHistory(): void {
  try {
    // Get the optimization steps directory
    const stepsDir = path.join(process.cwd(), 'output', 'optimization-steps');

    if (!fs.existsSync(stepsDir)) {
      console.log('No optimization history found.');
      return;
    }

    // Get all step files
    const stepFiles = fs
      .readdirSync(stepsDir)
      .filter((file) => file.startsWith('step-') && file.endsWith('.json'))
      .sort((a, b) => {
        // Sort by iteration number
        const iterationA = parseInt(a.split('-')[1]);
        const iterationB = parseInt(b.split('-')[1]);
        return iterationA - iterationB;
      });

    if (stepFiles.length === 0) {
      console.log('No optimization steps found.');
      return;
    }

    console.log(`Found ${stepFiles.length} optimization steps:\n`);

    // Display each step
    for (const file of stepFiles) {
      const filePath = path.join(stepsDir, file);
      const stepData = JSON.parse(
        fs.readFileSync(filePath, 'utf8'),
      ) as OptimizationStep;

      console.log(
        `=== Iteration ${stepData.iteration} (${new Date(stepData.timestamp).toLocaleString()}) ===`,
      );
      console.log(`Pass Rate: ${stepData.evaluation.passRate}%`);

      console.log('\nImprovements:');
      stepData.evaluation.improvements.forEach((improvement) => {
        console.log(`- ${improvement}`);
      });

      console.log('\nRemaining Issues:');
      stepData.evaluation.issues.forEach((issue) => {
        console.log(`- ${issue}`);
      });

      console.log('\nPrompt:');
      console.log('-----------------------------------');
      console.log(stepData.prompt);
      console.log('-----------------------------------\n');
    }

    console.log('To test the latest optimized prompt, run:');
    console.log('npm run example:test-conversation');
  } catch (error) {
    console.error('Error viewing optimization history:', error.message);
  }
}

// Run the function
viewOptimizationHistory();
