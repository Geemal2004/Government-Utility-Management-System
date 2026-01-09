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
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto, UpdateComplaintDto, ComplaintResponseDto, ComplaintFilterDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Complaints')
@ApiBearerAuth()
@Controller('api/v1/complaints')
@UseGuards(JwtAuthGuard)
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new complaint' })
  @ApiResponse({ status: 201, type: ComplaintResponseDto })
  async create(@Body() createDto: CreateComplaintDto) {
    const complaint = await this.complaintsService.create(createDto);
    return {
      success: true,
      data: complaint,
      message: 'Complaint created successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all complaints with filtering' })
  async findAll(@Query() filters: ComplaintFilterDto) {
    const result = await this.complaintsService.findAll(filters);
    return {
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      message: 'Complaints retrieved successfully',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get complaint by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const complaint = await this.complaintsService.findOne(id);
    return {
      success: true,
      data: this.complaintsService['toResponseDto'](complaint),
      message: 'Complaint retrieved successfully',
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a complaint' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateComplaintDto,
  ) {
    const complaint = await this.complaintsService.update(id, updateDto);
    return {
      success: true,
      data: complaint,
      message: 'Complaint updated successfully',
    };
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign complaint to employee' })
  async assign(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { employeeId: number },
  ) {
    const complaint = await this.complaintsService.assign(id, body.employeeId);
    return {
      success: true,
      data: complaint,
      message: 'Complaint assigned successfully',
    };
  }

  @Patch(':id/resolve')
  @ApiOperation({ summary: 'Resolve a complaint' })
  async resolve(@Param('id', ParseIntPipe) id: number) {
    const complaint = await this.complaintsService.resolve(id);
    return {
      success: true,
      data: complaint,
      message: 'Complaint resolved successfully',
    };
  }

  @Patch(':id/close')
  @ApiOperation({ summary: 'Close a complaint' })
  async close(@Param('id', ParseIntPipe) id: number) {
    const complaint = await this.complaintsService.close(id);
    return {
      success: true,
      data: complaint,
      message: 'Complaint closed successfully',
    };
  }
}
