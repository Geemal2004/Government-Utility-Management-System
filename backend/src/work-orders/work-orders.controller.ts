import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WorkOrdersService } from './work-orders.service';
import { CreateWorkOrderDto, UpdateWorkOrderDto, WorkOrderResponseDto, WorkOrderFilterDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkOrderStatus } from '../database/entities/work-order.entity';

@ApiTags('Work Orders')
@ApiBearerAuth()
@Controller('api/v1/work-orders')
@UseGuards(JwtAuthGuard)
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new work order' })
  @ApiResponse({ status: 201, type: WorkOrderResponseDto })
  async create(@Body() createDto: CreateWorkOrderDto) {
    const workOrder = await this.workOrdersService.create(createDto);
    return {
      success: true,
      data: workOrder,
      message: 'Work order created successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all work orders with filtering' })
  @ApiResponse({ status: 200 })
  async findAll(@Query() filters: WorkOrderFilterDto) {
    const result = await this.workOrdersService.findAll(filters);
    return {
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      message: 'Work orders retrieved successfully',
    };
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get work order statistics' })
  async getStatistics(@Query() filters: any) {
    const stats = await this.workOrdersService.getStatistics(filters);
    return {
      success: true,
      data: stats,
      message: 'Statistics retrieved successfully',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get work order by ID' })
  @ApiResponse({ status: 200, type: WorkOrderResponseDto })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const workOrder = await this.workOrdersService.findOne(id);
    return {
      success: true,
      data: this.workOrdersService['toResponseDto'](workOrder),
      message: 'Work order retrieved successfully',
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a work order' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateWorkOrderDto,
  ) {
    const workOrder = await this.workOrdersService.update(id, updateDto);
    return {
      success: true,
      data: workOrder,
      message: 'Work order updated successfully',
    };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update work order status' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: WorkOrderStatus; notes?: string },
  ) {
    const workOrder = await this.workOrdersService.updateStatus(id, body.status, body.notes);
    return {
      success: true,
      data: workOrder,
      message: 'Work order status updated successfully',
    };
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete a work order' })
  async complete(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { resolutionNotes: string },
  ) {
    const workOrder = await this.workOrdersService.complete(id, body.resolutionNotes);
    return {
      success: true,
      data: workOrder,
      message: 'Work order completed successfully',
    };
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a work order' })
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason: string },
  ) {
    const workOrder = await this.workOrdersService.cancel(id, body.reason);
    return {
      success: true,
      data: workOrder,
      message: 'Work order cancelled successfully',
    };
  }
}
