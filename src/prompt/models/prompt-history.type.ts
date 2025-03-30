import { TestCase } from '../../core/models/optimization-result.type';

export interface PromptHistory {
  readonly id: string;
  readonly globalPrompt: string;
  readonly originalPrompt: string;
  readonly iterations: PromptIteration[];
  readonly finalPrompt: string;
  readonly createdAt: Date;
  readonly completedAt?: Date | null;
}

export interface PromptIteration {
  readonly iterationNumber: number;
  readonly prompt: string;
  readonly testCases: TestCase[];
  readonly timestamp: Date;
}
