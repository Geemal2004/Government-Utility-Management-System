import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Customer } from '../../database/entities/customer.entity';

/**
 * DTO for customer address in response
 */
export class CustomerAddressResponseDto {
  @ApiProperty({ description: 'Address ID', example: 1 })
  customerAddressId: number;

  @ApiProperty({ description: 'Postal code', example: '10100' })
  postalCode: string;

  @ApiProperty({ description: 'Address line 1', example: '123 Main Street' })
  line1: string;
}

/**
 * DTO for customer response (excludes sensitive data like password)
 */
export class CustomerResponseDto {
  @ApiProperty({ description: 'Customer ID', example: 1 })
  customerId: number;

  @ApiProperty({ description: 'First name', example: 'John' })
  firstName: string;

  @ApiPropertyOptional({ description: 'Middle name', example: 'William' })
  middleName: string | null;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  lastName: string;

  @ApiProperty({ description: 'Full name', example: 'John William Doe' })
  fullName: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'john.doe@example.com',
  })
  email: string | null;

  @ApiProperty({ description: 'Customer type', example: 'RESIDENTIAL' })
  customerType: string;

  @ApiProperty({
    description: 'Registration date',
    example: '2024-01-15',
  })
  registrationDate: Date;

  @ApiProperty({ description: 'Identity type', example: 'NIC' })
  identityType: string;

  @ApiProperty({ description: 'Identity reference', example: '123456789V' })
  identityRef: string;

  @ApiPropertyOptional({ description: 'Tariff category ID', example: 1 })
  tariffCategoryId: number | null;

  @ApiPropertyOptional({ description: 'Registered by employee ID', example: 1 })
  employeeId: number | null;

  @ApiProperty({ description: 'Customer address', type: CustomerAddressResponseDto })
  address: CustomerAddressResponseDto;

  @ApiProperty({
    description: 'Phone numbers',
    type: [String],
    example: ['+1234567890'],
  })
  phoneNumbers: string[];

  /**
   * Convert Customer entity to CustomerResponseDto
   */
  static fromEntity(customer: Customer): CustomerResponseDto {
    const dto = new CustomerResponseDto();
    dto.customerId = customer.customerId;
    dto.firstName = customer.firstName;
    dto.middleName = customer.middleName;
    dto.lastName = customer.lastName;
    dto.fullName = customer.fullName;
    dto.email = customer.email;
    dto.customerType = customer.customerType;
    dto.registrationDate = customer.registrationDate;
    dto.identityType = customer.identityType;
    dto.identityRef = customer.identityRef;
    dto.tariffCategoryId = customer.tariffCategoryId;
    dto.employeeId = customer.employeeId;

    if (customer.address) {
      dto.address = {
        customerAddressId: customer.address.customerAddressId,
        postalCode: customer.address.postalCode,
        line1: customer.address.line1,
      };
    }

    dto.phoneNumbers = customer.phoneNumbers?.map((p) => p.phone) || [];

    return dto;
  }
}
