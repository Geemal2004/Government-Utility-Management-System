import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { IsNotEmpty, IsNumber, IsDate, Min } from 'class-validator';
import { Meter } from './meter.entity';
import { BillDetail } from './bill-detail.entity';
import { BillTax } from './bill-tax.entity';
import { Payment } from './payment.entity';

/**
 * Bill entity mapping to the Bill table in SQL Server
 * Represents utility bills generated for meter readings
 *
 * Bill Amount Calculation:
 * 1. Energy Charge (from tariff slabs)
 * 2. + Fixed Charge
 * 3. - Subsidies
 * 4. - Solar Export Credits
 * 5. + Taxes (applied to subtotal)
 * = Total Amount Payable
 */
@Entity({ name: 'Bill' })
@Index('IX_Bill_meter_period', ['meterId', 'billingPeriodStart', 'billingPeriodEnd'])
@Index('IX_Bill_bill_date', ['billDate'])
@Index('IX_Bill_due_date', ['dueDate'])
export class Bill {
  @PrimaryGeneratedColumn({ name: 'bill_id', type: 'bigint' })
  billId: number;

  @IsNotEmpty()
  @Index('IX_Bill_meter')
  @Column({ name: 'meter_id', type: 'bigint' })
  meterId: number;

  @IsNotEmpty()
  @IsDate()
  @Column({ name: 'billing_period_start', type: 'date' })
  billingPeriodStart: Date;

  @IsNotEmpty()
  @IsDate()
  @Column({ name: 'billing_period_end', type: 'date' })
  billingPeriodEnd: Date;

  @IsNotEmpty()
  @IsDate()
  @Column({ name: 'bill_date', type: 'date' })
  billDate: Date;

  @IsNotEmpty()
  @IsDate()
  @Column({ name: 'due_date', type: 'date' })
  dueDate: Date;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Column({ name: 'total_import_unit', type: 'decimal', precision: 14, scale: 3 })
  totalImportUnit: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Column({ name: 'total_export_unit', type: 'decimal', precision: 14, scale: 3, default: 0 })
  totalExportUnit: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Column({ name: 'energy_charge_amount', type: 'decimal', precision: 12, scale: 2 })
  energyChargeAmount: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Column({ name: 'fixed_charge_amount', type: 'decimal', precision: 12, scale: 2 })
  fixedChargeAmount: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Column({ name: 'subsidy_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  subsidyAmount: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Column({ name: 'solar_export_credit', type: 'decimal', precision: 12, scale: 2, default: 0 })
  solarExportCredit: number;

  // Relations
  @ManyToOne(() => Meter, { eager: false })
  @JoinColumn({ name: 'meter_id' })
  meter: Meter;

  @OneToMany(() => BillDetail, (detail) => detail.bill, { cascade: true })
  billDetails: BillDetail[];

  @OneToMany(() => BillTax, (tax) => tax.bill, { cascade: true })
  billTaxes: BillTax[];

  @OneToMany(() => Payment, (payment) => payment.bill)
  payments: Payment[];

  /**
   * Calculate total tax amount from all bill taxes
   * @returns Sum of all tax amounts
   */
  getTaxAmount(): number {
    if (!this.billTaxes || this.billTaxes.length === 0) {
      return 0;
    }
    return this.billTaxes.reduce((sum, tax) => sum + tax.getTaxAmount(), 0);
  }

  /**
   * Calculate total amount payable
   * Formula: Energy Charge + Fixed Charge - Subsidies - Solar Credits + Taxes
   * @returns Total amount payable
   */
  getTotalAmount(): number {
    const subtotal =
      this.energyChargeAmount +
      this.fixedChargeAmount -
      this.subsidyAmount -
      this.solarExportCredit;

    const taxes = this.getTaxAmount();

    return subtotal + taxes;
  }

  /**
   * Alias for getTotalAmount() - convenience method
   * @returns Net payable amount
   */
  getNetPayable(): number {
    return this.getTotalAmount();
  }

  /**
   * Calculate total amount paid from all payments
   * @returns Sum of all payment amounts
   */
  getTotalPaid(): number {
    if (!this.payments || this.payments.length === 0) {
      return 0;
    }
    return this.payments.reduce((sum, payment) => sum + payment.paymentAmount, 0);
  }

  /**
   * Check if the bill has been fully paid
   * @returns true if total payments >= total amount
   */
  isPaid(): boolean {
    return this.getTotalPaid() >= this.getTotalAmount();
  }

  /**
   * Calculate outstanding balance
   * @returns Remaining amount to be paid
   */
  getOutstandingBalance(): number {
    const balance = this.getTotalAmount() - this.getTotalPaid();
    return Math.max(0, balance); // Never return negative
  }

  /**
   * Check if the bill is overdue
   * @param currentDate - Date to check against (defaults to current date)
   * @returns true if due date has passed and bill not fully paid
   */
  isOverdue(currentDate: Date = new Date()): boolean {
    if (this.isPaid()) {
      return false;
    }

    const dueDate = new Date(this.dueDate);
    const checkDate = new Date(currentDate);

    // Set time to start of day for fair comparison
    dueDate.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);

    return checkDate > dueDate;
  }

  /**
   * Get number of days overdue
   * @param currentDate - Date to check against (defaults to current date)
   * @returns Number of days overdue (0 if not overdue)
   */
  getDaysOverdue(currentDate: Date = new Date()): number {
    if (!this.isOverdue(currentDate)) {
      return 0;
    }

    const dueDate = new Date(this.dueDate);
    const checkDate = new Date(currentDate);

    const diffTime = checkDate.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  /**
   * Get billing period duration in days
   * @returns Number of days in billing period
   */
  getBillingPeriodDays(): number {
    const start = new Date(this.billingPeriodStart);
    const end = new Date(this.billingPeriodEnd);

    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays + 1; // Include both start and end dates
  }

  /**
   * Get average daily consumption
   * @returns Average units consumed per day
   */
  getAverageDailyConsumption(): number {
    const days = this.getBillingPeriodDays();
    return days > 0 ? this.totalImportUnit / days : 0;
  }
}
