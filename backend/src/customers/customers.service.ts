import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Customer } from '../database/entities/customer.entity';
import { CustomerAddress } from '../database/entities/customer-address.entity';
import { CustomerPhone } from '../database/entities/customer-phone.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { PaginationQueryDto, PaginatedResponseDto } from '../common/dto/pagination.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(CustomerAddress)
    private addressRepository: Repository<CustomerAddress>,
    @InjectRepository(CustomerPhone)
    private phoneRepository: Repository<CustomerPhone>,
    private dataSource: DataSource,
  ) {}

  /**
   * Create a new customer with address and phone numbers
   */
  async create(
    createCustomerDto: CreateCustomerDto,
    employeeId?: number,
  ): Promise<CustomerResponseDto> {
    // Check if identity reference already exists
    const existingCustomer = await this.customerRepository.findOne({
      where: { identityRef: createCustomerDto.identityRef },
    });

    if (existingCustomer) {
      throw new ConflictException(
        `Customer with identity reference ${createCustomerDto.identityRef} already exists`,
      );
    }

    // Check if email already exists (if provided)
    if (createCustomerDto.email) {
      const existingEmail = await this.customerRepository.findOne({
        where: { email: createCustomerDto.email },
      });

      if (existingEmail) {
        throw new ConflictException(
          `Customer with email ${createCustomerDto.email} already exists`,
        );
      }
    }

    // Use transaction for creating customer with related entities
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create address first
      const address = this.addressRepository.create({
        postalCode: createCustomerDto.address.postalCode,
        line1: createCustomerDto.address.line1,
      });
      const savedAddress = await queryRunner.manager.save(address);

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(createCustomerDto.password, saltRounds);

      // Create customer
      const customer = this.customerRepository.create({
        firstName: createCustomerDto.firstName,
        middleName: createCustomerDto.middleName,
        lastName: createCustomerDto.lastName,
        email: createCustomerDto.email,
        passwordHash,
        customerType: createCustomerDto.customerType,
        identityType: createCustomerDto.identityType,
        identityRef: createCustomerDto.identityRef,
        tariffCategoryId: createCustomerDto.tariffCategoryId,
        customerAddressId: savedAddress.customerAddressId,
        employeeId: employeeId,
        registrationDate: new Date(),
      });
      const savedCustomer = await queryRunner.manager.save(customer);

      // Create phone numbers
      if (createCustomerDto.phoneNumbers && createCustomerDto.phoneNumbers.length > 0) {
        const phoneEntities = createCustomerDto.phoneNumbers.map((phone) =>
          this.phoneRepository.create({
            customerId: savedCustomer.customerId,
            phone,
          }),
        );
        await queryRunner.manager.save(phoneEntities);
      }

      await queryRunner.commitTransaction();

      // Fetch the complete customer with relations
      const completeCustomer = await this.customerRepository.findOne({
        where: { customerId: savedCustomer.customerId },
        relations: ['address', 'phoneNumbers'],
      });

      return CustomerResponseDto.fromEntity(completeCustomer!);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Find all customers with pagination and filtering
   */
  async findAll(
    query: PaginationQueryDto & {
      customerType?: string;
      search?: string;
    },
  ): Promise<PaginatedResponseDto<CustomerResponseDto>> {
    const { page = 1, limit = 10, sortBy = 'customerId', order = 'ASC' } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.customerRepository
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.address', 'address')
      .leftJoinAndSelect('customer.phoneNumbers', 'phoneNumbers');

    // Apply filters
    if (query.customerType) {
      queryBuilder.andWhere('customer.customerType = :customerType', {
        customerType: query.customerType,
      });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(customer.firstName LIKE :search OR customer.lastName LIKE :search OR customer.email LIKE :search OR customer.identityRef LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    // Apply sorting
    const validSortFields = [
      'customerId',
      'firstName',
      'lastName',
      'email',
      'customerType',
      'registrationDate',
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'customerId';
    queryBuilder.orderBy(`customer.${sortField}`, order === 'DESC' ? 'DESC' : 'ASC');

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    const [customers, total] = await queryBuilder.getManyAndCount();

    const items = customers.map((customer) => CustomerResponseDto.fromEntity(customer));

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Find a customer by ID
   */
  async findById(id: number): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findOne({
      where: { customerId: id },
      relations: ['address', 'phoneNumbers', 'registeredBy'],
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return CustomerResponseDto.fromEntity(customer);
  }

  /**
   * Find a customer by identity reference
   */
  async findByIdentityRef(identityRef: string): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findOne({
      where: { identityRef },
      relations: ['address', 'phoneNumbers'],
    });

    if (!customer) {
      throw new NotFoundException(`Customer with identity reference ${identityRef} not found`);
    }

    return CustomerResponseDto.fromEntity(customer);
  }

  /**
   * Update a customer
   */
  async update(id: number, updateCustomerDto: UpdateCustomerDto): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findOne({
      where: { customerId: id },
      relations: ['address', 'phoneNumbers'],
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // Check for duplicate email
    if (updateCustomerDto.email && updateCustomerDto.email !== customer.email) {
      const existingEmail = await this.customerRepository.findOne({
        where: { email: updateCustomerDto.email },
      });
      if (existingEmail) {
        throw new ConflictException(
          `Customer with email ${updateCustomerDto.email} already exists`,
        );
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update address if provided
      if (updateCustomerDto.address && customer.address) {
        await queryRunner.manager.update(
          CustomerAddress,
          { customerAddressId: customer.address.customerAddressId },
          {
            postalCode: updateCustomerDto.address.postalCode,
            line1: updateCustomerDto.address.line1,
          },
        );
      }

      // Update phone numbers if provided
      if (updateCustomerDto.phoneNumbers !== undefined) {
        // Delete existing phone numbers
        await queryRunner.manager.delete(CustomerPhone, { customerId: id });

        // Create new phone numbers
        if (updateCustomerDto.phoneNumbers.length > 0) {
          const phoneEntities = updateCustomerDto.phoneNumbers.map((phone) =>
            this.phoneRepository.create({
              customerId: id,
              phone,
            }),
          );
          await queryRunner.manager.save(phoneEntities);
        }
      }

      // Update customer fields
      const updateData: Partial<Customer> = {};

      if (updateCustomerDto.firstName !== undefined) {
        updateData.firstName = updateCustomerDto.firstName;
      }
      if (updateCustomerDto.middleName !== undefined) {
        updateData.middleName = updateCustomerDto.middleName;
      }
      if (updateCustomerDto.lastName !== undefined) {
        updateData.lastName = updateCustomerDto.lastName;
      }
      if (updateCustomerDto.email !== undefined) {
        updateData.email = updateCustomerDto.email;
      }
      if (updateCustomerDto.customerType !== undefined) {
        updateData.customerType = updateCustomerDto.customerType;
      }
      if (updateCustomerDto.identityType !== undefined) {
        updateData.identityType = updateCustomerDto.identityType;
      }
      if (updateCustomerDto.tariffCategoryId !== undefined) {
        updateData.tariffCategoryId = updateCustomerDto.tariffCategoryId;
      }
      if (updateCustomerDto.password) {
        const saltRounds = 10;
        updateData.passwordHash = await bcrypt.hash(updateCustomerDto.password, saltRounds);
      }

      if (Object.keys(updateData).length > 0) {
        await queryRunner.manager.update(Customer, { customerId: id }, updateData);
      }

      await queryRunner.commitTransaction();

      // Fetch updated customer
      const updatedCustomer = await this.customerRepository.findOne({
        where: { customerId: id },
        relations: ['address', 'phoneNumbers'],
      });

      return CustomerResponseDto.fromEntity(updatedCustomer!);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Delete a customer
   */
  async delete(id: number): Promise<void> {
    const customer = await this.customerRepository.findOne({
      where: { customerId: id },
      relations: ['address', 'phoneNumbers'],
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Delete phone numbers first
      await queryRunner.manager.delete(CustomerPhone, { customerId: id });

      // Delete customer
      await queryRunner.manager.delete(Customer, { customerId: id });

      // Delete address
      if (customer.address) {
        await queryRunner.manager.delete(CustomerAddress, {
          customerAddressId: customer.address.customerAddressId,
        });
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get customer count by type
   */
  async getCountByType(): Promise<{ type: string; count: number }[]> {
    const result = await this.customerRepository
      .createQueryBuilder('customer')
      .select('customer.customerType', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('customer.customerType')
      .getRawMany();

    return result.map((r) => ({
      type: r.type,
      count: parseInt(r.count, 10),
    }));
  }
}
