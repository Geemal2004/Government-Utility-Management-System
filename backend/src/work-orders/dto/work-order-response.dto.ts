import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkOrderStatus } from '../../database/entities/work-order.entity';

export class WorkOrderResponseDto {
  @ApiProperty()
  workOrderId: number;

  @ApiProperty()
  openedTs: Date;

  @ApiPropertyOptional()
  scheduledStartTs?: Date;

  @ApiPropertyOptional()
  scheduledEndTs?: Date;

  @ApiPropertyOptional()
  closedTs?: Date;

  @ApiProperty({ enum: WorkOrderStatus })
  workOrderStatus: WorkOrderStatus;

  @ApiPropertyOptional()
  resolutionNotes?: string;

  @ApiPropertyOptional()
  assetId?: number;

  @ApiPropertyOptional()
  requestId?: number;

  @ApiProperty()
  geoAreaId: number;

  @ApiPropertyOptional()
  asset?: any;

  @ApiPropertyOptional()
  request?: any;

  @ApiPropertyOptional()
  geoArea?: any;

  @ApiPropertyOptional()
  totalLaborCost?: number;

  @ApiPropertyOptional()
  totalItemCost?: number;

  @ApiPropertyOptional()
  totalCost?: number;

  @ApiPropertyOptional()
  durationHours?: number;

  @ApiPropertyOptional()
  laborEntries?: any[];

  @ApiPropertyOptional()
  itemUsages?: any[];
}
