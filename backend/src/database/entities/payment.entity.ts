import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { IsNotEmpty, IsNumber, IsDate, IsEnum, IsOptional, Min, MaxLength } from 'class-validator';
import { Bill } from './bill.entity';
import { Employee } from './employee.entity';
import { Customer } from './customer.entity';

/**
 * Payment method enum
 */
export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOBILE_PAYMENT = 'MOBILE_PAYMENT',
  CHEQUE = 'CHEQUE',
  ONLINE = 'ONLINE',
}

/**
 * Payment channel enum
 */
export enum PaymentChannel {
  COUNTER = 'COUNTER',
  ONLINE_PORTAL = 'ONLINE_PORTAL',
  MOBILE_APP = 'MOBILE_APP',
  BANK = 'BANK',
  AGENT = 'AGENT',
}

/**
 * Payment entity mapping to the Payment table in SQL Server
 * Represents payments made against bills
 */
@Entity({ name: 'Payment' })
@Index('IX_Payment_bill', ['billId'])
@Index('IX_Payment_date', ['paymentDate'])
@Index('IX_Payment_customer', ['customerId'])
export class Payment {
  @PrimaryGeneratedColumn({ name: 'payment_id', type: 'bigint' })
  paymentId: number;

  @IsNotEmpty()
  @IsDate()
  @Column({ name: 'payment_date', type: 'datetime2', precision: 0 })
  paymentDate: Date;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Column({ name: 'payment_amount', type: 'decimal', precision: 12, scale: 2 })
  paymentAmount: number;

  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  @Column({ name: 'payment_method', type: 'varchar', length: 30 })
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsEnum(PaymentChannel)
  @Column({ name: 'payment_channel', type: 'varchar', length: 30, nullable: true })
  paymentChannel: PaymentChannel | null;

  @IsOptional()
  @MaxLength(120)
  @Column({ name: 'transaction_ref', type: 'varchar', length: 120, nullable: true })
  transactionRef: string | null;

  @IsNotEmpty()
  @Column({ name: 'bill_id', type: 'bigint' })
  billId: number;

  @IsOptional()
  @Column({ name: 'employee_id', type: 'bigint', nullable: true })
  employeeId: number | null;

  @IsOptional()
  @Column({ name: 'customer_id', type: 'bigint', nullable: true })
  customerId: number | null;

  // Relations
  @ManyToOne(() => Bill, (bill) => bill.payments)
  @JoinColumn({ name: 'bill_id' })
  bill: Bill;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee | null;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer | null;
}
