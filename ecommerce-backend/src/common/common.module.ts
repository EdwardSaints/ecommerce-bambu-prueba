import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { LoggerService } from './logger/logger.service';

@Global()
@Module({
  providers: [PrismaService, LoggerService],
  exports: [PrismaService, LoggerService],
})
export class CommonModule {}
