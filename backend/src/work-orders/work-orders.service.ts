import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { WorkOrder, WorkOrderStatus } from '../database/entities/work-order.entity';
import { CreateWorkOrderDto, UpdateWorkOrderDto, WorkOrderResponseDto, WorkOrderFilterDto } from './dto';

@Injectable()
export class WorkOrdersService {
  constructor(
    @InjectRepository(WorkOrder)
    private workOrderRepository: Repository<WorkOrder>,
  ) {}

  async create(createDto: CreateWorkOrderDto): Promise<WorkOrderResponseDto> {
    const workOrder = this.workOrderRepository.create({
      openedTs: new Date(createDto.openedTs),
      scheduledStartTs: createDto.scheduledStartTs ? new Date(createDto.scheduledStartTs) : null,
      scheduledEndTs: createDto.scheduledEndTs ? new Date(createDto.scheduledEndTs) : null,
      workOrderStatus: createDto.workOrderStatus,
      resolutionNotes: createDto.resolutionNotes || null,
      assetId: createDto.assetId || null,
      requestId: createDto.requestId || null,
      geoAreaId: createDto.geoAreaId,
    });

    const saved = await this.workOrderRepository.save(workOrder);
    return this.toResponseDto(await this.findOne(saved.workOrderId));
  }

  async findAll(filters: WorkOrderFilterDto): Promise<{ data: WorkOrderResponseDto[]; total: number; page: number; limit: number }> {
    const { status, assetId, requestId, geoAreaId, startDate, endDate, page = 1, limit = 10, sortBy = 'workOrderId', order = 'DESC' } = filters;

    const queryBuilder = this.workOrderRepository
      .createQueryBuilder('workOrder')
      .leftJoinAndSelect('workOrder.asset', 'asset')
      .leftJoinAndSelect('workOrder.request', 'request')
      .leftJoinAndSelect('workOrder.geoArea', 'geoArea')
      .leftJoinAndSelect('workOrder.laborEntries', 'laborEntries')
      .leftJoinAndSelect('workOrder.itemUsages', 'itemUsages');

    if (status) {
      queryBuilder.andWhere('workOrder.workOrderStatus = :status', { status });
    }

    if (assetId) {
      queryBuilder.andWhere('workOrder.assetId = :assetId', { assetId });
    }

    if (requestId) {
      queryBuilder.andWhere('workOrder.requestId = :requestId', { requestId });
    }

    if (geoAreaId) {
      queryBuilder.andWhere('workOrder.geoAreaId = :geoAreaId', { geoAreaId });
    }

    if (startDate) {
      queryBuilder.andWhere('workOrder.openedTs >= :startDate', { startDate: new Date(startDate) });
    }

    if (endDate) {
      queryBuilder.andWhere('workOrder.openedTs <= :endDate', { endDate: new Date(endDate) });
    }

    const total = await queryBuilder.getCount();
    
    const workOrders = await queryBuilder
      .orderBy(`workOrder.${sortBy}`, order)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data: workOrders.map(wo => this.toResponseDto(wo)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<WorkOrder> {
    const workOrder = await this.workOrderRepository.findOne({
      where: { workOrderId: id },
      relations: ['asset', 'request', 'geoArea', 'laborEntries', 'itemUsages'],
    });

    if (!workOrder) {
      throw new NotFoundException(`Work order with ID ${id} not found`);
    }

    return workOrder;
  }

  async update(id: number, updateDto: UpdateWorkOrderDto): Promise<WorkOrderResponseDto> {
    await this.findOne(id);
    
    const updateData: any = {};
    if (updateDto.openedTs) updateData.openedTs = new Date(updateDto.openedTs);
    if (updateDto.scheduledStartTs) updateData.scheduledStartTs = new Date(updateDto.scheduledStartTs);
    if (updateDto.scheduledEndTs) updateData.scheduledEndTs = new Date(updateDto.scheduledEndTs);
    if (updateDto.workOrderStatus) updateData.workOrderStatus = updateDto.workOrderStatus;
    if (updateDto.resolutionNotes !== undefined) updateData.resolutionNotes = updateDto.resolutionNotes;
    if (updateDto.assetId !== undefined) updateData.assetId = updateDto.assetId;
    if (updateDto.requestId !== undefined) updateData.requestId = updateDto.requestId;
    if (updateDto.geoAreaId) updateData.geoAreaId = updateDto.geoAreaId;

    await this.workOrderRepository.update(id, updateData);
    return this.toResponseDto(await this.findOne(id));
  }

  async updateStatus(id: number, status: WorkOrderStatus, notes?: string): Promise<WorkOrderResponseDto> {
    const workOrder = await this.findOne(id);
    workOrder.workOrderStatus = status;
    
    if (notes) {
      workOrder.resolutionNotes = notes;
    }

    if (status === WorkOrderStatus.COMPLETED || status === WorkOrderStatus.CANCELLED) {
      workOrder.closedTs = new Date();
    }

    await this.workOrderRepository.save(workOrder);
    return this.toResponseDto(await this.findOne(id));
  }

  async complete(id: number, resolutionNotes: string): Promise<WorkOrderResponseDto> {
    return this.updateStatus(id, WorkOrderStatus.COMPLETED, resolutionNotes);
  }

  async cancel(id: number, reason: string): Promise<WorkOrderResponseDto> {
    return this.updateStatus(id, WorkOrderStatus.CANCELLED, reason);
  }

  async getStatistics(filters?: any): Promise<any> {
    const queryBuilder = this.workOrderRepository.createQueryBuilder('workOrder');

    if (filters?.startDate) {
      queryBuilder.andWhere('workOrder.openedTs >= :startDate', { startDate: new Date(filters.startDate) });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('workOrder.openedTs <= :endDate', { endDate: new Date(filters.endDate) });
    }

    const total = await queryBuilder.getCount();
    const open = await queryBuilder.andWhere('workOrder.workOrderStatus = :status', { status: WorkOrderStatus.OPEN }).getCount();
    const inProgress = await this.workOrderRepository.count({ where: { workOrderStatus: WorkOrderStatus.IN_PROGRESS } });
    const completed = await this.workOrderRepository.count({ where: { workOrderStatus: WorkOrderStatus.COMPLETED } });

    return {
      total,
      open,
      inProgress,
      completed,
      cancelled: total - open - inProgress - completed,
    };
  }

  private toResponseDto(workOrder: WorkOrder): WorkOrderResponseDto {
    return {
      workOrderId: workOrder.workOrderId,
      openedTs: workOrder.openedTs,
      scheduledStartTs: workOrder.scheduledStartTs ?? undefined,
      scheduledEndTs: workOrder.scheduledEndTs ?? undefined,
      closedTs: workOrder.closedTs ?? undefined,
      workOrderStatus: workOrder.workOrderStatus,
      resolutionNotes: workOrder.resolutionNotes ?? undefined,
      assetId: workOrder.assetId ?? undefined,
      requestId: workOrder.requestId ?? undefined,
      geoAreaId: workOrder.geoAreaId,
      asset: workOrder.asset,
      request: workOrder.request,
      geoArea: workOrder.geoArea,
      totalLaborCost: workOrder.totalLaborCost,
      totalItemCost: workOrder.totalItemCost,
      totalCost: workOrder.totalCost,
      durationHours: workOrder.durationHours ?? undefined,
      laborEntries: workOrder.laborEntries,
      itemUsages: workOrder.itemUsages,
    };
  }
}
