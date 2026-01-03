import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { UtilityType } from './utility-type.entity';

/**
 * NetworkNode entity mapping to the NetworkNode table in SQL Server
 * Represents nodes in the utility distribution network
 */
@Entity({ name: 'NetworkNode' })
export class NetworkNode {
  @PrimaryGeneratedColumn({ name: 'node_id', type: 'bigint' })
  nodeId: number;

  @Column({ name: 'name', type: 'varchar', length: 120 })
  name: string;

  @Index('IX_NetworkNode_status')
  @Column({ name: 'status', type: 'varchar', length: 30 })
  status: string;

  @Column({ name: 'node_type', type: 'varchar', length: 50 })
  nodeType: string;

  @Index('IX_NetworkNode_utility_type')
  @Column({ name: 'utility_type_id', type: 'bigint' })
  utilityTypeId: number;

  // Relations
  @ManyToOne(() => UtilityType)
  @JoinColumn({ name: 'utility_type_id' })
  utilityType: UtilityType;
}
