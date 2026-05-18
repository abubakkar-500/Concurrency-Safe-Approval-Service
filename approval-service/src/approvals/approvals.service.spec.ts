import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApprovalStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalsService } from './approvals.service';

describe('ApprovalsService', () => {
  let service: ApprovalsService;

  const prisma = {
    approvalRequest: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ApprovalsService);
    jest.clearAllMocks();
  });

  it('creates a pending approval request', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    prisma.approvalRequest.create.mockResolvedValue({
      id: '11111111-1111-1111-1111-111111111111',
      title: 'Budget',
      status: ApprovalStatus.PENDING,
      version: 1,
      createdAt,
      updatedAt: createdAt,
    });

    const result = await service.create({ title: 'Budget' });

    expect(result.status).toBe(ApprovalStatus.PENDING);
    expect(result.version).toBe(1);
  });

  it('throws NotFoundException when request does not exist', async () => {
    prisma.approvalRequest.findUnique.mockResolvedValue(null);

    await expect(
      service.findById('11111111-1111-1111-1111-111111111111'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('approves a pending request', async () => {
    const id = '11111111-1111-1111-1111-111111111111';
    const updatedAt = new Date('2026-01-01T00:00:01.000Z');
    prisma.approvalRequest.updateMany.mockResolvedValue({ count: 1 });
    prisma.approvalRequest.findUniqueOrThrow.mockResolvedValue({
      id,
      title: 'Budget',
      status: ApprovalStatus.APPROVED,
      version: 2,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt,
    });

    const result = await service.approve(id);

    expect(prisma.approvalRequest.updateMany).toHaveBeenCalledWith({
      where: { id, status: ApprovalStatus.PENDING },
      data: {
        status: ApprovalStatus.APPROVED,
        version: { increment: 1 },
      },
    });
    expect(result.status).toBe(ApprovalStatus.APPROVED);
    expect(result.version).toBe(2);
  });

  it('throws ConflictException when approve loses race', async () => {
    const id = '11111111-1111-1111-1111-111111111111';
    prisma.approvalRequest.updateMany.mockResolvedValue({ count: 0 });
    prisma.approvalRequest.findUnique.mockResolvedValue({
      id,
      title: 'Budget',
      status: ApprovalStatus.APPROVED,
      version: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(service.approve(id)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('throws NotFoundException when approve targets missing request', async () => {
    const id = '11111111-1111-1111-1111-111111111111';
    prisma.approvalRequest.updateMany.mockResolvedValue({ count: 0 });
    prisma.approvalRequest.findUnique.mockResolvedValue(null);

    await expect(service.approve(id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
