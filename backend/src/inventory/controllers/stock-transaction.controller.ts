import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StockTransactionService } from '../services';
import {
  StockReceiptDto,
  StockIssueDto,
  StockTransferDto,
  StockAdjustmentDto,
  StockWriteOffDto,
  StockTransactionResponseDto,
  StockTransactionFilterDto,
} from '../dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Inventory - Stock Transactions')
@ApiBearerAuth()
@Controller('api/v1/inventory/transactions')
@UseGuards(JwtAuthGuard)
export class StockTransactionController {
  constructor(
    private readonly stockTransactionService: StockTransactionService,
  ) {}

  @Post('receive')
  @ApiOperation({ summary: 'Receive stock into warehouse' })
  @ApiResponse({ status: 201, type: [StockTransactionResponseDto] })
  async receiveStock(@Body() receiptDto: StockReceiptDto) {
    const transactions = await this.stockTransactionService.receiveStock(
      receiptDto,
    );
    return {
      success: true,
      data: transactions,
      message: 'Stock received successfully',
    };
  }

  @Post('issue')
  @ApiOperation({ summary: 'Issue stock from warehouse' })
  @ApiResponse({ status: 201, type: [StockTransactionResponseDto] })
  async issueStock(@Body() issueDto: StockIssueDto) {
    const transactions = await this.stockTransactionService.issueStock(
      issueDto,
    );
    return {
      success: true,
      data: transactions,
      message: 'Stock issued successfully',
    };
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Transfer stock between warehouses' })
  @ApiResponse({ status: 201 })
  async transferStock(@Body() transferDto: StockTransferDto) {
    const result = await this.stockTransactionService.transferStock(
      transferDto,
    );
    return {
      success: true,
      data: result,
      message: 'Stock transferred successfully',
    };
  }

  @Post('adjust')
  @ApiOperation({ summary: 'Adjust stock levels' })
  @ApiResponse({ status: 201, type: [StockTransactionResponseDto] })
  async adjustStock(@Body() adjustmentDto: StockAdjustmentDto) {
    const transactions = await this.stockTransactionService.adjustStock(
      adjustmentDto,
    );
    return {
      success: true,
      data: transactions,
      message: 'Stock adjusted successfully',
    };
  }

  @Post('write-off')
  @ApiOperation({ summary: 'Write off damaged/expired stock' })
  @ApiResponse({ status: 201, type: StockTransactionResponseDto })
  async writeOffStock(@Body() writeOffDto: StockWriteOffDto) {
    const transaction = await this.stockTransactionService.writeOffStock(
      writeOffDto,
    );
    return {
      success: true,
      data: transaction,
      message: 'Stock written off successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all stock transactions with filters' })
  @ApiResponse({ status: 200, type: [StockTransactionResponseDto] })
  async findAll(@Query() filters: StockTransactionFilterDto) {
    const result = await this.stockTransactionService.findAll(filters);
    return {
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      message: 'Stock transactions retrieved successfully',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a stock transaction by ID' })
  @ApiResponse({ status: 200, type: StockTransactionResponseDto })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const transaction = await this.stockTransactionService.findOne(id);
    return {
      success: true,
      data: transaction,
      message: 'Stock transaction retrieved successfully',
    };
  }
}
