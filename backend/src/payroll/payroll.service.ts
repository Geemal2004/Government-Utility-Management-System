import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Readable } from 'stream';
import { PayrollRun, PayrollRunStatus } from '../database/entities/payroll-run.entity';
import { Payslip } from '../database/entities/payslip.entity';
import { PayslipComponent } from '../database/entities/payslip-component.entity';
import { SalaryComponentType, ComponentType } from '../database/entities/salary-component-type.entity';
import { Employee } from '../database/entities/employee.entity';
import {
    CreatePayrollRunDto,
    ProcessPayrollDto,
    PayrollRunFilterDto,
    PayslipFilterDto,
    PayrollSummaryQueryDto,
    CreateSalaryComponentTypeDto,
    PayrollRunResponseDto,
    PayrollRunDetailDto,
    PayslipResponseDto,
    ProcessPayrollResultDto,
    PayrollSummaryDto,
    SalaryComponentTypeResponseDto,
    PayslipComponentDto,
} from './dto';

/**
 * PayrollService handles all payroll business logic
 */
@Injectable()
export class PayrollService {
    constructor(
        @InjectRepository(PayrollRun)
        private readonly payrollRunRepository: Repository<PayrollRun>,
        @InjectRepository(Payslip)
        private readonly payslipRepository: Repository<Payslip>,
        @InjectRepository(PayslipComponent)
        private readonly payslipComponentRepository: Repository<PayslipComponent>,
        @InjectRepository(SalaryComponentType)
        private readonly salaryComponentTypeRepository: Repository<SalaryComponentType>,
        @InjectRepository(Employee)
        private readonly employeeRepository: Repository<Employee>,
    ) { }

    // ==================== PAYROLL RUN OPERATIONS ====================

    /**
     * Create a new payroll run
     */
    async createPayrollRun(dto: CreatePayrollRunDto, createdByEmployeeId: number): Promise<PayrollRunResponseDto> {
        // Check if run already exists for this period
        const existing = await this.payrollRunRepository.findOne({
            where: {
                periodMonth: dto.month,
                periodYear: dto.year,
            },
        });

        if (existing) {
            throw new ConflictException(`Payroll run for ${dto.month}/${dto.year} already exists`);
        }

        const payrollRun = this.payrollRunRepository.create({
            periodMonth: dto.month,
            periodYear: dto.year,
            runDate: new Date(),
            status: PayrollRunStatus.DRAFT,
            createdByEmployeeId,
        });

        const saved = await this.payrollRunRepository.save(payrollRun);
        return this.toPayrollRunResponse(saved);
    }

    /**
     * Get all payroll runs with filters
     */
    async getPayrollRuns(filterDto: PayrollRunFilterDto): Promise<{
        data: PayrollRunResponseDto[];
        total: number;
        page: number;
        limit: number;
    }> {
        const { status, month, year, page = 1, limit = 10 } = filterDto;
        const skip = (page - 1) * limit;

        const queryBuilder = this.payrollRunRepository
            .createQueryBuilder('run')
            .leftJoinAndSelect('run.createdBy', 'createdBy')
            .orderBy('run.runDate', 'DESC');

        if (status) {
            queryBuilder.andWhere('run.status = :status', { status });
        }
        if (month) {
            queryBuilder.andWhere('run.periodMonth = :month', { month });
        }
        if (year) {
            queryBuilder.andWhere('run.periodYear = :year', { year });
        }

        queryBuilder.skip(skip).take(limit);

        const [runs, total] = await queryBuilder.getManyAndCount();

        // Get employee counts and totals for each run
        const data: PayrollRunResponseDto[] = [];
        for (const run of runs) {
            const stats = await this.getPayrollRunStats(run.payrollRunId);
            data.push(this.toPayrollRunResponse(run, stats));
        }

        return { data, total, page, limit };
    }

    /**
     * Get payroll run by ID with full details
     */
    async getPayrollRunById(id: number): Promise<PayrollRunDetailDto> {
        const run = await this.payrollRunRepository.findOne({
            where: { payrollRunId: id },
            relations: ['createdBy'],
        });

        if (!run) {
            throw new NotFoundException(`Payroll run with ID ${id} not found`);
        }

        const stats = await this.getPayrollRunStats(id);
        const payslips = await this.getPayslipsForRun(id);

        return {
            ...this.toPayrollRunResponse(run, stats),
            payslips,
        };
    }

    /**
     * Process payroll run - generate payslips for employees
     */
    async processPayrollRun(
        id: number,
        processDto: ProcessPayrollDto,
        processedByEmployeeId: number,
    ): Promise<ProcessPayrollResultDto> {
        const run = await this.payrollRunRepository.findOne({
            where: { payrollRunId: id },
        });

        if (!run) {
            throw new NotFoundException(`Payroll run with ID ${id} not found`);
        }

        if (run.status !== PayrollRunStatus.DRAFT) {
            throw new BadRequestException('Only DRAFT payroll runs can be processed');
        }

        // Update status to PROCESSING
        run.status = PayrollRunStatus.PROCESSING;
        await this.payrollRunRepository.save(run);

        // Get employees to process
        let employees: Employee[];
        if (processDto.employeeIds && processDto.employeeIds.length > 0) {
            employees = await this.employeeRepository.find({
                where: { employeeId: In(processDto.employeeIds) },
            });
        } else {
            employees = await this.employeeRepository.find();
        }

        const success: PayslipResponseDto[] = [];
        const failed: Array<{ employeeId: number; name: string; reason: string }> = [];

        // Get salary component types
        const componentTypes = await this.salaryComponentTypeRepository.find();

        // Generate payslips for each employee
        for (const employee of employees) {
            try {
                const payslip = await this.generatePayslipForEmployee(
                    run,
                    employee,
                    componentTypes,
                    processDto.dryRun || false,
                );
                success.push(payslip);
            } catch (error) {
                failed.push({
                    employeeId: employee.employeeId,
                    name: employee.fullName,
                    reason: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        // If not dry run and all successful, keep PROCESSING status (awaiting approval)
        // If dry run, revert to DRAFT
        if (processDto.dryRun) {
            run.status = PayrollRunStatus.DRAFT;
            await this.payrollRunRepository.save(run);
        }

        return {
            totalProcessed: success.length,
            totalFailed: failed.length,
            success,
            failed,
        };
    }

    /**
     * Approve payroll run
     */
    async approvePayrollRun(id: number, approvedByEmployeeId: number): Promise<PayrollRunResponseDto> {
        const run = await this.payrollRunRepository.findOne({
            where: { payrollRunId: id },
            relations: ['createdBy'],
        });

        if (!run) {
            throw new NotFoundException(`Payroll run with ID ${id} not found`);
        }

        if (run.status !== PayrollRunStatus.PROCESSING) {
            throw new BadRequestException('Only PROCESSING payroll runs can be approved');
        }

        run.status = PayrollRunStatus.COMPLETED;
        const saved = await this.payrollRunRepository.save(run);

        const stats = await this.getPayrollRunStats(id);
        return this.toPayrollRunResponse(saved, stats);
    }

    /**
     * Cancel payroll run
     */
    async cancelPayrollRun(
        id: number,
        reason: string,
        cancelledByEmployeeId: number,
    ): Promise<PayrollRunResponseDto> {
        const run = await this.payrollRunRepository.findOne({
            where: { payrollRunId: id },
            relations: ['createdBy'],
        });

        if (!run) {
            throw new NotFoundException(`Payroll run with ID ${id} not found`);
        }

        if (run.status === PayrollRunStatus.COMPLETED) {
            throw new BadRequestException('COMPLETED payroll runs cannot be cancelled');
        }

        if (run.status === PayrollRunStatus.CANCELLED) {
            throw new BadRequestException('Payroll run is already cancelled');
        }

        run.status = PayrollRunStatus.CANCELLED;
        const saved = await this.payrollRunRepository.save(run);

        const stats = await this.getPayrollRunStats(id);
        return this.toPayrollRunResponse(saved, stats);
    }

    /**
     * Export payroll run to CSV
     */
    async exportPayrollRunToCsv(id: number): Promise<{ stream: Readable; filename: string }> {
        const run = await this.getPayrollRunById(id);

        const headers = ['Employee No', 'Employee Name', 'Department', 'Gross', 'Deductions', 'Net Pay', 'Status'];
        const rows = run.payslips?.map((p) => [
            p.employeeNo,
            p.employeeName,
            p.departmentName || '',
            p.grossSalary.toFixed(2),
            p.totalDeductions.toFixed(2),
            p.netSalary.toFixed(2),
            p.status,
        ]) || [];

        const csvContent = [
            headers.join(','),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        ].join('\n');

        const stream = Readable.from([csvContent]);
        const filename = `payroll-${run.periodYear}-${String(run.periodMonth).padStart(2, '0')}.csv`;

        return { stream, filename };
    }

    // ==================== PAYSLIP OPERATIONS ====================

    /**
     * Get payslips for an employee
     */
    async getEmployeePayslips(
        employeeId: number,
        filterDto: PayslipFilterDto,
    ): Promise<PayslipResponseDto[]> {
        const { year, month, page = 1, limit = 12 } = filterDto;
        const skip = (page - 1) * limit;

        const queryBuilder = this.payslipRepository
            .createQueryBuilder('payslip')
            .leftJoinAndSelect('payslip.employee', 'employee')
            .leftJoinAndSelect('payslip.payrollRun', 'payrollRun')
            .where('payslip.employeeId = :employeeId', { employeeId })
            .orderBy('payrollRun.periodYear', 'DESC')
            .addOrderBy('payrollRun.periodMonth', 'DESC');

        if (year) {
            queryBuilder.andWhere('payrollRun.periodYear = :year', { year });
        }
        if (month) {
            queryBuilder.andWhere('payrollRun.periodMonth = :month', { month });
        }

        queryBuilder.skip(skip).take(limit);

        const payslips = await queryBuilder.getMany();
        return payslips.map((p) => this.toPayslipResponse(p));
    }

    /**
     * Get payslip by ID
     */
    async getPayslipById(
        id: number,
        currentEmployeeId: number,
        currentRole: string,
    ): Promise<PayslipResponseDto> {
        const payslip = await this.payslipRepository.findOne({
            where: { payslipId: id },
            relations: ['employee', 'payrollRun'],
        });

        if (!payslip) {
            throw new NotFoundException(`Payslip with ID ${id} not found`);
        }

        // Check access: only own payslip or admin/manager
        if (
            payslip.employeeId !== currentEmployeeId &&
            !['ADMIN', 'MANAGER'].includes(currentRole)
        ) {
            throw new ForbiddenException('You can only view your own payslips');
        }

        // Get components
        const components = await this.payslipComponentRepository.find({
            where: { payslipId: id },
            relations: ['componentType'],
        });

        return this.toPayslipResponse(payslip, components);
    }

    /**
     * Generate payslip PDF
     */
    async generatePayslipPdf(
        id: number,
        currentEmployeeId: number,
        currentRole: string,
    ): Promise<{ stream: Readable; filename: string }> {
        const payslip = await this.getPayslipById(id, currentEmployeeId, currentRole);

        // Simple text-based PDF content (in production, use a PDF library)
        const content = `
PAYSLIP
=======

Employee: ${payslip.employeeName}
Employee No: ${payslip.employeeNo}
Period: ${payslip.periodStart} - ${payslip.periodEnd}

EARNINGS
--------
Gross Salary: $${payslip.grossSalary.toFixed(2)}

DEDUCTIONS
----------
Total Deductions: $${payslip.totalDeductions.toFixed(2)}

NET PAY: $${payslip.netSalary.toFixed(2)}
    `;

        const stream = Readable.from([content]);
        const filename = `payslip-${payslip.employeeNo}-${payslip.month}.pdf`;

        return { stream, filename };
    }

    // ==================== SALARY COMPONENT OPERATIONS ====================

    /**
     * Create salary component type
     */
    async createSalaryComponentType(dto: CreateSalaryComponentTypeDto): Promise<SalaryComponentTypeResponseDto> {
        const existing = await this.salaryComponentTypeRepository.findOne({
            where: { name: dto.name },
        });

        if (existing) {
            throw new ConflictException(`Salary component type "${dto.name}" already exists`);
        }

        const componentType = this.salaryComponentTypeRepository.create({
            name: dto.name,
            type: dto.type as ComponentType,
        });

        const saved = await this.salaryComponentTypeRepository.save(componentType);

        return {
            componentTypeId: saved.componentTypeId,
            name: saved.name,
            type: saved.type,
        };
    }

    /**
     * Get all salary component types
     */
    async getSalaryComponentTypes(): Promise<SalaryComponentTypeResponseDto[]> {
        const types = await this.salaryComponentTypeRepository.find({
            order: { type: 'ASC', name: 'ASC' },
        });

        return types.map((t) => ({
            componentTypeId: t.componentTypeId,
            name: t.name,
            type: t.type,
        }));
    }

    /**
     * Update salary component type
     */
    async updateSalaryComponentType(
        id: number,
        dto: Partial<CreateSalaryComponentTypeDto>,
    ): Promise<SalaryComponentTypeResponseDto> {
        const componentType = await this.salaryComponentTypeRepository.findOne({
            where: { componentTypeId: id },
        });

        if (!componentType) {
            throw new NotFoundException(`Salary component type with ID ${id} not found`);
        }

        if (dto.name && dto.name !== componentType.name) {
            const existing = await this.salaryComponentTypeRepository.findOne({
                where: { name: dto.name },
            });
            if (existing) {
                throw new ConflictException(`Name "${dto.name}" already exists`);
            }
            componentType.name = dto.name;
        }

        if (dto.type) {
            componentType.type = dto.type as ComponentType;
        }

        const saved = await this.salaryComponentTypeRepository.save(componentType);

        return {
            componentTypeId: saved.componentTypeId,
            name: saved.name,
            type: saved.type,
        };
    }

    /**
     * Delete salary component type
     */
    async deleteSalaryComponentType(id: number): Promise<void> {
        const componentType = await this.salaryComponentTypeRepository.findOne({
            where: { componentTypeId: id },
        });

        if (!componentType) {
            throw new NotFoundException(`Salary component type with ID ${id} not found`);
        }

        // Check if used in any payslip components
        const usageCount = await this.payslipComponentRepository.count({
            where: { componentTypeId: id },
        });

        if (usageCount > 0) {
            throw new BadRequestException(
                `Cannot delete: component is used in ${usageCount} payslip(s)`,
            );
        }

        await this.salaryComponentTypeRepository.remove(componentType);
    }

    // ==================== SUMMARY OPERATIONS ====================

    /**
     * Get payroll summary for a month/year
     */
    async getPayrollSummary(query: PayrollSummaryQueryDto): Promise<PayrollSummaryDto> {
        const { month, year } = query;

        const run = await this.payrollRunRepository.findOne({
            where: {
                periodMonth: month,
                periodYear: year,
                status: PayrollRunStatus.COMPLETED,
            },
        });

        if (!run) {
            return {
                month: `${year}-${String(month).padStart(2, '0')}`,
                year,
                totalEmployeesPaid: 0,
                totalGross: 0,
                totalDeductions: 0,
                netPayout: 0,
            };
        }

        const stats = await this.getPayrollRunStats(run.payrollRunId);

        return {
            month: `${year}-${String(month).padStart(2, '0')}`,
            year,
            totalEmployeesPaid: stats.totalEmployees,
            totalGross: stats.totalGross,
            totalDeductions: stats.totalDeductions,
            netPayout: stats.totalNet,
        };
    }

    // ==================== PRIVATE HELPER METHODS ====================

    private async getPayrollRunStats(runId: number): Promise<{
        totalEmployees: number;
        totalGross: number;
        totalDeductions: number;
        totalNet: number;
    }> {
        const result = await this.payslipRepository
            .createQueryBuilder('payslip')
            .select('COUNT(*)', 'count')
            .addSelect('COALESCE(SUM(payslip.gross), 0)', 'totalGross')
            .addSelect('COALESCE(SUM(payslip.deductions), 0)', 'totalDeductions')
            .where('payslip.payrollRunId = :runId', { runId })
            .getRawOne();

        return {
            totalEmployees: parseInt(result.count, 10),
            totalGross: parseFloat(result.totalGross),
            totalDeductions: parseFloat(result.totalDeductions),
            totalNet: parseFloat(result.totalGross) - parseFloat(result.totalDeductions),
        };
    }

    private async getPayslipsForRun(runId: number): Promise<PayslipResponseDto[]> {
        const payslips = await this.payslipRepository.find({
            where: { payrollRunId: runId },
            relations: ['employee', 'payrollRun'],
            order: { employeeId: 'ASC' },
        });

        return payslips.map((p) => this.toPayslipResponse(p));
    }

    private async generatePayslipForEmployee(
        run: PayrollRun,
        employee: Employee,
        componentTypes: SalaryComponentType[],
        dryRun: boolean,
    ): Promise<PayslipResponseDto> {
        // Basic salary calculation (in production, this would be more complex)
        const baseSalary = 5000; // Default base salary
        const taxRate = 0.15;
        const socialSecurityRate = 0.05;

        const gross = baseSalary;
        const tax = gross * taxRate;
        const socialSecurity = gross * socialSecurityRate;
        const totalDeductions = tax + socialSecurity;

        if (dryRun) {
            // Return preview without saving
            return {
                payslipId: 0,
                payrollRunId: run.payrollRunId,
                employeeId: employee.employeeId,
                employeeNo: employee.employeeNo,
                employeeName: employee.fullName,
                month: run.month,
                periodStart: run.periodStart.toISOString().split('T')[0],
                periodEnd: run.periodEnd.toISOString().split('T')[0],
                grossSalary: gross,
                totalDeductions,
                netSalary: gross - totalDeductions,
                status: 'PREVIEW',
            };
        }

        // Create and save payslip
        const payslip = this.payslipRepository.create({
            payrollRunId: run.payrollRunId,
            employeeId: employee.employeeId,
            gross,
            deductions: totalDeductions,
        });

        const savedPayslip = await this.payslipRepository.save(payslip);

        // Create payslip components
        const earningType = componentTypes.find((t) => t.name === 'Basic Salary' && t.type === ComponentType.EARNING);
        const taxType = componentTypes.find((t) => t.name === 'Income Tax' && t.type === ComponentType.DEDUCTION);
        const ssType = componentTypes.find((t) => t.name === 'Social Security' && t.type === ComponentType.DEDUCTION);

        const components: PayslipComponent[] = [];

        if (earningType) {
            components.push(
                this.payslipComponentRepository.create({
                    payslipId: savedPayslip.payslipId,
                    componentTypeId: earningType.componentTypeId,
                    name: 'Basic Salary',
                    amount: baseSalary,
                }),
            );
        }

        if (taxType) {
            components.push(
                this.payslipComponentRepository.create({
                    payslipId: savedPayslip.payslipId,
                    componentTypeId: taxType.componentTypeId,
                    name: 'Income Tax',
                    amount: tax,
                }),
            );
        }

        if (ssType) {
            components.push(
                this.payslipComponentRepository.create({
                    payslipId: savedPayslip.payslipId,
                    componentTypeId: ssType.componentTypeId,
                    name: 'Social Security',
                    amount: socialSecurity,
                }),
            );
        }

        if (components.length > 0) {
            await this.payslipComponentRepository.save(components);
        }

        return {
            payslipId: savedPayslip.payslipId,
            payrollRunId: run.payrollRunId,
            employeeId: employee.employeeId,
            employeeNo: employee.employeeNo,
            employeeName: employee.fullName,
            month: run.month,
            periodStart: run.periodStart.toISOString().split('T')[0],
            periodEnd: run.periodEnd.toISOString().split('T')[0],
            grossSalary: gross,
            totalDeductions,
            netSalary: gross - totalDeductions,
            status: 'GENERATED',
        };
    }

    private toPayrollRunResponse(
        run: PayrollRun,
        stats?: { totalEmployees: number; totalGross: number; totalDeductions: number; totalNet: number },
    ): PayrollRunResponseDto {
        return {
            runId: run.payrollRunId,
            month: run.month,
            periodMonth: run.periodMonth,
            periodYear: run.periodYear,
            periodStart: run.periodStart.toISOString().split('T')[0],
            periodEnd: run.periodEnd.toISOString().split('T')[0],
            status: run.status,
            totalEmployees: stats?.totalEmployees || 0,
            totalGross: stats?.totalGross || 0,
            totalDeductions: stats?.totalDeductions || 0,
            totalNet: stats?.totalNet || 0,
            createdBy: run.createdByEmployeeId,
            createdByName: run.createdBy?.fullName,
            runDate: run.runDate.toISOString().split('T')[0],
            createdAt: run.runDate.toISOString(),
        };
    }

    private toPayslipResponse(
        payslip: Payslip,
        components?: PayslipComponent[],
    ): PayslipResponseDto {
        const response: PayslipResponseDto = {
            payslipId: payslip.payslipId,
            payrollRunId: payslip.payrollRunId,
            employeeId: payslip.employeeId,
            employeeNo: payslip.employee?.employeeNo || '',
            employeeName: payslip.employee?.fullName || '',
            month: payslip.payrollRun?.month || '',
            periodStart: payslip.payrollRun?.periodStart?.toISOString().split('T')[0] || '',
            periodEnd: payslip.payrollRun?.periodEnd?.toISOString().split('T')[0] || '',
            grossSalary: Number(payslip.gross),
            totalDeductions: Number(payslip.deductions),
            netSalary: payslip.net,
            status: payslip.payrollRun?.status === PayrollRunStatus.COMPLETED ? 'PAID' : 'PENDING',
        };

        if (components) {
            response.components = components.map((c) => ({
                componentId: c.payslipComponentId,
                name: c.name,
                type: c.componentType?.type || 'EARNING',
                amount: Number(c.amount),
            }));
        }

        return response;
    }
}
