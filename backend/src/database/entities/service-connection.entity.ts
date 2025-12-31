import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Customer } from './customer.entity';
import { UtilityType } from './utility-type.entity';
import { TariffCategory } from './tariff-category.entity';
import { Meter } from './meter.entity';
import { ConnectionAddress } from './connection-address.entity';
import { NetworkNode } from './network-node.entity';

/**
 * Connection status enum
 */
export enum ConnectionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DISCONNECTED = 'DISCONNECTED',
  PENDING = 'PENDING',
}

/**
 * ServiceConnection entity mapping to the ServiceConnection table in SQL Server
 * Represents a customer's connection to a utility service
 */
@Entity({ name: 'ServiceConnection' })
@Index('IX_ServiceConnection_customer', ['customerId'])
@Index('IX_ServiceConnection_meter', ['meterId'])
@Index('IX_ServiceConnection_status', ['connectionStatus'])
@Index('IX_ServiceConnection_utility_tariff', ['utilityTypeId', 'tariffCategoryId'])
export class ServiceConnection {
  @PrimaryGeneratedColumn({ name: 'connection_id', type: 'bigint' })
  connectionId: number;

  @Column({ name: 'customer_id', type: 'bigint' })
  customerId: number;

  @Column({ name: 'utility_type_id', type: 'bigint' })
  utilityTypeId: number;

  @Column({ name: 'tariff_category_id', type: 'bigint' })
  tariffCategoryId: number;

  @Column({
    name: 'connection_status',
    type: 'varchar',
    length: 30,
    default: ConnectionStatus.PENDING,
  })
  connectionStatus: ConnectionStatus;

  @Column({ name: 'meter_id', type: 'bigint', nullable: true })
  meterId: number | null;

  @Column({ name: 'connection_address_id', type: 'bigint' })
  connectionAddressId: number;

  @Column({ name: 'node_id', type: 'bigint', nullable: true })
  nodeId: number | null;

  // Relations
  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => UtilityType)
  @JoinColumn({ name: 'utility_type_id' })
  utilityType: UtilityType;

  @ManyToOne(() => TariffCategory)
  @JoinColumn({ name: 'tariff_category_id' })
  tariffCategory: TariffCategory;

  @ManyToOne(() => Meter, { nullable: true })
  @JoinColumn({ name: 'meter_id' })
  meter: Meter | null;

  @ManyToOne(() => ConnectionAddress)
  @JoinColumn({ name: 'connection_address_id' })
  connectionAddress: ConnectionAddress;

  @ManyToOne(() => NetworkNode, { nullable: true })
  @JoinColumn({ name: 'node_id' })
  networkNode: NetworkNode | null;
}
