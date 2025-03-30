import { Module } from '@nestjs/common';
import { OptimizePromptController } from './optimize-prompt.controller';
import { OptimizePromptService } from './optimize-prompt.service';
import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { AgentModule } from '../../agent/agent.module';
import { ConversationService } from './conversation.service';

@Module({
  imports: [CoreModule, SharedModule, AgentModule],
  controllers: [OptimizePromptController],
  providers: [OptimizePromptService, ConversationService],
})
export class OptimizePromptModule {}
