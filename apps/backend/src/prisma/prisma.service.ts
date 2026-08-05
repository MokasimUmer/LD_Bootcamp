import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Prisma connected successfully to PostgreSQL database.');
    } catch (err) {
      this.logger.warn(`Prisma initial connection warning: ${err.message}. Retrying on first query.`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
