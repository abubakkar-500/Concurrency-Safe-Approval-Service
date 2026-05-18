import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateApprovalDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;
}
