import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { CreateAssetDto, UpdateAssetDto, AssetResponseDto, AssetFilterDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Controller for asset management endpoints
 */
@ApiTags('Assets')
@ApiBearerAuth()
@Controller('api/v1/assets')
@UseGuards(JwtAuthGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new asset' })
  @ApiResponse({ status: 201, description: 'Asset created successfully', type: AssetResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createAssetDto: CreateAssetDto): Promise<{ success: boolean; data: AssetResponseDto; message: string }> {
    const asset = await this.assetsService.create(createAssetDto);
    return {
      success: true,
      data: asset,
      message: 'Asset created successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all assets with filtering' })
  @ApiResponse({ status: 200, description: 'Assets retrieved successfully' })
  async findAll(@Query() filters: AssetFilterDto) {
    const result = await this.assetsService.findAll(filters);
    return {
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      message: 'Assets retrieved successfully',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get asset by ID' })
  @ApiResponse({ status: 200, description: 'Asset found', type: AssetResponseDto })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const asset = await this.assetsService.findOne(id);
    return {
      success: true,
      data: this.toResponseDto(asset),
      message: 'Asset retrieved successfully',
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an asset' })
  @ApiResponse({ status: 200, description: 'Asset updated successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAssetDto: UpdateAssetDto,
  ) {
    const asset = await this.assetsService.update(id, updateAssetDto);
    return {
      success: true,
      data: asset,
      message: 'Asset updated successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an asset (soft delete)' })
  @ApiResponse({ status: 200, description: 'Asset deleted successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.assetsService.remove(id);
    return {
      success: true,
      message: 'Asset deleted successfully',
    };
  }

  private toResponseDto(asset: any): AssetResponseDto {
    return {
      assetId: asset.assetId,
      name: asset.name,
      assetType: asset.assetType,
      status: asset.status,
      utilityTypeId: asset.utilityTypeId,
      utilityType: asset.utilityType,
    };
  }
}
