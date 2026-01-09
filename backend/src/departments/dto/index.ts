import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for creating a new department
 */
export class CreateDepartmentDto {
    @ApiProperty({ example: 'Billing Department', description: 'Department name' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 1, description: 'Utility type ID' })
    @IsNumber()
    @Type(() => Number)
    utilityTypeId: number;
}

/**
 * DTO for updating a department
 */
export class UpdateDepartmentDto {
    @ApiPropertyOptional({ example: 'Billing & Collections', description: 'Department name' })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({ example: 2, description: 'Utility type ID' })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    utilityTypeId?: number;
}

/**
 * Utility type info for department response
 */
export class UtilityTypeInfoDto {
    @ApiProperty({ example: 1 })
    utilityTypeId: number;

    @ApiProperty({ example: 'WATER' })
    name: string;

    @ApiProperty({ example: 'WATER' })
    code: string;
}

/**
 * DTO for department response
 */
export class DepartmentResponseDto {
    @ApiProperty({ example: 1 })
    departmentId: number;

    @ApiProperty({ example: 'Billing Department' })
    name: string;

    @ApiProperty({ example: 1 })
    utilityTypeId: number;

    @ApiPropertyOptional({ type: UtilityTypeInfoDto })
    utilityType?: UtilityTypeInfoDto;

    @ApiPropertyOptional({ example: 25, description: 'Number of employees in department' })
    employeeCount?: number;

    @ApiPropertyOptional({ example: '2024-01-15T10:30:00Z' })
    createdAt?: Date;

    @ApiPropertyOptional({ example: '2024-06-20T14:45:00Z' })
    updatedAt?: Date;
}

/**
 * Simplified employee info for department with employees response
 */
export class DepartmentEmployeeDto {
    @ApiProperty({ example: 1 })
    employeeId: number;

    @ApiProperty({ example: 'EMP001' })
    employeeNo: string;

    @ApiProperty({ example: 'John' })
    firstName: string;

    @ApiPropertyOptional({ example: 'Michael' })
    middleName?: string;

    @ApiProperty({ example: 'Doe' })
    lastName: string;

    @ApiProperty({ example: 'John Michael Doe' })
    fullName: string;

    @ApiProperty({ example: 'CASHIER' })
    role: string;

    @ApiPropertyOptional({ example: 'Senior Billing Officer' })
    designation?: string;

    @ApiProperty({ example: 'john.doe@utility.gov' })
    email: string;
}

/**
 * DTO for department with employees
 */
export class DepartmentWithEmployeesDto {
    @ApiProperty({ example: 1 })
    departmentId: number;

    @ApiProperty({ example: 'Billing Department' })
    name: string;

    @ApiProperty({ example: 1 })
    utilityTypeId: number;

    @ApiPropertyOptional({ type: UtilityTypeInfoDto })
    utilityType?: UtilityTypeInfoDto;

    @ApiProperty({ type: [DepartmentEmployeeDto] })
    employees: DepartmentEmployeeDto[];

    @ApiProperty({ example: 25 })
    employeeCount: number;
}
