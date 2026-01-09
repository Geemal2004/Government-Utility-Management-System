import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Complaint, ComplaintStatus } from '../database/entities/complaint.entity';
import { CreateComplaintDto, UpdateComplaintDto, ComplaintResponseDto, ComplaintFilterDto } from './dto';

@Injectable()
export class ComplaintsService {
  constructor(
    @InjectRepository(Complaint)
    private complaintRepository: Repository<Complaint>,
  ) {}

  async create(createDto: CreateComplaintDto): Promise<ComplaintResponseDto> {
    const complaint = this.complaintRepository.create({
      customerId: createDto.customerId,
      complaintType: createDto.complaintType,
      description: createDto.description,
      createdDate: new Date(),
      status: ComplaintStatus.OPEN,
    });

    const saved = await this.complaintRepository.save(complaint);
    return this.toResponseDto(await this.findOne(saved.complaintId));
  }

  async findAll(filters: ComplaintFilterDto): Promise<{ data: ComplaintResponseDto[]; total: number; page: number; limit: number }> {
    const { status, customerId, assignedEmployeeId, complaintType, page = 1, limit = 10, sortBy = 'complaintId', order = 'DESC' } = filters;

    const queryBuilder = this.complaintRepository
      .createQueryBuilder('complaint')
      .leftJoinAndSelect('complaint.customer', 'customer')
      .leftJoinAndSelect('complaint.assignedEmployee', 'assignedEmployee');

    if (status) {
      queryBuilder.andWhere('complaint.status = :status', { status });
    }

    if (customerId) {
      queryBuilder.andWhere('complaint.customerId = :customerId', { customerId });
    }

    if (assignedEmployeeId) {
      queryBuilder.andWhere('complaint.assignedEmployeeId = :assignedEmployeeId', { assignedEmployeeId });
    }

    if (complaintType) {
      queryBuilder.andWhere('complaint.complaintType = :complaintType', { complaintType });
    }

    const total = await queryBuilder.getCount();
    
    const complaints = await queryBuilder
      .orderBy(`complaint.${sortBy}`, order)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data: complaints.map(c => this.toResponseDto(c)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<Complaint> {
    const complaint = await this.complaintRepository.findOne({
      where: { complaintId: id },
      relations: ['customer', 'assignedEmployee'],
    });

    if (!complaint) {
      throw new NotFoundException(`Complaint with ID ${id} not found`);
    }

    return complaint;
  }

  async update(id: number, updateDto: UpdateComplaintDto): Promise<ComplaintResponseDto> {
    await this.findOne(id);
    await this.complaintRepository.update(id, updateDto);
    return this.toResponseDto(await this.findOne(id));
  }

  async assign(id: number, employeeId: number): Promise<ComplaintResponseDto> {
    const complaint = await this.findOne(id);
    complaint.assignedEmployeeId = employeeId;
    complaint.status = ComplaintStatus.ASSIGNED;
    await this.complaintRepository.save(complaint);
    return this.toResponseDto(await this.findOne(id));
  }

  async resolve(id: number): Promise<ComplaintResponseDto> {
    const complaint = await this.findOne(id);
    complaint.status = ComplaintStatus.RESOLVED;
    complaint.resolvedDate = new Date();
    await this.complaintRepository.save(complaint);
    return this.toResponseDto(await this.findOne(id));
  }

  async close(id: number): Promise<ComplaintResponseDto> {
    const complaint = await this.findOne(id);
    complaint.status = ComplaintStatus.CLOSED;
    if (!complaint.resolvedDate) {
      complaint.resolvedDate = new Date();
    }
    await this.complaintRepository.save(complaint);
    return this.toResponseDto(await this.findOne(id));
  }

  private toResponseDto(complaint: Complaint): ComplaintResponseDto {
    return {
      complaintId: complaint.complaintId,
      customerId: complaint.customerId,
      assignedEmployeeId: complaint.assignedEmployeeId ?? undefined,
      complaintType: complaint.complaintType,
      createdDate: complaint.createdDate,
      resolvedDate: complaint.resolvedDate ?? undefined,
      status: complaint.status,
      description: complaint.description,
      customer: complaint.customer,
      assignedEmployee: complaint.assignedEmployee,
      resolutionTimeHours: complaint.resolutionTimeHours ?? undefined,
    };
  }
}
