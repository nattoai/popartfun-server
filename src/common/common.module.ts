import { Module } from '@nestjs/common';
import { CommonController } from './common.controller';
import { EmailService } from './services/email.service';

@Module({
  controllers: [CommonController],
  providers: [EmailService],
  exports: [EmailService],
})
export class CommonModule {}
