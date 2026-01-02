import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { IsNotEmpty, IsNumber, IsDate, IsOptional, Min } from 'class-validator';
import { TariffCategory } from './tariff-category.entity';

/**
 * TariffSlab entity mapping to the TariffSlab table in SQL Server
 * Represents progressive pricing tiers within a tariff category
 *
 * Example:
 * - Slab 1: 0-60 units @ Rs 7.85/unit
 * - Slab 2: 61-90 units @ Rs 10.00/unit
 * - Slab 3: 91+ units @ Rs 27.75/unit
 */
@Entity({ name: 'TariffSlab' })
export class TariffSlab {
  @PrimaryGeneratedColumn({ name: 'slab_id', type: 'bigint' })
  slabId: number;

  @IsNotEmpty()
  @IsNumber()
  @Index('IX_TariffSlab_category')
  @Column({ name: 'tariff_category_id', type: 'bigint' })
  tariffCategoryId: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Column({ name: 'from_unit', type: 'decimal', precision: 14, scale: 3 })
  fromUnit: number;

  @IsOptional()
  @IsNumber()
  @Column({ name: 'to_unit', type: 'decimal', precision: 14, scale: 3, nullable: true })
  toUnit: number | null;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Column({ name: 'rate_per_unit', type: 'decimal', precision: 12, scale: 4 })
  ratePerUnit: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Column({ name: 'fixed_charge', type: 'decimal', precision: 12, scale: 2 })
  fixedCharge: number;

  @IsOptional()
  @IsNumber()
  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 4, nullable: true })
  unitPrice: number | null;

  @IsNotEmpty()
  @IsDate()
  @Index('IX_TariffSlab_valid_from')
  @Column({ name: 'valid_from', type: 'date' })
  validFrom: Date;

  @IsOptional()
  @IsDate()
  @Column({ name: 'valid_to', type: 'date', nullable: true })
  validTo: Date | null;

  // Relations
  @ManyToOne(() => TariffCategory, { eager: false })
  @JoinColumn({ name: 'tariff_category_id' })
  tariffCategory: TariffCategory;

  /**
   * Check if this tariff slab is valid for a given date
   * @param date - The date to check validity (defaults to current date)
   * @returns true if the slab is valid on the given date
   */
  isValid(date: Date = new Date()): boolean {
    const checkDate = new Date(date);
    const validFrom = new Date(this.validFrom);

    // Check if date is after valid_from
    if (checkDate < validFrom) {
      return false;
    }

    // Check if date is before valid_to (if valid_to exists)
    if (this.validTo) {
      const validTo = new Date(this.validTo);
      if (checkDate > validTo) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if a given consumption falls within this slab range
   * @param units - Number of units consumed
   * @returns true if the units fall within this slab's range
   */
  isInRange(units: number): boolean {
    if (units < this.fromUnit) {
      return false;
    }

    // If to_unit is null, it means unlimited (this is the highest slab)
    if (this.toUnit === null) {
      return true;
    }

    return units <= this.toUnit;
  }

  /**
   * Calculate the number of units that apply to this slab
   * @param totalUnits - Total consumption units
   * @returns Number of units that fall within this slab
   */
  getUnitsInSlab(totalUnits: number): number {
    if (totalUnits <= this.fromUnit) {
      return 0;
    }

    // If to_unit is null (unlimited), all remaining units apply
    if (this.toUnit === null) {
      return totalUnits - this.fromUnit;
    }

    // If total units exceed this slab's upper limit
    if (totalUnits > this.toUnit) {
      return this.toUnit - this.fromUnit;
    }

    // Units fall within this slab's range
    return totalUnits - this.fromUnit;
  }

  /**
   * Calculate the charge for this slab based on consumption
   * @param totalUnits - Total consumption units
   * @returns Amount to charge for units in this slab
   */
  calculateSlabCharge(totalUnits: number): number {
    const unitsInSlab = this.getUnitsInSlab(totalUnits);
    return unitsInSlab * this.ratePerUnit;
  }
}
