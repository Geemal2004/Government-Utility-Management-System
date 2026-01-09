import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { GeoArea } from './geo-area.entity';
import { WarehouseStock } from './warehouse-stock.entity';
import { StockTransaction } from './stock-transaction.entity';

/**
 * Warehouse status enum
 */
export enum WarehouseStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
}

/**
 * Warehouse entity mapping to the Warehouse table in SQL Server
 * Represents storage locations for inventory
 */
@Entity({ name: 'Warehouse' })
@Index('IX_Warehouse_geo_area', ['geoAreaId'])
@Index('IX_Warehouse_status', ['status'])
export class Warehouse {
  @PrimaryGeneratedColumn({ name: 'warehouse_id', type: 'bigint' })
  warehouseId: number;

  @Column({ name: 'name', type: 'varchar', length: 150 })
  name: string;

  @Column({ name: 'status', type: 'varchar', length: 30 })
  status: WarehouseStatus;

  @Column({ name: 'geo_area_id', type: 'bigint' })
  geoAreaId: number;

  // Relations
  @ManyToOne(() => GeoArea)
  @JoinColumn({ name: 'geo_area_id' })
  geoArea: GeoArea;

  @OneToMany(() => WarehouseStock, (stock) => stock.warehouse)
  stock: WarehouseStock[];

  @OneToMany(() => StockTransaction, (txn) => txn.warehouse)
  transactions: StockTransaction[];
}
