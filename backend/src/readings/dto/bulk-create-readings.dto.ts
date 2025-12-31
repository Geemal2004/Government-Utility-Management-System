import { IsArray, IsBoolean, IsOptional, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateMeterReadingDto } from './create-meter-reading.dto';

/**
 * DTO for bulk creating meter readings
 * Used for batch uploads from mobile devices or smart meter imports
 */
export class BulkCreateReadingsDto {
  @ApiProperty({
    description: 'Array of meter readings to create',
    type: [CreateMeterReadingDto],
  })
  @IsArray({ message: 'Readings must be an array' })
  @ArrayMinSize(1, { message: 'At least one reading is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateMeterReadingDto)
  readings: CreateMeterReadingDto[];

  @ApiPropertyOptional({
    description: 'Whether to validate all readings before saving any',
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'validateAll must be a boolean' })
  validateAll?: boolean = true;
}
