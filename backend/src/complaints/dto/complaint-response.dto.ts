import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ComplaintStatus } from '../../database/entities/complaint.entity';

export class ComplaintResponseDto {
  @ApiProperty()
  complaintId: number;

  @ApiProperty()
  customerId: number;

  @ApiPropertyOptional()
  assignedEmployeeId?: number;

  @ApiProperty()
  complaintType: string;

  @ApiProperty()
  createdDate: Date;

  @ApiPropertyOptional()
  resolvedDate?: Date;

  @ApiProperty({ enum: ComplaintStatus })
  status: ComplaintStatus;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional()
  customer?: any;

  @ApiPropertyOptional()
  assignedEmployee?: any;

  @ApiPropertyOptional()
  resolutionTimeHours?: number;
}
