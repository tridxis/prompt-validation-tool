import { Module } from '@nestjs/common';
import { PromptService } from './services/prompt.service';

@Module({
  providers: [PromptService],
  exports: [PromptService],
})
export class PromptModule {}
