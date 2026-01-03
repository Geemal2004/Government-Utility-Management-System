import { IsOptional, IsNumber, IsEnum, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReadingSourceDto } from './create-meter-reading.dto';

/**
 * Sort order enum
 */
export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

/**
 * DTO for filtering and paginating meter readings
 */
export class ReadingFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by meter ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Meter ID must be a number' })
  @Type(() => Number)
  meterId?: number;

  @ApiPropertyOptional({
    description: 'Filter by meter reader (employee) ID',
    example: 5,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Meter reader ID must be a number' })
  @Type(() => Number)
  meterReaderId?: number;

  @ApiPropertyOptional({
    description: 'Filter by reading source',
    enum: ReadingSourceDto,
  })
  @IsOptional()
  @IsEnum(ReadingSourceDto, {
    message: `Reading source must be one of: ${Object.values(ReadingSourceDto).join(', ')}`,
  })
  readingSource?: ReadingSourceDto;

  @ApiPropertyOptional({
    description: 'Filter readings from this date',
    example: '2025-01-01',
  })
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'Filter readings up to this date',
    example: '2025-12-31',
  })
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit must not exceed 100' })
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    default: 'readingDate',
    example: 'readingDate',
  })
  @IsOptional()
  @IsString({ message: 'sortBy must be a string' })
  sortBy?: string = 'readingDate';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder, { message: 'Order must be ASC or DESC' })
  order?: SortOrder = SortOrder.DESC;
}
