import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { GeoArea } from './geo-area.entity';
import { UtilityType } from './utility-type.entity';

/**
 * Request priority enum
 */
export enum RequestPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * MaintenanceRequest entity mapping to the MaintenanceRequest table in SQL Server
 * Represents customer or employee-initiated maintenance requests
 */
@Entity({ name: 'MaintenanceRequest' })
@Index('IX_MaintenanceRequest_customer', ['requestedByCustomerId'])
@Index('IX_MaintenanceRequest_priority', ['priority'])
@Index('IX_MaintenanceRequest_geo_area', ['geoAreaId'])
@Index('IX_MaintenanceRequest_date', ['requestTs'])
export class MaintenanceRequest {
  @PrimaryGeneratedColumn({ name: 'request_id', type: 'bigint' })
  requestId: number;

  @Column({ name: 'requested_by_customer_id', type: 'bigint', nullable: true })
  requestedByCustomerId: number | null;

  @Column({ name: 'request_ts', type: 'datetime2', precision: 0 })
  requestTs: Date;

  @Column({ name: 'priority', type: 'varchar', length: 20 })
  priority: RequestPriority;

  @Column({ name: 'issue_type', type: 'varchar', length: 50 })
  issueType: string;

  @Column({ name: 'description', type: 'nvarchar', length: 'MAX' })
  description: string;

  @Column({ name: 'output_uom', type: 'varchar', length: 20, nullable: true })
  outputUom: string | null;

  @Column({ name: 'geo_area_id', type: 'bigint' })
  geoAreaId: number;

  @Column({ name: 'utility_type_id', type: 'bigint' })
  utilityTypeId: number;

  // Relations
  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'requested_by_customer_id' })
  requestedByCustomer: Customer | null;

  @ManyToOne(() => GeoArea)
  @JoinColumn({ name: 'geo_area_id' })
  geoArea: GeoArea;

  @ManyToOne(() => UtilityType)
  @JoinColumn({ name: 'utility_type_id' })
  utilityType: UtilityType;
}
