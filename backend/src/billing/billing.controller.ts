import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Req,
  StreamableFile,
  Header,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { BillingService } from './billing.service';
import {
  CreateBillDto,
  BulkBillGenerationDto,
  UpdateBillDto,
  BillFilterDto,
  BillResponseDto,
  BillCalculationDto,
  BillSummaryDto,
} from './dto';
import { Bill } from '../database/entities';

/**
 * Controller for billing operations
 * Handles bill generation, retrieval, and management
 */
@ApiTags('bills')
@ApiBearerAuth()
@Controller('bills')
// @UseGuards(JwtAuthGuard) // TODO: Uncomment when auth is implemented
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /**
   * Calculate bill without saving (preview)
   */
  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate bill preview',
    description: 'Calculate bill without saving to database. Used for previewing charges.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bill calculation successful',
    type: BillCalculationDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input or insufficient readings',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Meter not found or no service connection',
  })
  async calculateBill(
    @Body()
    body: {
      meterId: number;
      periodStart: string;
      periodEnd: string;
    },
  ): Promise<BillCalculationDto> {
    const periodStart = new Date(body.periodStart);
    const periodEnd = new Date(body.periodEnd);

    return this.billingService.calculateBill(body.meterId, periodStart, periodEnd);
  }

  /**
   * Generate and save a single bill
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate single bill',
    description: 'Generate and save a bill for a specific meter and billing period',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Bill generated successfully',
    type: BillResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input or calculation failed',
  })
  // @Roles('ADMIN', 'MANAGER', 'CASHIER')
  async createBill(
    @Body() createDto: CreateBillDto,
    @Req() req: Request & { user?: { employeeId?: number } },
  ): Promise<BillResponseDto> {
    const employeeId = req.user?.employeeId; // TODO: Get from JWT token

    const bill = await this.billingService.create(
      createDto.meterId,
      new Date(createDto.billingPeriodStart),
      new Date(createDto.billingPeriodEnd),
      employeeId,
    );

    return this.transformBillToResponse(bill);
  }

  /**
   * Generate bills for multiple meters in bulk
   */
  @Post('bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate bulk bills',
    description: 'Generate bills for multiple meters based on filters. Supports dry-run mode.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk billing completed with success/failure breakdown',
    schema: {
      properties: {
        success: { type: 'array', items: { $ref: '#/components/schemas/Bill' } },
        failed: { type: 'array', items: { type: 'object' } },
        summary: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            successful: { type: 'number' },
            failed: { type: 'number' },
          },
        },
      },
    },
  })
  // @Roles('ADMIN', 'MANAGER')
  async createBulk(@Body() bulkDto: BulkBillGenerationDto): Promise<{
    success: Bill[];
    failed: Array<{ meterId: number; meterSerialNo: string; error: string }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  }> {
    const result = await this.billingService.createBulk(
      bulkDto.utilityTypeId,
      bulkDto.customerType,
      bulkDto.meterIds,
      bulkDto.billingPeriodStart ? new Date(bulkDto.billingPeriodStart) : undefined,
      bulkDto.billingPeriodEnd ? new Date(bulkDto.billingPeriodEnd) : undefined,
      bulkDto.dryRun,
    );

    return {
      ...result,
      summary: {
        total: result.success.length + result.failed.length,
        successful: result.success.length,
        failed: result.failed.length,
      },
    };
  }

  /**
   * Get bills with filtering and pagination
   */
  @Get()
  @ApiOperation({
    summary: 'Get bills with filters',
    description: 'Retrieve bills with optional filters, pagination, and sorting',
  })
  @ApiQuery({ name: 'customerId', required: false, type: Number })
  @ApiQuery({ name: 'meterId', required: false, type: Number })
  @ApiQuery({ name: 'utilityTypeId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['PAID', 'UNPAID', 'OVERDUE'] })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['billDate', 'dueDate', 'billId'] })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bills retrieved successfully',
    schema: {
      properties: {
        bills: { type: 'array', items: { $ref: '#/components/schemas/Bill' } },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async findAll(@Query() filters: BillFilterDto): Promise<{
    bills: Bill[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const filterOptions = {
      customerId: filters.customerId,
      meterId: filters.meterId,
      utilityTypeId: filters.utilityTypeId,
      status: filters.status,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      page: filters.page || 1,
      limit: filters.limit || 20,
      sortBy: filters.sortBy || 'billDate',
      order: filters.order || 'DESC',
    };

    const { bills, total } = await this.billingService.findAll(filterOptions);

    const page = filterOptions.page;
    const limit = filterOptions.limit;
    const totalPages = Math.ceil(total / limit);

    return {
      bills,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get bill by ID with full details
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get bill details',
    description: 'Retrieve complete bill information including breakdown, taxes, and payments',
  })
  @ApiParam({ name: 'id', description: 'Bill ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bill retrieved successfully',
    type: BillResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Bill not found',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<BillResponseDto> {
    const bill = await this.billingService.findOne(id);
    return this.transformBillToResponse(bill);
  }

  /**
   * Get bill history for a specific meter
   */
  @Get('meter/:meterId')
  @ApiOperation({
    summary: 'Get meter bill history',
    description: 'Retrieve billing history for a specific meter',
  })
  @ApiParam({ name: 'meterId', description: 'Meter ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Meter bills retrieved successfully',
    type: [BillResponseDto],
  })
  async findByMeter(
    @Param('meterId', ParseIntPipe) meterId: number,
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<Bill[]> {
    const options = {
      limit,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    return this.billingService.findByMeter(meterId, options);
  }

  /**
   * Get all bills for a customer
   */
  @Get('customer/:customerId')
  @ApiOperation({
    summary: 'Get customer bills',
    description: 'Retrieve all bills for a customer across all their service connections',
  })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer bills retrieved successfully',
    type: [BillResponseDto],
  })
  async findByCustomer(@Param('customerId', ParseIntPipe) customerId: number): Promise<Bill[]> {
    return this.billingService.findByCustomer(customerId);
  }

  /**
   * Check billing eligibility for a meter
   */
  @Get('meter/:meterId/eligibility')
  @ApiOperation({
    summary: 'Check billing eligibility',
    description:
      'Check if a meter is eligible for automatic bill generation and get suggested billing period',
  })
  @ApiParam({ name: 'meterId', description: 'Meter ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Billing eligibility status',
    schema: {
      properties: {
        eligible: { type: 'boolean', description: 'Whether the meter is eligible for billing' },
        reason: { type: 'string', description: 'Explanation of eligibility status' },
        lastBillDate: {
          type: 'string',
          format: 'date',
          description: 'Date of last bill end period',
          nullable: true,
        },
        readingCount: { type: 'number', description: 'Number of unbilled readings available' },
        suggestedPeriodStart: {
          type: 'string',
          format: 'date',
          description: 'Suggested billing period start date',
          nullable: true,
        },
      },
    },
  })
  async checkBillingEligibility(@Param('meterId', ParseIntPipe) meterId: number): Promise<{
    eligible: boolean;
    reason: string;
    lastBillDate?: Date;
    readingCount?: number;
    suggestedPeriodStart?: Date;
  }> {
    return this.billingService.checkBillingEligibility(meterId);
  }

  /**
   * Manually trigger auto-bill generation for a meter
   */
  @Post('meter/:meterId/auto-generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Auto-generate bill from readings',
    description:
      'Manually trigger automatic bill generation for a meter based on available readings',
  })
  @ApiParam({ name: 'meterId', description: 'Meter ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bill generation result',
    schema: {
      properties: {
        success: { type: 'boolean' },
        bill: { $ref: '#/components/schemas/BillResponseDto', nullable: true },
        message: { type: 'string' },
      },
    },
  })
  async autoGenerateBill(
    @Param('meterId', ParseIntPipe) meterId: number,
    @Body() options?: { minDaysBetweenBills?: number; dueDaysFromBillDate?: number },
  ): Promise<{ success: boolean; bill?: BillResponseDto; message: string }> {
    const bill = await this.billingService.generateBillFromReading(meterId, new Date(), options);

    if (bill) {
      return {
        success: true,
        bill: this.transformBillToResponse(bill),
        message: `Bill #${bill.billId} generated successfully`,
      };
    }

    // Check why bill wasn't generated
    const eligibility = await this.billingService.checkBillingEligibility(meterId);
    return {
      success: false,
      message: eligibility.reason,
    };
  }

  /**
   * Get billing statistics and summary
   */
  @Get('summary')
  @ApiOperation({
    summary: 'Get billing summary',
    description:
      'Retrieve billing statistics including total, paid, outstanding, and overdue amounts',
  })
  @ApiQuery({ name: 'customerId', required: false, type: Number })
  @ApiQuery({ name: 'utilityTypeId', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Billing summary retrieved successfully',
    type: BillSummaryDto,
  })
  async getSummary(
    @Query('customerId') customerId?: number,
    @Query('utilityTypeId') utilityTypeId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<BillSummaryDto> {
    const filters = {
      customerId,
      utilityTypeId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const result = await this.billingService.getSummary(filters);

    // Map service response to DTO format
    return {
      totalBills: result.totalBills,
      totalAmount: result.totalAmount,
      totalPaid: result.paidAmount,
      totalOutstanding: result.outstanding,
      overdueBills: result.overdueBills,
      overdueAmount: result.overdueAmount,
    };
  }

  /**
   * Update/correct a bill
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update bill',
    description: 'Update bill fields such as due date, subsidy, or solar credit',
  })
  @ApiParam({ name: 'id', description: 'Bill ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bill updated successfully',
    type: BillResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Bill not found',
  })
  // @Roles('ADMIN', 'MANAGER')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateBillDto,
    @Req() req: Request & { user?: { employeeId?: number } },
  ): Promise<BillResponseDto> {
    const employeeId = req.user?.employeeId; // TODO: Get from JWT token

    const updates = {
      dueDate: updateDto.dueDate ? new Date(updateDto.dueDate) : undefined,
      subsidyAmount: updateDto.subsidyAmount,
      solarExportCredit: updateDto.solarExportCredit,
    };

    const bill = await this.billingService.update(id, updates, employeeId);
    return this.transformBillToResponse(bill);
  }

  /**
   * Recalculate a bill
   */
  @Post(':id/recalculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recalculate bill',
    description: 'Recalculate bill with updated tariffs or readings',
  })
  @ApiParam({ name: 'id', description: 'Bill ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bill recalculated successfully',
    type: BillResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Bill not found',
  })
  // @Roles('ADMIN', 'MANAGER')
  async recalculate(@Param('id', ParseIntPipe) id: number): Promise<BillResponseDto> {
    const bill = await this.billingService.recalculate(id);
    return this.transformBillToResponse(bill);
  }

  /**
   * Void/cancel a bill
   */
  @Post(':id/void')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Void bill',
    description: 'Cancel/void a bill that has not been paid',
  })
  @ApiParam({ name: 'id', description: 'Bill ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Bill voided successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bill has payments and cannot be voided',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Bill not found',
  })
  // @Roles('ADMIN', 'MANAGER')
  async void(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason: string },
    @Req() req: Request & { user?: { employeeId?: number } },
  ): Promise<void> {
    const employeeId = req.user?.employeeId || 1; // TODO: Get from JWT token

    await this.billingService.void(id, body.reason, employeeId);
  }

  /**
   * Download bill as PDF
   */
  @Get(':id/download')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="bill.pdf"')
  @ApiOperation({
    summary: 'Download bill PDF',
    description: 'Generate and download bill as PDF document',
  })
  @ApiParam({ name: 'id', description: 'Bill ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'PDF generated successfully',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Bill not found',
  })
  async downloadPdf(@Param('id', ParseIntPipe) _id: number): Promise<StreamableFile> {
    void _id; // Reserved for future PDF generation
    // TODO: Implement PDF generation
    // const bill = await this.billingService.findOne(_id);
    // const pdfBuffer = await this.generatePdf(bill);
    // return new StreamableFile(pdfBuffer);

    throw new Error('PDF generation not yet implemented');
  }

  /**
   * Export bills to CSV
   */
  @Get('export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="bills.csv"')
  @ApiOperation({
    summary: 'Export bills to CSV',
    description: 'Export filtered bills to CSV file',
  })
  @ApiQuery({ name: 'customerId', required: false, type: Number })
  @ApiQuery({ name: 'meterId', required: false, type: Number })
  @ApiQuery({ name: 'utilityTypeId', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'CSV generated successfully',
    content: {
      'text/csv': {
        schema: {
          type: 'string',
        },
      },
    },
  })
  async exportCsv(@Query() _filters: BillFilterDto): Promise<StreamableFile> {
    void _filters; // Reserved for future CSV export
    // TODO: Implement CSV export
    // const { bills } = await this.billingService.findAll(_filters);
    // const csvBuffer = this.generateCsv(bills);
    // return new StreamableFile(csvBuffer);

    throw new Error('CSV export not yet implemented');
  }

  /**
   * Get overdue bills
   */
  @Get('overdue')
  @ApiOperation({
    summary: 'Get overdue bills',
    description: 'Retrieve all bills that are past their due date and not fully paid',
  })
  @ApiQuery({ name: 'utilityTypeId', required: false, type: Number })
  @ApiQuery({ name: 'customerId', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Overdue bills retrieved successfully',
    type: [BillResponseDto],
  })
  async getOverdue(
    @Query('utilityTypeId') utilityTypeId?: number,
    @Query('customerId') customerId?: number,
  ): Promise<Bill[]> {
    const filters = {
      status: 'OVERDUE',
      utilityTypeId,
      customerId,
      endDate: new Date(), // Only bills with due date before today
    };

    const { bills } = await this.billingService.findAll(filters);
    return bills;
  }

  /**
   * Transform Bill entity to BillResponseDto
   */
  private transformBillToResponse(bill: Bill): BillResponseDto {
    const totalAmount = bill.getTotalAmount();
    const taxAmount =
      bill.billTaxes?.reduce(
        (sum, tax) => sum + (tax.taxableBaseAmount * tax.ratePercentApplied) / 100,
        0,
      ) || 0;

    return {
      billId: bill.billId,
      meterId: bill.meterId,
      meterSerialNo: bill.meter?.meterSerialNo || '',
      customerName: 'N/A', // TODO: Get from service connection when Meter entity is updated
      connectionAddress: 'N/A', // TODO: Get from service connection
      tariffCategoryName: 'Standard', // TODO: Get from tariff configuration
      utilityTypeName: bill.meter?.utilityType?.name || 'Unknown',
      billingPeriodStart: bill.billingPeriodStart,
      billingPeriodEnd: bill.billingPeriodEnd,
      billDate: bill.billDate,
      dueDate: bill.dueDate,
      totalImportUnit: bill.totalImportUnit,
      totalExportUnit: bill.totalExportUnit || 0,
      energyChargeAmount: bill.energyChargeAmount,
      fixedChargeAmount: bill.fixedChargeAmount,
      subsidyAmount: bill.subsidyAmount || 0,
      solarExportCredit: bill.solarExportCredit || 0,
      details:
        bill.billDetails?.map((detail) => ({
          slabRange: `${detail.tariffSlab?.fromUnit || 0}-${detail.tariffSlab?.toUnit || 'Above'} units`,
          unitsInSlab: detail.unitsInSlab,
          ratePerUnit: detail.tariffSlab?.ratePerUnit || 0,
          amount: detail.amount,
        })) || [],
      taxes:
        bill.billTaxes?.map((tax) => ({
          taxName: tax.taxConfig?.taxName || 'Unknown Tax',
          ratePercent: tax.ratePercentApplied,
          taxableAmount: tax.taxableBaseAmount,
          taxAmount: (tax.taxableBaseAmount * tax.ratePercentApplied) / 100,
        })) || [],
      totalAmount,
      taxAmount,
      isPaid: bill.isPaid(),
      isOverdue: bill.isOverdue(),
      payments: bill.payments?.map((payment) => ({
        paymentId: payment.paymentId,
        paymentDate: payment.paymentDate,
        paymentAmount: payment.paymentAmount,
        paymentMethod: payment.paymentMethod,
        transactionRef: payment.transactionRef || '',
      })),
    };
  }
}
