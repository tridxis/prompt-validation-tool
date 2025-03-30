import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@nestjs/common';

const logger = new Logger('FileUtils');

/**
 * Reads a prompt from a file
 * @param filePath Path to the prompt file
 * @param defaultPrompt Default prompt to use if file is not found
 * @returns The prompt from the file or the default prompt
 */
export function readPromptFromFile(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw Error(`Prompt file not found: ${filePath}`);
  }

  const prompt = fs.readFileSync(filePath, 'utf8');
  logger.log(`Loaded prompt from ${filePath}`);
  return prompt;
}

/**
 * Gets the absolute path to a file in the input directory
 * @param filename The name of the file
 * @returns The absolute path to the file
 */
export function getInputFilePath(filename: string): string {
  return path.join(process.cwd(), 'input', filename);
}
