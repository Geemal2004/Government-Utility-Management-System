import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

/**
 * Employee entity mapping to the Employee table in SQL Server
 * Represents system users who can authenticate and perform operations
 */
@Entity({ name: 'Employee' })
export class Employee {
  @PrimaryGeneratedColumn({ name: 'employee_id', type: 'bigint' })
  employeeId: number;

  @Column({ name: 'first_name', type: 'varchar', length: 80 })
  firstName: string;

  @Column({ name: 'middle_name', type: 'varchar', length: 80, nullable: true })
  middleName: string | null;

  @Column({ name: 'last_name', type: 'varchar', length: 80 })
  lastName: string;

  @Column({ name: 'employee_no', type: 'varchar', length: 30, unique: true })
  employeeNo: string;

  @Column({ name: 'designation', type: 'varchar', length: 80 })
  designation: string;

  @Column({ name: 'role', type: 'varchar', length: 80 })
  role: string;

  @Column({ name: 'department_id', type: 'bigint' })
  departmentId: number;

  @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'username', type: 'varchar', length: 80, unique: true })
  username: string;

  @Exclude()
  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ name: 'last_login_at', type: 'datetime2', nullable: true })
  lastLoginAt: Date | null;

  /**
   * Get full name of the employee
   */
  get fullName(): string {
    if (this.middleName) {
      return `${this.firstName} ${this.middleName} ${this.lastName}`;
    }
    return `${this.firstName} ${this.lastName}`;
  }
}
