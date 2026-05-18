import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApprovalStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalResponseDto } from './dto/approval-response.dto';
import { CreateApprovalDto } from './dto/create-approval.dto';

@Injectable()
export class ApprovalsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateApprovalDto): Promise<ApprovalResponseDto> {
    const request = await this.prisma.approvalRequest.create({
      data: { title: dto.title },
    });
    return ApprovalResponseDto.fromEntity(request);
  }

  async findById(id: string): Promise<ApprovalResponseDto> {
    const request = await this.prisma.approvalRequest.findUnique({
      where: { id },
    });
    if (!request) {
      throw new NotFoundException(`Approval request ${id} not found`);
    }
    return ApprovalResponseDto.fromEntity(request);
  }

  async approve(id: string): Promise<ApprovalResponseDto> {
    return this.transition(id, ApprovalStatus.APPROVED);
  }

  async reject(id: string): Promise<ApprovalResponseDto> {
    return this.transition(id, ApprovalStatus.REJECTED);
  }

  private async transition(
    id: string,
    targetStatus: ApprovalStatus,
  ): Promise<ApprovalResponseDto> {
    const result = await this.prisma.approvalRequest.updateMany({
      where: { id, status: ApprovalStatus.PENDING },
      data: {
        status: targetStatus,
        version: { increment: 1 },
      },
    });

    if (result.count === 0) {
      const existing = await this.prisma.approvalRequest.findUnique({
        where: { id },
      });
      if (!existing) {
        throw new NotFoundException(`Approval request ${id} not found`);
      }
      throw new ConflictException(
        'Request is not pending or was already processed',
      );
    }

    const updated = await this.prisma.approvalRequest.findUniqueOrThrow({
      where: { id },
    });
    return ApprovalResponseDto.fromEntity(updated);
  }
}
