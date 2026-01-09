import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../database/entities/department.entity';
import { Employee } from '../database/entities/employee.entity';
import {
    CreateDepartmentDto,
    UpdateDepartmentDto,
    DepartmentResponseDto,
    DepartmentWithEmployeesDto,
} from './dto';
import { EmployeeResponseDto } from '../employees/dto/employee-response.dto';

/**
 * Service for department operations
 */
@Injectable()
export class DepartmentService {
    constructor(
        @InjectRepository(Department)
        private readonly departmentRepository: Repository<Department>,
        @InjectRepository(Employee)
        private readonly employeeRepository: Repository<Employee>,
    ) { }

    /**
     * Create a new department
     */
    async create(dto: CreateDepartmentDto, createdByEmployeeId: number): Promise<DepartmentResponseDto> {
        // Check for duplicate name
        const existing = await this.departmentRepository.findOne({
            where: { name: dto.name },
        });

        if (existing) {
            throw new ConflictException('Department name already exists');
        }

        const department = this.departmentRepository.create({
            name: dto.name,
            utilityTypeId: dto.utilityTypeId,
        });

        const saved = await this.departmentRepository.save(department);

        return this.toResponseDto(saved);
    }

    /**
     * Get all departments with utility type and employee count
     */
    async findAllWithStats(): Promise<DepartmentResponseDto[]> {
        const departments = await this.departmentRepository.find({
            relations: ['utilityType'],
            order: { name: 'ASC' },
        });

        const result: DepartmentResponseDto[] = [];

        for (const dept of departments) {
            const employeeCount = await this.employeeRepository.count({
                where: { departmentId: dept.departmentId },
            });

            result.push({
                departmentId: dept.departmentId,
                name: dept.name,
                utilityTypeId: dept.utilityTypeId,
                utilityType: dept.utilityType ? {
                    utilityTypeId: dept.utilityType.utilityTypeId,
                    name: dept.utilityType.name,
                    code: dept.utilityType.code,
                } : undefined,
                employeeCount,
            });
        }

        return result;
    }

    /**
     * Get department by ID with employees
     */
    async findByIdWithEmployees(id: number): Promise<DepartmentWithEmployeesDto> {
        const department = await this.departmentRepository.findOne({
            where: { departmentId: id },
            relations: ['utilityType'],
        });

        if (!department) {
            throw new NotFoundException(`Department with ID ${id} not found`);
        }

        const employees = await this.employeeRepository.find({
            where: { departmentId: id },
            order: { lastName: 'ASC', firstName: 'ASC' },
        });

        return {
            departmentId: department.departmentId,
            name: department.name,
            utilityTypeId: department.utilityTypeId,
            utilityType: department.utilityType ? {
                utilityTypeId: department.utilityType.utilityTypeId,
                name: department.utilityType.name,
                code: department.utilityType.code,
            } : undefined,
            employees: employees.map(emp => ({
                employeeId: emp.employeeId,
                employeeNo: emp.employeeNo,
                firstName: emp.firstName,
                middleName: emp.middleName || undefined,
                lastName: emp.lastName,
                fullName: emp.fullName,
                role: emp.role,
                designation: emp.designation,
                email: emp.email,
            })),
            employeeCount: employees.length,
        };
    }

    /**
     * Update department
     */
    async update(id: number, dto: UpdateDepartmentDto, updatedByEmployeeId: number): Promise<DepartmentResponseDto> {
        const department = await this.departmentRepository.findOne({
            where: { departmentId: id },
        });

        if (!department) {
            throw new NotFoundException(`Department with ID ${id} not found`);
        }

        // Check for duplicate name if name is being updated
        if (dto.name && dto.name !== department.name) {
            const existing = await this.departmentRepository.findOne({
                where: { name: dto.name },
            });

            if (existing) {
                throw new ConflictException('Department name already exists');
            }
        }

        Object.assign(department, dto);
        const saved = await this.departmentRepository.save(department);

        return this.toResponseDto(saved);
    }

    /**
     * Delete department (fails if employees exist)
     */
    async delete(id: number): Promise<void> {
        const department = await this.departmentRepository.findOne({
            where: { departmentId: id },
        });

        if (!department) {
            throw new NotFoundException(`Department with ID ${id} not found`);
        }

        const employeeCount = await this.employeeRepository.count({
            where: { departmentId: id },
        });

        if (employeeCount > 0) {
            throw new BadRequestException(
                `Cannot delete department with ${employeeCount} assigned employee(s). Reassign employees first.`
            );
        }

        await this.departmentRepository.remove(department);
    }

    /**
     * Get employees by department
     */
    async findEmployeesByDepartment(id: number): Promise<EmployeeResponseDto[]> {
        const department = await this.departmentRepository.findOne({
            where: { departmentId: id },
        });

        if (!department) {
            throw new NotFoundException(`Department with ID ${id} not found`);
        }

        const employees = await this.employeeRepository.find({
            where: { departmentId: id },
            order: { lastName: 'ASC', firstName: 'ASC' },
        });

        return employees.map(emp => EmployeeResponseDto.fromEntity(emp));
    }

    /**
     * Convert entity to response DTO
     */
    private toResponseDto(department: Department): DepartmentResponseDto {
        return {
            departmentId: department.departmentId,
            name: department.name,
            utilityTypeId: department.utilityTypeId,
        };
    }
}
