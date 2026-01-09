import { IsNotEmpty, IsString, IsEnum, IsNumber, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AssetStatus } from '../../database/entities/asset.entity';

/**
 * DTO for creating an asset
 */
export class CreateAssetDto {
  @ApiProperty({ description: 'Asset name', example: 'Transformer Station A1', maxLength: 150 })
  @IsNotEmpty({ message: 'Asset name is required' })
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiProperty({ description: 'Asset type', example: 'TRANSFORMER', maxLength: 50 })
  @IsNotEmpty({ message: 'Asset type is required' })
  @IsString()
  @MaxLength(50)
  assetType: string;

  @ApiProperty({ 
    description: 'Asset status', 
    enum: AssetStatus,
    example: AssetStatus.ACTIVE 
  })
  @IsNotEmpty({ message: 'Asset status is required' })
  @IsEnum(AssetStatus)
  status: AssetStatus;

  @ApiProperty({ description: 'Utility type ID', example: 1 })
  @IsNotEmpty({ message: 'Utility type ID is required' })
  @IsNumber()
  utilityTypeId: number;
}
