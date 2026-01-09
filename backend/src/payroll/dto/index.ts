import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNumber,
    IsOptional,
    IsEnum,
    IsNotEmpty,
    IsArray,
    IsBoolean,
    Min,
    Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================================
// ENUMS
// ============================================================

export enum PayrollRunStatus {
    DRAFT = 'DRAFT',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

export enum ComponentType {
    EARNING = 'EARNING',
    DEDUCTION = 'DEDUCTION',
}

export enum PayslipStatus {
    DRAFT = 'DRAFT',
    PENDING = 'PENDING',
    GENERATED = 'GENERATED',
    PREVIEW = 'PREVIEW',
    APPROVED = 'APPROVED',
    PAID = 'PAID',
}

// ============================================================
// REQUEST DTOs
// ============================================================

/**
 * DTO for creating a payroll run
 */
export class CreatePayrollRunDto {
    @ApiProperty({ example: 1, description: 'Month (1-12)' })
    @IsNumber()
    @Min(1)
    @Max(12)
    month: number;

    @ApiProperty({ example: 2026 })
    @IsNumber()
    @Min(2000)
    year: number;

    @ApiPropertyOptional({ example: 'January 2026 Payroll' })
    @IsString()
    @IsOptional()
    description?: string;
}

/**
 * DTO for processing a payroll run
 */
export class ProcessPayrollDto {
    @ApiPropertyOptional({
        example: [1, 2, 3],
        description: 'Specific employee IDs to process. If empty, processes all eligible employees'
    })
    @IsArray()
    @IsNumber({}, { each: true })
    @IsOptional()
    employeeIds?: number[];

    @ApiPropertyOptional({ example: true, description: 'Dry run - preview only, no saving' })
    @IsBoolean()
    @IsOptional()
    dryRun?: boolean;

    @ApiPropertyOptional({ example: true, description: 'Include inactive employees' })
    @IsBoolean()
    @IsOptional()
    includeInactive?: boolean;
}

/**
 * DTO for cancelling a payroll run
 */
export class CancelPayrollRunDto {
    @ApiProperty({ example: 'Duplicate run created by mistake' })
    @IsString()
    @IsNotEmpty()
    reason: string;
}

/**
 * DTO for creating salary component type
 */
export class CreateSalaryComponentTypeDto {
    @ApiProperty({ example: 'Housing Allowance' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ enum: ComponentType, example: ComponentType.EARNING })
    @IsEnum(ComponentType)
    type: ComponentType;

    @ApiPropertyOptional({ example: 'Monthly housing allowance for employees' })
    @IsString()
    @IsOptional()
    description?: string;
}

/**
 * DTO for filtering payroll runs
 */
export class PayrollRunFilterDto {
    @ApiPropertyOptional({ enum: PayrollRunStatus })
    @IsEnum(PayrollRunStatus)
    @IsOptional()
    status?: PayrollRunStatus;

    @ApiPropertyOptional({ example: 1, description: 'Month (1-12)' })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    month?: number;

    @ApiPropertyOptional({ example: 2026 })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    year?: number;

    @ApiPropertyOptional({ example: 1 })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ example: 10 })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    @Max(100)
    limit?: number;
}

/**
 * DTO for filtering employee payslips
 */
export class PayslipFilterDto {
    @ApiPropertyOptional({ example: 2026 })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    year?: number;

    @ApiPropertyOptional({ example: 1, description: 'Month (1-12)' })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    month?: number;

    @ApiPropertyOptional({ example: 1 })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ example: 12 })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    @Max(50)
    limit?: number;
}

/**
 * DTO for payroll summary query
 */
export class PayrollSummaryQueryDto {
    @ApiProperty({ example: 1, description: 'Month (1-12)' })
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(12)
    month: number;

    @ApiProperty({ example: 2026 })
    @IsNumber()
    @Type(() => Number)
    year: number;
}

// ============================================================
// RESPONSE DTOs
// ============================================================

/**
 * Salary component in payslip
 */
export class PayslipComponentDto {
    @ApiProperty({ example: 1 })
    componentId: number;

    @ApiProperty({ example: 'Basic Salary' })
    name: string;

    @ApiProperty({ enum: ComponentType })
    type: ComponentType | string;

    @ApiProperty({ example: 5000.00 })
    amount: number;
}

/**
 * Payslip response DTO
 */
export class PayslipResponseDto {
    @ApiProperty({ example: 1 })
    payslipId: number;

    @ApiProperty({ example: 1 })
    payrollRunId: number;

    @ApiProperty({ example: 1 })
    employeeId: number;

    @ApiProperty({ example: 'EMP-1001' })
    employeeNo: string;

    @ApiProperty({ example: 'John Doe' })
    employeeName: string;

    @ApiPropertyOptional({ example: 'Operations' })
    departmentName?: string;

    @ApiProperty({ example: '2026-01' })
    month: string;

    @ApiProperty({ example: '2026-01-01' })
    periodStart: string;

    @ApiProperty({ example: '2026-01-31' })
    periodEnd: string;

    @ApiProperty({ example: 8000.00 })
    grossSalary: number;

    @ApiProperty({ example: 1500.00 })
    totalDeductions: number;

    @ApiProperty({ example: 6500.00 })
    netSalary: number;

    @ApiProperty()
    status: string;

    @ApiPropertyOptional({ type: [PayslipComponentDto] })
    components?: PayslipComponentDto[];

    @ApiPropertyOptional({ example: '2026-01-25T10:00:00Z' })
    paidAt?: string;

    @ApiPropertyOptional({ example: '2026-01-20T10:00:00Z' })
    createdAt?: string;
}

/**
 * Payroll run response DTO
 */
export class PayrollRunResponseDto {
    @ApiProperty({ example: 1 })
    runId: number;

    @ApiProperty({ example: '2026-01' })
    month: string;

    @ApiPropertyOptional({ example: 1 })
    periodMonth?: number;

    @ApiPropertyOptional({ example: 2026 })
    periodYear?: number;

    @ApiPropertyOptional({ example: 'January 2026 Payroll' })
    description?: string;

    @ApiProperty({ example: '2026-01-01' })
    periodStart: string;

    @ApiProperty({ example: '2026-01-31' })
    periodEnd: string;

    @ApiProperty({ enum: PayrollRunStatus })
    status: PayrollRunStatus;

    @ApiProperty({ example: 50 })
    totalEmployees: number;

    @ApiProperty({ example: 400000.00 })
    totalGross: number;

    @ApiProperty({ example: 75000.00 })
    totalDeductions: number;

    @ApiProperty({ example: 325000.00 })
    totalNet: number;

    @ApiProperty({ example: 1 })
    createdBy: number;

    @ApiPropertyOptional({ example: 'John Admin' })
    createdByName?: string;

    @ApiPropertyOptional({ example: 2 })
    approvedBy?: number;

    @ApiPropertyOptional({ example: 'Jane Manager' })
    approvedByName?: string;

    @ApiProperty({ example: '2026-01-20' })
    runDate: string;

    @ApiProperty({ example: '2026-01-20T10:00:00Z' })
    createdAt: string;

    @ApiPropertyOptional({ example: '2026-01-22T10:00:00Z' })
    approvedAt?: string;

    @ApiPropertyOptional({ type: [PayslipResponseDto] })
    payslips?: PayslipResponseDto[];
}

/**
 * Payroll run with detailed summary
 */
export class PayrollRunDetailDto extends PayrollRunResponseDto {
    @ApiProperty({ type: [PayslipResponseDto] })
    payslips: PayslipResponseDto[];

    @ApiPropertyOptional()
    summary?: {
        byDepartment?: Array<{ departmentId: number; departmentName: string; totalNet: number }>;
        byRole?: Array<{ role: string; count: number; totalNet: number }>;
    };
}

/**
 * Process payroll result
 */
export class ProcessPayrollResultDto {
    @ApiProperty({ type: [PayslipResponseDto] })
    success: PayslipResponseDto[];

    @ApiProperty({
        example: [{ employeeId: 5, name: 'John Doe', reason: 'No salary structure defined' }]
    })
    failed: Array<{ employeeId: number; name: string; reason: string }>;

    @ApiProperty({ example: 48 })
    totalProcessed: number;

    @ApiProperty({ example: 2 })
    totalFailed: number;
}

/**
 * Payroll summary DTO
 */
export class PayrollSummaryDto {
    @ApiProperty({ example: '2026-01' })
    month: string;

    @ApiProperty({ example: 2026 })
    year: number;

    @ApiProperty({ example: 50 })
    totalEmployeesPaid: number;

    @ApiProperty({ example: 400000.00 })
    totalGross: number;

    @ApiProperty({ example: 75000.00 })
    totalDeductions: number;

    @ApiProperty({ example: 325000.00 })
    netPayout: number;

    @ApiPropertyOptional({
        example: [
            { type: 'Basic Salary', total: 250000 },
            { type: 'Housing Allowance', total: 50000 }
        ]
    })
    earningsBreakdown?: Array<{ type: string; total: number }>;

    @ApiPropertyOptional({
        example: [
            { type: 'Tax', total: 50000 },
            { type: 'Insurance', total: 25000 }
        ]
    })
    deductionsBreakdown?: Array<{ type: string; total: number }>;
}

/**
 * Salary component type response
 */
export class SalaryComponentTypeResponseDto {
    @ApiProperty({ example: 1 })
    componentTypeId: number;

    @ApiProperty({ example: 'Housing Allowance' })
    name: string;

    @ApiProperty({ enum: ComponentType })
    type: ComponentType;

    @ApiPropertyOptional({ example: 'Monthly housing allowance' })
    description?: string;

    @ApiPropertyOptional({ example: true })
    isActive?: boolean;

    @ApiPropertyOptional({ example: '2026-01-01T10:00:00Z' })
    createdAt?: string;
}
