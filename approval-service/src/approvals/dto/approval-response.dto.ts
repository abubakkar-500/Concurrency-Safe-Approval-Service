import { ApprovalRequest, ApprovalStatus } from '@prisma/client';

export class ApprovalResponseDto {
  id: string;
  title: string;
  status: ApprovalStatus;
  version: number;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: ApprovalRequest): ApprovalResponseDto {
    return {
      id: entity.id,
      title: entity.title,
      status: entity.status,
      version: entity.version,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
