import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgentModule } from './agent/agent.module';
import { CoreModule } from './core/core.module';
import { PromptModule } from './prompt/prompt.module';
import { SharedModule } from './shared/shared.module';
import { OptimizePromptController } from './examples/optimize-prompt/optimize-prompt.controller';
import { OptimizePromptService } from './examples/optimize-prompt/optimize-prompt.service';
import { ConversationService } from './examples/optimize-prompt/conversation.service';

@Module({
  imports: [AgentModule, CoreModule, PromptModule, SharedModule],
  controllers: [AppController, OptimizePromptController],
  providers: [AppService, OptimizePromptService, ConversationService],
})
export class AppModule {}
