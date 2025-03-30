import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TestCaseOptions {
  @IsOptional()
  exampleTestCases?: any;

  @IsOptional()
  @IsString()
  testCasePrompt?: string;
}

export class OptimizePromptDto {
  @IsString()
  @IsNotEmpty()
  public readonly globalPrompt: string;

  @IsString()
  @IsNotEmpty()
  public readonly promptToOptimize: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TestCaseOptions)
  public readonly testCaseOptions?: TestCaseOptions;
}
