import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsEmail,
    IsOptional,
    IsNumber,
    MinLength,
    IsNotEmpty,
    Min,
    Max,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Paginated response wrapper
 */
export class Paginated<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

/**
 * DTO for creating a new employee
 */
export class CreateEmployeeDto {
    @ApiProperty({ example: 'John' })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiPropertyOptional({ example: 'Michael' })
    @IsString()
    @IsOptional()
    middleName?: string;

    @ApiProperty({ example: 'Doe' })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiProperty({ example: 'john.doe@utility.gov' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'johndoe' })
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    username: string;

    @ApiProperty({ example: 'SecurePass123!' })
    @IsString()
    @MinLength(8)
    password: string;

    @ApiProperty({ example: 'CASHIER', enum: ['ADMIN', 'MANAGER', 'CASHIER', 'METER_READER', 'FIELD_OFFICER', 'ADMINISTRATIVE_STAFF'] })
    @IsString()
    @IsNotEmpty()
    role: string;

    @ApiPropertyOptional({ example: 1 })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    departmentId?: number;

    @ApiPropertyOptional({ example: 'Senior Billing Officer' })
    @IsString()
    @IsOptional()
    designation?: string;

    @ApiPropertyOptional({ example: '+94771234567' })
    @IsString()
    @IsOptional()
    phone?: string;
}

/**
 * DTO for updating employee details
 */
export class UpdateEmployeeDto {
    @ApiPropertyOptional({ example: 'John' })
    @IsString()
    @IsOptional()
    firstName?: string;

    @ApiPropertyOptional({ example: 'Michael' })
    @IsString()
    @IsOptional()
    middleName?: string;

    @ApiPropertyOptional({ example: 'Doe' })
    @IsString()
    @IsOptional()
    lastName?: string;

    @ApiPropertyOptional({ example: 'john.doe@utility.gov' })
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiPropertyOptional({ example: 'johndoe' })
    @IsString()
    @IsOptional()
    username?: string;

    @ApiPropertyOptional({ example: 'CASHIER', enum: ['ADMIN', 'MANAGER', 'CASHIER', 'METER_READER', 'FIELD_OFFICER', 'ADMINISTRATIVE_STAFF'] })
    @IsString()
    @IsOptional()
    role?: string;

    @ApiPropertyOptional({ example: 1 })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    departmentId?: number;

    @ApiPropertyOptional({ example: 'Senior Billing Officer' })
    @IsString()
    @IsOptional()
    designation?: string;

    @ApiPropertyOptional({ example: '+94771234567' })
    @IsString()
    @IsOptional()
    phone?: string;
}

/**
 * DTO for updating own profile (limited fields)
 */
export class UpdateProfileDto {
    @ApiPropertyOptional({ example: 'John' })
    @IsString()
    @IsOptional()
    firstName?: string;

    @ApiPropertyOptional({ example: 'Michael' })
    @IsString()
    @IsOptional()
    middleName?: string;

    @ApiPropertyOptional({ example: 'Doe' })
    @IsString()
    @IsOptional()
    lastName?: string;

    @ApiPropertyOptional({ example: 'john.doe@utility.gov' })
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiPropertyOptional({ example: '+94771234567' })
    @IsString()
    @IsOptional()
    phone?: string;
}

/**
 * DTO for filtering employees
 */
export class EmployeeFilterDto {
    @ApiPropertyOptional({ example: 1, description: 'Page number' })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ example: 10, description: 'Items per page' })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @ApiPropertyOptional({ example: 1, description: 'Filter by department ID' })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    departmentId?: number;

    @ApiPropertyOptional({ example: 'CASHIER', description: 'Filter by role' })
    @IsString()
    @IsOptional()
    role?: string;

    @ApiPropertyOptional({ example: 'john', description: 'Search by name, email, or username' })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiPropertyOptional({ example: 'lastName', description: 'Sort by column' })
    @IsString()
    @IsOptional()
    sortBy?: string;

    @ApiPropertyOptional({ example: 'ASC', enum: ['ASC', 'DESC'], description: 'Sort order' })
    @IsString()
    @IsOptional()
    sortOrder?: 'ASC' | 'DESC';
}

/**
 * DTO for changing password
 */
export class ChangePasswordDto {
    @ApiProperty({ example: 'OldPass123!' })
    @IsString()
    @IsNotEmpty()
    oldPassword: string;

    @ApiProperty({ example: 'NewSecurePass123!' })
    @IsString()
    @MinLength(8)
    newPassword: string;
}

/**
 * DTO for deactivating employee
 */
export class DeactivateEmployeeDto {
    @ApiProperty({ example: 'Employee resigned' })
    @IsString()
    @IsNotEmpty()
    reason: string;
}

/**
 * DTO for assigning specialized role
 */
export class AssignRoleDto {
    @ApiProperty({ example: 'CASHIER', enum: ['ADMIN', 'MANAGER', 'CASHIER', 'METER_READER', 'FIELD_OFFICER', 'ADMINISTRATIVE_STAFF'] })
    @IsString()
    @IsNotEmpty()
    role: string;

    @ApiPropertyOptional({ example: 'Senior Cashier' })
    @IsString()
    @IsOptional()
    designation?: string;
}

/**
 * DTO for employee statistics
 */
export class EmployeeStatsDto {
    @ApiProperty({ example: 150 })
    total: number;

    @ApiProperty({
        example: [
            { departmentId: 1, departmentName: 'Billing', count: 45 },
            { departmentId: 2, departmentName: 'Field Operations', count: 35 },
        ],
    })
    byDepartment: Array<{ departmentId: number; departmentName: string; count: number }>;

    @ApiProperty({
        example: [
            { role: 'CASHIER', count: 25 },
            { role: 'METER_READER', count: 40 },
        ],
    })
    byRole: Array<{ role: string; count: number }>;
}
