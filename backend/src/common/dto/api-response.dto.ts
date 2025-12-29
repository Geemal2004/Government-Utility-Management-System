import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Standard API response wrapper DTO
 * All API responses follow this format for consistency
 */
export class ApiResponseDto<T> {
  @ApiProperty({
    description: 'Indicates if the request was successful',
    example: true,
  })
  success: boolean;

  @ApiPropertyOptional({
    description: 'Response data (varies by endpoint)',
  })
  data?: T;

  @ApiPropertyOptional({
    description: 'Success or info message',
    example: 'Operation completed successfully',
  })
  message?: string;

  @ApiPropertyOptional({
    description: 'Error message (only present when success is false)',
    example: 'Validation failed',
  })
  error?: string;
}

/**
 * Paginated response wrapper
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Array of items' })
  data: T[];

  @ApiProperty({ description: 'Total number of items', example: 100 })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Number of items per page', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 10 })
  get totalPages(): number {
    return Math.ceil(this.total / this.limit);
  }

  @ApiProperty({ description: 'Has next page', example: true })
  get hasNextPage(): boolean {
    return this.page < this.totalPages;
  }

  @ApiProperty({ description: 'Has previous page', example: false })
  get hasPreviousPage(): boolean {
    return this.page > 1;
  }
}
