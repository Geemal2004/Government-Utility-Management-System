import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { Bill } from './bill.entity';
import { TariffSlab } from './tariff-slab.entity';

/**
 * BillDetail entity mapping to the BillDetail table in SQL Server
 * Represents slab-wise breakdown of energy charges in a bill
 *
 * Example for 150 units consumption with 3 slabs:
 * - Slab 1: 0-60 units @ Rs 7.85 = 60 units × 7.85 = Rs 471.00
 * - Slab 2: 61-90 units @ Rs 10.00 = 30 units × 10.00 = Rs 300.00
 * - Slab 3: 91-180 units @ Rs 27.75 = 60 units × 27.75 = Rs 1,665.00
 * Total Energy Charge = Rs 2,436.00
 */
@Entity({ name: 'BillDetail' })
@Index('IX_BillDetail_bill', ['billId'])
export class BillDetail {
  @PrimaryGeneratedColumn({ name: 'bill_detail_id', type: 'bigint' })
  billDetailId: number;

  @IsNotEmpty()
  @Column({ name: 'bill_id', type: 'bigint' })
  billId: number;

  @IsOptional()
  @Column({ name: 'slab_id', type: 'bigint', nullable: true })
  slabId: number | null;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Column({ name: 'units_in_slab', type: 'decimal', precision: 14, scale: 3 })
  unitsInSlab: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Column({ name: 'amount', type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  // Relations
  @ManyToOne(() => Bill, (bill) => bill.billDetails, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bill_id' })
  bill: Bill;

  @ManyToOne(() => TariffSlab, { eager: false, nullable: true })
  @JoinColumn({ name: 'slab_id' })
  tariffSlab: TariffSlab | null;

  /**
   * Calculate the rate per unit for this detail
   * @returns Rate per unit (amount / units)
   */
  getRatePerUnit(): number {
    return this.unitsInSlab > 0 ? this.amount / this.unitsInSlab : 0;
  }

  /**
   * Get slab range description
   * @returns Formatted string like "0-60 units" or "180+ units"
   */
  getSlabRangeDescription(): string {
    if (!this.tariffSlab) {
      return 'Fixed charge / Other';
    }

    const from = this.tariffSlab.fromUnit;
    const to = this.tariffSlab.toUnit;

    if (to === null) {
      return `${from}+ units`;
    }

    return `${from}-${to} units`;
  }

  /**
   * Validate that calculated amount matches units × rate
   * @returns true if amount matches the expected calculation
   */
  validateAmount(): boolean {
    if (!this.tariffSlab) {
      return true; // Can't validate without tariff slab
    }

    const expectedAmount = this.unitsInSlab * this.tariffSlab.ratePerUnit;
    const tolerance = 0.01; // Allow 1 cent tolerance for rounding

    return Math.abs(this.amount - expectedAmount) <= tolerance;
  }
}
