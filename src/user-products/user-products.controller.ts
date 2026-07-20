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
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserProductsService } from './user-products.service';
import { AuthGuard } from '../auth/auth.guard';
import { User, type AuthUser } from '../auth/decorators/user.decorator';
import {
  CreateCustomProductDto,
  UpdateCustomProductDto,
  CreateUserOrderDto,
  CancelOrderDto,
  CancelOrderResponseDto,
  ReportProblemDto,
  ReportProblemResponseDto,
  OrderProblemDto,
} from './dto';

@ApiTags('User Products')
@ApiBearerAuth()
@Controller('user-products')
@UseGuards(AuthGuard)
export class UserProductsController {
  constructor(private readonly userProductsService: UserProductsService) {}

  // ==================== CUSTOM PRODUCTS ====================

  @Post()
  @ApiOperation({
    summary: 'Create a custom product design',
    description: 'Save a user-created custom product design',
  })
  @ApiResponse({
    status: 201,
    description: 'Custom product created',
  })
  async createCustomProduct(
    @User() user: AuthUser,
    @Body() createDto: CreateCustomProductDto,
  ) {
    return this.userProductsService.createCustomProduct(user.userId, createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get user custom products',
    description: 'Retrieve all custom products created by the user',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['draft', 'completed', 'archived'],
  })
  @ApiResponse({
    status: 200,
    description: 'List of user custom products',
  })
  async getUserCustomProducts(
    @User() user: AuthUser,
    @Query('status') status?: string,
  ) {
    return this.userProductsService.getUserCustomProducts(user.userId, status);
  }

  // ==================== USER ORDERS ====================
  // Note: Order routes must come BEFORE :id routes to avoid route conflicts

  @Post('orders')
  @ApiOperation({
    summary: 'Create a user order',
    description: 'Submit a new order for the user',
  })
  @ApiResponse({
    status: 201,
    description: 'Order created',
  })
  async createUserOrder(
    @User() user: AuthUser,
    @Body() createDto: CreateUserOrderDto,
  ) {
    return this.userProductsService.createUserOrder(user.userId, createDto);
  }

  @Get('orders')
  @ApiOperation({
    summary: 'Get user orders',
    description: 'Retrieve all orders placed by the user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of user orders',
  })
  async getUserOrders(@User() user: AuthUser) {
    return this.userProductsService.getUserOrders(user.userId);
  }

  @Get('orders/:id')
  @ApiOperation({
    summary: 'Get a user order',
    description: 'Retrieve a specific order by ID',
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Order details',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  async getUserOrder(@User() user: AuthUser, @Param('id') id: string) {
    return this.userProductsService.getUserOrder(user.userId, id);
  }

  @Post('orders/:id/cancel')
  @ApiOperation({
    summary: 'Cancel an order',
    description: 'Cancel an order that is still pending or processing. A refund will be automatically processed.',
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Order cancelled successfully',
    type: CancelOrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Order cannot be cancelled (already shipped/delivered)',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  async cancelOrder(
    @User() user: AuthUser,
    @Param('id') id: string,
    @Body() cancelDto: CancelOrderDto,
  ): Promise<CancelOrderResponseDto> {
    return this.userProductsService.cancelOrder(user.userId, id, cancelDto);
  }

  @Post('orders/:id/report-problem')
  @ApiOperation({
    summary: 'Report a problem with an order',
    description: 'Report an issue with a shipped or delivered order (damaged, wrong item, etc.)',
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: 201,
    description: 'Problem reported successfully',
    type: ReportProblemResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot report problem for this order status or already have an open report',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  async reportProblem(
    @User() user: AuthUser,
    @Param('id') id: string,
    @Body() reportDto: ReportProblemDto,
  ): Promise<ReportProblemResponseDto> {
    return this.userProductsService.reportProblem(user.userId, id, reportDto);
  }

  @Get('orders/:id/problems')
  @ApiOperation({
    summary: 'Get problems for an order',
    description: 'Retrieve all problem reports for a specific order',
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'List of problem reports',
    type: [OrderProblemDto],
  })
  async getOrderProblems(@User() user: AuthUser, @Param('id') id: string) {
    return this.userProductsService.getOrderProblems(user.userId, id);
  }

  @Get('problems')
  @ApiOperation({
    summary: 'Get all user problems',
    description: 'Retrieve all problem reports submitted by the user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of problem reports',
    type: [OrderProblemDto],
  })
  async getUserProblems(@User() user: AuthUser) {
    return this.userProductsService.getUserProblems(user.userId);
  }

  // ==================== CUSTOM PRODUCTS BY ID ====================

  @Get(':id')
  @ApiOperation({
    summary: 'Get a custom product',
    description: 'Retrieve a specific custom product by ID',
  })
  @ApiParam({ name: 'id', description: 'Custom product ID' })
  @ApiResponse({
    status: 200,
    description: 'Custom product details',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async getCustomProduct(@User() user: AuthUser, @Param('id') id: string) {
    return this.userProductsService.getCustomProduct(user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a custom product',
    description: 'Update custom product details',
  })
  @ApiParam({ name: 'id', description: 'Custom product ID' })
  @ApiResponse({
    status: 200,
    description: 'Custom product updated',
  })
  async updateCustomProduct(
    @User() user: AuthUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateCustomProductDto,
  ) {
    return this.userProductsService.updateCustomProduct(user.userId, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a custom product',
    description: 'Remove a custom product from the user account',
  })
  @ApiParam({ name: 'id', description: 'Custom product ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCustomProduct(@User() user: AuthUser, @Param('id') id: string) {
    return this.userProductsService.deleteCustomProduct(user.userId, id);
  }
}

