import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Asset } from './asset.entity';
import { MaintenanceRequest } from './maintenance-request.entity';
import { GeoArea } from './geo-area.entity';
import { WorkOrderLabor } from './work-order-labor.entity';
import { WorkOrderItemUsage } from './work-order-item-usage.entity';

/**
 * Work order status enum
 */
export enum WorkOrderStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * WorkOrder entity mapping to the WorkOrder table in SQL Server
 * Represents work orders for maintenance and field operations
 */
@Entity({ name: 'WorkOrder' })
@Index('IX_WorkOrder_status', ['workOrderStatus'])
@Index('IX_WorkOrder_asset', ['assetId'])
@Index('IX_WorkOrder_request', ['requestId'])
@Index('IX_WorkOrder_geo_area', ['geoAreaId'])
@Index('IX_WorkOrder_dates', ['openedTs', 'scheduledStartTs'])
export class WorkOrder {
  @PrimaryGeneratedColumn({ name: 'work_order_id', type: 'bigint' })
  workOrderId: number;

  @Column({ name: 'opened_ts', type: 'datetime2', precision: 0 })
  openedTs: Date;

  @Column({ name: 'scheduled_start_ts', type: 'datetime2', precision: 0, nullable: true })
  scheduledStartTs: Date | null;

  @Column({ name: 'scheduled_end_ts', type: 'datetime2', precision: 0, nullable: true })
  scheduledEndTs: Date | null;

  @Column({ name: 'closed_ts', type: 'datetime2', precision: 0, nullable: true })
  closedTs: Date | null;

  @Column({ name: 'work_order_status', type: 'varchar', length: 30 })
  workOrderStatus: WorkOrderStatus;

  @Column({ name: 'resolution_notes', type: 'nvarchar', length: 'MAX', nullable: true })
  resolutionNotes: string | null;

  @Column({ name: 'asset_id', type: 'bigint', nullable: true })
  assetId: number | null;

  @Column({ name: 'request_id', type: 'bigint', nullable: true })
  requestId: number | null;

  @Column({ name: 'geo_area_id', type: 'bigint' })
  geoAreaId: number;

  // Relations
  @ManyToOne(() => Asset, { nullable: true })
  @JoinColumn({ name: 'asset_id' })
  asset: Asset | null;

  @ManyToOne(() => MaintenanceRequest, { nullable: true })
  @JoinColumn({ name: 'request_id' })
  request: MaintenanceRequest | null;

  @ManyToOne(() => GeoArea)
  @JoinColumn({ name: 'geo_area_id' })
  geoArea: GeoArea;

  @OneToMany(() => WorkOrderLabor, (labor) => labor.workOrder, { cascade: true })
  laborEntries: WorkOrderLabor[];

  @OneToMany(() => WorkOrderItemUsage, (item) => item.workOrder, { cascade: true })
  itemUsages: WorkOrderItemUsage[];

  /**
   * Calculate total labor cost
   */
  get totalLaborCost(): number {
    if (!this.laborEntries || this.laborEntries.length === 0) return 0;
    return this.laborEntries.reduce(
      (sum, labor) => sum + Number(labor.hours) * Number(labor.hourlyRateSnapshot),
      0,
    );
  }

  /**
   * Calculate total item cost
   */
  get totalItemCost(): number {
    if (!this.itemUsages || this.itemUsages.length === 0) return 0;
    return this.itemUsages.reduce((sum, item) => sum + Number(item.itemCostAmount), 0);
  }

  /**
   * Calculate total work order cost (labor + items)
   */
  get totalCost(): number {
    return this.totalLaborCost + this.totalItemCost;
  }

  /**
   * Calculate work order duration in hours
   */
  get durationHours(): number | null {
    if (!this.scheduledStartTs || !this.scheduledEndTs) return null;
    const diff = this.scheduledEndTs.getTime() - this.scheduledStartTs.getTime();
    return Math.round(diff / (1000 * 60 * 60) * 10) / 10; // Round to 1 decimal
  }
}
