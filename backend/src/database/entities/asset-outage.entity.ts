import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Asset } from './asset.entity';

/**
 * Asset outage type enum
 */
export enum AssetOutageType {
  FULL = 'FULL',
  PARTIAL = 'PARTIAL',
}

/**
 * AssetOutage entity mapping to the AssetOutage table in SQL Server
 * Represents outages specific to physical assets
 */
@Entity({ name: 'AssetOutage' })
@Index('IX_AssetOutage_asset', ['assetId'])
@Index('IX_AssetOutage_type', ['outageType'])
@Index('IX_AssetOutage_dates', ['startTs', 'endTs'])
export class AssetOutage {
  @PrimaryGeneratedColumn({ name: 'outage_id', type: 'bigint' })
  outageId: number;

  @Column({ name: 'asset_id', type: 'bigint' })
  assetId: number;

  @Column({ name: 'outage_type', type: 'varchar', length: 20 })
  outageType: AssetOutageType;

  @Column({ name: 'start_ts', type: 'datetime2', precision: 0 })
  startTs: Date;

  @Column({ name: 'end_ts', type: 'datetime2', precision: 0, nullable: true })
  endTs: Date | null;

  @Column({ name: 'reason', type: 'nvarchar', length: 'MAX', nullable: true })
  reason: string | null;

  @Column({ name: 'derate_percent', type: 'decimal', precision: 5, scale: 2, nullable: true })
  deratePercent: number | null;

  // Relations
  @ManyToOne(() => Asset)
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  /**
   * Check if asset outage is currently active
   */
  get isActive(): boolean {
    const now = new Date();
    return this.startTs <= now && (!this.endTs || this.endTs >= now);
  }

  /**
   * Calculate outage duration in hours
   */
  get durationHours(): number | null {
    if (!this.endTs) return null;
    const diff = this.endTs.getTime() - this.startTs.getTime();
    return Math.round(diff / (1000 * 60 * 60) * 10) / 10; // Round to 1 decimal
  }
}
