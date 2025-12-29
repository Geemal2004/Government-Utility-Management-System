import { ApiProperty } from '@nestjs/swagger';

/**
 * Employee data included in login response (excludes sensitive fields)
 */
export class LoginEmployeeDto {
  @ApiProperty({ description: 'Employee ID', example: 1 })
  employeeId: number;

  @ApiProperty({ description: 'First name', example: 'John' })
  firstName: string;

  @ApiProperty({ description: 'Middle name', example: 'Michael', nullable: true })
  middleName: string | null;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  lastName: string;

  @ApiProperty({ description: 'Full name', example: 'John Michael Doe' })
  fullName: string;

  @ApiProperty({ description: 'Employee number', example: 'EMP001' })
  employeeNo: string;

  @ApiProperty({ description: 'Job designation', example: 'Senior Engineer' })
  designation: string;

  @ApiProperty({ description: 'Role in the system', example: 'Manager' })
  role: string;

  @ApiProperty({ description: 'Department ID', example: 1 })
  departmentId: number;

  @ApiProperty({ description: 'Email address', example: 'john.doe@utility.gov' })
  email: string;

  @ApiProperty({ description: 'Username', example: 'johndoe' })
  username: string;
}

/**
 * DTO for login response
 */
export class LoginResponseDto {
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
    description: 'Authenticated employee data',
    type: LoginEmployeeDto,
  })
  employee: LoginEmployeeDto;
}
