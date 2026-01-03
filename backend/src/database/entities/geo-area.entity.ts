import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';

/**
 * GeoArea entity mapping to the GeoArea table in SQL Server
 * Represents geographic areas (District, Division, Zone)
 */
@Entity({ name: 'GeoArea' })
export class GeoArea {
  @PrimaryGeneratedColumn({ name: 'geo_area_id', type: 'bigint' })
  geoAreaId: number;

  @Column({ name: 'name', type: 'varchar', length: 120 })
  name: string;

  @Column({ name: 'type', type: 'varchar', length: 30 })
  type: string;

  @Column({ name: 'parent_geo_area_id', type: 'bigint', nullable: true })
  parentGeoAreaId: number | null;

  // Self-referencing relation for hierarchical areas
  @ManyToOne(() => GeoArea, { nullable: true })
  @JoinColumn({ name: 'parent_geo_area_id' })
  parentGeoArea: GeoArea | null;
}
