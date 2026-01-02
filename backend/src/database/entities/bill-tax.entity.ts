import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { IsNotEmpty, IsNumber, Min, Max } from 'class-validator';
import { Bill } from './bill.entity';
import { TaxConfig } from './tax-config.entity';

/**
 * BillTax entity mapping to the BillTax table in SQL Server
 * Represents individual tax components applied to a bill
 *
 * Example:
 * Subtotal (Energy + Fixed - Subsidies - Credits) = Rs 2,536.00
 * - VAT @ 15% on Rs 2,536.00 = Rs 380.40
 * - Service Tax @ 2.5% on Rs 2,536.00 = Rs 63.40
 * Total Tax = Rs 443.80
 * Final Amount = Rs 2,536.00 + Rs 443.80 = Rs 2,979.80
 */
@Entity({ name: 'BillTax' })
@Index('IX_BillTax_bill', ['billId'])
export class BillTax {
  @PrimaryGeneratedColumn({ name: 'bill_tax_id', type: 'bigint' })
  billTaxId: number;

  @IsNotEmpty()
  @Column({ name: 'bill_id', type: 'bigint' })
  billId: number;

  @IsNotEmpty()
  @Column({ name: 'tax_id', type: 'bigint' })
  taxId: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Column({ name: 'rate_percent_applied', type: 'decimal', precision: 6, scale: 3 })
  ratePercentApplied: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Column({ name: 'taxable_base_amount', type: 'decimal', precision: 12, scale: 2 })
  taxableBaseAmount: number;

  // Relations
  @ManyToOne(() => Bill, (bill) => bill.billTaxes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bill_id' })
  bill: Bill;

  @ManyToOne(() => TaxConfig, { eager: false })
  @JoinColumn({ name: 'tax_id' })
  taxConfig: TaxConfig;

  /**
   * Calculate the tax amount based on rate and base amount
   * Formula: (taxable_base_amount × rate_percent_applied) / 100
   * @returns Calculated tax amount
   */
  getTaxAmount(): number {
    return (this.taxableBaseAmount * this.ratePercentApplied) / 100;
  }

  /**
   * Get the rate as a decimal (e.g., 15% returns 0.15)
   * @returns Rate as decimal
   */
  getRateAsDecimal(): number {
    return this.ratePercentApplied / 100;
  }

  /**
   * Get formatted display string for this tax
   * @returns String like "VAT @ 15% on Rs 2,536.00 = Rs 380.40"
   */
  getDisplayString(): string {
    const taxAmount = this.getTaxAmount();
    return `${this.taxConfig?.taxName || 'Tax'} @ ${this.ratePercentApplied}% on Rs ${this.taxableBaseAmount.toFixed(2)} = Rs ${taxAmount.toFixed(2)}`;
  }

  /**
   * Validate that the applied rate matches the current tax config rate
   * (Useful for detecting rate changes)
   * @returns true if rates match within tolerance
   */
  validateRate(): boolean {
    if (!this.taxConfig) {
      return true; // Can't validate without tax config
    }

    const tolerance = 0.001; // Allow 0.001% tolerance
    return Math.abs(this.ratePercentApplied - this.taxConfig.ratePercent) <= tolerance;
  }

  /**
   * Check if this tax was calculated with a different rate than current
   * (Historical bills may have different rates)
   * @returns true if rate differs from current config
   */
  hasRateChanged(): boolean {
    if (!this.taxConfig) {
      return false;
    }

    const tolerance = 0.001;
    return Math.abs(this.ratePercentApplied - this.taxConfig.ratePercent) > tolerance;
  }

  /**
   * Get effective tax percentage of the base amount
   * @returns Percentage of base that goes to tax
   */
  getEffectivePercentage(): number {
    if (this.taxableBaseAmount === 0) {
      return 0;
    }
    return (this.getTaxAmount() / this.taxableBaseAmount) * 100;
  }
}
