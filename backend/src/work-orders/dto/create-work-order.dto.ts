import {
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsString,
  IsArray,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkOrderStatus } from '../../database/entities/work-order.entity';

/**
 * DTO for creating a work order
 */
export class CreateWorkOrderDto {
  @ApiProperty({ description: 'Opened timestamp', example: '2024-01-15T10:00:00Z' })
  @IsNotEmpty()
  @IsDateString()
  openedTs: string;

  @ApiPropertyOptional({ description: 'Scheduled start timestamp' })
  @IsOptional()
  @IsDateString()
  scheduledStartTs?: string;

  @ApiPropertyOptional({ description: 'Scheduled end timestamp' })
  @IsOptional()
  @IsDateString()
  scheduledEndTs?: string;

  @ApiProperty({ 
    description: 'Work order status', 
    enum: WorkOrderStatus,
    example: WorkOrderStatus.OPEN 
  })
  @IsNotEmpty()
  @IsEnum(WorkOrderStatus)
  workOrderStatus: WorkOrderStatus;

  @ApiPropertyOptional({ description: 'Resolution notes', maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  resolutionNotes?: string;

  @ApiPropertyOptional({ description: 'Asset ID' })
  @IsOptional()
  @IsNumber()
  assetId?: number;

  @ApiPropertyOptional({ description: 'Maintenance request ID' })
  @IsOptional()
  @IsNumber()
  requestId?: number;

  @ApiProperty({ description: 'Geographic area ID' })
  @IsNotEmpty()
  @IsNumber()
  geoAreaId: number;

  @ApiPropertyOptional({ description: 'Employee IDs to assign', type: [Number] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  assignedEmployeeIds?: number[];
}
