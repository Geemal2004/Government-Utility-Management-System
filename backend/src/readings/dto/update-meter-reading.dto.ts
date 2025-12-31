import { IsOptional, IsNumber, IsEnum, IsString, Min, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Reading source enum for updates (includes CORRECTED)
 */
export enum UpdateReadingSourceDto {
  MANUAL = 'MANUAL',
  SMART_METER = 'SMART_METER',
  ESTIMATED = 'ESTIMATED',
  CORRECTED = 'CORRECTED',
}

/**
 * DTO for updating an existing meter reading
 * All fields are optional
 */
export class UpdateMeterReadingDto {
  @ApiPropertyOptional({
    description: 'Updated import reading value',
    example: 12550.75,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Import reading must be a number' })
  @Min(0, { message: 'Import reading must be non-negative' })
  importReading?: number;

  @ApiPropertyOptional({
    description: 'Updated export reading value',
    example: 525.0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Export reading must be a number' })
  @Min(0, { message: 'Export reading must be non-negative' })
  exportReading?: number;

  @ApiPropertyOptional({
    description: 'Updated reading source (use CORRECTED for corrections)',
    enum: UpdateReadingSourceDto,
    example: UpdateReadingSourceDto.CORRECTED,
  })
  @IsOptional()
  @IsEnum(UpdateReadingSourceDto, {
    message: `Reading source must be one of: ${Object.values(UpdateReadingSourceDto).join(', ')}`,
  })
  readingSource?: UpdateReadingSourceDto;

  @ApiPropertyOptional({
    description: 'Updated notes',
    example: 'Corrected after verification',
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(500, { message: 'Notes must not exceed 500 characters' })
  notes?: string;
}
