import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../database/entities/employee.entity';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  /**
   * Find employee by username
   * @param username - Employee username
   * @returns Employee or null
   */
  async findByUsername(username: string): Promise<Employee | null> {
    return this.employeeRepository.findOne({
      where: { username },
    });
  }

  /**
   * Find employee by email
   * @param email - Employee email
   * @returns Employee or null
   */
  async findByEmail(email: string): Promise<Employee | null> {
    return this.employeeRepository.findOne({
      where: { email },
    });
  }

  /**
   * Find employee by ID
   * @param employeeId - Employee ID
   * @returns Employee or null
   */
  async findById(employeeId: number): Promise<Employee | null> {
    return this.employeeRepository.findOne({
      where: { employeeId },
    });
  }

  /**
   * Find employee by ID or throw NotFoundException
   * @param employeeId - Employee ID
   * @returns Employee
   * @throws NotFoundException if employee not found
   */
  async findByIdOrFail(employeeId: number): Promise<Employee> {
    const employee = await this.findById(employeeId);
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }
    return employee;
  }

  /**
   * Update employee's last login timestamp
   * @param employeeId - Employee ID
   */
  async updateLastLogin(employeeId: number): Promise<void> {
    await this.employeeRepository.update(employeeId, {
      lastLoginAt: new Date(),
    });
  }

  /**
   * Get all employees (paginated)
   * @param page - Page number (1-based)
   * @param limit - Number of items per page
   * @returns Paginated employees list
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Employee[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.employeeRepository.findAndCount({
      skip,
      take: limit,
      order: { employeeId: 'ASC' },
    });

    return { data, total, page, limit };
  }
}
