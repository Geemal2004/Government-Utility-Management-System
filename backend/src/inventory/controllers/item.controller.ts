import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
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
import { ItemService } from '../services';
import {
  CreateItemDto,
  UpdateItemDto,
  ItemResponseDto,
  ItemFilterDto,
  WarehouseStockInfoDto,
} from '../dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Inventory - Items')
@ApiBearerAuth()
@Controller('api/v1/inventory/items')
@UseGuards(JwtAuthGuard)
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new item' })
  @ApiResponse({ status: 201, type: ItemResponseDto })
  async create(@Body() createDto: CreateItemDto) {
    const item = await this.itemService.create(createDto);
    return {
      success: true,
      data: item,
      message: 'Item created successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all items with filters and pagination' })
  @ApiResponse({ status: 200, type: [ItemResponseDto] })
  async findAll(@Query() filters: ItemFilterDto) {
    const result = await this.itemService.findAll(filters);
    return {
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      message: 'Items retrieved successfully',
    };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search items by name' })
  @ApiResponse({ status: 200, type: [ItemResponseDto] })
  async search(@Query('q') searchTerm: string) {
    const items = await this.itemService.searchItems(searchTerm);
    return {
      success: true,
      data: items,
      message: 'Items search completed',
    };
  }

  @Get('reorder')
  @ApiOperation({ summary: 'Get items below reorder level' })
  @ApiResponse({ status: 200, type: [ItemResponseDto] })
  async getBelowReorderLevel() {
    const items = await this.itemService.getBelowReorderLevel();
    return {
      success: true,
      data: items,
      message: 'Items below reorder level retrieved',
    };
  }

  @Get('expiring')
  @ApiOperation({ summary: 'Get items expiring within specified days' })
  @ApiResponse({ status: 200, type: [ItemResponseDto] })
  async getExpiring(@Query('days', ParseIntPipe) days: number) {
    const items = await this.itemService.getExpiringItems(days);
    return {
      success: true,
      data: items,
      message: 'Expiring items retrieved successfully',
    };
  }

  @Get('hazardous')
  @ApiOperation({ summary: 'Get all hazardous items' })
  @ApiResponse({ status: 200, type: [ItemResponseDto] })
  async getHazardous() {
    const items = await this.itemService.getHazardousItems();
    return {
      success: true,
      data: items,
      message: 'Hazardous items retrieved successfully',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an item by ID with stock details' })
  @ApiResponse({ status: 200, type: ItemResponseDto })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const item = await this.itemService.findOne(id);
    return {
      success: true,
      data: item,
      message: 'Item retrieved successfully',
    };
  }

  @Get(':id/stock')
  @ApiOperation({ summary: 'Get item stock across all warehouses' })
  @ApiResponse({ status: 200, type: [WarehouseStockInfoDto] })
  async getStock(@Param('id', ParseIntPipe) id: number) {
    const stock = await this.itemService.getItemStock(id);
    return {
      success: true,
      data: stock,
      message: 'Item stock retrieved successfully',
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an item' })
  @ApiResponse({ status: 200, type: ItemResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateItemDto,
  ) {
    const item = await this.itemService.update(id, updateDto);
    return {
      success: true,
      data: item,
      message: 'Item updated successfully',
    };
  }

  @Patch(':id/cost')
  @ApiOperation({ summary: 'Update item standard cost' })
  @ApiResponse({ status: 200, type: ItemResponseDto })
  async updateCost(
    @Param('id', ParseIntPipe) id: number,
    @Body('standardUnitCost') cost: number,
  ) {
    const item = await this.itemService.updateStandardCost(id, cost);
    return {
      success: true,
      data: item,
      message: 'Item cost updated successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an item' })
  @ApiResponse({ status: 200 })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.itemService.delete(id);
    return {
      success: true,
      message: 'Item deleted successfully',
    };
  }
}
