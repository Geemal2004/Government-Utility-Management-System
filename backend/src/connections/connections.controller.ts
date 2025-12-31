import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { ConnectionsService } from './connections.service';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';
import { ConnectionResponseDto } from './dto/connection-response.dto';
import { ConnectionFilterDto } from './dto/connection-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Employee } from '../database/entities/employee.entity';
import { ConnectionStatus } from '../database/entities/service-connection.entity';

@ApiTags('Service Connections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  /**
   * Get all service connections with filtering and pagination
   */
  @Get()
  @ApiOperation({
    summary: 'Get all service connections',
    description: 'Retrieve a paginated list of service connections with optional filtering',
  })
  @ApiQuery({ name: 'customerId', required: false, type: Number })
  @ApiQuery({ name: 'utilityTypeId', required: false, type: Number })
  @ApiQuery({ name: 'connectionStatus', required: false, enum: ConnectionStatus })
  @ApiQuery({ name: 'city', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'connectionId' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'], example: 'DESC' })
  @ApiOkResponse({
    description: 'List of service connections retrieved successfully',
    type: ConnectionResponseDto,
    isArray: true,
  })
  async findAll(@Query(ValidationPipe) filters: ConnectionFilterDto) {
    return this.connectionsService.findAll(filters);
  }

  /**
   * Get a single service connection by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get service connection by ID',
    description: 'Retrieve detailed information about a specific service connection',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Connection ID' })
  @ApiOkResponse({
    description: 'Service connection found',
    type: ConnectionResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Service connection not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.connectionsService.findOne(id);
  }

  /**
   * Get all connections for a specific customer
   */
  @Get('customer/:customerId')
  @ApiOperation({
    summary: 'Get connections by customer',
    description: 'Retrieve all service connections for a specific customer',
  })
  @ApiParam({ name: 'customerId', type: Number, description: 'Customer ID' })
  @ApiOkResponse({
    description: 'Customer connections retrieved successfully',
    type: ConnectionResponseDto,
    isArray: true,
  })
  async findByCustomer(@Param('customerId', ParseIntPipe) customerId: number) {
    return this.connectionsService.findByCustomer(customerId);
  }

  /**
   * Get connection statistics for a customer
   */
  @Get('customer/:customerId/stats')
  @ApiOperation({
    summary: 'Get customer connection statistics',
    description: 'Retrieve connection statistics grouped by status and utility type',
  })
  @ApiParam({ name: 'customerId', type: Number, description: 'Customer ID' })
  @ApiOkResponse({
    description: 'Connection statistics retrieved successfully',
    schema: {
      example: {
        total: 3,
        active: 2,
        pending: 1,
        suspended: 0,
        disconnected: 0,
        byUtilityType: [
          { utilityTypeId: 1, utilityTypeName: 'Electricity', count: 1 },
          { utilityTypeId: 2, utilityTypeName: 'Water', count: 2 },
        ],
      },
    },
  })
  async getCustomerStats(@Param('customerId', ParseIntPipe) customerId: number) {
    return this.connectionsService.getCustomerConnectionStats(customerId);
  }

  /**
   * Create a new service connection
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new service connection',
    description: 'Create a new service connection for a customer',
  })
  @ApiBody({ type: CreateConnectionDto })
  @ApiCreatedResponse({
    description: 'Service connection created successfully',
    type: ConnectionResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiConflictResponse({ description: 'Meter already assigned to another connection' })
  async create(
    @Body(ValidationPipe) createDto: CreateConnectionDto,
    @CurrentUser() user: Employee,
  ) {
    return this.connectionsService.create(createDto, user.employeeId);
  }

  /**
   * Update a service connection
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update service connection',
    description: 'Update an existing service connection',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Connection ID' })
  @ApiBody({ type: UpdateConnectionDto })
  @ApiOkResponse({
    description: 'Service connection updated successfully',
    type: ConnectionResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Service connection not found' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateDto: UpdateConnectionDto,
  ) {
    return this.connectionsService.update(id, updateDto);
  }

  /**
   * Update connection status
   */
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update connection status',
    description: 'Change the status of a service connection',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Connection ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: Object.values(ConnectionStatus),
          example: ConnectionStatus.ACTIVE,
        },
      },
      required: ['status'],
    },
  })
  @ApiOkResponse({
    description: 'Connection status updated successfully',
    type: ConnectionResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Service connection not found' })
  @ApiBadRequestResponse({ description: 'Invalid status or status transition' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: ConnectionStatus,
    @CurrentUser() user: Employee,
  ) {
    return this.connectionsService.updateStatus(id, status, user.employeeId);
  }

  /**
   * Assign a meter to a connection
   */
  @Patch(':id/assign-meter')
  @ApiOperation({
    summary: 'Assign meter to connection',
    description: 'Link a meter to a service connection',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Connection ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        meterId: {
          type: 'number',
          example: 1,
        },
      },
      required: ['meterId'],
    },
  })
  @ApiOkResponse({
    description: 'Meter assigned successfully',
    type: ConnectionResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Connection or meter not found' })
  @ApiConflictResponse({ description: 'Meter already assigned to another connection' })
  @ApiBadRequestResponse({ description: 'Meter is faulty or invalid' })
  async assignMeter(
    @Param('id', ParseIntPipe) id: number,
    @Body('meterId', ParseIntPipe) meterId: number,
  ) {
    return this.connectionsService.assignMeter(id, meterId);
  }

  /**
   * Deactivate a service connection (soft delete)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Deactivate service connection',
    description: 'Soft delete a service connection by marking it as disconnected',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Connection ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Service connection deactivated successfully',
  })
  @ApiNotFoundResponse({ description: 'Service connection not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.connectionsService.remove(id);
  }
}
