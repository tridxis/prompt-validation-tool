import { Module } from '@nestjs/common';
import { AiService } from './services/ai.service';
import { ConfigService } from './services/config.service';

@Module({
  providers: [AiService, ConfigService],
  exports: [AiService, ConfigService],
})
export class SharedModule {}
