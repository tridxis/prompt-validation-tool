export interface OptimizationResult {
  readonly originalPrompt: string;
  readonly optimizedPrompt: string;
  readonly iterations: number;
  readonly testCases: TestCase[];
  readonly convergenceReason: string;
  readonly optimizationSteps?: OptimizationStep[];
}

export interface OptimizationStep {
  readonly iteration: number;
  readonly prompt: string;
  readonly evaluation: StepEvaluation;
  readonly timestamp: string;
}

export interface StepEvaluation {
  readonly passRate: number;
  readonly improvements: string[];
  readonly issues: string[];
}

export type ConversationRole = 'user' | 'assistant';

export interface Conversation {
  readonly role: ConversationRole;
  readonly content: string;
}

export interface TestCase {
  readonly input: string;
  readonly expectedOutput: string;
  readonly conversation: Conversation[];
  readonly finalOutput: Record<string, any>;
}
