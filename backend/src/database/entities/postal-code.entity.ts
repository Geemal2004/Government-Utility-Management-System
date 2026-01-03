import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * PostalCodes entity mapping to the PostalCodes table in SQL Server
 * Represents postal code reference data for Sri Lanka
 */
@Entity({ name: 'PostalCodes' })
export class PostalCode {
  @PrimaryColumn({ name: 'postal_code', type: 'varchar', length: 20 })
  postalCode: string;

  @Column({ name: 'city', type: 'varchar', length: 120 })
  city: string;

  @Column({ name: 'province', type: 'varchar', length: 120 })
  province: string;
}
