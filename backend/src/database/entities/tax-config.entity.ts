import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsDate,
  IsOptional,
  IsEnum,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

/**
 * Tax status enum
 */
export enum TaxStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

/**
 * TaxConfig entity mapping to the TaxConfig table in SQL Server
 * Represents tax configurations applied to bills
 *
 * Examples:
 * - VAT: 15% (Value Added Tax)
 * - Service Tax: 2.5%
 * - Environmental Levy: 1%
 */
@Entity({ name: 'TaxConfig' })
export class TaxConfig {
  @PrimaryGeneratedColumn({ name: 'tax_id', type: 'bigint' })
  taxId: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  @Column({ name: 'tax_name', type: 'varchar', length: 120 })
  taxName: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Column({ name: 'rate_percent', type: 'decimal', precision: 6, scale: 3 })
  ratePercent: number;

  @IsNotEmpty()
  @IsDate()
  @Index('IX_TaxConfig_effective_from')
  @Column({ name: 'effective_from', type: 'date' })
  effectiveFrom: Date;

  @IsOptional()
  @IsDate()
  @Column({ name: 'effective_to', type: 'date', nullable: true })
  effectiveTo: Date | null;

  @IsNotEmpty()
  @IsEnum(TaxStatus)
  @Index('IX_TaxConfig_status')
  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: TaxStatus.ACTIVE,
  })
  status: TaxStatus;

  /**
   * Check if this tax configuration is active for a given date
   * @param date - The date to check (defaults to current date)
   * @returns true if the tax is active on the given date
   */
  isActive(date: Date = new Date()): boolean {
    // Check if status is ACTIVE
    if (this.status !== TaxStatus.ACTIVE) {
      return false;
    }

    const checkDate = new Date(date);
    const effectiveFrom = new Date(this.effectiveFrom);

    // Check if date is after effective_from
    if (checkDate < effectiveFrom) {
      return false;
    }

    // Check if date is before effective_to (if effective_to exists)
    if (this.effectiveTo) {
      const effectiveTo = new Date(this.effectiveTo);
      if (checkDate > effectiveTo) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate tax amount based on a taxable base amount
   * @param baseAmount - The base amount to calculate tax on
   * @returns The tax amount
   */
  calculateTaxAmount(baseAmount: number): number {
    return (baseAmount * this.ratePercent) / 100;
  }

  /**
   * Get the tax rate as a decimal (e.g., 15% returns 0.15)
   * @returns Tax rate as decimal
   */
  getRateAsDecimal(): number {
    return this.ratePercent / 100;
  }

  /**
   * Check if this tax is currently effective (based on current date and status)
   * @returns true if the tax is currently effective
   */
  isCurrentlyEffective(): boolean {
    return this.isActive(new Date());
  }

  /**
   * Get a formatted display string for the tax
   * @returns Formatted string like "VAT (15%)"
   */
  getDisplayName(): string {
    return `${this.taxName} (${this.ratePercent}%)`;
  }
}
