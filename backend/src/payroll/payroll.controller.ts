import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    ParseIntPipe,
    Res,
    StreamableFile,
    Header,
} from '@nestjs/common';
import { Response } from 'express';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiParam,
    ApiQuery,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiNotFoundResponse,
    ApiConflictResponse,
    ApiUnauthorizedResponse,
    ApiForbiddenResponse,
    ApiBadRequestResponse,
    ApiProduces,
} from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
    CreatePayrollRunDto,
    ProcessPayrollDto,
    CancelPayrollRunDto,
    CreateSalaryComponentTypeDto,
    PayrollRunFilterDto,
    PayslipFilterDto,
    PayrollSummaryQueryDto,
    PayrollRunResponseDto,
    PayrollRunDetailDto,
    ProcessPayrollResultDto,
    PayslipResponseDto,
    PayrollSummaryDto,
    SalaryComponentTypeResponseDto,
    PayrollRunStatus,
} from './dto';

/**
 * Controller for payroll management
 * Handles payroll runs, payslips, and salary components
 */
@ApiTags('Payroll')
@ApiBearerAuth('JWT-auth')
@Controller('payroll')
export class PayrollController {
    constructor(private readonly payrollService: PayrollService) { }

    // ============================================================
    // PAYROLL RUNS
    // ============================================================

    /**
     * POST /payroll/runs
     * Create new payroll run
     */
    @Post('runs')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'MANAGER')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create payroll run' })
    @ApiCreatedResponse({
        description: 'Payroll run created successfully',
        type: PayrollRunResponseDto,
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiForbiddenResponse({ description: 'Forbidden - ADMIN or MANAGER only' })
    @ApiBadRequestResponse({ description: 'Invalid input' })
    async createPayrollRun(
        @Body() createDto: CreatePayrollRunDto,
        @CurrentUser() currentUser: { employeeId: number; role: string },
    ): Promise<PayrollRunResponseDto> {
        return this.payrollService.createPayrollRun(createDto, currentUser.employeeId);
    }

    /**
     * GET /payroll/runs
     * Get all payroll runs with filters
     */
    @Get('runs')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get all payroll runs' })
    @ApiQuery({ name: 'status', enum: PayrollRunStatus, required: false })
    @ApiQuery({ name: 'month', required: false, example: '2026-01' })
    @ApiQuery({ name: 'year', type: Number, required: false })
    @ApiQuery({ name: 'page', type: Number, required: false })
    @ApiQuery({ name: 'limit', type: Number, required: false })
    @ApiOkResponse({
        description: 'Payroll runs retrieved successfully',
        type: [PayrollRunResponseDto],
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    async getPayrollRuns(
        @Query() filterDto: PayrollRunFilterDto,
    ): Promise<{ data: PayrollRunResponseDto[]; total: number; page: number; limit: number }> {
        return this.payrollService.getPayrollRuns(filterDto);
    }

    /**
     * GET /payroll/runs/:id
     * Get payroll run details with payslips
     */
    @Get('runs/:id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get payroll run by ID' })
    @ApiParam({ name: 'id', type: Number, description: 'Payroll run ID' })
    @ApiOkResponse({
        description: 'Payroll run found',
        type: PayrollRunDetailDto,
    })
    @ApiNotFoundResponse({ description: 'Payroll run not found' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    async getPayrollRunById(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<PayrollRunDetailDto> {
        return this.payrollService.getPayrollRunById(id);
    }

    /**
     * POST /payroll/runs/:id/process
     * Process payroll run - generate payslips
     */
    @Post('runs/:id/process')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'MANAGER')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Process payroll run' })
    @ApiParam({ name: 'id', type: Number, description: 'Payroll run ID' })
    @ApiOkResponse({
        description: 'Payroll processed successfully',
        type: ProcessPayrollResultDto,
    })
    @ApiConflictResponse({ description: 'Payroll run already processed' })
    @ApiNotFoundResponse({ description: 'Payroll run not found' })
    @ApiForbiddenResponse({ description: 'Forbidden - ADMIN or MANAGER only' })
    async processPayrollRun(
        @Param('id', ParseIntPipe) id: number,
        @Body() processDto: ProcessPayrollDto,
        @CurrentUser() currentUser: { employeeId: number; role: string },
    ): Promise<ProcessPayrollResultDto> {
        return this.payrollService.processPayrollRun(id, processDto, currentUser.employeeId);
    }

    /**
     * POST /payroll/runs/:id/approve
     * Approve payroll run
     */
    @Post('runs/:id/approve')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Approve payroll run' })
    @ApiParam({ name: 'id', type: Number, description: 'Payroll run ID' })
    @ApiOkResponse({
        description: 'Payroll run approved',
        type: PayrollRunResponseDto,
    })
    @ApiConflictResponse({ description: 'Payroll run not in PROCESSED status' })
    @ApiNotFoundResponse({ description: 'Payroll run not found' })
    @ApiForbiddenResponse({ description: 'Forbidden - ADMIN only' })
    async approvePayrollRun(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() currentUser: { employeeId: number; role: string },
    ): Promise<PayrollRunResponseDto> {
        return this.payrollService.approvePayrollRun(id, currentUser.employeeId);
    }

    /**
     * POST /payroll/runs/:id/cancel
     * Cancel payroll run
     */
    @Post('runs/:id/cancel')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Cancel payroll run' })
    @ApiParam({ name: 'id', type: Number, description: 'Payroll run ID' })
    @ApiOkResponse({
        description: 'Payroll run cancelled',
        type: PayrollRunResponseDto,
    })
    @ApiConflictResponse({ description: 'Cannot cancel COMPLETED payroll run' })
    @ApiNotFoundResponse({ description: 'Payroll run not found' })
    @ApiForbiddenResponse({ description: 'Forbidden - ADMIN only' })
    async cancelPayrollRun(
        @Param('id', ParseIntPipe) id: number,
        @Body() cancelDto: CancelPayrollRunDto,
        @CurrentUser() currentUser: { employeeId: number; role: string },
    ): Promise<PayrollRunResponseDto> {
        return this.payrollService.cancelPayrollRun(id, cancelDto.reason, currentUser.employeeId);
    }

    /**
     * GET /payroll/runs/:id/export
     * Export payroll run to CSV
     */
    @Get('runs/:id/export')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'MANAGER')
    @ApiOperation({ summary: 'Export payroll run to CSV' })
    @ApiParam({ name: 'id', type: Number, description: 'Payroll run ID' })
    @ApiProduces('text/csv')
    @ApiOkResponse({ description: 'CSV file stream' })
    @ApiNotFoundResponse({ description: 'Payroll run not found' })
    @ApiForbiddenResponse({ description: 'Forbidden - ADMIN or MANAGER only' })
    @Header('Content-Type', 'text/csv')
    async exportPayrollRun(
        @Param('id', ParseIntPipe) id: number,
        @Res({ passthrough: true }) res: Response,
    ): Promise<StreamableFile> {
        const { stream, filename } = await this.payrollService.exportPayrollRunToCsv(id);
        res.set({
            'Content-Disposition': `attachment; filename="${filename}"`,
        });
        return new StreamableFile(stream);
    }

    // ============================================================
    // PAYSLIPS
    // ============================================================

    /**
     * GET /payroll/me/payslips
     * Get current employee's payslips
     */
    @Get('me/payslips')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get my payslips' })
    @ApiQuery({ name: 'year', type: Number, required: false })
    @ApiQuery({ name: 'limit', type: Number, required: false })
    @ApiOkResponse({
        description: 'Payslips retrieved successfully',
        type: [PayslipResponseDto],
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    async getMyPayslips(
        @Query() filterDto: PayslipFilterDto,
        @CurrentUser() currentUser: { employeeId: number; role: string },
    ): Promise<PayslipResponseDto[]> {
        return this.payrollService.getEmployeePayslips(currentUser.employeeId, filterDto);
    }

    /**
     * GET /payroll/payslips/:id
     * Get payslip by ID
     */
    @Get('payslips/:id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get payslip by ID' })
    @ApiParam({ name: 'id', type: Number, description: 'Payslip ID' })
    @ApiOkResponse({
        description: 'Payslip found',
        type: PayslipResponseDto,
    })
    @ApiNotFoundResponse({ description: 'Payslip not found' })
    @ApiForbiddenResponse({ description: 'Forbidden - Cannot view other employee payslips' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    async getPayslipById(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() currentUser: { employeeId: number; role: string },
    ): Promise<PayslipResponseDto> {
        return this.payrollService.getPayslipById(id, currentUser.employeeId, currentUser.role);
    }

    /**
     * GET /payroll/payslips/:id/download
     * Download payslip PDF
     */
    @Get('payslips/:id/download')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Download payslip PDF' })
    @ApiParam({ name: 'id', type: Number, description: 'Payslip ID' })
    @ApiProduces('application/pdf')
    @ApiOkResponse({ description: 'PDF file stream' })
    @ApiNotFoundResponse({ description: 'Payslip not found' })
    @ApiForbiddenResponse({ description: 'Forbidden - Cannot download other employee payslips' })
    @Header('Content-Type', 'application/pdf')
    async downloadPayslipPdf(
        @Param('id', ParseIntPipe) id: number,
        @Res({ passthrough: true }) res: Response,
        @CurrentUser() currentUser: { employeeId: number; role: string },
    ): Promise<StreamableFile> {
        const { stream, filename } = await this.payrollService.generatePayslipPdf(
            id,
            currentUser.employeeId,
            currentUser.role,
        );
        res.set({
            'Content-Disposition': `attachment; filename="${filename}"`,
        });
        return new StreamableFile(stream);
    }

    /**
     * GET /payroll/employees/:employeeId/payslips
     * Get employee payslip history
     */
    @Get('employees/:employeeId/payslips')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get employee payslips' })
    @ApiParam({ name: 'employeeId', type: Number, description: 'Employee ID' })
    @ApiQuery({ name: 'year', type: Number, required: false })
    @ApiQuery({ name: 'limit', type: Number, required: false })
    @ApiOkResponse({
        description: 'Payslips retrieved successfully',
        type: [PayslipResponseDto],
    })
    @ApiForbiddenResponse({ description: 'Forbidden - Cannot view other employee payslips' })
    @ApiNotFoundResponse({ description: 'Employee not found' })
    async getEmployeePayslips(
        @Param('employeeId', ParseIntPipe) employeeId: number,
        @Query() filterDto: PayslipFilterDto,
        @CurrentUser() currentUser: { employeeId: number; role: string },
    ): Promise<PayslipResponseDto[]> {
        // Only allow viewing own payslips unless admin/manager
        if (employeeId !== currentUser.employeeId && !['ADMIN', 'MANAGER'].includes(currentUser.role)) {
            throw new Error('Cannot view other employee payslips');
        }
        return this.payrollService.getEmployeePayslips(employeeId, filterDto);
    }

    // ============================================================
    // SUMMARY & REPORTS
    // ============================================================

    /**
     * GET /payroll/summary
     * Get payroll summary for a month
     */
    @Get('summary')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'MANAGER')
    @ApiOperation({ summary: 'Get payroll summary' })
    @ApiQuery({ name: 'month', required: true, example: '01' })
    @ApiQuery({ name: 'year', type: Number, required: true })
    @ApiOkResponse({
        description: 'Payroll summary retrieved',
        type: PayrollSummaryDto,
    })
    @ApiForbiddenResponse({ description: 'Forbidden - ADMIN or MANAGER only' })
    async getPayrollSummary(
        @Query() queryDto: PayrollSummaryQueryDto,
    ): Promise<PayrollSummaryDto> {
        return this.payrollService.getPayrollSummary(queryDto);
    }

    // ============================================================
    // SALARY COMPONENTS
    // ============================================================

    /**
     * POST /payroll/components
     * Create salary component type
     */
    @Post('components')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create salary component type' })
    @ApiCreatedResponse({
        description: 'Salary component type created',
        type: SalaryComponentTypeResponseDto,
    })
    @ApiForbiddenResponse({ description: 'Forbidden - ADMIN only' })
    @ApiBadRequestResponse({ description: 'Invalid input' })
    async createSalaryComponentType(
        @Body() createDto: CreateSalaryComponentTypeDto,
        @CurrentUser() currentUser: { employeeId: number; role: string },
    ): Promise<SalaryComponentTypeResponseDto> {
        return this.payrollService.createSalaryComponentType(createDto);
    }

    /**
     * GET /payroll/components
     * Get all salary component types
     */
    @Get('components')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get salary component types' })
    @ApiOkResponse({
        description: 'Salary component types retrieved',
        type: [SalaryComponentTypeResponseDto],
    })
    async getSalaryComponentTypes(): Promise<SalaryComponentTypeResponseDto[]> {
        return this.payrollService.getSalaryComponentTypes();
    }
}
