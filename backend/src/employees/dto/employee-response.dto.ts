import { ApiProperty } from '@nestjs/swagger';
import { Employee } from '../../database/entities/employee.entity';

/**
 * DTO for employee response (excludes sensitive data like password)
 */
export class EmployeeResponseDto {
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

  @ApiProperty({ description: 'Username for login', example: 'johndoe' })
  username: string;

  @ApiProperty({
    description: 'Last login timestamp',
    example: '2024-01-15T10:30:00Z',
    nullable: true,
  })
  lastLoginAt: Date | null;

  /**
   * Convert Employee entity to EmployeeResponseDto
   */
  static fromEntity(employee: Employee): EmployeeResponseDto {
    const dto = new EmployeeResponseDto();
    dto.employeeId = employee.employeeId;
    dto.firstName = employee.firstName;
    dto.middleName = employee.middleName;
    dto.lastName = employee.lastName;
    dto.fullName = employee.fullName;
    dto.employeeNo = employee.employeeNo;
    dto.designation = employee.designation;
    dto.role = employee.role;
    dto.departmentId = employee.departmentId;
    dto.email = employee.email;
    dto.username = employee.username;
    dto.lastLoginAt = employee.lastLoginAt;
    return dto;
  }
}
