import { Module } from '@nestjs/common';
import { OptimizationService } from './services/optimization.service';
import { OptimizationController } from './controllers/optimization.controller';
import { AgentModule } from '../agent/agent.module';
import { PromptModule } from '../prompt/prompt.module';

@Module({
  imports: [AgentModule, PromptModule],
  providers: [OptimizationService],
  controllers: [OptimizationController],
  exports: [OptimizationService],
})
export class CoreModule {}
