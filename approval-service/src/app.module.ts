import { Module } from '@nestjs/common';
import { ApprovalsModule } from './approvals/approvals.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, ApprovalsModule],
})
export class AppModule {}
