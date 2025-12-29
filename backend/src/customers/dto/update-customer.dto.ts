import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateCustomerDto } from './create-customer.dto';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating an existing customer
 * All fields are optional except password which is handled separately
 */
export class UpdateCustomerDto extends PartialType(
  OmitType(CreateCustomerDto, ['password', 'identityRef'] as const),
) {
  @ApiPropertyOptional({
    description: 'New password (min 6 characters)',
    example: 'newSecurePassword123',
    minLength: 6,
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password?: string;
}
