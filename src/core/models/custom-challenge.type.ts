/**
 * Represents a custom challenge for test case generation
 */
export interface CustomChallenge {
  /**
   * The example user input for the challenge
   */
  inputExample: string;

  /**
   * Description of what makes this a challenging case
   */
  description: string;

  /**
   * Expected output parameters that should be extracted
   */
  outputExample: Record<string, any>;
}
