import { Body, Controller, Post } from '@nestjs/common';
import { OptimizationService } from '../services/optimization.service';
import { OptimizePromptDto } from '../models/optimize-prompt.dto';
import { OptimizationResult } from '../models/optimization-result.type';

@Controller('optimize')
export class OptimizationController {
  constructor(private readonly optimizationService: OptimizationService) {}

  /**
   * Optimizes a prompt using the two-agent approach
   * @param optimizePromptDto The DTO containing the global prompt and the prompt to optimize
   * @returns The optimization result with the improved prompt
   */
  @Post()
  public async optimizePrompt(
    @Body() optimizePromptDto: OptimizePromptDto,
  ): Promise<OptimizationResult> {
    const result =
      await this.optimizationService.optimizePrompt(optimizePromptDto);
    return result;
  }

  /**
   * Simple test endpoint for health checking
   * @returns A success message
   */
  @Post('test')
  public async test(): Promise<{ status: string }> {
    const status = { status: 'Optimization service is running' };
    return status;
  }
}
