import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EmployeesService } from '../employees/employees.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { Employee } from '../database/entities/employee.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Authenticate employee with username/email and password
   * @param loginDto - Login credentials
   * @returns Login response with JWT token and employee data
   * @throws UnauthorizedException if credentials are invalid
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { usernameOrEmail, password } = loginDto;

    // Try to find employee by username or email
    let employee: Employee | null = null;

    if (usernameOrEmail.includes('@')) {
      employee = await this.employeesService.findByEmail(usernameOrEmail);
    } else {
      employee = await this.employeesService.findByUsername(usernameOrEmail);
    }

    if (!employee) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, employee.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login timestamp
    await this.employeesService.updateLastLogin(employee.employeeId);

    // Generate JWT token
    const payload: JwtPayload = {
      sub: employee.employeeId,
      username: employee.username,
      email: employee.email,
      role: employee.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      employee: {
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        middleName: employee.middleName,
        lastName: employee.lastName,
        fullName: employee.fullName,
        employeeNo: employee.employeeNo,
        designation: employee.designation,
        role: employee.role,
        departmentId: employee.departmentId,
        email: employee.email,
        username: employee.username,
      },
    };
  }

  /**
   * Validate JWT payload and return employee
   * @param payload - JWT payload
   * @returns Employee if valid
   * @throws UnauthorizedException if employee not found
   */
  async validateJwtPayload(payload: JwtPayload): Promise<Employee> {
    const employee = await this.employeesService.findById(payload.sub);

    if (!employee) {
      throw new UnauthorizedException('Invalid token');
    }

    return employee;
  }

  /**
   * Get current authenticated employee profile
   * @param employeeId - Employee ID from JWT
   * @returns Employee profile
   */
  async getProfile(employeeId: number): Promise<Employee> {
    return this.employeesService.findByIdOrFail(employeeId);
  }
}
