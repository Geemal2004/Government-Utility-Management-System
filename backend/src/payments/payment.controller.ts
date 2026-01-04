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
  UseGuards,
  StreamableFile,
  Header,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';
import { PaymentService } from './payment.service';
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  PaymentFilterDto,
  PaymentResponseDto,
  RefundDto,
} from './dto';
import { Payment } from '../database/entities/payment.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

/**
 * Controller for payment operations
 * Handles payment recording, retrieval, and management
 */
@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. POST /payments - Record a payment
  // ═══════════════════════════════════════════════════════════════════════════

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CASHIER', 'ADMIN', 'MANAGER')
  @ApiOperation({
    summary: 'Record a payment',
    description: 'Record a new payment against a bill',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Payment recorded successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid payment data or validation failed',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Bill not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Duplicate transaction reference',
  })
  async create(
    @Body() createDto: CreatePaymentDto,
    @CurrentUser('employeeId') employeeId: number,
  ): Promise<PaymentResponseDto> {
    const payment = await this.paymentService.create(createDto, employeeId);
    return this.transformToResponse(payment);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. GET /payments - Get payments with filters
  // ═══════════════════════════════════════════════════════════════════════════

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get payments with filters',
    description: 'Retrieve payments with optional filters, pagination, and sorting',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payments retrieved successfully',
    schema: {
      properties: {
        payments: { type: 'array', items: { $ref: '#/components/schemas/PaymentResponseDto' } },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async findAll(@Query() filters: PaymentFilterDto): Promise<{
    payments: PaymentResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { payments, total } = await this.paymentService.findAll(filters);
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const totalPages = Math.ceil(total / limit);

    return {
      payments: payments.map((p) => this.transformToResponse(p)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. GET /payments/summary - Get payment statistics
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get payment statistics',
    description: 'Retrieve payment statistics with breakdowns by method and channel',
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'employeeId', required: false, type: Number })
  @ApiQuery({ name: 'customerId', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment summary retrieved successfully',
  })
  async getSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('employeeId') employeeId?: number,
    @Query('customerId') customerId?: number,
  ) {
    return this.paymentService.getSummary({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      employeeId,
      customerId,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. GET /payments/daily-report/:date - Get daily collection report
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('daily-report/:date')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get daily collection report',
    description: 'Generate daily collection report for a cashier',
  })
  @ApiParam({ name: 'date', description: 'Date (YYYY-MM-DD format)' })
  @ApiQuery({ name: 'employeeId', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Daily report generated successfully',
  })
  async getDailyReport(
    @Param('date') date: string,
    @Query('employeeId') employeeId?: number,
    @CurrentUser('employeeId') currentEmployeeId?: number,
  ) {
    const targetEmployeeId = employeeId || currentEmployeeId;
    if (!targetEmployeeId) {
      throw new Error('Employee ID is required');
    }
    return this.paymentService.getDailyCollectionReport(targetEmployeeId, new Date(date));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 15. GET /payments/overpayments - Get overpaid bills
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('overpayments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'CASHIER')
  @ApiOperation({
    summary: 'Get overpaid bills',
    description: 'Retrieve all overpaid bills for refund processing',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Overpayments retrieved successfully',
  })
  async getOverpayments() {
    return this.paymentService.getOverpayments();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 18. GET /payments/pending-reconciliation - Get pending reconciliation
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('pending-reconciliation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'CASHIER')
  @ApiOperation({
    summary: 'Get payments pending reconciliation',
    description: 'Retrieve payments needing manual reconciliation',
  })
  @ApiQuery({ name: 'date', required: true, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pending payments retrieved successfully',
  })
  async getPendingReconciliation(@Query('date') date: string) {
    return this.paymentService.getPendingReconciliation(new Date(date));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 16. GET /payments/export - Export payments to CSV
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('export')
  @UseGuards(JwtAuthGuard)
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="payments.csv"')
  @ApiOperation({
    summary: 'Export payments to CSV',
    description: 'Export filtered payments to CSV file',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'CSV exported successfully',
    content: {
      'text/csv': {
        schema: {
          type: 'string',
        },
      },
    },
  })
  async exportPayments(
    @Query() filters: PaymentFilterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const buffer = await this.paymentService.exportPayments(filters);
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="payments-${new Date().toISOString().split('T')[0]}.csv"`,
    });
    return new StreamableFile(buffer);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. GET /payments/search/transaction/:transactionRef - Find by transaction ref
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('search/transaction/:transactionRef')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Find payment by transaction reference',
    description: 'Search for a payment using its transaction reference',
  })
  @ApiParam({ name: 'transactionRef', description: 'Transaction reference' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment found',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
  })
  async searchByTransactionRef(
    @Param('transactionRef') transactionRef: string,
  ): Promise<PaymentResponseDto | null> {
    const payment = await this.paymentService.searchByTransactionRef(transactionRef);
    return payment ? this.transformToResponse(payment) : null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. GET /payments/cashier/:employeeId/collections - Get cashier collections
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('cashier/:employeeId/collections')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get cashier collections for day',
    description: 'Retrieve all payments collected by a cashier on a specific date',
  })
  @ApiParam({ name: 'employeeId', description: 'Employee/Cashier ID' })
  @ApiQuery({ name: 'date', required: true, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cashier collections retrieved successfully',
  })
  async getCashierCollections(
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Query('date') date: string,
  ) {
    return this.paymentService.findByEmployee(employeeId, new Date(date));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. GET /payments/bill/:billId - Get all payments for a bill
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('bill/:billId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get payments for a bill',
    description: 'Retrieve all payments made against a specific bill',
  })
  @ApiParam({ name: 'billId', description: 'Bill ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payments retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Bill not found',
  })
  async findByBill(@Param('billId', ParseIntPipe) billId: number): Promise<PaymentResponseDto[]> {
    const payments = await this.paymentService.findByBill(billId);
    return payments.map((p) => this.transformToResponse(p));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. GET /payments/bill/:billId/outstanding - Get outstanding amount
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('bill/:billId/outstanding')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get outstanding amount for bill',
    description: 'Calculate the outstanding balance for a bill',
  })
  @ApiParam({ name: 'billId', description: 'Bill ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Outstanding amount calculated',
    schema: {
      properties: {
        billId: { type: 'number' },
        totalAmount: { type: 'number' },
        totalPaid: { type: 'number' },
        outstanding: { type: 'number' },
      },
    },
  })
  async getBillOutstanding(@Param('billId', ParseIntPipe) billId: number): Promise<{
    billId: number;
    totalAmount: number;
    totalPaid: number;
    outstanding: number;
  }> {
    const outstanding = await this.paymentService.getBillOutstanding(billId);
    // We need to get bill details to compute totalAmount and totalPaid
    // For simplicity, we return the outstanding directly
    return {
      billId,
      totalAmount: 0, // Would need to fetch from bill
      totalPaid: 0, // Would need to calculate
      outstanding,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. GET /payments/customer/:customerId - Get payment history for customer
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('customer/:customerId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get payment history for customer',
    description: 'Retrieve payment history for a specific customer',
  })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment history retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer not found',
  })
  async findByCustomer(
    @Param('customerId', ParseIntPipe) customerId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
  ): Promise<PaymentResponseDto[]> {
    const payments = await this.paymentService.findByCustomer(customerId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
    });
    return payments.map((p) => this.transformToResponse(p));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. GET /payments/:id - Get payment details
  // ═══════════════════════════════════════════════════════════════════════════

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get payment details',
    description: 'Retrieve complete payment information',
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment retrieved successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<PaymentResponseDto> {
    const payment = await this.paymentService.findOne(id);
    return this.transformToResponse(payment);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. GET /payments/:id/receipt - Download payment receipt as PDF
  // ═══════════════════════════════════════════════════════════════════════════

  @Get(':id/receipt')
  @UseGuards(JwtAuthGuard)
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({
    summary: 'Download payment receipt as PDF',
    description: 'Generate and download payment receipt as PDF',
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
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
    description: 'Payment not found',
  })
  async downloadReceipt(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    // Get payment to validate existence
    const payment = await this.paymentService.findOne(id);

    // TODO: Implement PDF generation
    // For now, return a placeholder
    const pdfContent = `Payment Receipt\n\nPayment ID: ${payment.paymentId}\nReceipt: ${payment.receiptNumber}\nAmount: ${payment.paymentAmount}\nDate: ${payment.paymentDate}\n`;
    const buffer = Buffer.from(pdfContent, 'utf-8');

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="receipt-${payment.receiptNumber}.pdf"`,
    });

    return new StreamableFile(buffer);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. PUT /payments/:id - Update payment details
  // ═══════════════════════════════════════════════════════════════════════════

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({
    summary: 'Update payment details',
    description: 'Update payment details (corrections only)',
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment updated successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Duplicate transaction reference',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePaymentDto,
  ): Promise<PaymentResponseDto> {
    const payment = await this.paymentService.update(id, updateDto);
    return this.transformToResponse(payment);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. POST /payments/:id/refund - Process refund
  // ═══════════════════════════════════════════════════════════════════════════

  @Post(':id/refund')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({
    summary: 'Process refund',
    description: 'Process a refund for a payment',
  })
  @ApiParam({ name: 'id', description: 'Payment ID to refund' })
  @ApiBody({ type: RefundDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Refund processed successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid refund amount or already refunded',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
  })
  async processRefund(
    @Param('id', ParseIntPipe) id: number,
    @Body() refundDto: RefundDto,
    @CurrentUser('employeeId') employeeId: number,
  ): Promise<PaymentResponseDto> {
    const refundPayment = await this.paymentService.processRefund(
      {
        paymentId: id,
        refundAmount: refundDto.refundAmount,
        refundReason: refundDto.refundReason,
        refundMethod: refundDto.refundMethod,
      },
      employeeId,
    );
    return this.transformToResponse(refundPayment);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. POST /payments/:id/void - Void payment
  // ═══════════════════════════════════════════════════════════════════════════

  @Post(':id/void')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({
    summary: 'Void payment',
    description: 'Void/cancel a payment while maintaining audit trail',
  })
  @ApiParam({ name: 'id', description: 'Payment ID to void' })
  @ApiBody({
    schema: {
      properties: {
        reason: { type: 'string', description: 'Reason for voiding' },
      },
      required: ['reason'],
    },
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Payment voided successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Payment already voided or is a refund',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
  })
  async voidPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason: string },
    @CurrentUser('employeeId') employeeId: number,
  ): Promise<void> {
    await this.paymentService.voidPayment(id, body.reason, employeeId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 17. POST /payments/reconcile - Reconcile daily payments
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('reconcile')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({
    summary: 'Reconcile daily payments',
    description: 'Compare expected vs actual payments for reconciliation',
  })
  @ApiBody({
    schema: {
      properties: {
        date: { type: 'string', format: 'date' },
        expectedAmount: { type: 'number' },
        actualAmount: { type: 'number' },
      },
      required: ['date', 'expectedAmount', 'actualAmount'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reconciliation report generated',
  })
  async reconcilePayments(
    @Body() body: { date: string; expectedAmount: number; actualAmount: number },
  ) {
    return this.paymentService.reconcilePayments(
      new Date(body.date),
      body.expectedAmount,
      body.actualAmount,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Transform Payment entity to PaymentResponseDto
   */
  private transformToResponse(payment: Payment): PaymentResponseDto {
    const bill = payment.bill;
    const customer = payment.customer;
    const employee = payment.employee;

    // Get bill outstanding calculation
    const billAmount = bill?.getTotalAmount() || 0;
    const billPaid = bill?.getTotalPaid() || 0;
    const outstandingBefore = billAmount - billPaid + Number(payment.paymentAmount);
    const newOutstanding = billAmount - billPaid;

    return {
      paymentId: payment.paymentId,
      billId: payment.billId,
      customerId: payment.customerId,
      employeeId: payment.employeeId,
      paymentDate: payment.paymentDate,
      paymentAmount: Number(payment.paymentAmount),
      paymentMethod: payment.paymentMethod,
      paymentChannel: payment.paymentChannel,
      transactionRef: payment.transactionRef,
      notes: null, // Notes field to be added in future
      billNumber: `BILL-${bill?.billId || 0}`,
      customerName: customer?.fullName || 'Unknown',
      customerEmail: customer?.email || null,
      billAmount: billAmount,
      billOutstanding: outstandingBefore,
      newOutstanding: newOutstanding,
      receiptNumber: payment.receiptNumber,
      recordedByName: employee?.fullName || null,
      billDetails: {
        period: bill
          ? `${bill.billingPeriodStart?.toISOString().split('T')[0] || ''} to ${bill.billingPeriodEnd?.toISOString().split('T')[0] || ''}`
          : '',
        utilityType: bill?.meter?.utilityType?.name || 'Unknown',
        meterSerialNo: bill?.meter?.meterSerialNo || '',
      },
    };
  }
}
