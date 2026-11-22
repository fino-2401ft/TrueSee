import { Global, Module } from '@nestjs/common';
import { DatabaseStartupCheck } from './database-startup.check.js';
import { PrismaService } from './prisma.service.js';

@Global()
@Module({
  providers: [PrismaService, DatabaseStartupCheck],
  exports: [PrismaService],
})
export class DatabaseModule {}
