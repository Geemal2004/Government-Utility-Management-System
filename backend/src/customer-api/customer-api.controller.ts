import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  ParseIntPipe,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { PaymentService } from '../payments/payment.service';
import { BillingService } from '../billing/billing.service';
import { CustomerJwtGuard } from '../auth/guards/customer-jwt.guard';
import {
  CurrentCustomer,
  CustomerPayload,
} from '../common/decorators/current-customer.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../database/entities/payment.entity';
import { Bill } from '../database/entities/bill.entity';
import { ServiceConnection } from '../database/entities/service-connection.entity';

/**
 * Customer-facing API Controller
 * Handles customer portal functionality for bills, payments, and dashboard
 * Uses customer JWT authentication (different from employee JWT)
 */
@ApiTags('Customer Portal')
@ApiBearerAuth()
@Controller('customer')
export class CustomerApiController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly billingService: BillingService,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Bill)
    private readonly billRepository: Repository<Bill>,
    @InjectRepository(ServiceConnection)
    private readonly connectionRepository: Repository<ServiceConnection>,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // DASHBOARD ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get customer dashboard data
   * Returns aggregated data for customer dashboard view
   */
  @Get('dashboard')
  @UseGuards(CustomerJwtGuard)
  @ApiOperation({
    summary: 'Get customer dashboard data',
    description: 'Get aggregated dashboard data including outstanding balance, recent bills, and payments',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard data retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing authentication token',
  })
  async getDashboardData(@CurrentCustomer() customer: CustomerPayload) {
    const customerId = customer.customerId;

    // Get unpaid bills
    const billsData = await this.paymentService.getCustomerUnpaidBills(customerId);

    // Get recent payments (last 5)
    const payments = await this.paymentService.findByCustomer(customerId, { limit: 5 });

    // Get service connections count
    const connections = await this.connectionRepository.find({
      where: { customerId },
      relations: ['utilityType', 'meter', 'connectionAddress'],
    });

    return {
      customer: {
        customerId: customer.customerId,
        name: customer.fullName,
        email: customer.email,
      },
      accountSummary: {
        totalOutstanding: billsData.totalOutstanding,
        unpaidBillCount: billsData.unpaidBillCount,
        overdueBillCount: billsData.overdueBillCount,
        nextDueDate: billsData.bills[0]?.dueDate || null,
      },
      unpaidBills: billsData.bills.slice(0, 5),
      recentPayments: payments.slice(0, 5).map((p) => ({
        paymentId: p.paymentId,
        paymentDate: p.paymentDate,
        amount: Number(p.paymentAmount),
        method: p.paymentMethod,
        receiptNumber: p.receiptNumber,
        billNumber: `BILL-${p.billId}`,
      })),
      serviceConnections: connections.map((c) => ({
        connectionId: c.connectionId,
        utilityType: c.utilityType?.name || 'Unknown',
        meterSerialNo: c.meter?.meterSerialNo || 'N/A',
        status: c.connectionStatus,
        address: c.connectionAddress?.line1 || 'N/A',
      })),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BILLS ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get customer's bills (unpaid and recent)
   */
  @Get('my-bills')
  @UseGuards(CustomerJwtGuard)
  @ApiOperation({
    summary: "Get customer's bills",
    description: 'Get all unpaid bills and optionally recent paid bills',
  })
  @ApiQuery({ name: 'includeHistory', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bills retrieved successfully',
  })
  async getMyBills(
    @CurrentCustomer() customer: CustomerPayload,
    @Query('includeHistory') includeHistory?: string,
    @Query('limit') limit?: number,
  ) {
    const customerId = customer.customerId;

    // Get unpaid bills
    const billsData = await this.paymentService.getCustomerUnpaidBills(customerId);

    // Get bill history if requested
    let paidBills: any[] = [];
    if (includeHistory === 'true') {
      const allBills = await this.billingService.findByCustomer(customerId);
      paidBills = allBills
        .filter((b) => b.isPaid())
        .slice(0, limit || 10)
        .map((b) => ({
          billId: b.billId,
          billNumber: `BILL-${b.billId}`,
          billDate: b.billDate,
          dueDate: b.dueDate,
          amount: b.getTotalAmount(),
          status: b.isPaid() ? 'PAID' : 'UNPAID',
          billingPeriod: `${b.billingPeriodStart?.toISOString().split('T')[0] || ''} - ${b.billingPeriodEnd?.toISOString().split('T')[0] || ''}`,
        }));
    }

    return {
      totalOutstanding: billsData.totalOutstanding,
      unpaidBillCount: billsData.unpaidBillCount,
      overdueBillCount: billsData.overdueBillCount,
      bills: billsData.bills,
      paidBills,
    };
  }

  /**
   * Get specific bill details
   */
  @Get('bills/:billId')
  @UseGuards(CustomerJwtGuard)
  @ApiOperation({
    summary: 'Get bill details',
    description: 'Get detailed information about a specific bill',
  })
  @ApiParam({ name: 'billId', description: 'Bill ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bill details retrieved successfully',
  })
  async getBillDetails(
    @CurrentCustomer() customer: CustomerPayload,
    @Param('billId', ParseIntPipe) billId: number,
  ) {
    const bill = await this.billingService.findOne(billId);

    // Verify bill belongs to customer
    const connection = await this.connectionRepository.findOne({
      where: { meterId: bill.meterId },
    });

    if (!connection || connection.customerId !== customer.customerId) {
      return { error: 'Bill not found', status: 404 };
    }

    const payments = await this.paymentService.findByBill(billId);

    return {
      billId: bill.billId,
      billNumber: `BILL-${bill.billId}`,
      billDate: bill.billDate,
      dueDate: bill.dueDate,
      billingPeriodStart: bill.billingPeriodStart,
      billingPeriodEnd: bill.billingPeriodEnd,
      totalAmount: bill.getTotalAmount(),
      totalPaid: bill.getTotalPaid(),
      outstanding: bill.getTotalAmount() - bill.getTotalPaid(),
      status: bill.isPaid() ? 'PAID' : bill.isOverdue() ? 'OVERDUE' : 'UNPAID',
      meterSerialNo: bill.meter?.meterSerialNo,
      utilityType: bill.meter?.utilityType?.name,
      totalImportUnit: bill.totalImportUnit,
      totalExportUnit: bill.totalExportUnit,
      energyChargeAmount: bill.energyChargeAmount,
      fixedChargeAmount: bill.fixedChargeAmount,
      subsidyAmount: bill.subsidyAmount,
      solarExportCredit: bill.solarExportCredit,
      details: bill.billDetails?.map((d) => ({
        slabRange: d.getSlabRangeDescription(),
        unitsInSlab: d.unitsInSlab,
        ratePerUnit: d.getRatePerUnit(),
        amount: d.amount,
      })),
      taxes: bill.billTaxes?.map((t) => ({
        taxName: t.taxConfig?.taxName || 'Tax',
        taxRate: t.ratePercentApplied,
        taxableBase: t.taxableBaseAmount,
        taxAmount: t.getTaxAmount(),
      })),
      payments: payments.map((p) => ({
        paymentId: p.paymentId,
        paymentDate: p.paymentDate,
        amount: Number(p.paymentAmount),
        method: p.paymentMethod,
        receiptNumber: p.receiptNumber,
      })),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAYMENT HISTORY ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get customer's payment history
   */
  @Get('payments/history')
  @UseGuards(CustomerJwtGuard)
  @ApiOperation({
    summary: 'Get payment history',
    description: "Get customer's payment history with optional filtering",
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment history retrieved successfully',
  })
  async getPaymentHistory(
    @CurrentCustomer() customer: CustomerPayload,
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const payments = await this.paymentService.findByCustomer(customer.customerId, {
      limit: limit || 50,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return payments.map((p) => ({
      paymentId: p.paymentId,
      paymentDate: p.paymentDate,
      amount: Number(p.paymentAmount),
      method: p.paymentMethod,
      channel: p.paymentChannel,
      receiptNumber: p.receiptNumber,
      transactionRef: p.transactionRef,
      status: p.paymentStatus,
      billId: p.billId,
      billNumber: p.bill ? `BILL-${p.bill.billId}` : null,
    }));
  }

  /**
   * Get payment receipt
   */
  @Get('payments/:paymentId/receipt')
  @UseGuards(CustomerJwtGuard)
  @ApiOperation({
    summary: 'Get payment receipt',
    description: 'Get payment receipt details',
  })
  @ApiParam({ name: 'paymentId', description: 'Payment ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Receipt retrieved successfully',
  })
  async getPaymentReceipt(
    @CurrentCustomer() customer: CustomerPayload,
    @Param('paymentId', ParseIntPipe) paymentId: number,
  ) {
    const payment = await this.paymentService.findOne(paymentId);

    // Verify payment belongs to customer
    if (payment.customerId !== customer.customerId) {
      return { error: 'Payment not found', status: 404 };
    }

    return {
      paymentId: payment.paymentId,
      receiptNumber: payment.receiptNumber,
      paymentDate: payment.paymentDate,
      amount: Number(payment.paymentAmount),
      method: payment.paymentMethod,
      channel: payment.paymentChannel,
      transactionRef: payment.transactionRef,
      status: payment.paymentStatus,
      bill: payment.bill
        ? {
            billId: payment.bill.billId,
            billNumber: `BILL-${payment.bill.billId}`,
            billDate: payment.bill.billDate,
            totalAmount: payment.bill.getTotalAmount(),
          }
        : null,
      customer: {
        customerId: customer.customerId,
        name: customer.fullName,
        email: customer.email,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAYMENT INITIATION ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create Stripe checkout session for bill payment
   */
  @Post('payments/checkout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CustomerJwtGuard)
  @ApiOperation({
    summary: 'Create payment checkout session',
    description: 'Create a Stripe checkout session for paying selected bills',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Checkout session created successfully',
  })
  async createCheckoutSession(
    @CurrentCustomer() customer: CustomerPayload,
    @Body() body: { billIds: number[]; successUrl?: string; cancelUrl?: string },
  ) {
    const { billIds, successUrl, cancelUrl } = body;

    // Verify all bills belong to customer
    for (const billId of billIds) {
      const bill = await this.billRepository.findOne({
        where: { billId },
        relations: ['meter'],
      });

      if (!bill) {
        return { error: `Bill ${billId} not found`, status: 404 };
      }

      const connection = await this.connectionRepository.findOne({
        where: { meterId: bill.meterId },
      });

      if (!connection || connection.customerId !== customer.customerId) {
        return { error: `Bill ${billId} does not belong to you`, status: 403 };
      }
    }

    // Create checkout session using the payment service
    try {
      const session = await this.paymentService.createCheckoutSession(
        {
          billIds,
          successUrl: successUrl || `${process.env.CUSTOMER_PORTAL_URL || 'http://localhost:3000'}/customer/payments/success`,
          cancelUrl: cancelUrl || `${process.env.CUSTOMER_PORTAL_URL || 'http://localhost:3000'}/customer/payments/cancel`,
        },
        customer.customerId,
      );

      return session;
    } catch (error) {
      return { error: error.message || 'Failed to create checkout session', status: 500 };
    }
  }

  /**
   * Get service connections
   */
  @Get('connections')
  @UseGuards(CustomerJwtGuard)
  @ApiOperation({
    summary: 'Get service connections',
    description: "Get customer's service connections",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Connections retrieved successfully',
  })
  async getConnections(@CurrentCustomer() customer: CustomerPayload) {
    const connections = await this.connectionRepository.find({
      where: { customerId: customer.customerId },
      relations: ['utilityType', 'meter', 'tariffCategory', 'connectionAddress'],
    });

    return connections.map((c) => ({
      connectionId: c.connectionId,
      utilityType: c.utilityType?.name || 'Unknown',
      meterSerialNo: c.meter?.meterSerialNo || 'N/A',
      status: c.connectionStatus,
      serviceAddress: c.connectionAddress?.line1 || 'N/A',
      tariffCategory: c.tariffCategory?.name || 'Standard',
    }));
  }
}
