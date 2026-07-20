import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { DiscountsService } from './discounts.service';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import {
  CreateDiscountDto,
  UpdateDiscountDto,
  ValidateDiscountDto,
  DiscountResponseDto,
  ValidateDiscountResponseDto,
} from './dto/discount.dto';

@ApiTags('Discounts')
@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  // ==================== ADMIN ENDPOINTS ====================

  @Post()
  @UseGuards(AuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new discount code (admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Discount created successfully',
    type: DiscountResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  async create(@Body() createDto: CreateDiscountDto): Promise<DiscountResponseDto> {
    return this.discountsService.create(createDto);
  }

  @Get()
  @UseGuards(AuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all discount codes (admin only)' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'List of discounts',
    type: [DiscountResponseDto],
  })
  async findAll(
    @Query('activeOnly') activeOnly?: boolean,
  ): Promise<DiscountResponseDto[]> {
    return this.discountsService.findAll(activeOnly === true);
  }

  @Get(':id')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a discount by ID (admin only)' })
  @ApiParam({ name: 'id', description: 'Discount ID' })
  @ApiResponse({
    status: 200,
    description: 'Discount details',
    type: DiscountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Discount not found' })
  async findOne(@Param('id') id: string): Promise<DiscountResponseDto> {
    return this.discountsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a discount (admin only)' })
  @ApiParam({ name: 'id', description: 'Discount ID' })
  @ApiResponse({
    status: 200,
    description: 'Discount updated successfully',
    type: DiscountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Discount not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDiscountDto,
  ): Promise<DiscountResponseDto> {
    return this.discountsService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a discount (admin only)' })
  @ApiParam({ name: 'id', description: 'Discount ID' })
  @ApiResponse({ status: 204, description: 'Discount deleted successfully' })
  @ApiResponse({ status: 404, description: 'Discount not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.discountsService.remove(id);
  }

  // ==================== PUBLIC ENDPOINTS ====================

  @Post('validate')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // Rate limit: 20 validations per minute
  @ApiOperation({ summary: 'Validate a discount code for checkout' })
  @ApiResponse({
    status: 200,
    description: 'Validation result',
    type: ValidateDiscountResponseDto,
  })
  async validate(
    @Body() validateDto: ValidateDiscountDto,
  ): Promise<ValidateDiscountResponseDto> {
    return this.discountsService.validate(validateDto);
  }
}

