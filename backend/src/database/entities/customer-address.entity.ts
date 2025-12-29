import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

/**
 * CustomerAddress entity mapping to the CustomerAddress table in SQL Server
 */
@Entity({ name: 'CustomerAddress' })
export class CustomerAddress {
  @PrimaryGeneratedColumn({ name: 'customer_address_id', type: 'bigint' })
  customerAddressId: number;

  @Column({ name: 'postal_code', type: 'varchar', length: 20 })
  postalCode: string;

  @Column({ name: 'line1', type: 'varchar', length: 200 })
  line1: string;
}
