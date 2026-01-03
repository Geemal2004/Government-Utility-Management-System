import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { LookupService } from './lookup.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Lookup')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('lookup')
export class LookupController {
  constructor(private readonly lookupService: LookupService) {}

  /**
   * Get all utility types
   */
  @Get('utility-types')
  @ApiOperation({
    summary: 'Get all utility types',
    description: 'Retrieve list of all utility types (Electricity, Water, Gas)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of utility types',
  })
  async getUtilityTypes() {
    return this.lookupService.getUtilityTypes();
  }

  /**
   * Get tariff categories
   */
  @Get('tariff-categories')
  @ApiOperation({
    summary: 'Get tariff categories',
    description: 'Retrieve list of tariff categories, optionally filtered by utility type',
  })
  @ApiQuery({
    name: 'utilityTypeId',
    required: false,
    type: Number,
    description: 'Filter by utility type ID',
  })
  @ApiResponse({
    status: 200,
    description: 'List of tariff categories',
  })
  async getTariffCategories(@Query('utilityTypeId') utilityTypeId?: string) {
    const typeId = utilityTypeId ? parseInt(utilityTypeId) : undefined;
    return this.lookupService.getTariffCategories(typeId);
  }

  /**
   * Get all meters
   */
  @Get('meters')
  @ApiOperation({
    summary: 'Get all meters',
    description: 'Retrieve list of all meters, optionally filtered by utility type',
  })
  @ApiQuery({
    name: 'utilityTypeId',
    required: false,
    type: Number,
    description: 'Filter by utility type ID',
  })
  @ApiResponse({
    status: 200,
    description: 'List of meters',
  })
  async getMeters(@Query('utilityTypeId') utilityTypeId?: string) {
    const typeId = utilityTypeId ? parseInt(utilityTypeId) : undefined;
    return this.lookupService.getMeters(typeId);
  }

  /**
   * Get available (unassigned) meters
   */
  @Get('meters/available')
  @ApiOperation({
    summary: 'Get available meters',
    description: 'Retrieve list of unassigned meters, optionally filtered by utility type',
  })
  @ApiQuery({
    name: 'utilityTypeId',
    required: false,
    type: Number,
    description: 'Filter by utility type ID',
  })
  @ApiResponse({
    status: 200,
    description: 'List of available meters',
  })
  async getAvailableMeters(@Query('utilityTypeId') utilityTypeId?: string) {
    const typeId = utilityTypeId ? parseInt(utilityTypeId) : undefined;
    return this.lookupService.getAvailableMeters(typeId);
  }

  /**
   * Get geographic areas
   */
  @Get('geo-areas')
  @ApiOperation({
    summary: 'Get geographic areas',
    description: 'Retrieve list of all geographic areas',
  })
  @ApiResponse({
    status: 200,
    description: 'List of geographic areas',
  })
  async getGeoAreas() {
    return this.lookupService.getGeoAreas();
  }

  /**
   * Get network nodes
   */
  @Get('network-nodes')
  @ApiOperation({
    summary: 'Get network nodes',
    description: 'Retrieve list of network nodes, optionally filtered by utility type',
  })
  @ApiQuery({
    name: 'utilityTypeId',
    required: false,
    type: Number,
    description: 'Filter by utility type ID',
  })
  @ApiResponse({
    status: 200,
    description: 'List of network nodes',
  })
  async getNetworkNodes(@Query('utilityTypeId') utilityTypeId?: string) {
    const typeId = utilityTypeId ? parseInt(utilityTypeId) : undefined;
    return this.lookupService.getNetworkNodes(typeId);
  }

  /**
   * Get customers for dropdown
   */
  @Get('customers')
  @ApiOperation({
    summary: 'Get customers for selection',
    description: 'Retrieve list of customers for dropdown selection',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term for filtering customers',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of results',
  })
  @ApiResponse({
    status: 200,
    description: 'List of customers',
  })
  async getCustomers(@Query('search') search?: string, @Query('limit') limit?: string) {
    const maxResults = limit ? parseInt(limit) : 50;
    return this.lookupService.getCustomers(search, maxResults);
  }
}
