import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
    Logger,
    InternalServerErrorException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, LessThanOrEqual, MoreThanOrEqual, Like, In, IsNull, Not } from 'typeorm';
import {
    Payment,
    PaymentMethod,
    PaymentChannel,
    PaymentStatus,
    PAYMENT_METHODS_REQUIRING_REF,
    STRIPE_PAYMENT_METHODS,
} from '../database/entities/payment.entity';
import { Bill } from '../database/entities/bill.entity';
import { Customer } from '../database/entities/customer.entity';
import { Employee } from '../database/entities/employee.entity';
import { StripeService, CheckoutLineItem } from '../stripe/stripe.service';
import {
    CreatePaymentDto,
    UpdatePaymentDto,
    PaymentFilterDto,
    CreateCheckoutSessionDto,
    CheckoutSessionResponseDto,
    ConfirmStripePaymentDto,
    CustomerBillPaymentDto,
    CustomerBillsResponseDto,
    PaymentIntentResponseDto,
    StripeWebhookEventDto,
    StripeWebhookEventType,
    CreateCashierPaymentDto,
    CashierPaymentMethod,
    RefundDto,
    PaymentSummaryDto,
    DailyCollectionReportDto,
} from './dto';

/**
 * Service for payment operations
 * Handles payment recording, retrieval, and business rule enforcement
 */
@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);

    /**
     * Tolerance for overpayment (10%)
     * Payments exceeding outstanding + tolerance will be rejected
     */
    private readonly OVERPAYMENT_TOLERANCE = 0.10;

    constructor(
        @InjectRepository(Payment)
        private paymentRepository: Repository<Payment>,
        @InjectRepository(Bill)
        private billRepository: Repository<Bill>,
        @InjectRepository(Customer)
        private customerRepository: Repository<Customer>,
        @InjectRepository(Employee)
        private employeeRepository: Repository<Employee>,
        private dataSource: DataSource,
        private stripeService: StripeService,
    ) { }

    // ═══════════════════════════════════════════════════════════════════════════
    // CREATE PAYMENT
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Record a new payment
     *
     * @param createDto - Payment creation data
     * @param employeeId - ID of employee recording the payment (optional)
     * @returns Created payment with populated relations
     *
     * @throws NotFoundException if bill not found
     * @throws BadRequestException if validation fails
     * @throws ConflictException if duplicate transaction reference
     */
    async create(createDto: CreatePaymentDto, employeeId?: number): Promise<Payment> {
        this.logger.log(`Recording payment for bill ${createDto.billId}, amount: ${createDto.paymentAmount}`);

        // Step a) Get bill with full details
        const bill = await this.billRepository.findOne({
            where: { billId: createDto.billId },
            relations: ['meter', 'payments', 'billDetails', 'billTaxes'],
        });

        // Step b) Validate bill exists
        if (!bill) {
            throw new NotFoundException(`Bill with ID ${createDto.billId} not found`);
        }

        // Step c) Calculate bill outstanding amount
        const totalBillAmount = bill.getTotalAmount();
        const totalPaid = bill.getTotalPaid();
        const outstanding = totalBillAmount - totalPaid;

        this.logger.debug(
            `Bill ${createDto.billId}: Total=${totalBillAmount}, Paid=${totalPaid}, Outstanding=${outstanding}`
        );

        // Step d) Validate payment amount <= outstanding + tolerance
        const maxAllowedPayment = outstanding * (1 + this.OVERPAYMENT_TOLERANCE);

        if (createDto.paymentAmount > maxAllowedPayment && outstanding > 0) {
            throw new BadRequestException(
                `Payment amount ${createDto.paymentAmount} exceeds maximum allowed ${maxAllowedPayment.toFixed(2)} ` +
                `(outstanding ${outstanding.toFixed(2)} + ${this.OVERPAYMENT_TOLERANCE * 100}% tolerance)`
            );
        }

        // Step e) Log overpayment warning
        if (createDto.paymentAmount > outstanding && outstanding > 0) {
            this.logger.warn(
                `Overpayment detected for bill ${createDto.billId}: ` +
                `Paying ${createDto.paymentAmount} when outstanding is ${outstanding}. ` +
                `Consider creating credit note.`
            );
        }

        // Step f) Validate transaction reference
        if (PAYMENT_METHODS_REQUIRING_REF.includes(createDto.paymentMethod)) {
            if (!createDto.transactionRef || createDto.transactionRef.trim().length === 0) {
                throw new BadRequestException(
                    `Transaction reference is required for ${createDto.paymentMethod} payments`
                );
            }

            // Check for duplicate transaction reference
            const existingPayment = await this.paymentRepository.findOne({
                where: { transactionRef: createDto.transactionRef },
            });

            if (existingPayment) {
                throw new ConflictException(
                    `Transaction reference '${createDto.transactionRef}' already exists (Payment ID: ${existingPayment.paymentId})`
                );
            }
        }

        // Get customer from bill's meter connection for snapshot
        const customerId = await this.getCustomerIdFromBill(bill);

        // Validate employee if provided
        if (employeeId) {
            const employee = await this.employeeRepository.findOne({
                where: { employeeId },
            });
            if (!employee) {
                throw new NotFoundException(`Employee with ID ${employeeId} not found`);
            }
        }

        // Start transaction
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Step g, h, i) Create Payment entity
            const payment = this.paymentRepository.create({
                billId: createDto.billId,
                customerId: customerId,
                employeeId: employeeId || null,
                paymentDate: createDto.paymentDate || new Date(),
                paymentAmount: createDto.paymentAmount,
                paymentMethod: createDto.paymentMethod,
                paymentChannel: createDto.paymentChannel || PaymentChannel.CASHIER_PORTAL,
                paymentStatus: PaymentStatus.COMPLETED,
                transactionRef: createDto.transactionRef || null,
            });

            // Step k) Save payment
            const savedPayment = await queryRunner.manager.save(Payment, payment) as Payment;

            // Step l) Log if bill is now fully paid
            const newOutstanding = outstanding - createDto.paymentAmount;
            if (newOutstanding <= 0) {
                this.logger.log(`Bill ${createDto.billId} is now fully paid`);
            }

            // Commit transaction
            await queryRunner.commitTransaction();

            // Step m) Log payment creation
            this.logger.log(
                `Payment ${savedPayment.paymentId} created successfully. ` +
                `Receipt: ${savedPayment.receiptNumber}, Amount: ${savedPayment.paymentAmount}`
            );

            // Step n) Return payment with populated relations
            return this.findOne(savedPayment.paymentId);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Failed to create payment for bill ${createDto.billId}:`, error);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FIND ALL PAYMENTS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Get payments with filtering and pagination
     *
     * @param filters - Filter and pagination options
     * @returns Payments array and total count
     */
    async findAll(filters: PaymentFilterDto): Promise<{ payments: Payment[]; total: number }> {
        this.logger.debug(`Finding payments with filters: ${JSON.stringify(filters)}`);

        // Step a) Build query with filters
        const queryBuilder = this.paymentRepository
            .createQueryBuilder('payment')
            // Step b) Join with Bill, Customer, Employee
            .leftJoinAndSelect('payment.bill', 'bill')
            .leftJoinAndSelect('bill.meter', 'meter')
            .leftJoinAndSelect('meter.utilityType', 'utilityType')
            .leftJoinAndSelect('payment.customer', 'customer')
            .leftJoinAndSelect('payment.employee', 'employee');

        // Apply bill filter
        if (filters.billId) {
            queryBuilder.andWhere('payment.billId = :billId', { billId: filters.billId });
        }

        // Apply customer filter
        if (filters.customerId) {
            queryBuilder.andWhere('payment.customerId = :customerId', { customerId: filters.customerId });
        }

        // Apply employee filter
        if (filters.employeeId) {
            queryBuilder.andWhere('payment.employeeId = :employeeId', { employeeId: filters.employeeId });
        }

        // Apply payment method filter
        if (filters.paymentMethod) {
            queryBuilder.andWhere('payment.paymentMethod = :paymentMethod', {
                paymentMethod: filters.paymentMethod,
            });
        }

        // Apply payment channel filter
        if (filters.paymentChannel) {
            queryBuilder.andWhere('payment.paymentChannel = :paymentChannel', {
                paymentChannel: filters.paymentChannel,
            });
        }

        // Step c) Apply date range filters
        if (filters.startDate) {
            queryBuilder.andWhere('payment.paymentDate >= :startDate', { startDate: filters.startDate });
        }

        if (filters.endDate) {
            queryBuilder.andWhere('payment.paymentDate <= :endDate', { endDate: filters.endDate });
        }

        // Step d) Apply amount range filters
        if (filters.minAmount !== undefined) {
            queryBuilder.andWhere('payment.paymentAmount >= :minAmount', { minAmount: filters.minAmount });
        }

        if (filters.maxAmount !== undefined) {
            queryBuilder.andWhere('payment.paymentAmount <= :maxAmount', { maxAmount: filters.maxAmount });
        }

        // Apply transaction reference filter (partial match)
        if (filters.transactionRef) {
            queryBuilder.andWhere('payment.transactionRef LIKE :transactionRef', {
                transactionRef: `%${filters.transactionRef}%`,
            });
        }

        // Step e & f) Add pagination and sorting
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const sortBy = filters.sortBy || 'paymentDate';
        const order = filters.order || 'DESC';

        // Map camelCase to snake_case for database columns
        const sortColumn = this.mapSortColumn(sortBy);

        queryBuilder
            .orderBy(`payment.${sortColumn}`, order)
            .skip((page - 1) * limit)
            .take(limit);

        // Execute query
        const [payments, total] = await queryBuilder.getManyAndCount();

        this.logger.debug(`Found ${total} payments, returning page ${page} with ${payments.length} items`);

        // Step g) Return payments with populated relations
        return { payments, total };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FIND ONE PAYMENT
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Get payment details by ID
     *
     * @param paymentId - Payment ID to find
     * @returns Payment with full relations
     *
     * @throws NotFoundException if payment not found
     */
    async findOne(paymentId: number): Promise<Payment> {
        this.logger.debug(`Finding payment ${paymentId}`);

        // Step a & b) Find payment by ID with relations
        const payment = await this.paymentRepository.findOne({
            where: { paymentId },
            relations: [
                'bill',
                'bill.meter',
                'bill.meter.utilityType',
                'bill.billDetails',
                'bill.billTaxes',
                'bill.payments',
                'customer',
                'customer.address',
                'employee',
            ],
        });

        // Step c) Throw NotFoundException if not found
        if (!payment) {
            throw new NotFoundException(`Payment with ID ${paymentId} not found`);
        }

        // Step d) Return payment
        return payment;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FIND PAYMENTS BY BILL
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Get all payments for a bill
     *
     * @param billId - Bill ID to get payments for
     * @returns Array of payments ordered by date descending
     */
    async findByBill(billId: number): Promise<Payment[]> {
        this.logger.debug(`Finding payments for bill ${billId}`);

        // Validate bill exists
        const bill = await this.billRepository.findOne({
            where: { billId },
        });

        if (!bill) {
            throw new NotFoundException(`Bill with ID ${billId} not found`);
        }

        // Step a, b, c) Find all payments for bill_id, ordered by payment_date DESC
        const payments = await this.paymentRepository.find({
            where: { billId },
            relations: ['employee', 'customer'],
            order: { paymentDate: 'DESC' },
        });

        // Step d) Calculate running outstanding balance (in response DTO mapping)
        // This is done when mapping to response DTO

        // Step e) Return payments
        return payments;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FIND PAYMENTS BY CUSTOMER
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Get payment history for a customer
     *
     * @param customerId - Customer ID to get payments for
     * @param options - Optional filters (startDate, endDate, limit)
     * @returns Array of payments ordered by date descending
     */
    async findByCustomer(
        customerId: number,
        options?: { startDate?: Date; endDate?: Date; limit?: number }
    ): Promise<Payment[]> {
        this.logger.debug(`Finding payments for customer ${customerId}`);

        // Validate customer exists
        const customer = await this.customerRepository.findOne({
            where: { customerId },
        });

        if (!customer) {
            throw new NotFoundException(`Customer with ID ${customerId} not found`);
        }

        // Step a) Build query for customer
        const queryBuilder = this.paymentRepository
            .createQueryBuilder('payment')
            .leftJoinAndSelect('payment.bill', 'bill')
            .leftJoinAndSelect('bill.meter', 'meter')
            .leftJoinAndSelect('meter.utilityType', 'utilityType')
            .leftJoinAndSelect('payment.employee', 'employee')
            .where('payment.customerId = :customerId', { customerId });

        // Step c) Apply date filters if provided
        if (options?.startDate) {
            queryBuilder.andWhere('payment.paymentDate >= :startDate', {
                startDate: options.startDate,
            });
        }

        if (options?.endDate) {
            queryBuilder.andWhere('payment.paymentDate <= :endDate', {
                endDate: options.endDate,
            });
        }

        // Step d) Order by payment_date DESC
        queryBuilder.orderBy('payment.paymentDate', 'DESC');

        // Step e) Apply limit if provided
        if (options?.limit) {
            queryBuilder.take(options.limit);
        }

        // Step f) Return payments
        return queryBuilder.getMany();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FIND PAYMENTS BY EMPLOYEE
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Get payments recorded by employee on specific date
     * Used for cashier reconciliation
     *
     * @param employeeId - Employee ID
     * @param date - Date to get payments for
     * @returns Array of payments ordered by time ascending
     */
    async findByEmployee(employeeId: number, date: Date): Promise<Payment[]> {
        this.logger.debug(`Finding payments for employee ${employeeId} on ${date.toDateString()}`);

        // Validate employee exists
        const employee = await this.employeeRepository.findOne({
            where: { employeeId },
        });

        if (!employee) {
            throw new NotFoundException(`Employee with ID ${employeeId} not found`);
        }

        // Calculate date range (start and end of day)
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Step a, b) Find all payments by employee on date
        const payments = await this.paymentRepository
            .createQueryBuilder('payment')
            .leftJoinAndSelect('payment.bill', 'bill')
            .leftJoinAndSelect('bill.meter', 'meter')
            .leftJoinAndSelect('payment.customer', 'customer')
            .where('payment.employeeId = :employeeId', { employeeId })
            .andWhere('payment.paymentDate >= :startOfDay', { startOfDay })
            .andWhere('payment.paymentDate <= :endOfDay', { endOfDay })
            // Step c) Order by payment_date ASC
            .orderBy('payment.paymentDate', 'ASC')
            .getMany();

        // Step d) Return payments for cashier reconciliation
        return payments;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UPDATE PAYMENT
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Update payment details (corrections only)
     * Only allows updating transactionRef, notes, and paymentDate
     * Does NOT allow changing amount or method (use void/refund instead)
     *
     * @param paymentId - Payment ID to update
     * @param updateDto - Update data
     * @returns Updated payment
     *
     * @throws NotFoundException if payment not found
     */
    async update(paymentId: number, updateDto: UpdatePaymentDto): Promise<Payment> {
        this.logger.log(`Updating payment ${paymentId}`);

        // Step a) Find payment
        const payment = await this.findOne(paymentId);

        // Step b & c) Only update allowed fields
        const changes: string[] = [];

        if (updateDto.transactionRef !== undefined) {
            // Check for duplicate if changing transaction ref
            if (updateDto.transactionRef && updateDto.transactionRef !== payment.transactionRef) {
                const existingPayment = await this.paymentRepository.findOne({
                    where: { transactionRef: updateDto.transactionRef },
                });

                if (existingPayment && existingPayment.paymentId !== paymentId) {
                    throw new ConflictException(
                        `Transaction reference '${updateDto.transactionRef}' already exists`
                    );
                }
            }

            payment.transactionRef = updateDto.transactionRef;
            changes.push(`transactionRef: ${updateDto.transactionRef}`);
        }

        if (updateDto.paymentDate !== undefined) {
            // Validate date is not in future
            const newDate = new Date(updateDto.paymentDate);
            if (newDate > new Date()) {
                throw new BadRequestException('Payment date cannot be in the future');
            }

            payment.paymentDate = newDate;
            changes.push(`paymentDate: ${newDate.toISOString()}`);
        }

        if (updateDto.notes !== undefined) {
            // Notes stored in a separate field or future extension
            changes.push(`notes: ${updateDto.notes}`);
        }

        // Step d) Log correction with reason
        if (changes.length > 0) {
            this.logger.log(`Payment ${paymentId} corrected: ${changes.join(', ')}`);
        }

        // Step e) Save and return
        await this.paymentRepository.save(payment);

        return this.findOne(paymentId);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GET BILL OUTSTANDING
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Calculate outstanding amount for a bill
     *
     * @param billId - Bill ID to calculate outstanding for
     * @returns Outstanding amount (can be negative if overpaid)
     *
     * @throws NotFoundException if bill not found
     */
    async getBillOutstanding(billId: number): Promise<number> {
        this.logger.debug(`Calculating outstanding for bill ${billId}`);

        // Step a) Get bill with payments
        const bill = await this.billRepository.findOne({
            where: { billId },
            relations: ['payments', 'billDetails', 'billTaxes'],
        });

        if (!bill) {
            throw new NotFoundException(`Bill with ID ${billId} not found`);
        }

        // Step b) Get bill total amount
        const totalAmount = bill.getTotalAmount();

        // Step c) Sum all payments for this bill
        const totalPaid = bill.getTotalPaid();

        // Step d) outstanding = totalAmount - totalPaid
        const outstanding = this.roundAmount(totalAmount - totalPaid);

        this.logger.debug(
            `Bill ${billId} outstanding: ${outstanding} (Total: ${totalAmount}, Paid: ${totalPaid})`
        );

        return outstanding;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PART 2 - ADVANCED OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    // ═══════════════════════════════════════════════════════════════════════════
    // GET SUMMARY
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Get payment statistics
     *
     * @param filters - Optional filters (startDate, endDate, employeeId, customerId)
     * @returns Payment summary with breakdowns by method and channel
     */
    async getSummary(filters?: {
        startDate?: Date;
        endDate?: Date;
        employeeId?: number;
        customerId?: number;
    }): Promise<{
        totalPayments: number;
        totalAmount: number;
        byMethod: Array<{ category: string; count: number; amount: number }>;
        byChannel: Array<{ category: string; count: number; amount: number }>;
        period: { start: Date; end: Date };
    }> {
        this.logger.debug(`Getting payment summary with filters: ${JSON.stringify(filters)}`);

        // Build base query
        const queryBuilder = this.paymentRepository.createQueryBuilder('payment');

        // Apply filters
        if (filters?.startDate) {
            queryBuilder.andWhere('payment.paymentDate >= :startDate', { startDate: filters.startDate });
        }
        if (filters?.endDate) {
            queryBuilder.andWhere('payment.paymentDate <= :endDate', { endDate: filters.endDate });
        }
        if (filters?.employeeId) {
            queryBuilder.andWhere('payment.employeeId = :employeeId', { employeeId: filters.employeeId });
        }
        if (filters?.customerId) {
            queryBuilder.andWhere('payment.customerId = :customerId', { customerId: filters.customerId });
        }

        // Step a) Count total payments matching filters
        const totalPayments = await queryBuilder.getCount();

        // Step b) Sum total payment amounts
        const sumResult = await queryBuilder
            .select('SUM(payment.paymentAmount)', 'totalAmount')
            .getRawOne();
        const totalAmount = parseFloat(sumResult?.totalAmount || '0');

        // Step c) Group by payment method with counts and sums
        const byMethodResult = await this.paymentRepository
            .createQueryBuilder('payment')
            .select('payment.paymentMethod', 'category')
            .addSelect('COUNT(*)', 'count')
            .addSelect('SUM(payment.paymentAmount)', 'amount')
            .where(filters?.startDate ? 'payment.paymentDate >= :startDate' : '1=1', { startDate: filters?.startDate })
            .andWhere(filters?.endDate ? 'payment.paymentDate <= :endDate' : '1=1', { endDate: filters?.endDate })
            .andWhere(filters?.employeeId ? 'payment.employeeId = :employeeId' : '1=1', { employeeId: filters?.employeeId })
            .andWhere(filters?.customerId ? 'payment.customerId = :customerId' : '1=1', { customerId: filters?.customerId })
            .groupBy('payment.paymentMethod')
            .getRawMany();

        // Step d) Group by payment channel with counts and sums
        const byChannelResult = await this.paymentRepository
            .createQueryBuilder('payment')
            .select('payment.paymentChannel', 'category')
            .addSelect('COUNT(*)', 'count')
            .addSelect('SUM(payment.paymentAmount)', 'amount')
            .where(filters?.startDate ? 'payment.paymentDate >= :startDate' : '1=1', { startDate: filters?.startDate })
            .andWhere(filters?.endDate ? 'payment.paymentDate <= :endDate' : '1=1', { endDate: filters?.endDate })
            .andWhere(filters?.employeeId ? 'payment.employeeId = :employeeId' : '1=1', { employeeId: filters?.employeeId })
            .andWhere(filters?.customerId ? 'payment.customerId = :customerId' : '1=1', { customerId: filters?.customerId })
            .andWhere('payment.paymentChannel IS NOT NULL')
            .groupBy('payment.paymentChannel')
            .getRawMany();

        const byMethod = byMethodResult.map((r) => ({
            category: r.category,
            count: parseInt(r.count, 10),
            amount: parseFloat(r.amount || '0'),
        }));

        const byChannel = byChannelResult.map((r) => ({
            category: r.category || 'UNKNOWN',
            count: parseInt(r.count, 10),
            amount: parseFloat(r.amount || '0'),
        }));

        // Step e) Return summary
        return {
            totalPayments,
            totalAmount: this.roundAmount(totalAmount),
            byMethod,
            byChannel,
            period: {
                start: filters?.startDate || new Date(0),
                end: filters?.endDate || new Date(),
            },
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GET DAILY COLLECTION REPORT
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Generate daily collection report for cashier
     *
     * @param employeeId - Employee/Cashier ID
     * @param date - Date for the report
     * @returns Daily collection report with breakdowns
     */
    async getDailyCollectionReport(
        employeeId: number,
        date: Date,
    ): Promise<{
        date: Date;
        cashierName: string;
        cashierId: number;
        openingBalance: number;
        totalCollected: number;
        byMethod: Array<{ category: string; count: number; amount: number }>;
        paymentsList: Payment[];
        closingBalance: number;
        totalTransactions: number;
        cashCollected: number;
        nonCashCollected: number;
    }> {
        this.logger.log(`Generating daily collection report for employee ${employeeId} on ${date.toDateString()}`);

        // Step a) Get employee details
        const employee = await this.employeeRepository.findOne({
            where: { employeeId },
        });

        if (!employee) {
            throw new NotFoundException(`Employee with ID ${employeeId} not found`);
        }

        // Step b) Get all payments by employee on date
        const payments = await this.findByEmployee(employeeId, date);

        // Step c) Group by payment method
        const byMethodMap = new Map<string, { count: number; amount: number }>();
        let cashCollected = 0;
        let nonCashCollected = 0;

        for (const payment of payments) {
            const method = payment.paymentMethod;
            const existing = byMethodMap.get(method) || { count: 0, amount: 0 };
            existing.count++;
            existing.amount += Number(payment.paymentAmount);
            byMethodMap.set(method, existing);

            if (method === PaymentMethod.CASH) {
                cashCollected += Number(payment.paymentAmount);
            } else {
                nonCashCollected += Number(payment.paymentAmount);
            }
        }

        const byMethod = Array.from(byMethodMap.entries()).map(([category, data]) => ({
            category,
            count: data.count,
            amount: this.roundAmount(data.amount),
        }));

        // Step d) Calculate total collected
        const totalCollected = payments.reduce((sum, p) => sum + Number(p.paymentAmount), 0);

        // Step e) Get opening balance (previous day closing) - simplified: use 0 for now
        // In real implementation, this would query previous day's closing
        const openingBalance = 0;

        // Step f) Calculate closing balance (opening + cash collections)
        const closingBalance = openingBalance + cashCollected;

        // Step g) Return detailed report
        return {
            date,
            cashierName: employee.fullName,
            cashierId: employeeId,
            openingBalance: this.roundAmount(openingBalance),
            totalCollected: this.roundAmount(totalCollected),
            byMethod,
            paymentsList: payments,
            closingBalance: this.roundAmount(closingBalance),
            totalTransactions: payments.length,
            cashCollected: this.roundAmount(cashCollected),
            nonCashCollected: this.roundAmount(nonCashCollected),
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PROCESS REFUND
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Process refund/reversal
     *
     * @param refundDto - Refund details
     * @param employeeId - Employee processing the refund
     * @returns Refund payment record (negative amount)
     */
    async processRefund(
        refundDto: { paymentId: number; refundAmount: number; refundReason: string; refundMethod: string },
        employeeId: number,
    ): Promise<Payment> {
        this.logger.log(`Processing refund for payment ${refundDto.paymentId}, amount: ${refundDto.refundAmount}`);

        // Step a) Get original payment
        const originalPayment = await this.findOne(refundDto.paymentId);

        // Step b) Validate payment exists (already done by findOne)

        // Step c) Validate refund amount <= payment amount
        if (refundDto.refundAmount > Number(originalPayment.paymentAmount)) {
            throw new BadRequestException(
                `Refund amount ${refundDto.refundAmount} exceeds original payment amount ${originalPayment.paymentAmount}`
            );
        }

        if (refundDto.refundAmount <= 0) {
            throw new BadRequestException('Refund amount must be greater than 0');
        }

        // Step d) Check if already refunded (sum of refunds for this payment)
        const existingRefunds = await this.paymentRepository
            .createQueryBuilder('payment')
            .where('payment.transactionRef LIKE :ref', { ref: `REFUND-${refundDto.paymentId}-%` })
            .getMany();

        const totalRefunded = existingRefunds.reduce((sum, r) => sum + Math.abs(Number(r.paymentAmount)), 0);
        const remainingRefundable = Number(originalPayment.paymentAmount) - totalRefunded;

        if (refundDto.refundAmount > remainingRefundable) {
            throw new BadRequestException(
                `Cannot refund ${refundDto.refundAmount}. Maximum refundable amount is ${remainingRefundable} ` +
                `(already refunded: ${totalRefunded})`
            );
        }

        // Validate employee
        const employee = await this.employeeRepository.findOne({
            where: { employeeId },
        });
        if (!employee) {
            throw new NotFoundException(`Employee with ID ${employeeId} not found`);
        }

        // Start transaction
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Step e & f) Create negative payment record (refund)
            const refundPayment = this.paymentRepository.create({
                billId: originalPayment.billId,
                customerId: originalPayment.customerId,
                employeeId: employeeId,
                paymentDate: new Date(),
                paymentAmount: -refundDto.refundAmount, // Negative amount for refund
                paymentMethod: refundDto.refundMethod as PaymentMethod,
                paymentChannel: originalPayment.paymentChannel,
                transactionRef: `REFUND-${refundDto.paymentId}-${Date.now()}`,
            });

            const savedRefund = await queryRunner.manager.save(Payment, refundPayment);

            // Commit transaction
            await queryRunner.commitTransaction();

            // Step h) Log refund with reason
            this.logger.log(
                `Refund ${savedRefund.paymentId} processed for payment ${refundDto.paymentId}. ` +
                `Amount: ${refundDto.refundAmount}, Reason: ${refundDto.refundReason}, ` +
                `Processed by: ${employee.fullName}`
            );

            // Step i) Return refund payment record
            return this.findOne(savedRefund.paymentId);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Failed to process refund for payment ${refundDto.paymentId}:`, error);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // VOID PAYMENT
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Void/cancel a payment
     * Does NOT physically delete (maintains audit trail)
     *
     * @param paymentId - Payment ID to void
     * @param reason - Reason for voiding
     * @param employeeId - Employee performing the void
     */
    async voidPayment(paymentId: number, reason: string, employeeId: number): Promise<void> {
        this.logger.log(`Voiding payment ${paymentId}, reason: ${reason}`);

        // Step a) Get payment
        const payment = await this.findOne(paymentId);

        // Step b) Validate payment not already voided (check if it's a negative/refund amount)
        if (Number(payment.paymentAmount) < 0) {
            throw new BadRequestException('Cannot void a refund payment');
        }

        // Check if already voided by looking for void refund
        const existingVoid = await this.paymentRepository.findOne({
            where: { transactionRef: `VOID-${paymentId}` },
        });

        if (existingVoid) {
            throw new BadRequestException(`Payment ${paymentId} has already been voided`);
        }

        // Validate employee
        const employee = await this.employeeRepository.findOne({
            where: { employeeId },
        });
        if (!employee) {
            throw new NotFoundException(`Employee with ID ${employeeId} not found`);
        }

        // Start transaction
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Step c, d) Create void record (full negative of original payment)
            const voidPayment = this.paymentRepository.create({
                billId: payment.billId,
                customerId: payment.customerId,
                employeeId: employeeId,
                paymentDate: new Date(),
                paymentAmount: -Number(payment.paymentAmount), // Full negative
                paymentMethod: payment.paymentMethod,
                paymentChannel: payment.paymentChannel,
                transactionRef: `VOID-${paymentId}`,
            });

            await queryRunner.manager.save(Payment, voidPayment);

            // Commit transaction
            await queryRunner.commitTransaction();

            // Step f) Log void action
            this.logger.log(
                `Payment ${paymentId} voided. Amount: ${payment.paymentAmount}, ` +
                `Reason: ${reason}, Voided by: ${employee.fullName}`
            );

            // Step g) Audit trail is maintained - original payment remains in database
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Failed to void payment ${paymentId}:`, error);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RECONCILE PAYMENTS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Reconcile daily payments
     *
     * @param date - Date to reconcile
     * @param expectedAmount - Expected total amount
     * @param actualAmount - Actual amount collected
     * @returns Reconciliation report
     */
    async reconcilePayments(
        date: Date,
        expectedAmount: number,
        actualAmount: number,
    ): Promise<{
        date: Date;
        expectedTotal: number;
        actualTotal: number;
        totalVariance: number;
        totalPayments: number;
        byMethod: Array<{ category: string; count: number; amount: number }>;
        discrepancies: Array<{
            category: string;
            expectedAmount: number;
            actualAmount: number;
            variance: number;
            variancePercent: number;
            exceedsThreshold: boolean;
        }>;
        hasVariances: boolean;
        status: 'BALANCED' | 'NEEDS_REVIEW' | 'DISCREPANCY_FOUND';
    }> {
        this.logger.log(`Reconciling payments for ${date.toDateString()}`);

        const VARIANCE_THRESHOLD = 0.01; // 1% threshold

        // Calculate date range
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Step a) Get all payments for date
        const payments = await this.paymentRepository.find({
            where: {
                paymentDate: Between(startOfDay, endOfDay),
            },
        });

        // Step b) Sum total payments by method
        const byMethodMap = new Map<string, { count: number; amount: number }>();
        for (const payment of payments) {
            const method = payment.paymentMethod;
            const existing = byMethodMap.get(method) || { count: 0, amount: 0 };
            existing.count++;
            existing.amount += Number(payment.paymentAmount);
            byMethodMap.set(method, existing);
        }

        const byMethod = Array.from(byMethodMap.entries()).map(([category, data]) => ({
            category,
            count: data.count,
            amount: this.roundAmount(data.amount),
        }));

        const systemTotal = payments.reduce((sum, p) => sum + Number(p.paymentAmount), 0);

        // Step c) Compare with expected amounts
        const totalVariance = actualAmount - expectedAmount;
        const systemVariance = systemTotal - expectedAmount;

        // Step d & e) Identify discrepancies
        const discrepancies: Array<{
            category: string;
            expectedAmount: number;
            actualAmount: number;
            variance: number;
            variancePercent: number;
            exceedsThreshold: boolean;
        }> = [];

        // Overall discrepancy
        if (Math.abs(totalVariance) > 0) {
            const variancePercent = expectedAmount > 0 ? (totalVariance / expectedAmount) * 100 : 0;
            discrepancies.push({
                category: 'TOTAL',
                expectedAmount,
                actualAmount,
                variance: totalVariance,
                variancePercent: this.roundAmount(variancePercent),
                exceedsThreshold: Math.abs(variancePercent) > VARIANCE_THRESHOLD * 100,
            });
        }

        // System vs actual discrepancy
        if (Math.abs(actualAmount - systemTotal) > 0.01) {
            discrepancies.push({
                category: 'SYSTEM_VS_ACTUAL',
                expectedAmount: systemTotal,
                actualAmount: actualAmount,
                variance: actualAmount - systemTotal,
                variancePercent: systemTotal > 0 ? ((actualAmount - systemTotal) / systemTotal) * 100 : 0,
                exceedsThreshold: true,
            });
        }

        // Step f) Determine status
        const hasVariances = discrepancies.length > 0;
        let status: 'BALANCED' | 'NEEDS_REVIEW' | 'DISCREPANCY_FOUND' = 'BALANCED';

        if (hasVariances) {
            const hasSignificantVariance = discrepancies.some((d) => d.exceedsThreshold);
            status = hasSignificantVariance ? 'DISCREPANCY_FOUND' : 'NEEDS_REVIEW';
        }

        return {
            date,
            expectedTotal: expectedAmount,
            actualTotal: actualAmount,
            totalVariance: this.roundAmount(totalVariance),
            totalPayments: payments.length,
            byMethod,
            discrepancies,
            hasVariances,
            status,
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ALLOCATE PAYMENT TO BILLS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Allocate single payment to multiple bills
     *
     * @param paymentAmount - Total payment amount
     * @param billIds - Array of bill IDs to allocate to (in priority order)
     * @param employeeId - Employee recording the payment
     * @param paymentMethod - Payment method
     * @param transactionRef - Optional transaction reference
     * @returns Allocation result with breakdown
     */
    async allocatePaymentToBills(
        paymentAmount: number,
        billIds: number[],
        employeeId?: number,
        paymentMethod: PaymentMethod = PaymentMethod.CASH,
        transactionRef?: string,
    ): Promise<{
        totalPaymentAmount: number;
        totalAllocated: number;
        excessAmount: number;
        allocations: Array<{
            billId: number;
            outstandingBefore: number;
            allocatedAmount: number;
            outstandingAfter: number;
            isFullyPaid: boolean;
        }>;
        paymentIds: number[];
    }> {
        this.logger.log(`Allocating payment of ${paymentAmount} to ${billIds.length} bills`);

        if (billIds.length === 0) {
            throw new BadRequestException('At least one bill ID is required');
        }

        // Step a) Validate bills and get outstanding amounts
        const bills: Array<{ bill: Bill; outstanding: number }> = [];
        let totalOutstanding = 0;

        for (const billId of billIds) {
            const bill = await this.billRepository.findOne({
                where: { billId },
                relations: ['payments', 'billDetails', 'billTaxes'],
            });

            if (!bill) {
                throw new NotFoundException(`Bill with ID ${billId} not found`);
            }

            const outstanding = await this.getBillOutstanding(billId);
            if (outstanding > 0) {
                bills.push({ bill, outstanding });
                totalOutstanding += outstanding;
            }
        }

        if (bills.length === 0) {
            throw new BadRequestException('All specified bills are already fully paid');
        }

        // Start transaction
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const allocations: Array<{
                billId: number;
                outstandingBefore: number;
                allocatedAmount: number;
                outstandingAfter: number;
                isFullyPaid: boolean;
            }> = [];
            const paymentIds: number[] = [];
            let remainingAmount = paymentAmount;

            // Step b & c) Allocate by priority (order in array)
            for (const { bill, outstanding } of bills) {
                if (remainingAmount <= 0) break;

                const allocatedAmount = Math.min(remainingAmount, outstanding);
                remainingAmount -= allocatedAmount;

                // Get customer ID
                const customerId = await this.getCustomerIdFromBill(bill);

                // Create payment for this bill
                const payment = this.paymentRepository.create({
                    billId: bill.billId,
                    customerId,
                    employeeId: employeeId || null,
                    paymentDate: new Date(),
                    paymentAmount: allocatedAmount,
                    paymentMethod,
                    transactionRef: transactionRef ? `${transactionRef}-${bill.billId}` : null,
                });

                const savedPayment = await queryRunner.manager.save(Payment, payment);
                paymentIds.push(savedPayment.paymentId);

                allocations.push({
                    billId: bill.billId,
                    outstandingBefore: outstanding,
                    allocatedAmount: this.roundAmount(allocatedAmount),
                    outstandingAfter: this.roundAmount(outstanding - allocatedAmount),
                    isFullyPaid: outstanding - allocatedAmount <= 0,
                });

                this.logger.debug(`Allocated ${allocatedAmount} to bill ${bill.billId}`);
            }

            await queryRunner.commitTransaction();

            // Step f) Return allocation breakdown
            return {
                totalPaymentAmount: paymentAmount,
                totalAllocated: this.roundAmount(paymentAmount - remainingAmount),
                excessAmount: this.roundAmount(remainingAmount),
                allocations,
                paymentIds,
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error('Failed to allocate payment to bills:', error);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SEARCH BY TRANSACTION REF
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Find payment by transaction reference
     *
     * @param transactionRef - Transaction reference to search
     * @returns Payment or null if not found
     */
    async searchByTransactionRef(transactionRef: string): Promise<Payment | null> {
        this.logger.debug(`Searching for payment with transaction ref: ${transactionRef}`);

        // Step a) Search by transaction_ref
        const payment = await this.paymentRepository.findOne({
            where: { transactionRef },
            // Step b) Include bill and customer details
            relations: ['bill', 'bill.meter', 'customer', 'employee'],
        });

        // Step c) Return payment or null
        return payment;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GET OVERPAYMENTS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Find overpaid bills for refund processing
     *
     * @returns List of overpayments with details
     */
    async getOverpayments(): Promise<
        Array<{
            paymentId: number;
            billId: number;
            customerId: number | null;
            customerName: string;
            billAmount: number;
            totalPaid: number;
            overpaymentAmount: number;
            paymentDate: Date;
        }>
    > {
        this.logger.debug('Finding overpaid bills');

        // Step a & b) Find bills where total payments > bill amount
        const bills = await this.billRepository.find({
            relations: ['payments', 'billDetails', 'billTaxes'],
        });

        const overpayments: Array<{
            paymentId: number;
            billId: number;
            customerId: number | null;
            customerName: string;
            billAmount: number;
            totalPaid: number;
            overpaymentAmount: number;
            paymentDate: Date;
        }> = [];

        for (const bill of bills) {
            const totalAmount = bill.getTotalAmount();
            const totalPaid = bill.getTotalPaid();

            if (totalPaid > totalAmount) {
                // Get last payment for this bill
                const lastPayment = bill.payments?.sort(
                    (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
                )[0];

                if (lastPayment) {
                    // Get customer name
                    let customerName = 'Unknown';
                    if (lastPayment.customerId) {
                        const customer = await this.customerRepository.findOne({
                            where: { customerId: lastPayment.customerId },
                        });
                        customerName = customer?.fullName || 'Unknown';
                    }

                    overpayments.push({
                        paymentId: lastPayment.paymentId,
                        billId: bill.billId,
                        customerId: lastPayment.customerId,
                        customerName,
                        billAmount: this.roundAmount(totalAmount),
                        totalPaid: this.roundAmount(totalPaid),
                        overpaymentAmount: this.roundAmount(totalPaid - totalAmount),
                        paymentDate: lastPayment.paymentDate,
                    });
                }
            }
        }

        // Step c) Return list for refund processing
        return overpayments;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GET PENDING RECONCILIATION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Get payments pending reconciliation
     *
     * @param date - Date to check
     * @returns List of payments needing manual reconciliation
     */
    async getPendingReconciliation(date: Date): Promise<Payment[]> {
        this.logger.debug(`Finding payments pending reconciliation for ${date.toDateString()}`);

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Step a & b) Find payments without transaction_ref for methods that require it
        const payments = await this.paymentRepository
            .createQueryBuilder('payment')
            .leftJoinAndSelect('payment.bill', 'bill')
            .leftJoinAndSelect('payment.customer', 'customer')
            .leftJoinAndSelect('payment.employee', 'employee')
            .where('payment.paymentDate >= :startOfDay', { startOfDay })
            .andWhere('payment.paymentDate <= :endOfDay', { endOfDay })
            .andWhere(
                '(payment.transactionRef IS NULL AND payment.paymentMethod IN (:...methods))',
                { methods: PAYMENT_METHODS_REQUIRING_REF }
            )
            .orderBy('payment.paymentDate', 'ASC')
            .getMany();

        // Step c) Return list for manual reconciliation
        return payments;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EXPORT PAYMENTS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Export payments to CSV
     *
     * @param filters - Filter options (no pagination applied)
     * @returns CSV buffer
     */
    async exportPayments(filters: PaymentFilterDto): Promise<Buffer> {
        this.logger.log('Exporting payments to CSV');

        // Step a) Get all payments matching filters (no pagination)
        const filtersWithoutPagination = { ...filters, page: 1, limit: 100000 };
        const { payments } = await this.findAll(filtersWithoutPagination);

        // Step b) Format data for CSV
        const headers = [
            'Payment ID',
            'Receipt Number',
            'Bill ID',
            'Payment Date',
            'Payment Amount',
            'Payment Method',
            'Payment Channel',
            'Transaction Ref',
            'Customer ID',
            'Employee ID',
        ];

        const rows = payments.map((p) => [
            p.paymentId,
            p.receiptNumber,
            p.billId,
            p.paymentDate.toISOString(),
            p.paymentAmount,
            p.paymentMethod,
            p.paymentChannel || '',
            p.transactionRef || '',
            p.customerId || '',
            p.employeeId || '',
        ]);

        // Step c) Generate CSV
        const csvContent = [
            headers.join(','),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        ].join('\n');

        // Step d) Return buffer
        return Buffer.from(csvContent, 'utf-8');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STRIPE INTEGRATION - ONLINE PAYMENTS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Create Stripe Checkout session for customer to pay bills online
     * 
     * @param dto - Checkout session creation data
     * @param customerId - Customer ID making the payment
     * @returns Checkout session response with URL for redirect
     */
    async createCheckoutSession(
        dto: CreateCheckoutSessionDto,
        customerId: number,
    ): Promise<CheckoutSessionResponseDto> {
        this.logger.log(`Creating checkout session for customer ${customerId}, bills: ${dto.billIds.join(',')}`);

        // Step a) Get customer details with email
        const customer = await this.customerRepository.findOne({
            where: { customerId },
        });

        if (!customer) {
            throw new NotFoundException(`Customer with ID ${customerId} not found`);
        }

        if (!customer.email) {
            throw new BadRequestException('Customer email is required for online payments');
        }

        // Step b) Get bills by IDs and validate
        const bills = await this.billRepository.find({
            where: { billId: In(dto.billIds) },
            relations: ['payments', 'meter', 'billDetails'],
        });

        if (bills.length !== dto.billIds.length) {
            const foundIds = bills.map(b => b.billId);
            const missingIds = dto.billIds.filter(id => !foundIds.includes(id));
            throw new NotFoundException(`Bills not found: ${missingIds.join(', ')}`);
        }

        // Validate all bills belong to customer and are payable
        for (const bill of bills) {
            // Get customer ID for this bill
            const billCustomerId = await this.getCustomerIdFromBill(bill);
            if (billCustomerId !== customerId) {
                throw new BadRequestException(`Bill ${bill.billId} does not belong to customer ${customerId}`);
            }

            // Check bill is not fully paid
            const outstanding = bill.getTotalAmount() - bill.getTotalPaid();
            if (outstanding <= 0) {
                throw new BadRequestException(`Bill ${bill.billId} is already fully paid`);
            }
        }

        // Step c) Calculate total amount and create line items
        const lineItems: CheckoutLineItem[] = bills.map(bill => {
            const outstanding = bill.getTotalAmount() - bill.getTotalPaid();
            // Use billing period from Bill entity directly
            const periodStart = bill.billingPeriodStart ? new Date(bill.billingPeriodStart).toLocaleDateString() : '';
            const periodEnd = bill.billingPeriodEnd ? new Date(bill.billingPeriodEnd).toLocaleDateString() : '';
            const period = periodStart && periodEnd ? `${periodStart} - ${periodEnd}` : 'N/A';

            return {
                billId: bill.billId,
                billNumber: `BILL-${bill.billId}`, // Bill ID as identifier
                description: `Utility Bill - ${period}`,
                amount: this.roundAmount(outstanding),
            };
        });

        const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);

        // Step f) Call stripeService.createCheckoutSession()
        const session = await this.stripeService.createCheckoutSession(
            lineItems,
            customerId,
            customer.email,
            dto.successUrl,
            dto.cancelUrl,
        );

        // Step g) Create pending Payment records for each bill
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            for (const bill of bills) {
                const outstanding = bill.getTotalAmount() - bill.getTotalPaid();

                const payment = this.paymentRepository.create({
                    billId: bill.billId,
                    customerId: customerId,
                    employeeId: null,
                    paymentDate: new Date(),
                    paymentAmount: outstanding,
                    paymentMethod: PaymentMethod.STRIPE_CARD,
                    paymentChannel: PaymentChannel.CUSTOMER_PORTAL,
                    paymentStatus: PaymentStatus.PENDING,
                    stripePaymentIntentId: session.payment_intent as string || null,
                    transactionRef: session.id,
                    metadata: JSON.stringify({
                        checkoutSessionId: session.id,
                        billIds: dto.billIds,
                        customerId,
                    }),
                });

                await queryRunner.manager.save(Payment, payment);
            }

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error('Failed to create pending payment records:', error);
            throw new InternalServerErrorException('Failed to create payment records');
        } finally {
            await queryRunner.release();
        }

        this.logger.log(`Checkout session created: ${session.id}, URL: ${session.url}`);

        // Step i) Return session URL and ID
        return {
            sessionId: session.id,
            sessionUrl: session.url || '',
            expiresAt: new Date((session.expires_at || 0) * 1000),
            totalAmount,
            currency: 'LKR',
        };
    }

    /**
     * Create payment intent for custom checkout flow
     * 
     * @param billIds - Array of bill IDs to pay
     * @param customerId - Customer ID
     * @returns Payment intent response with client secret
     */
    async createPaymentIntent(
        billIds: number[],
        customerId: number,
    ): Promise<PaymentIntentResponseDto> {
        this.logger.log(`Creating payment intent for customer ${customerId}, bills: ${billIds.join(',')}`);

        // Step a) Get customer
        const customer = await this.customerRepository.findOne({
            where: { customerId },
        });

        if (!customer) {
            throw new NotFoundException(`Customer with ID ${customerId} not found`);
        }

        // Step b) Get bills and validate
        const bills = await this.billRepository.find({
            where: { billId: In(billIds) },
            relations: ['payments'],
        });

        if (bills.length !== billIds.length) {
            throw new NotFoundException('One or more bills not found');
        }

        // Validate and calculate total
        let totalAmount = 0;
        for (const bill of bills) {
            const billCustomerId = await this.getCustomerIdFromBill(bill);
            if (billCustomerId !== customerId) {
                throw new BadRequestException(`Bill ${bill.billId} does not belong to customer`);
            }

            const outstanding = bill.getTotalAmount() - bill.getTotalPaid();
            if (outstanding <= 0) {
                throw new BadRequestException(`Bill ${bill.billId} is already fully paid`);
            }
            totalAmount += outstanding;
        }

        // Step c) Create payment intent
        const paymentIntent = await this.stripeService.createPaymentIntent(
            totalAmount,
            {
                billIds: billIds.join(','),
                customerId: customerId.toString(),
                customerEmail: customer.email || '',
                source: 'payment_intent',
            },
        );

        // Step d) Create pending payment records
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            for (const bill of bills) {
                const outstanding = bill.getTotalAmount() - bill.getTotalPaid();

                const payment = this.paymentRepository.create({
                    billId: bill.billId,
                    customerId: customerId,
                    employeeId: null,
                    paymentDate: new Date(),
                    paymentAmount: outstanding,
                    paymentMethod: PaymentMethod.STRIPE_CARD,
                    paymentChannel: PaymentChannel.CUSTOMER_PORTAL,
                    paymentStatus: PaymentStatus.PENDING,
                    stripePaymentIntentId: paymentIntent.id,
                    transactionRef: paymentIntent.id,
                });

                await queryRunner.manager.save(Payment, payment);
            }

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }

        this.logger.log(`Payment intent created: ${paymentIntent.id}`);

        // Step e) Return client secret for frontend
        return {
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret || '',
            amount: totalAmount,
            currency: 'LKR',
            status: paymentIntent.status,
            publicKey: this.stripeService.getPublishableKey(),
            billIds,
        };
    }

    /**
     * Confirm and record Stripe payment (called from webhook)
     * 
     * @param dto - Stripe payment confirmation data
     * @returns Confirmed payment records
     */
    async confirmStripePayment(dto: ConfirmStripePaymentDto): Promise<Payment[]> {
        this.logger.log(`Confirming Stripe payment: ${dto.paymentIntentId}`);

        // Step a) Find pending payments by stripe_payment_intent_id
        let payments = await this.paymentRepository.find({
            where: {
                stripePaymentIntentId: dto.paymentIntentId,
                paymentStatus: PaymentStatus.PENDING,
            },
            relations: ['bill'],
        });

        // Step b) If not found, try to extract from metadata and create
        if (payments.length === 0 && dto.metadata?.billIds) {
            this.logger.warn(`No pending payments found for ${dto.paymentIntentId}, attempting to create from metadata`);

            const billIds = dto.metadata.billIds.split(',').map(id => parseInt(id, 10));
            const customerId = dto.metadata.customerId ? parseInt(dto.metadata.customerId, 10) : null;

            const bills = await this.billRepository.find({
                where: { billId: In(billIds) },
                relations: ['payments'],
            });

            const queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();

            try {
                for (const bill of bills) {
                    const outstanding = bill.getTotalAmount() - bill.getTotalPaid();

                    const payment = this.paymentRepository.create({
                        billId: bill.billId,
                        customerId: customerId,
                        employeeId: null,
                        paymentDate: new Date(),
                        paymentAmount: outstanding,
                        paymentMethod: dto.paymentMethodType === 'card' ? PaymentMethod.STRIPE_CARD : PaymentMethod.STRIPE_WALLET,
                        paymentChannel: PaymentChannel.CUSTOMER_PORTAL,
                        paymentStatus: PaymentStatus.COMPLETED,
                        stripePaymentIntentId: dto.paymentIntentId,
                        stripeChargeId: dto.stripeChargeId,
                        transactionRef: dto.paymentIntentId,
                    });

                    const savedPayment = await queryRunner.manager.save(Payment, payment) as Payment;
                    payments.push(savedPayment);
                }

                await queryRunner.commitTransaction();
            } catch (error) {
                await queryRunner.rollbackTransaction();
                throw error;
            } finally {
                await queryRunner.release();
            }
        } else {
            // Step c) Update existing pending payments to COMPLETED
            const queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();

            try {
                for (const payment of payments) {
                    payment.paymentStatus = PaymentStatus.COMPLETED;
                    payment.stripeChargeId = dto.stripeChargeId;
                    payment.paymentDate = new Date();

                    await queryRunner.manager.save(Payment, payment);
                }

                await queryRunner.commitTransaction();
            } catch (error) {
                await queryRunner.rollbackTransaction();
                throw error;
            } finally {
                await queryRunner.release();
            }
        }

        this.logger.log(`Confirmed ${payments.length} payments for ${dto.paymentIntentId}`);

        // Step h) Return confirmed payment records
        return payments;
    }

    /**
     * Handle Stripe webhook events
     * 
     * @param event - Parsed webhook event data
     */
    async handleStripeWebhook(event: StripeWebhookEventDto): Promise<void> {
        this.logger.log(`Processing webhook event: ${event.eventType}, ID: ${event.eventId}`);

        // Check for idempotency - don't process same event twice
        const existingPayment = await this.paymentRepository.findOne({
            where: { metadata: Like(`%"webhookEventId":"${event.eventId}"%`) },
        });

        if (existingPayment) {
            this.logger.warn(`Webhook event ${event.eventId} already processed, skipping`);
            return;
        }

        try {
            switch (event.eventType) {
                case StripeWebhookEventType.PAYMENT_INTENT_SUCCEEDED:
                    await this.handlePaymentIntentSucceeded(event);
                    break;

                case StripeWebhookEventType.PAYMENT_INTENT_FAILED:
                    await this.handlePaymentIntentFailed(event);
                    break;

                case StripeWebhookEventType.CHECKOUT_SESSION_COMPLETED:
                    await this.handleCheckoutSessionCompleted(event);
                    break;

                case StripeWebhookEventType.CHECKOUT_SESSION_EXPIRED:
                    await this.handleCheckoutSessionExpired(event);
                    break;

                case StripeWebhookEventType.CHARGE_REFUNDED:
                    await this.handleChargeRefunded(event);
                    break;

                default:
                    this.logger.warn(`Unhandled webhook event type: ${event.eventType}`);
            }
        } catch (error) {
            this.logger.error(`Error processing webhook ${event.eventId}:`, error);
            throw error;
        }
    }

    /**
     * Handle payment_intent.succeeded webhook
     */
    private async handlePaymentIntentSucceeded(event: StripeWebhookEventDto): Promise<void> {
        this.logger.log(`Payment intent succeeded: ${event.paymentIntentId}`);

        await this.confirmStripePayment({
            paymentIntentId: event.paymentIntentId || '',
            stripeChargeId: event.chargeId || '',
            amount: event.amount,
            currency: event.currency,
            paymentMethodType: 'card',
            metadata: event.metadata,
        });
    }

    /**
     * Handle payment_intent.payment_failed webhook
     */
    private async handlePaymentIntentFailed(event: StripeWebhookEventDto): Promise<void> {
        this.logger.warn(`Payment intent failed: ${event.paymentIntentId}`);

        // Update pending payments to FAILED
        const payments = await this.paymentRepository.find({
            where: {
                stripePaymentIntentId: event.paymentIntentId,
                paymentStatus: PaymentStatus.PENDING,
            },
        });

        for (const payment of payments) {
            payment.paymentStatus = PaymentStatus.FAILED;
            payment.metadata = JSON.stringify({
                ...(payment.parsedMetadata || {}),
                failureReason: 'Payment failed',
                webhookEventId: event.eventId,
            });
            await this.paymentRepository.save(payment);
        }

        this.logger.log(`Marked ${payments.length} payments as FAILED`);
    }

    /**
     * Handle checkout.session.completed webhook
     */
    private async handleCheckoutSessionCompleted(event: StripeWebhookEventDto): Promise<void> {
        this.logger.log(`Checkout session completed: ${event.checkoutSessionId}`);

        // Find payments by checkout session ID in metadata
        const payments = await this.paymentRepository.find({
            where: { transactionRef: event.checkoutSessionId },
        });

        for (const payment of payments) {
            if (payment.paymentStatus === PaymentStatus.PENDING) {
                payment.paymentStatus = PaymentStatus.COMPLETED;
                payment.paymentDate = new Date();
                await this.paymentRepository.save(payment);
            }
        }

        this.logger.log(`Confirmed ${payments.length} payments from checkout session`);
    }

    /**
     * Handle checkout.session.expired webhook
     */
    private async handleCheckoutSessionExpired(event: StripeWebhookEventDto): Promise<void> {
        this.logger.log(`Checkout session expired: ${event.checkoutSessionId}`);

        // Delete or mark as cancelled
        const payments = await this.paymentRepository.find({
            where: {
                transactionRef: event.checkoutSessionId,
                paymentStatus: PaymentStatus.PENDING,
            },
        });

        for (const payment of payments) {
            payment.paymentStatus = PaymentStatus.CANCELLED;
            await this.paymentRepository.save(payment);
        }

        this.logger.log(`Cancelled ${payments.length} expired checkout payments`);
    }

    /**
     * Handle charge.refunded webhook
     */
    private async handleChargeRefunded(event: StripeWebhookEventDto): Promise<void> {
        this.logger.log(`Charge refunded: ${event.chargeId}`);

        const payment = await this.paymentRepository.findOne({
            where: { stripeChargeId: event.chargeId },
        });

        if (payment) {
            payment.paymentStatus = PaymentStatus.REFUNDED;
            await this.paymentRepository.save(payment);
            this.logger.log(`Payment ${payment.paymentId} marked as REFUNDED`);
        }
    }

    /**
     * Get all unpaid bills for customer portal
     * 
     * @param customerId - Customer ID
     * @returns List of unpaid bills formatted for payment selection
     */
    async getCustomerUnpaidBills(customerId: number): Promise<CustomerBillsResponseDto> {
        this.logger.log(`Getting unpaid bills for customer ${customerId}`);

        // Get customer
        const customer = await this.customerRepository.findOne({
            where: { customerId },
        });

        if (!customer) {
            throw new NotFoundException(`Customer with ID ${customerId} not found`);
        }

        // Get all bills for customer's connections
        const bills = await this.dataSource.query(
            `SELECT b.*, m.serial_no as meterSerialNo, ut.type_name as utilityType
             FROM Bill b
             INNER JOIN Meter m ON m.meter_id = b.meter_id
             INNER JOIN ServiceConnection sc ON sc.meter_id = m.meter_id
             INNER JOIN UtilityType ut ON ut.utility_type_id = m.utility_type_id
             WHERE sc.customer_id = @0
             ORDER BY b.due_date ASC`,
            [customerId]
        );

        // Filter and format unpaid bills
        const unpaidBills: CustomerBillPaymentDto[] = [];
        let totalOutstanding = 0;
        let overdueBillCount = 0;

        for (const bill of bills) {
            // Calculate outstanding
            const paymentsResult = await this.dataSource.query(
                `SELECT COALESCE(SUM(payment_amount), 0) as total_paid
                 FROM Payment
                 WHERE bill_id = @0 AND payment_status = 'COMPLETED'`,
                [bill.bill_id]
            );
            const totalPaid = parseFloat(paymentsResult[0]?.total_paid || '0');
            const billAmount = parseFloat(bill.total_amount || '0');
            const outstanding = billAmount - totalPaid;

            if (outstanding > 0) {
                const dueDate = new Date(bill.due_date);
                const today = new Date();
                const isOverdue = dueDate < today;
                const daysOverdue = isOverdue
                    ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
                    : undefined;

                if (isOverdue) {
                    overdueBillCount++;
                }

                totalOutstanding += outstanding;

                unpaidBills.push({
                    billId: bill.bill_id,
                    billNumber: bill.bill_number,
                    billDate: new Date(bill.bill_date),
                    dueDate: dueDate,
                    amount: billAmount,
                    outstanding: outstanding,
                    isOverdue,
                    daysOverdue,
                    meterSerialNo: bill.meterSerialNo,
                    utilityType: bill.utilityType,
                    billingPeriod: `${bill.billing_period_start || ''} - ${bill.billing_period_end || ''}`,
                    selected: false,
                });
            }
        }

        // Sort: overdue first, then by due date
        unpaidBills.sort((a, b) => {
            if (a.isOverdue && !b.isOverdue) return -1;
            if (!a.isOverdue && b.isOverdue) return 1;
            return a.dueDate.getTime() - b.dueDate.getTime();
        });

        return {
            customerId,
            customerName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
            customerEmail: customer.email || '',
            totalOutstanding: this.roundAmount(totalOutstanding),
            unpaidBillCount: unpaidBills.length,
            overdueBillCount,
            bills: unpaidBills,
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CASHIER PAYMENTS - OFFICE COUNTER
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Record payment made at office counter by cashier
     * 
     * @param dto - Cashier payment data
     * @param employeeId - Employee recording the payment
     * @returns Created payment with receipt
     */
    async createCashierPayment(
        dto: CreateCashierPaymentDto,
        employeeId: number,
    ): Promise<Payment> {
        this.logger.log(`Creating cashier payment for bill ${dto.billId} by employee ${employeeId}`);

        // Step a) Validate employee exists and has cashier role
        const employee = await this.employeeRepository.findOne({
            where: { employeeId },
        });

        if (!employee) {
            throw new NotFoundException(`Employee with ID ${employeeId} not found`);
        }

        // Check employee role (CASHIER, MANAGER, ADMIN can record payments)
        const allowedRoles = ['CASHIER', 'MANAGER', 'ADMIN', 'CLERK'];
        if (!allowedRoles.includes(employee.role?.toUpperCase() || '')) {
            throw new ForbiddenException('Employee does not have permission to record payments');
        }

        // Step b) Get bill and validate
        const bill = await this.billRepository.findOne({
            where: { billId: dto.billId },
            relations: ['payments', 'meter'],
        });

        if (!bill) {
            throw new NotFoundException(`Bill with ID ${dto.billId} not found`);
        }

        // Calculate outstanding
        const totalBillAmount = bill.getTotalAmount();
        const totalPaid = bill.getTotalPaid();
        const outstanding = totalBillAmount - totalPaid;

        // Validate payment amount
        const maxAllowedPayment = outstanding * (1 + this.OVERPAYMENT_TOLERANCE);
        if (dto.paymentAmount > maxAllowedPayment && outstanding > 0) {
            throw new BadRequestException(
                `Payment amount ${dto.paymentAmount} exceeds maximum allowed ${maxAllowedPayment.toFixed(2)}`
            );
        }

        // Step c) Get customer ID
        const customerId = dto.customerId || await this.getCustomerIdFromBill(bill);

        // Validate customer matches
        if (dto.customerId) {
            const customer = await this.customerRepository.findOne({
                where: { customerId: dto.customerId },
            });
            if (!customer) {
                throw new NotFoundException(`Customer with ID ${dto.customerId} not found`);
            }
        }

        // Validate transaction ref for non-cash
        if (dto.paymentMethod !== CashierPaymentMethod.CASH && !dto.transactionRef) {
            throw new BadRequestException(`Transaction reference required for ${dto.paymentMethod} payments`);
        }

        // Map cashier payment method to PaymentMethod enum
        const paymentMethodMap: Record<CashierPaymentMethod, PaymentMethod> = {
            [CashierPaymentMethod.CASH]: PaymentMethod.CASH,
            [CashierPaymentMethod.CARD_TERMINAL]: PaymentMethod.CARD_TERMINAL,
            [CashierPaymentMethod.CHEQUE]: PaymentMethod.CHEQUE,
            [CashierPaymentMethod.BANK_TRANSFER]: PaymentMethod.BANK_TRANSFER,
        };

        // Step d) Create payment record
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const payment = this.paymentRepository.create({
                billId: dto.billId,
                customerId: customerId,
                employeeId: employeeId,
                paymentDate: new Date(),
                paymentAmount: dto.paymentAmount,
                paymentMethod: paymentMethodMap[dto.paymentMethod],
                paymentChannel: PaymentChannel.CASHIER_PORTAL,
                paymentStatus: PaymentStatus.COMPLETED,
                transactionRef: dto.transactionRef || `CASH-${Date.now()}`,
                metadata: dto.notes ? JSON.stringify({ notes: dto.notes }) : null,
            });

            const savedPayment = await queryRunner.manager.save(Payment, payment) as Payment;

            // Step f) Log if bill is now fully paid
            const newOutstanding = outstanding - dto.paymentAmount;
            if (newOutstanding <= 0) {
                this.logger.log(`Bill ${dto.billId} is now fully paid`);
            }

            await queryRunner.commitTransaction();

            // Step g) Log payment creation
            this.logger.log(
                `Cashier payment ${savedPayment.paymentId} created. Receipt: ${savedPayment.receiptNumber}, ` +
                `Amount: ${savedPayment.paymentAmount}, Method: ${dto.paymentMethod}`
            );

            // Step h) Return payment with receipt
            return this.findOne(savedPayment.paymentId);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Failed to create cashier payment for bill ${dto.billId}:`, error);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Get payment history for customer portal
     * 
     * @param customerId - Customer ID
     * @param options - Filter options
     * @returns Payment history for customer
     */
    async getCustomerPaymentHistory(
        customerId: number,
        options?: { limit?: number; startDate?: Date; endDate?: Date },
    ): Promise<Payment[]> {
        this.logger.log(`Getting payment history for customer ${customerId}`);

        const queryBuilder = this.paymentRepository
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.bill', 'b')
            .where('p.customerId = :customerId', { customerId })
            .andWhere('p.paymentStatus IN (:...statuses)', {
                statuses: [PaymentStatus.COMPLETED, PaymentStatus.REFUNDED]
            });

        if (options?.startDate) {
            queryBuilder.andWhere('p.paymentDate >= :startDate', { startDate: options.startDate });
        }

        if (options?.endDate) {
            queryBuilder.andWhere('p.paymentDate <= :endDate', { endDate: options.endDate });
        }

        queryBuilder.orderBy('p.paymentDate', 'DESC');

        if (options?.limit) {
            queryBuilder.take(options.limit);
        }

        return queryBuilder.getMany();
    }

    /**
     * Get pending Stripe payments
     * 
     * @param customerId - Optional customer filter
     * @returns List of pending Stripe payments
     */
    async getPendingStripePayments(customerId?: number): Promise<Payment[]> {
        this.logger.log(`Getting pending Stripe payments${customerId ? ` for customer ${customerId}` : ''}`);

        const whereConditions: any = {
            paymentStatus: PaymentStatus.PENDING,
            paymentMethod: In([PaymentMethod.STRIPE_CARD, PaymentMethod.STRIPE_WALLET]),
        };

        if (customerId) {
            whereConditions.customerId = customerId;
        }

        const pendingPayments = await this.paymentRepository.find({
            where: whereConditions,
            relations: ['bill'],
            order: { paymentDate: 'DESC' },
        });

        // Check for expired payments (> 24 hours old)
        const now = new Date();
        const expiryHours = 24;
        const expiredPayments: Payment[] = [];
        const activePayments: Payment[] = [];

        for (const payment of pendingPayments) {
            const ageHours = (now.getTime() - new Date(payment.paymentDate).getTime()) / (1000 * 60 * 60);

            if (ageHours > expiryHours) {
                // Mark as expired/cancelled
                payment.paymentStatus = PaymentStatus.CANCELLED;
                payment.metadata = JSON.stringify({
                    ...(payment.parsedMetadata || {}),
                    expiredAt: now.toISOString(),
                    reason: 'Payment intent expired',
                });
                await this.paymentRepository.save(payment);
                expiredPayments.push(payment);
            } else {
                activePayments.push(payment);
            }
        }

        if (expiredPayments.length > 0) {
            this.logger.log(`Marked ${expiredPayments.length} pending payments as expired`);
        }

        return activePayments;
    }

    /**
     * Process refund for Stripe payment
     * 
     * @param paymentId - Payment ID to refund
     * @param amount - Refund amount (optional, full refund if not specified)
     * @param reason - Refund reason
     * @param employeeId - Employee processing the refund
     * @returns Refund payment record
     */
    async refundStripePayment(
        paymentId: number,
        amount?: number,
        reason?: string,
        employeeId?: number,
    ): Promise<Payment> {
        this.logger.log(`Processing Stripe refund for payment ${paymentId}`);

        // Step a) Get payment and validate
        const payment = await this.paymentRepository.findOne({
            where: { paymentId },
            relations: ['bill'],
        });

        if (!payment) {
            throw new NotFoundException(`Payment with ID ${paymentId} not found`);
        }

        if (!STRIPE_PAYMENT_METHODS.includes(payment.paymentMethod)) {
            throw new BadRequestException('This payment was not made via Stripe');
        }

        if (payment.paymentStatus !== PaymentStatus.COMPLETED) {
            throw new BadRequestException('Only completed payments can be refunded');
        }

        if (!payment.stripePaymentIntentId) {
            throw new BadRequestException('Stripe payment intent ID not found');
        }

        // Calculate refund amount
        const refundAmount = amount || payment.paymentAmount;
        if (refundAmount > payment.paymentAmount) {
            throw new BadRequestException('Refund amount cannot exceed payment amount');
        }

        // Step b) Call Stripe refund
        const stripeReason = reason === 'duplicate' || reason === 'fraudulent' || reason === 'requested_by_customer'
            ? reason
            : 'requested_by_customer';

        const refund = await this.stripeService.refundPayment(
            payment.stripePaymentIntentId,
            refundAmount,
            stripeReason,
        );

        // Step c,d,e) Create refund record and update original
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Create refund record (negative amount)
            const refundPayment = this.paymentRepository.create({
                billId: payment.billId,
                customerId: payment.customerId,
                employeeId: employeeId || null,
                paymentDate: new Date(),
                paymentAmount: -refundAmount, // Negative for refund
                paymentMethod: payment.paymentMethod,
                paymentChannel: payment.paymentChannel,
                paymentStatus: PaymentStatus.REFUNDED,
                transactionRef: refund.id,
                stripePaymentIntentId: payment.stripePaymentIntentId,
                stripeChargeId: refund.charge as string || null,
                metadata: JSON.stringify({
                    originalPaymentId: paymentId,
                    refundReason: reason,
                    stripeRefundId: refund.id,
                }),
            });

            const savedRefund = await queryRunner.manager.save(Payment, refundPayment) as Payment;

            // Update original payment status
            if (refundAmount >= payment.paymentAmount) {
                payment.paymentStatus = PaymentStatus.REFUNDED;
            }
            payment.metadata = JSON.stringify({
                ...(payment.parsedMetadata || {}),
                refundedAt: new Date().toISOString(),
                refundAmount,
                refundPaymentId: savedRefund.paymentId,
            });
            await queryRunner.manager.save(Payment, payment);

            await queryRunner.commitTransaction();

            this.logger.log(`Stripe refund processed: ${savedRefund.paymentId}, Amount: ${refundAmount}`);

            return savedRefund;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Process refund for cashier (office) payment
     * 
     * @param paymentId - Payment ID to refund
     * @param refundDto - Refund details
     * @param employeeId - Employee processing the refund
     * @returns Refund payment record
     */
    async refundCashierPayment(
        paymentId: number,
        refundDto: RefundDto,
        employeeId: number,
    ): Promise<Payment> {
        this.logger.log(`Processing cashier refund for payment ${paymentId} by employee ${employeeId}`);

        // Step a) Validate employee
        const employee = await this.employeeRepository.findOne({
            where: { employeeId },
        });

        if (!employee) {
            throw new NotFoundException(`Employee with ID ${employeeId} not found`);
        }

        // Check for manager approval for large refunds
        const MANAGER_APPROVAL_THRESHOLD = 10000; // Amount requiring manager approval
        if (refundDto.refundAmount > MANAGER_APPROVAL_THRESHOLD) {
            const managerRoles = ['MANAGER', 'ADMIN'];
            if (!managerRoles.includes(employee.role?.toUpperCase() || '')) {
                throw new ForbiddenException('Manager approval required for refunds over ' + MANAGER_APPROVAL_THRESHOLD);
            }
        }

        // Get payment
        const payment = await this.paymentRepository.findOne({
            where: { paymentId },
            relations: ['bill'],
        });

        if (!payment) {
            throw new NotFoundException(`Payment with ID ${paymentId} not found`);
        }

        if (payment.paymentStatus !== PaymentStatus.COMPLETED) {
            throw new BadRequestException('Only completed payments can be refunded');
        }

        // Validate refund amount
        if (refundDto.refundAmount > payment.paymentAmount) {
            throw new BadRequestException('Refund amount cannot exceed payment amount');
        }

        // Create refund record
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Map refund method to PaymentMethod
            const refundMethodMap: Record<string, PaymentMethod> = {
                'CASH': PaymentMethod.CASH,
                'BANK_TRANSFER': PaymentMethod.BANK_TRANSFER,
            };

            const refundPayment = this.paymentRepository.create({
                billId: payment.billId,
                customerId: payment.customerId,
                employeeId: employeeId,
                paymentDate: new Date(),
                paymentAmount: -refundDto.refundAmount, // Negative for refund
                paymentMethod: refundMethodMap[refundDto.refundMethod] || PaymentMethod.CASH,
                paymentChannel: PaymentChannel.CASHIER_PORTAL,
                paymentStatus: PaymentStatus.REFUNDED,
                transactionRef: `REFUND-${Date.now()}`,
                metadata: JSON.stringify({
                    originalPaymentId: paymentId,
                    refundReason: refundDto.refundReason,
                    refundNotes: refundDto.notes,
                    authorizedBy: employeeId,
                    bankDetails: refundDto.refundMethod === 'BANK_TRANSFER' ? refundDto.bankDetails : undefined,
                }),
            });

            const savedRefund = await queryRunner.manager.save(Payment, refundPayment) as Payment;

            // Update original payment status if full refund
            if (refundDto.refundAmount >= payment.paymentAmount) {
                payment.paymentStatus = PaymentStatus.REFUNDED;
            }
            payment.metadata = JSON.stringify({
                ...(payment.parsedMetadata || {}),
                refundedAt: new Date().toISOString(),
                refundAmount: refundDto.refundAmount,
                refundPaymentId: savedRefund.paymentId,
            });
            await queryRunner.manager.save(Payment, payment);

            await queryRunner.commitTransaction();

            this.logger.log(`Cashier refund processed: ${savedRefund.paymentId}, Amount: ${refundDto.refundAmount}`);

            return savedRefund;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Get payment summary statistics (both channels)
     * 
     * @param filters - Optional filters
     * @returns Payment summary with statistics
     */
    async getPaymentSummary(filters?: PaymentFilterDto): Promise<PaymentSummaryDto> {
        this.logger.log('Getting payment summary');

        const queryBuilder = this.paymentRepository.createQueryBuilder('p');

        // Apply date filters
        if (filters?.startDate) {
            queryBuilder.andWhere('p.paymentDate >= :startDate', { startDate: filters.startDate });
        }
        if (filters?.endDate) {
            queryBuilder.andWhere('p.paymentDate <= :endDate', { endDate: filters.endDate });
        }
        if (filters?.customerId) {
            queryBuilder.andWhere('p.customerId = :customerId', { customerId: filters.customerId });
        }

        // Get all payments matching filters
        const payments = await queryBuilder.getMany();

        // Calculate summary by channel
        const byChannel: Record<string, { count: number; amount: number }> = {};
        const byMethod: Record<string, { count: number; amount: number }> = {};
        const byStatus: Record<string, { count: number; amount: number }> = {};

        let totalAmount = 0;
        let totalCount = 0;
        let completedCount = 0;
        let failedCount = 0;
        let refundedAmount = 0;

        for (const payment of payments) {
            const amount = Math.abs(payment.paymentAmount);

            // By channel
            const channel = payment.paymentChannel || 'UNKNOWN';
            if (!byChannel[channel]) {
                byChannel[channel] = { count: 0, amount: 0 };
            }
            byChannel[channel].count++;
            byChannel[channel].amount += amount;

            // By method
            const method = payment.paymentMethod;
            if (!byMethod[method]) {
                byMethod[method] = { count: 0, amount: 0 };
            }
            byMethod[method].count++;
            byMethod[method].amount += amount;

            // By status
            const status = payment.paymentStatus;
            if (!byStatus[status]) {
                byStatus[status] = { count: 0, amount: 0 };
            }
            byStatus[status].count++;
            byStatus[status].amount += amount;

            // Totals
            if (payment.paymentAmount > 0) {
                totalAmount += payment.paymentAmount;
                totalCount++;
            }

            if (payment.paymentStatus === PaymentStatus.COMPLETED) {
                completedCount++;
            } else if (payment.paymentStatus === PaymentStatus.FAILED) {
                failedCount++;
            } else if (payment.paymentStatus === PaymentStatus.REFUNDED && payment.paymentAmount < 0) {
                refundedAmount += Math.abs(payment.paymentAmount);
            }
        }

        // Calculate Stripe success rate
        const stripeTotal = (byMethod[PaymentMethod.STRIPE_CARD]?.count || 0) +
            (byMethod[PaymentMethod.STRIPE_WALLET]?.count || 0);
        const stripeCompleted = payments.filter(p =>
            STRIPE_PAYMENT_METHODS.includes(p.paymentMethod) &&
            p.paymentStatus === PaymentStatus.COMPLETED
        ).length;
        const stripeSuccessRate = stripeTotal > 0 ? (stripeCompleted / stripeTotal) * 100 : 100;

        return {
            totalPayments: totalCount,
            totalAmount: this.roundAmount(totalAmount),
            byChannel: Object.entries(byChannel).map(([category, data]) => ({
                category,
                count: data.count,
                amount: this.roundAmount(data.amount),
            })),
            byMethod: Object.entries(byMethod).map(([category, data]) => ({
                category,
                count: data.count,
                amount: this.roundAmount(data.amount),
            })),
            byStatus: Object.entries(byStatus).map(([category, data]) => ({
                category,
                count: data.count,
                amount: this.roundAmount(data.amount),
            })),
            stripeSuccessRate: this.roundAmount(stripeSuccessRate),
            failedCount,
            refundedAmount: this.roundAmount(refundedAmount),
            period: {
                start: filters?.startDate || new Date(),
                end: filters?.endDate || new Date(),
            },
        };
    }

    /**
     * Get daily collection report for cashier reconciliation
     * 
     * @param date - Report date
     * @param employeeId - Optional employee filter
     * @returns Daily collection report
     */
    async getCashierDailyReport(
        date: Date,
        employeeId?: number,
    ): Promise<DailyCollectionReportDto> {
        this.logger.log(`Getting daily cashier report for ${date.toDateString()}`);

        // Set date range for the day
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Build query for cashier payments only
        const queryBuilder = this.paymentRepository
            .createQueryBuilder('p')
            .where('p.paymentChannel = :channel', { channel: PaymentChannel.CASHIER_PORTAL })
            .andWhere('p.paymentDate BETWEEN :start AND :end', { start: startOfDay, end: endOfDay })
            .andWhere('p.paymentStatus = :status', { status: PaymentStatus.COMPLETED })
            .andWhere('p.paymentAmount > 0'); // Exclude refunds

        if (employeeId) {
            queryBuilder.andWhere('p.employeeId = :employeeId', { employeeId });
        }

        const payments = await queryBuilder.getMany();

        // Get employee name
        let cashierName = 'All Cashiers';
        if (employeeId) {
            const employee = await this.employeeRepository.findOne({ where: { employeeId } });
            if (employee) {
                cashierName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
            }
        }

        // Calculate statistics
        const byMethod: Record<string, { count: number; amount: number }> = {};
        let totalCollected = 0;
        let cashCollected = 0;
        let nonCashCollected = 0;

        for (const payment of payments) {
            const method = payment.paymentMethod;
            if (!byMethod[method]) {
                byMethod[method] = { count: 0, amount: 0 };
            }
            byMethod[method].count++;
            byMethod[method].amount += payment.paymentAmount;

            totalCollected += payment.paymentAmount;

            if (method === PaymentMethod.CASH) {
                cashCollected += payment.paymentAmount;
            } else {
                nonCashCollected += payment.paymentAmount;
            }
        }

        return {
            date: date,
            cashierName,
            cashierId: employeeId || 0,
            openingBalance: 0, // Can be fetched from reconciliation table if exists
            totalCollected: this.roundAmount(totalCollected),
            cashCollected: this.roundAmount(cashCollected),
            nonCashCollected: this.roundAmount(nonCashCollected),
            totalTransactions: payments.length,
            byMethod: Object.entries(byMethod).map(([category, data]) => ({
                category,
                count: data.count,
                amount: this.roundAmount(data.amount),
            })),
            closingBalance: this.roundAmount(cashCollected), // Cash only
            paymentsList: [] as any, // Payment transformation would be done by controller
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Get customer ID from bill's meter connection
     */
    private async getCustomerIdFromBill(bill: Bill): Promise<number | null> {
        try {
            // Query to get customer from service connection
            const result = await this.dataSource.query(
                `SELECT c.customer_id 
         FROM ServiceConnection sc
         INNER JOIN Customer c ON c.customer_id = sc.customer_id
         WHERE sc.meter_id = @0`,
                [bill.meterId]
            );

            return result?.[0]?.customer_id || null;
        } catch (error) {
            this.logger.warn(`Could not get customer ID for bill ${bill.billId}:`, error.message);
            return null;
        }
    }

    /**
     * Map camelCase sort column to snake_case database column
     */
    private mapSortColumn(sortBy: string): string {
        const columnMap: Record<string, string> = {
            paymentDate: 'payment_date',
            paymentAmount: 'payment_amount',
            paymentMethod: 'payment_method',
            paymentChannel: 'payment_channel',
            transactionRef: 'transaction_ref',
            billId: 'bill_id',
            customerId: 'customer_id',
            employeeId: 'employee_id',
        };

        return columnMap[sortBy] || sortBy;
    }

    /**
     * Round amount to 2 decimal places
     */
    private roundAmount(amount: number): number {
        return Math.round(amount * 100) / 100;
    }
}
