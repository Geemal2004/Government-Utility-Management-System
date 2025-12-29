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
