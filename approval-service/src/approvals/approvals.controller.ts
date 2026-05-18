import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { ApprovalResponseDto } from './dto/approval-response.dto';
import { CreateApprovalDto } from './dto/create-approval.dto';

@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateApprovalDto): Promise<ApprovalResponseDto> {
    return this.approvalsService.create(dto);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApprovalResponseDto> {
    return this.approvalsService.findById(id);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  approve(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApprovalResponseDto> {
    return this.approvalsService.approve(id);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApprovalResponseDto> {
    return this.approvalsService.reject(id);
  }
}
