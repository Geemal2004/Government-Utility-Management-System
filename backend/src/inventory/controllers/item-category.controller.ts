import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ItemCategoryService } from '../services';
import {
  CreateItemCategoryDto,
  UpdateItemCategoryDto,
  ItemCategoryResponseDto,
} from '../dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Inventory - Item Categories')
@ApiBearerAuth()
@Controller('api/v1/inventory/categories')
@UseGuards(JwtAuthGuard)
export class ItemCategoryController {
  constructor(private readonly itemCategoryService: ItemCategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new item category' })
  @ApiResponse({ status: 201, type: ItemCategoryResponseDto })
  async create(@Body() createDto: CreateItemCategoryDto) {
    const category = await this.itemCategoryService.create(createDto);
    return {
      success: true,
      data: category,
      message: 'Item category created successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all item categories' })
  @ApiResponse({ status: 200, type: [ItemCategoryResponseDto] })
  async findAll() {
    const categories = await this.itemCategoryService.findAll();
    return {
      success: true,
      data: categories,
      message: 'Item categories retrieved successfully',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an item category by ID' })
  @ApiResponse({ status: 200, type: ItemCategoryResponseDto })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const category = await this.itemCategoryService.findOne(id);
    return {
      success: true,
      data: category,
      message: 'Item category retrieved successfully',
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an item category' })
  @ApiResponse({ status: 200, type: ItemCategoryResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateItemCategoryDto,
  ) {
    const category = await this.itemCategoryService.update(id, updateDto);
    return {
      success: true,
      data: category,
      message: 'Item category updated successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an item category' })
  @ApiResponse({ status: 200 })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.itemCategoryService.delete(id);
    return {
      success: true,
      message: 'Item category deleted successfully',
    };
  }
}
