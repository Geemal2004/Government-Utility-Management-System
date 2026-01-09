import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetStatus } from '../../database/entities/asset.entity';

/**
 * DTO for asset response
 */
export class AssetResponseDto {
  @ApiProperty({ description: 'Asset ID' })
  assetId: number;

  @ApiProperty({ description: 'Asset name' })
  name: string;

  @ApiProperty({ description: 'Asset type' })
  assetType: string;

  @ApiProperty({ description: 'Asset status', enum: AssetStatus })
  status: AssetStatus;

  @ApiProperty({ description: 'Utility type ID' })
  utilityTypeId: number;

  @ApiPropertyOptional({ description: 'Utility type details' })
  utilityType?: {
    utilityTypeId: number;
    code: string;
    name: string;
  };

  @ApiPropertyOptional({ description: 'Total work orders count' })
  totalWorkOrders?: number;

  @ApiPropertyOptional({ description: 'Last maintenance date' })
  lastMaintenanceDate?: Date;
}
