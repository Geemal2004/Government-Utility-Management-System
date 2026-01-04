import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

/**
 * DTO for customer login request
 */
export class CustomerLoginDto {
    @ApiProperty({
        description: 'Customer email or Customer ID',
        example: 'customer@example.com',
    })
    @IsString()
    @IsNotEmpty({ message: 'Email or Customer ID is required' })
    identifier: string;

    @ApiProperty({
        description: 'Customer password',
        example: 'password123',
        minLength: 6,
    })
    @IsString()
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(6, { message: 'Password must be at least 6 characters' })
    password: string;
}
