import { ApiProperty } from '@nestjs/swagger';

/**
 * Customer info DTO for login response
 */
export class CustomerInfoDto {
    @ApiProperty({ example: 1 })
    customerId: number;

    @ApiProperty({ example: 'John' })
    firstName: string;

    @ApiProperty({ example: 'M', nullable: true })
    middleName: string | null;

    @ApiProperty({ example: 'Doe' })
    lastName: string;

    @ApiProperty({ example: 'John M Doe' })
    fullName: string;

    @ApiProperty({ example: 'customer@example.com', nullable: true })
    email: string | null;

    @ApiProperty({ example: 'RESIDENTIAL' })
    customerType: string;
}

/**
 * DTO for customer login response
 */
export class CustomerLoginResponseDto {
    @ApiProperty({
        description: 'JWT access token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    accessToken: string;

    @ApiProperty({
        description: 'Token type',
        example: 'Bearer',
    })
    tokenType: string;

    @ApiProperty({
        description: 'Customer information',
        type: CustomerInfoDto,
    })
    customer: CustomerInfoDto;
}
