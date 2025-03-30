import { IsString, IsOptional } from 'class-validator';

export class OptimizePromptDto {
  @IsString()
  @IsOptional()
  public readonly globalPrompt?: string;

  @IsString()
  @IsOptional()
  public readonly promptToOptimize?: string;
}
