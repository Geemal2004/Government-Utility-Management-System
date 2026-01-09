import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Patch,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WarehouseService } from '../services';
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  WarehouseResponseDto,
  WarehouseStockDto,
} from '../dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Inventory - Warehouses')
@ApiBearerAuth()
@Controller('api/v1/inventory/warehouses')
@UseGuards(JwtAuthGuard)
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new warehouse' })
  @ApiResponse({ status: 201, type: WarehouseResponseDto })
  async create(@Body() createDto: CreateWarehouseDto) {
    const warehouse = await this.warehouseService.create(createDto);
    return {
      success: true,
      data: warehouse,
      message: 'Warehouse created successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all warehouses' })
  @ApiResponse({ status: 200, type: [WarehouseResponseDto] })
  async findAll() {
    const warehouses = await this.warehouseService.findAll();
    return {
      success: true,
      data: warehouses,
      message: 'Warehouses retrieved successfully',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a warehouse by ID' })
  @ApiResponse({ status: 200, type: WarehouseResponseDto })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const warehouse = await this.warehouseService.findOne(id);
    return {
      success: true,
      data: warehouse,
      message: 'Warehouse retrieved successfully',
    };
  }

  @Get(':id/stock')
  @ApiOperation({ summary: 'Get all stock in a warehouse' })
  @ApiResponse({ status: 200, type: [WarehouseStockDto] })
  async getStock(@Param('id', ParseIntPipe) id: number) {
    const stock = await this.warehouseService.getStock(id);
    return {
      success: true,
      data: stock,
      message: 'Warehouse stock retrieved successfully',
    };
  }

  @Get(':id/stock/:itemId')
  @ApiOperation({ summary: 'Get specific item stock in a warehouse' })
  @ApiResponse({ status: 200, type: WarehouseStockDto })
  async getItemStock(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    const stock = await this.warehouseService.getItemStock(id, itemId);
    return {
      success: true,
      data: stock,
      message: 'Item stock retrieved successfully',
    };
  }

  @Get(':id/value')
  @ApiOperation({ summary: 'Get total stock value for a warehouse' })
  @ApiResponse({ status: 200 })
  async getStockValue(@Param('id', ParseIntPipe) id: number) {
    const value = await this.warehouseService.getStockValue(id);
    return {
      success: true,
      data: { totalValue: value },
      message: 'Stock value calculated successfully',
    };
  }

  @Get(':id/low-stock')
  @ApiOperation({ summary: 'Get items below reorder level in warehouse' })
  @ApiResponse({ status: 200, type: [WarehouseStockDto] })
  async getLowStock(@Param('id', ParseIntPipe) id: number) {
    const items = await this.warehouseService.getLowStockItems(id);
    return {
      success: true,
      data: items,
      message: 'Low stock items retrieved successfully',
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a warehouse' })
  @ApiResponse({ status: 200, type: WarehouseResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateWarehouseDto,
  ) {
    const warehouse = await this.warehouseService.update(id, updateDto);
    return {
      success: true,
      data: warehouse,
      message: 'Warehouse updated successfully',
    };
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a warehouse' })
  @ApiResponse({ status: 200, type: WarehouseResponseDto })
  async deactivate(@Param('id', ParseIntPipe) id: number) {
    const warehouse = await this.warehouseService.deactivate(id);
    return {
      success: true,
      data: warehouse,
      message: 'Warehouse deactivated successfully',
    };
  }
}
