import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UtilityType } from '../database/entities/utility-type.entity';
import { TariffCategory } from '../database/entities/tariff-category.entity';
import { Meter, MeterStatus } from '../database/entities/meter.entity';
import { GeoArea } from '../database/entities/geo-area.entity';
import { NetworkNode } from '../database/entities/network-node.entity';
import { Customer } from '../database/entities/customer.entity';
import {
  ServiceConnection,
  ConnectionStatus,
} from '../database/entities/service-connection.entity';

@Injectable()
export class LookupService {
  private readonly logger = new Logger(LookupService.name);

  constructor(
    @InjectRepository(UtilityType)
    private utilityTypeRepository: Repository<UtilityType>,
    @InjectRepository(TariffCategory)
    private tariffCategoryRepository: Repository<TariffCategory>,
    @InjectRepository(Meter)
    private meterRepository: Repository<Meter>,
    @InjectRepository(GeoArea)
    private geoAreaRepository: Repository<GeoArea>,
    @InjectRepository(NetworkNode)
    private networkNodeRepository: Repository<NetworkNode>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(ServiceConnection)
    private connectionRepository: Repository<ServiceConnection>,
  ) {}

  /**
   * Get all utility types
   */
  async getUtilityTypes(): Promise<UtilityType[]> {
    return this.utilityTypeRepository.find({
      order: { name: 'ASC' },
    });
  }

  /**
   * Get tariff categories, optionally filtered by utility type
   */
  async getTariffCategories(utilityTypeId?: number): Promise<TariffCategory[]> {
    const where = utilityTypeId ? { utilityTypeId } : {};
    return this.tariffCategoryRepository.find({
      where,
      order: { code: 'ASC' },
    });
  }

  /**
   * Get all meters, optionally filtered by utility type
   */
  async getMeters(utilityTypeId?: number): Promise<Meter[]> {
    const where = utilityTypeId ? { utilityTypeId } : {};
    return this.meterRepository.find({
      where,
      order: { meterSerialNo: 'ASC' },
    });
  }

  /**
   * Get available (unassigned) meters, optionally filtered by utility type
   */
  async getAvailableMeters(utilityTypeId?: number): Promise<Meter[]> {
    // Get all meters that are assigned to active connections
    const assignedMeterIds = await this.connectionRepository
      .createQueryBuilder('connection')
      .select('connection.meterId')
      .where('connection.meterId IS NOT NULL')
      .andWhere('connection.connectionStatus NOT IN (:...statuses)', {
        statuses: [ConnectionStatus.DISCONNECTED],
      })
      .getRawMany();

    const assignedIds = assignedMeterIds.map((r) => r.connection_meter_id).filter((id) => id);

    // Build query for available meters
    const queryBuilder = this.meterRepository.createQueryBuilder('meter');

    // Exclude assigned meters
    if (assignedIds.length > 0) {
      queryBuilder.where('meter.meterId NOT IN (:...assignedIds)', { assignedIds });
    }

    // Filter by utility type if provided
    if (utilityTypeId) {
      queryBuilder.andWhere('meter.utilityTypeId = :utilityTypeId', { utilityTypeId });
    }

    // Only include active or inactive meters (not faulty or replaced)
    queryBuilder.andWhere('meter.status IN (:...statuses)', {
      statuses: [MeterStatus.ACTIVE, MeterStatus.INACTIVE],
    });

    queryBuilder.orderBy('meter.meterSerialNo', 'ASC');

    return queryBuilder.getMany();
  }

  /**
   * Get all geographic areas
   */
  async getGeoAreas(): Promise<GeoArea[]> {
    return this.geoAreaRepository.find({
      order: { name: 'ASC' },
    });
  }

  /**
   * Get network nodes, optionally filtered by utility type
   */
  async getNetworkNodes(utilityTypeId?: number): Promise<NetworkNode[]> {
    const where: Record<string, unknown> = { status: 'ACTIVE' };
    if (utilityTypeId) {
      where.utilityTypeId = utilityTypeId;
    }
    return this.networkNodeRepository.find({
      where,
      order: { name: 'ASC' },
    });
  }

  /**
   * Get customers for dropdown selection
   */
  async getCustomers(
    search?: string,
    limit: number = 50,
  ): Promise<
    {
      customerId: number;
      fullName: string;
      email: string | null;
      customerType: string;
      identityRef: string;
    }[]
  > {
    const queryBuilder = this.customerRepository
      .createQueryBuilder('customer')
      .select([
        'customer.customerId',
        'customer.firstName',
        'customer.middleName',
        'customer.lastName',
        'customer.email',
        'customer.customerType',
        'customer.identityRef',
      ]);

    if (search) {
      queryBuilder.where(
        '(customer.firstName LIKE :search OR customer.lastName LIKE :search OR customer.email LIKE :search OR customer.identityRef LIKE :search OR CAST(customer.customerId AS VARCHAR) LIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy('customer.lastName', 'ASC').addOrderBy('customer.firstName', 'ASC');
    queryBuilder.take(limit);

    const customers = await queryBuilder.getMany();

    return customers.map((c) => ({
      customerId: c.customerId,
      fullName: [c.firstName, c.middleName, c.lastName].filter(Boolean).join(' '),
      email: c.email,
      customerType: c.customerType,
      identityRef: c.identityRef,
    }));
  }
}
