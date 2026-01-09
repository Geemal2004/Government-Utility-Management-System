import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { EmployeesService } from '../employees/employees.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { CustomerLoginResponseDto } from './dto/customer-login-response.dto';
import { CustomerRegisterDto } from './dto/customer-register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { Employee } from '../database/entities/employee.entity';
import { Customer } from '../database/entities/customer.entity';
import { CustomerAddress } from '../database/entities/customer-address.entity';
import { CustomerPhone } from '../database/entities/customer-phone.entity';
import { PostalCode } from '../database/entities/postal-code.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly jwtService: JwtService,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(CustomerAddress)
    private readonly customerAddressRepository: Repository<CustomerAddress>,
    @InjectRepository(CustomerPhone)
    private readonly customerPhoneRepository: Repository<CustomerPhone>,
    @InjectRepository(PostalCode)
    private readonly postalCodeRepository: Repository<PostalCode>,
    private dataSource: DataSource,
  ) { }

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
   * Authenticate customer with email/customerId and password
   * @param loginDto - Customer login credentials
   * @returns Login response with JWT token and customer data
   * @throws UnauthorizedException if credentials are invalid
   */
  async customerLogin(loginDto: CustomerLoginDto): Promise<CustomerLoginResponseDto> {
    const { identifier, password } = loginDto;

    // Try to find customer by email or customer ID
    let customer: Customer | null = null;

    if (identifier.includes('@')) {
      // It's an email
      customer = await this.customerRepository.findOne({
        where: { email: identifier },
      });
    } else if (/^\d+$/.test(identifier)) {
      // It's a numeric customer ID
      customer = await this.customerRepository.findOne({
        where: { customerId: parseInt(identifier, 10) },
      });
    }

    if (!customer) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, customer.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token for customer
    const payload = {
      sub: customer.customerId,
      email: customer.email,
      type: 'customer',
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      customer: {
        customerId: customer.customerId,
        firstName: customer.firstName,
        middleName: customer.middleName,
        lastName: customer.lastName,
        fullName: customer.fullName,
        email: customer.email,
        customerType: customer.customerType,
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

  /**
   * Get current authenticated customer profile
   * @param customerId - Customer ID from JWT
   * @returns Customer profile
   */
  async getCustomerProfile(customerId: number): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { customerId },
    });

    if (!customer) {
      throw new UnauthorizedException('Customer not found');
    }

    return customer;
  }

  /**
   * Register a new customer (public endpoint)
   * @param registerDto - Customer registration data
   * @returns Newly created customer info
   */
  async registerCustomer(registerDto: CustomerRegisterDto): Promise<{
    customerId: number;
    firstName: string;
    lastName: string;
    email: string;
    message: string;
  }> {
    // Check if email already exists
    const existingEmail = await this.customerRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    // Check if identity ref already exists
    const existingIdentity = await this.customerRepository.findOne({
      where: { identityRef: registerDto.identityRef },
    });

    if (existingIdentity) {
      throw new ConflictException('Identity reference already registered');
    }

    // Validate postal code exists
    const postalCode = registerDto.postalCode || '10100'; // Default to Negombo
    const validPostalCode = await this.postalCodeRepository.findOne({
      where: { postalCode },
    });

    if (!validPostalCode) {
      throw new BadRequestException(`Invalid postal code: ${postalCode}. Please provide a valid Sri Lankan postal code.`);
    }

    // Use transaction to create address and customer
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create address
      const address = this.customerAddressRepository.create({
        line1: registerDto.address,
        postalCode: postalCode,
      });
      const savedAddress = await queryRunner.manager.save(address);

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(registerDto.password, saltRounds);

      // Create customer
      const customer = this.customerRepository.create({
        firstName: registerDto.firstName,
        middleName: registerDto.middleName || null,
        lastName: registerDto.lastName,
        email: registerDto.email,
        passwordHash,
        customerAddressId: savedAddress.customerAddressId,
        customerType: registerDto.customerType || 'RESIDENTIAL',
        registrationDate: new Date(),
        identityType: registerDto.identityType || 'NIC',
        identityRef: registerDto.identityRef,
        employeeId: null, // Self-registration, no employee
        tariffCategoryId: null,
      });
      const savedCustomer = await queryRunner.manager.save(customer);

      // Create phone number if provided
      if (registerDto.phoneNumber) {
        const phone = this.customerPhoneRepository.create({
          customerId: savedCustomer.customerId,
          phone: registerDto.phoneNumber,
        });
        await queryRunner.manager.save(phone);
      }

      await queryRunner.commitTransaction();

      return {
        customerId: savedCustomer.customerId,
        firstName: savedCustomer.firstName,
        lastName: savedCustomer.lastName,
        email: savedCustomer.email || '',
        message: 'Registration successful. You can now login.',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
