import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { GeoArea } from './geo-area.entity';

/**
 * ConnectionAddress entity mapping to the ConnectionAddress table in SQL Server
 * Represents the physical address where a service connection is installed
 */
@Entity({ name: 'ConnectionAddress' })
export class ConnectionAddress {
  @PrimaryGeneratedColumn({ name: 'connection_address_id', type: 'bigint' })
  connectionAddressId: number;

  @Column({ name: 'line1', type: 'varchar', length: 200 })
  line1: string;

  @Column({ name: 'city', type: 'varchar', length: 120 })
  city: string;

  @Column({ name: 'postal_code', type: 'varchar', length: 20 })
  postalCode: string;

  @Index('IX_ConnectionAddress_geo_area')
  @Column({ name: 'geo_area_id', type: 'bigint' })
  geoAreaId: number;

  // Relations
  @ManyToOne(() => GeoArea)
  @JoinColumn({ name: 'geo_area_id' })
  geoArea: GeoArea;

  /**
   * Get full address string
   */
  get fullAddress(): string {
    return `${this.line1}, ${this.city} ${this.postalCode}`;
  }
}
