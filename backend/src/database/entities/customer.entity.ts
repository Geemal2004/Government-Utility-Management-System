import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { CustomerAddress } from './customer-address.entity';
import { CustomerPhone } from './customer-phone.entity';
import { Employee } from './employee.entity';
import { TariffCategory } from './tariff-category.entity';
import { ServiceConnection } from './service-connection.entity';

/**
 * Customer entity mapping to the Customer table in SQL Server
 */
@Entity({ name: 'Customer' })
export class Customer {
  @PrimaryGeneratedColumn({ name: 'customer_id', type: 'bigint' })
  customerId: number;

  @Column({ name: 'first_name', type: 'varchar', length: 80 })
  firstName: string;

  @Column({ name: 'middle_name', type: 'varchar', length: 80, nullable: true })
  middleName: string | null;

  @Column({ name: 'last_name', type: 'varchar', length: 80 })
  lastName: string;

  @Exclude()
  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ name: 'email', type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ name: 'customer_address_id', type: 'bigint' })
  customerAddressId: number;

  @Column({ name: 'customer_type', type: 'varchar', length: 30 })
  customerType: string;

  @Column({ name: 'registration_date', type: 'date' })
  registrationDate: Date;

  @Column({ name: 'identity_type', type: 'varchar', length: 30 })
  identityType: string;

  @Column({ name: 'identity_ref', type: 'varchar', length: 80, unique: true })
  identityRef: string;

  @Column({ name: 'employee_id', type: 'bigint', nullable: true })
  employeeId: number | null;

  @Column({ name: 'tariff_category_id', type: 'bigint', nullable: true })
  tariffCategoryId: number | null;

  // Relations
  @ManyToOne(() => CustomerAddress, { eager: true })
  @JoinColumn({ name: 'customer_address_id' })
  address: CustomerAddress;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  registeredBy: Employee;

  @ManyToOne(() => TariffCategory, { nullable: true })
  @JoinColumn({ name: 'tariff_category_id' })
  tariffCategory: TariffCategory | null;

  @OneToMany(() => CustomerPhone, (phone) => phone.customer, { eager: true })
  phoneNumbers: CustomerPhone[];

  @OneToMany(() => ServiceConnection, (connection) => connection.customer)
  serviceConnections: ServiceConnection[];

  /**
   * Get full name of the customer
   */
  get fullName(): string {
    if (this.middleName) {
      return `${this.firstName} ${this.middleName} ${this.lastName}`;
    }
    return `${this.firstName} ${this.lastName}`;
  }
}
