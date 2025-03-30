import { Module } from '@nestjs/common';
import { TestCaseGeneratorService } from './services/test-case-generator.service';
import { PromptOptimizerService } from './services/prompt-optimizer.service';
import { PromptEvaluatorService } from './services/prompt-evaluator.service';
import { ParameterExtractorService } from './services/parameter-extractor.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  providers: [
    TestCaseGeneratorService,
    PromptOptimizerService,
    PromptEvaluatorService,
    ParameterExtractorService,
  ],
  exports: [
    TestCaseGeneratorService,
    PromptOptimizerService,
    PromptEvaluatorService,
    ParameterExtractorService,
  ],
})
export class AgentModule {}
