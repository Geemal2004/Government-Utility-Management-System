import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Employee } from '../database/entities/employee.entity';
import { Department } from '../database/entities/department.entity';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  UpdateProfileDto,
  EmployeeFilterDto,
  ChangePasswordDto,
  DeactivateEmployeeDto,
  AssignRoleDto,
  EmployeeStatsDto,
  Paginated,
} from './dto';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) { }

  // ============================================================
  // AUTH METHODS (used by auth module)
  // ============================================================

  async findByUsername(username: string): Promise<Employee | null> {
    return this.employeeRepository.findOne({ where: { username } });
  }

  async findByEmail(email: string): Promise<Employee | null> {
    return this.employeeRepository.findOne({ where: { email } });
  }

  async findByIdEntity(employeeId: number): Promise<Employee | null> {
    return this.employeeRepository.findOne({ where: { employeeId } });
  }

  async findByIdOrFail(employeeId: number): Promise<Employee> {
    const employee = await this.findByIdEntity(employeeId);
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }
    return employee;
  }

  async updateLastLogin(employeeId: number): Promise<void> {
    await this.employeeRepository.update(employeeId, { lastLoginAt: new Date() });
  }

  // ============================================================
  // STATISTICS
  // ============================================================

  async statistics(): Promise<EmployeeStatsDto> {
    const total = await this.employeeRepository.count();

    // By department
    const byDepartmentRaw = await this.employeeRepository
      .createQueryBuilder('e')
      .select('e.departmentId', 'departmentId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('e.departmentId')
      .getRawMany();

    const departments = await this.departmentRepository.find();
    const deptMap = new Map(departments.map(d => [d.departmentId, d.name]));

    const byDepartment = byDepartmentRaw.map(r => ({
      departmentId: r.departmentId,
      departmentName: deptMap.get(r.departmentId) || 'Unknown',
      count: parseInt(r.count, 10),
    }));

    // By role
    const byRoleRaw = await this.employeeRepository
      .createQueryBuilder('e')
      .select('e.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('e.role')
      .getRawMany();

    const byRole = byRoleRaw.map(r => ({
      role: r.role,
      count: parseInt(r.count, 10),
    }));

    return { total, byDepartment, byRole };
  }

  // ============================================================
  // CURRENT USER PROFILE
  // ============================================================

  async me(currentUser: { employeeId: number }): Promise<EmployeeResponseDto> {
    const employee = await this.findByIdOrFail(currentUser.employeeId);
    return EmployeeResponseDto.fromEntity(employee);
  }

  async updateMyProfile(
    currentUser: { employeeId: number },
    dto: UpdateProfileDto,
  ): Promise<EmployeeResponseDto> {
    const employee = await this.findByIdOrFail(currentUser.employeeId);

    // Only allow updating certain fields
    if (dto.firstName) employee.firstName = dto.firstName;
    if (dto.lastName) employee.lastName = dto.lastName;
    if (dto.middleName !== undefined) employee.middleName = dto.middleName;
    if (dto.email && dto.email !== employee.email) {
      const existing = await this.findByEmail(dto.email);
      if (existing && existing.employeeId !== employee.employeeId) {
        throw new ConflictException('Email already in use');
      }
      employee.email = dto.email;
    }

    const saved = await this.employeeRepository.save(employee);
    return EmployeeResponseDto.fromEntity(saved);
  }

  // ============================================================
  // FIND EMPLOYEES
  // ============================================================

  async findById(id: string): Promise<EmployeeResponseDto> {
    const employee = await this.findByIdOrFail(parseInt(id, 10));
    return EmployeeResponseDto.fromEntity(employee);
  }

  async findByEmployeeNo(employeeNo: string): Promise<EmployeeResponseDto> {
    const employee = await this.employeeRepository.findOne({ where: { employeeNo } });
    if (!employee) {
      throw new NotFoundException(`Employee with employee number ${employeeNo} not found`);
    }
    return EmployeeResponseDto.fromEntity(employee);
  }

  async findByDepartment(departmentId: string): Promise<EmployeeResponseDto[]> {
    const employees = await this.employeeRepository.find({
      where: { departmentId: parseInt(departmentId, 10) },
      order: { lastName: 'ASC', firstName: 'ASC' },
    });
    return employees.map(e => EmployeeResponseDto.fromEntity(e));
  }

  async findByRole(role: string): Promise<EmployeeResponseDto[]> {
    const employees = await this.employeeRepository.find({
      where: { role },
      order: { lastName: 'ASC', firstName: 'ASC' },
    });
    return employees.map(e => EmployeeResponseDto.fromEntity(e));
  }

  async findAll(filterDto: EmployeeFilterDto): Promise<Paginated<EmployeeResponseDto>> {
    const { page = 1, limit = 10, search, departmentId, role, sortBy = 'employeeId', sortOrder = 'ASC' } = filterDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.employeeRepository.createQueryBuilder('e');

    if (search) {
      queryBuilder.andWhere(
        '(e.firstName LIKE :search OR e.lastName LIKE :search OR e.email LIKE :search OR e.employeeNo LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (departmentId) {
      queryBuilder.andWhere('e.departmentId = :departmentId', { departmentId });
    }

    if (role) {
      queryBuilder.andWhere('e.role = :role', { role });
    }

    const validSortColumns = ['employeeId', 'firstName', 'lastName', 'email', 'role', 'departmentId'];
    const orderColumn = validSortColumns.includes(sortBy) ? `e.${sortBy}` : 'e.employeeId';
    queryBuilder.orderBy(orderColumn, sortOrder === 'DESC' ? 'DESC' : 'ASC');

    queryBuilder.skip(skip).take(limit);

    const [employees, total] = await queryBuilder.getManyAndCount();

    return {
      data: employees.map(e => EmployeeResponseDto.fromEntity(e)),
      total,
      page,
      limit,
    };
  }

  // ============================================================
  // CREATE / UPDATE EMPLOYEE
  // ============================================================

  async create(dto: CreateEmployeeDto, createdByEmployeeId: string): Promise<EmployeeResponseDto> {
    // Check for duplicates
    const existingUsername = await this.findByUsername(dto.username);
    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

    const existingEmail = await this.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    // Generate employee number
    const lastEmployee = await this.employeeRepository.find({
      order: { employeeId: 'DESC' },
      take: 1,
    });
    const nextNum = lastEmployee.length > 0 ? lastEmployee[0].employeeId + 1 : 1;
    const employeeNo = `EMP${String(nextNum).padStart(5, '0')}`;

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const employee = this.employeeRepository.create({
      employeeNo,
      firstName: dto.firstName,
      middleName: dto.middleName,
      lastName: dto.lastName,
      email: dto.email,
      username: dto.username,
      passwordHash,
      role: dto.role,
      designation: dto.designation,
      departmentId: dto.departmentId,
    });

    const saved = await this.employeeRepository.save(employee);
    return EmployeeResponseDto.fromEntity(saved);
  }

  async update(
    id: string,
    dto: UpdateEmployeeDto,
    currentUser: { employeeId: number; role: string },
  ): Promise<EmployeeResponseDto> {
    const employee = await this.findByIdOrFail(parseInt(id, 10));

    // Check unique constraints
    if (dto.username && dto.username !== employee.username) {
      const existing = await this.findByUsername(dto.username);
      if (existing) throw new ConflictException('Username already exists');
      employee.username = dto.username;
    }

    if (dto.email && dto.email !== employee.email) {
      const existing = await this.findByEmail(dto.email);
      if (existing) throw new ConflictException('Email already exists');
      employee.email = dto.email;
    }

    // Update fields
    if (dto.firstName) employee.firstName = dto.firstName;
    if (dto.lastName) employee.lastName = dto.lastName;
    if (dto.middleName !== undefined) employee.middleName = dto.middleName;
    if (dto.designation !== undefined) employee.designation = dto.designation;
    if (dto.departmentId !== undefined) employee.departmentId = dto.departmentId;
    if (dto.role && currentUser.role === 'ADMIN') employee.role = dto.role;

    const saved = await this.employeeRepository.save(employee);
    return EmployeeResponseDto.fromEntity(saved);
  }

  // ============================================================
  // PASSWORD MANAGEMENT
  // ============================================================

  async changePassword(
    id: string,
    dto: ChangePasswordDto,
    currentUser: { employeeId: number; role: string },
  ): Promise<void> {
    const employeeId = parseInt(id, 10);

    // Only allow changing own password unless ADMIN
    if (currentUser.employeeId !== employeeId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only change your own password');
    }

    const employee = await this.findByIdOrFail(employeeId);

    // Verify old password (unless admin resetting)
    if (currentUser.employeeId === employeeId) {
      const isOldPasswordValid = await bcrypt.compare(dto.oldPassword, employee.passwordHash);
      if (!isOldPasswordValid) {
        throw new BadRequestException('Old password is incorrect');
      }
    }

    // Hash and save new password
    employee.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.employeeRepository.save(employee);
  }

  async resetPassword(
    id: string,
    currentUser: { employeeId: number; role: string },
  ): Promise<{ temporaryPassword: string }> {
    const employee = await this.findByIdOrFail(parseInt(id, 10));

    // Generate temporary password
    const temporaryPassword = `Temp${Math.random().toString(36).substring(2, 10)}!`;
    employee.passwordHash = await bcrypt.hash(temporaryPassword, 10);
    await this.employeeRepository.save(employee);

    return { temporaryPassword };
  }

  // ============================================================
  // ACTIVATION / DEACTIVATION (Schema doesn't support isActive, so these are no-ops or throw)
  // ============================================================

  async deactivate(
    id: string,
    dto: DeactivateEmployeeDto,
    currentUser: { employeeId: number; role: string },
  ): Promise<void> {
    // Schema doesn't have isActive field - this is a placeholder
    const employee = await this.findByIdOrFail(parseInt(id, 10));
    // In a real implementation with isActive, we would set: employee.isActive = false;
    // For now, just log/acknowledge
    console.log(`Deactivation requested for employee ${employee.employeeId}: ${dto.reason}`);
  }

  async reactivate(
    id: string,
    currentUser: { employeeId: number; role: string },
  ): Promise<EmployeeResponseDto> {
    // Schema doesn't have isActive field - this is a placeholder
    const employee = await this.findByIdOrFail(parseInt(id, 10));
    // In a real implementation with isActive, we would set: employee.isActive = true;
    return EmployeeResponseDto.fromEntity(employee);
  }

  // ============================================================
  // ROLE ASSIGNMENT
  // ============================================================

  async assignSpecializedRole(
    id: string,
    dto: AssignRoleDto,
    currentUser: { employeeId: number; role: string },
  ): Promise<EmployeeResponseDto> {
    const employee = await this.findByIdOrFail(parseInt(id, 10));

    employee.role = dto.role;
    if (dto.designation) {
      employee.designation = dto.designation;
    }

    const saved = await this.employeeRepository.save(employee);
    return EmployeeResponseDto.fromEntity(saved);
  }
}
