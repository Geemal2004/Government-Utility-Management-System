import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not } from 'typeorm';
import { ServiceConnection } from '../database/entities/service-connection.entity';
import { ConnectionAddress } from '../database/entities/connection-address.entity';
import { Meter } from '../database/entities/meter.entity';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';
import { ConnectionResponseDto } from './dto/connection-response.dto';
import { ConnectionFilterDto } from './dto/connection-filter.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { ConnectionStatus } from '../database/entities/service-connection.entity';
import { MeterStatus } from '../database/entities/meter.entity';

@Injectable()
export class ConnectionsService {
  private readonly logger = new Logger(ConnectionsService.name);

  constructor(
    @InjectRepository(ServiceConnection)
    private connectionRepository: Repository<ServiceConnection>,
    @InjectRepository(ConnectionAddress)
    private addressRepository: Repository<ConnectionAddress>,
    @InjectRepository(Meter)
    private meterRepository: Repository<Meter>,
    private dataSource: DataSource,
  ) {}

  /**
   * Find all connections with filtering and pagination
   */
  async findAll(
    filters: ConnectionFilterDto,
  ): Promise<PaginatedResponseDto<ConnectionResponseDto>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'connectionId',
      order = 'DESC',
      customerId,
      utilityTypeId,
      connectionStatus,
      city,
    } = filters;

    const skip = (page - 1) * limit;

    const queryBuilder = this.connectionRepository
      .createQueryBuilder('connection')
      .leftJoinAndSelect('connection.customer', 'customer')
      .leftJoinAndSelect('connection.utilityType', 'utilityType')
      .leftJoinAndSelect('connection.tariffCategory', 'tariffCategory')
      .leftJoinAndSelect('connection.meter', 'meter')
      .leftJoinAndSelect('connection.connectionAddress', 'connectionAddress')
      .leftJoinAndSelect('connectionAddress.geoArea', 'geoArea')
      .leftJoinAndSelect('connection.networkNode', 'networkNode');

    // Apply filters
    if (customerId) {
      queryBuilder.andWhere('connection.customerId = :customerId', { customerId });
    }

    if (utilityTypeId) {
      queryBuilder.andWhere('connection.utilityTypeId = :utilityTypeId', {
        utilityTypeId,
      });
    }

    if (connectionStatus) {
      queryBuilder.andWhere('connection.connectionStatus = :connectionStatus', {
        connectionStatus,
      });
    }

    if (city) {
      queryBuilder.andWhere('connectionAddress.city LIKE :city', { city: `%${city}%` });
    }

    // Apply sorting
    const validSortFields = [
      'connectionId',
      'connectionStatus',
      'customer.firstName',
      'customer.lastName',
    ];
    const sortField = validSortFields.includes(sortBy)
      ? `connection.${sortBy}`
      : 'connection.connectionId';
    queryBuilder.orderBy(sortField, order === 'DESC' ? 'DESC' : 'ASC');

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    const [connections, total] = await queryBuilder.getManyAndCount();

    this.logger.log(`Found ${connections.length} connections out of ${total} total (page ${page})`);

    const items = connections.map((connection) => ConnectionResponseDto.fromEntity(connection));

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
   * Find a connection by ID with all relations
   */
  async findOne(id: number): Promise<ConnectionResponseDto> {
    const connection = await this.connectionRepository.findOne({
      where: { connectionId: id },
      relations: [
        'customer',
        'customer.address',
        'customer.phoneNumbers',
        'utilityType',
        'tariffCategory',
        'meter',
        'connectionAddress',
        'connectionAddress.geoArea',
        'networkNode',
      ],
    });

    if (!connection) {
      this.logger.warn(`Connection with ID ${id} not found`);
      throw new NotFoundException(`Service connection with ID ${id} not found`);
    }

    this.logger.log(`Retrieved connection ${id} for customer ${connection.customerId}`);
    return ConnectionResponseDto.fromEntity(connection);
  }

  /**
   * Find all connections for a specific customer
   */
  async findByCustomer(customerId: number): Promise<ConnectionResponseDto[]> {
    const connections = await this.connectionRepository.find({
      where: { customerId },
      relations: [
        'utilityType',
        'tariffCategory',
        'meter',
        'connectionAddress',
        'connectionAddress.geoArea',
        'networkNode',
      ],
      order: { connectionId: 'DESC' },
    });

    this.logger.log(`Found ${connections.length} connections for customer ${customerId}`);

    return connections.map((connection) => ConnectionResponseDto.fromEntity(connection));
  }

  /**
   * Create a new service connection with address
   */
  async create(
    createDto: CreateConnectionDto,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    employeeId?: number,
  ): Promise<ConnectionResponseDto> {
    // Validate meter if provided
    if (createDto.meterId) {
      await this.validateMeterAvailability(createDto.meterId);
    }

    // Use transaction for creating connection with address
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create connection address first
      const address = this.addressRepository.create({
        line1: createDto.connectionAddress.line1,
        city: createDto.connectionAddress.city,
        postalCode: createDto.connectionAddress.postalCode,
        geoAreaId: createDto.connectionAddress.geoAreaId,
      });
      const savedAddress = await queryRunner.manager.save(address);

      // Create service connection
      const connection = this.connectionRepository.create({
        customerId: createDto.customerId,
        utilityTypeId: createDto.utilityTypeId,
        tariffCategoryId: createDto.tariffCategoryId,
        connectionStatus: ConnectionStatus.PENDING,
        meterId: createDto.meterId || null,
        connectionAddressId: savedAddress.connectionAddressId,
        nodeId: createDto.nodeId || null,
      });
      const savedConnection = await queryRunner.manager.save(connection);

      // If meter is assigned, update meter status to ACTIVE
      if (createDto.meterId) {
        await queryRunner.manager.update(
          Meter,
          { meterId: createDto.meterId },
          { status: MeterStatus.ACTIVE },
        );
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `Created connection ${savedConnection.connectionId} for customer ${createDto.customerId}`,
      );

      // Fetch the complete connection with relations
      return await this.findOne(savedConnection.connectionId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to create connection: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Update a service connection
   */
  async update(id: number, updateDto: UpdateConnectionDto): Promise<ConnectionResponseDto> {
    // Check if connection exists
    const existingConnection = await this.connectionRepository.findOne({
      where: { connectionId: id },
      relations: ['meter'],
    });

    if (!existingConnection) {
      throw new NotFoundException(`Service connection with ID ${id} not found`);
    }

    // Validate meter reassignment if meter is being changed
    if (updateDto.meterId && updateDto.meterId !== existingConnection.meterId) {
      await this.validateMeterAvailability(updateDto.meterId, id);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update connection address if provided
      if (updateDto.connectionAddress) {
        await queryRunner.manager.update(
          ConnectionAddress,
          { connectionAddressId: existingConnection.connectionAddressId },
          {
            line1: updateDto.connectionAddress.line1,
            city: updateDto.connectionAddress.city,
            postalCode: updateDto.connectionAddress.postalCode,
            geoAreaId: updateDto.connectionAddress.geoAreaId,
          },
        );
      }

      // Prepare update data
      const updateData: Partial<ServiceConnection> = {};

      if (updateDto.utilityTypeId !== undefined) {
        updateData.utilityTypeId = updateDto.utilityTypeId;
      }
      if (updateDto.tariffCategoryId !== undefined) {
        updateData.tariffCategoryId = updateDto.tariffCategoryId;
      }
      if (updateDto.connectionStatus !== undefined) {
        updateData.connectionStatus = updateDto.connectionStatus;
      }
      if (updateDto.nodeId !== undefined) {
        updateData.nodeId = updateDto.nodeId;
      }

      // Handle meter reassignment
      if (updateDto.meterId !== undefined && updateDto.meterId !== existingConnection.meterId) {
        // Set old meter to INACTIVE if exists
        if (existingConnection.meterId) {
          await queryRunner.manager.update(
            Meter,
            { meterId: existingConnection.meterId },
            { status: MeterStatus.INACTIVE },
          );
        }

        // Set new meter to ACTIVE
        if (updateDto.meterId) {
          await queryRunner.manager.update(
            Meter,
            { meterId: updateDto.meterId },
            { status: MeterStatus.ACTIVE },
          );
        }

        updateData.meterId = updateDto.meterId;
      }

      // Update connection
      if (Object.keys(updateData).length > 0) {
        await queryRunner.manager.update(ServiceConnection, { connectionId: id }, updateData);
      }

      await queryRunner.commitTransaction();

      this.logger.log(`Updated connection ${id}`);

      // Return updated connection with relations
      return await this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to update connection ${id}: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Update connection status
   */
  async updateStatus(
    id: number,
    status: ConnectionStatus,
    employeeId?: number,
  ): Promise<ConnectionResponseDto> {
    const connection = await this.connectionRepository.findOne({
      where: { connectionId: id },
    });

    if (!connection) {
      throw new NotFoundException(`Service connection with ID ${id} not found`);
    }

    // Validate status transition
    this.validateStatusTransition(connection.connectionStatus, status);

    await this.connectionRepository.update({ connectionId: id }, { connectionStatus: status });

    this.logger.log(
      `Updated connection ${id} status from ${connection.connectionStatus} to ${status}${employeeId ? ` by employee ${employeeId}` : ''}`,
    );

    return await this.findOne(id);
  }

  /**
   * Assign a meter to a connection
   */
  async assignMeter(connectionId: number, meterId: number): Promise<ConnectionResponseDto> {
    // Validate meter availability
    await this.validateMeterAvailability(meterId);

    const connection = await this.connectionRepository.findOne({
      where: { connectionId },
      relations: ['meter'],
    });

    if (!connection) {
      throw new NotFoundException(`Service connection with ID ${connectionId} not found`);
    }

    if (connection.meterId) {
      throw new ConflictException(
        `Connection ${connectionId} already has meter ${connection.meterId} assigned`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update connection with meter
      await queryRunner.manager.update(ServiceConnection, { connectionId }, { meterId });

      // Update meter status to ACTIVE
      await queryRunner.manager.update(Meter, { meterId }, { status: MeterStatus.ACTIVE });

      await queryRunner.commitTransaction();

      this.logger.log(`Assigned meter ${meterId} to connection ${connectionId}`);

      return await this.findOne(connectionId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to assign meter ${meterId} to connection ${connectionId}: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Soft delete connection by marking as INACTIVE
   */
  async remove(id: number): Promise<void> {
    const connection = await this.connectionRepository.findOne({
      where: { connectionId: id },
    });

    if (!connection) {
      throw new NotFoundException(`Service connection with ID ${id} not found`);
    }

    // Soft delete by updating status to DISCONNECTED
    await this.connectionRepository.update(
      { connectionId: id },
      { connectionStatus: ConnectionStatus.DISCONNECTED },
    );

    this.logger.log(`Soft deleted connection ${id} (marked as DISCONNECTED)`);
  }

  /**
   * Get connection statistics for a customer
   */
  async getCustomerConnectionStats(customerId: number): Promise<{
    total: number;
    active: number;
    pending: number;
    suspended: number;
    disconnected: number;
    byUtilityType: { utilityTypeId: number; utilityTypeName: string; count: number }[];
  }> {
    const connections = await this.connectionRepository.find({
      where: { customerId },
      relations: ['utilityType'],
    });

    const stats = {
      total: connections.length,
      active: connections.filter((c) => c.connectionStatus === ConnectionStatus.ACTIVE).length,
      pending: connections.filter((c) => c.connectionStatus === ConnectionStatus.PENDING).length,
      suspended: connections.filter((c) => c.connectionStatus === ConnectionStatus.SUSPENDED)
        .length,
      disconnected: connections.filter((c) => c.connectionStatus === ConnectionStatus.DISCONNECTED)
        .length,
      byUtilityType: [] as { utilityTypeId: number; utilityTypeName: string; count: number }[],
    };

    // Group by utility type
    const utilityTypeMap = new Map<number, { name: string; count: number }>();
    connections.forEach((connection) => {
      const existing = utilityTypeMap.get(connection.utilityTypeId);
      if (existing) {
        existing.count++;
      } else {
        utilityTypeMap.set(connection.utilityTypeId, {
          name: connection.utilityType?.name || 'Unknown',
          count: 1,
        });
      }
    });

    stats.byUtilityType = Array.from(utilityTypeMap.entries()).map(([id, data]) => ({
      utilityTypeId: id,
      utilityTypeName: data.name,
      count: data.count,
    }));

    return stats;
  }

  /**
   * Private helper: Validate meter availability
   */
  private async validateMeterAvailability(
    meterId: number,
    excludeConnectionId?: number,
  ): Promise<void> {
    const meter = await this.meterRepository.findOne({
      where: { meterId },
    });

    if (!meter) {
      throw new NotFoundException(`Meter with ID ${meterId} not found`);
    }

    // Check if meter is already assigned to another connection
    const whereCondition: any = {
      meterId,
      connectionStatus: Not(ConnectionStatus.DISCONNECTED),
    };

    // Exclude the current connection if provided (for update operations)
    if (excludeConnectionId) {
      whereCondition.connectionId = Not(excludeConnectionId);
    }

    const existingConnection = await this.connectionRepository.findOne({
      where: whereCondition,
    });

    if (existingConnection) {
      throw new ConflictException(
        `Meter ${meterId} is already assigned to connection ${existingConnection.connectionId}`,
      );
    }

    // Check if meter is in usable status
    if (meter.status === MeterStatus.FAULTY) {
      throw new BadRequestException(`Meter ${meterId} is faulty and cannot be assigned`);
    }
  }

  /**
   * Private helper: Validate status transition
   */
  private validateStatusTransition(
    currentStatus: ConnectionStatus,
    newStatus: ConnectionStatus,
  ): void {
    // Define valid status transitions
    const validTransitions: Record<ConnectionStatus, ConnectionStatus[]> = {
      [ConnectionStatus.PENDING]: [ConnectionStatus.ACTIVE, ConnectionStatus.DISCONNECTED],
      [ConnectionStatus.ACTIVE]: [ConnectionStatus.SUSPENDED, ConnectionStatus.DISCONNECTED],
      [ConnectionStatus.SUSPENDED]: [ConnectionStatus.ACTIVE, ConnectionStatus.DISCONNECTED],
      [ConnectionStatus.DISCONNECTED]: [ConnectionStatus.ACTIVE],
      [ConnectionStatus.INACTIVE]: [ConnectionStatus.ACTIVE],
    };

    const allowedTransitions = validTransitions[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }
}
