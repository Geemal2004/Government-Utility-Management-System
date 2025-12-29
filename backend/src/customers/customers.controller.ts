import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, CustomerType } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Employee } from '../database/entities/employee.entity';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles('Admin', 'Manager', 'FieldOfficer')
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({
    status: 201,
    description: 'Customer created successfully',
    type: CustomerResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Conflict - duplicate identity ref or email' })
  async create(
    @Body() createCustomerDto: CreateCustomerDto,
    @CurrentUser() user: Employee,
  ): Promise<ApiResponseDto<CustomerResponseDto>> {
    const customer = await this.customersService.create(createCustomerDto, user.employeeId);
    return {
      success: true,
      data: customer,
      message: 'Customer created successfully',
    };
  }

  @Get()
  @Roles('Admin', 'Manager', 'FieldOfficer', 'Cashier')
  @ApiOperation({ summary: 'Get all customers with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort field',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order',
  })
  @ApiQuery({
    name: 'customerType',
    required: false,
    enum: CustomerType,
    description: 'Filter by customer type',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name, email, or identity ref',
  })
  @ApiResponse({
    status: 200,
    description: 'List of customers retrieved successfully',
  })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: 'ASC' | 'DESC',
    @Query('customerType') customerType?: string,
    @Query('search') search?: string,
  ): Promise<ApiResponseDto<PaginatedResponseDto<CustomerResponseDto>>> {
    const result = await this.customersService.findAll({
      page: page || 1,
      limit: limit || 10,
      sortBy,
      order,
      customerType,
      search,
    });
    return {
      success: true,
      data: result,
    };
  }

  @Get('stats/count-by-type')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Get customer count by type' })
  @ApiResponse({
    status: 200,
    description: 'Customer count by type retrieved successfully',
  })
  async getCountByType(): Promise<ApiResponseDto<{ type: string; count: number }[]>> {
    const result = await this.customersService.getCountByType();
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  @Roles('Admin', 'Manager', 'FieldOfficer', 'Cashier')
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Customer retrieved successfully',
    type: CustomerResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<CustomerResponseDto>> {
    const customer = await this.customersService.findById(id);
    return {
      success: true,
      data: customer,
    };
  }

  @Get('identity/:identityRef')
  @Roles('Admin', 'Manager', 'FieldOfficer', 'Cashier')
  @ApiOperation({ summary: 'Get customer by identity reference' })
  @ApiParam({
    name: 'identityRef',
    type: String,
    description: 'Identity reference number',
  })
  @ApiResponse({
    status: 200,
    description: 'Customer retrieved successfully',
    type: CustomerResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findByIdentityRef(
    @Param('identityRef') identityRef: string,
  ): Promise<ApiResponseDto<CustomerResponseDto>> {
    const customer = await this.customersService.findByIdentityRef(identityRef);
    return {
      success: true,
      data: customer,
    };
  }

  @Put(':id')
  @Roles('Admin', 'Manager', 'FieldOfficer')
  @ApiOperation({ summary: 'Update a customer' })
  @ApiParam({ name: 'id', type: Number, description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Customer updated successfully',
    type: CustomerResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 409, description: 'Conflict - duplicate email' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ): Promise<ApiResponseDto<CustomerResponseDto>> {
    const customer = await this.customersService.update(id, updateCustomerDto);
    return {
      success: true,
      data: customer,
      message: 'Customer updated successfully',
    };
  }

  @Delete(':id')
  @Roles('Admin', 'Manager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a customer' })
  @ApiParam({ name: 'id', type: Number, description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Customer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<null>> {
    await this.customersService.delete(id);
    return {
      success: true,
      data: null,
      message: 'Customer deleted successfully',
    };
  }
}
