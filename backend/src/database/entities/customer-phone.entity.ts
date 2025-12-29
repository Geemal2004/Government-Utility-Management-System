import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from './customer.entity';

/**
 * CustomerPhoneNumbers entity mapping to the CustomerPhoneNumbers table in SQL Server
 * Composite primary key: (customer_id, phone)
 */
@Entity({ name: 'CustomerPhoneNumbers' })
export class CustomerPhone {
  @PrimaryColumn({ name: 'customer_id', type: 'bigint' })
  customerId: number;

  @PrimaryColumn({ name: 'phone', type: 'varchar', length: 30 })
  phone: string;

  @ManyToOne(() => Customer, (customer) => customer.phoneNumbers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;
}
