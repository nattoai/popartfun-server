import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { User, type AuthUser } from '../auth/decorators/user.decorator';
import {
  GetOrdersQueryDto,
  UpdateOrderStatusDto,
  InitiateRefundDto,
  OrdersResponseDto,
  AdminStatsDto,
  GetProblemsQueryDto,
  ResolveProblemDto,
  AddProblemResponseDto,
  ProblemsResponseDto,
} from './dto/admin.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('orders')
  @ApiOperation({
    summary: 'Get all orders (admin only)',
    description: 'Retrieve all orders with filtering, sorting, and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved successfully',
    type: OrdersResponseDto,
  })
  async getOrders(@Query() queryDto: GetOrdersQueryDto): Promise<OrdersResponseDto> {
    return this.adminService.getOrders(queryDto);
  }

  @Get('orders/:id')
  @ApiOperation({
    summary: 'Get order by ID (admin only)',
    description: 'Retrieve detailed information about a specific order',
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Order retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  async getOrderById(@Param('id') id: string) {
    return this.adminService.getOrderById(id);
  }

  @Patch('orders/:id/status')
  @ApiOperation({
    summary: 'Update order status (admin only)',
    description: 'Manually update the status of an order with optional note',
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Order status updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderStatusDto,
    @User() user: AuthUser,
  ) {
    return this.adminService.updateOrderStatus(id, updateDto, user.email);
  }

  @Post('orders/:id/refund')
  @ApiOperation({
    summary: 'Initiate refund (admin only)',
    description: 'Process a full or partial refund for an order through Stripe',
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Refund initiated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request (already refunded, invalid amount, etc.)',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  async initiateRefund(
    @Param('id') id: string,
    @Body() refundDto: InitiateRefundDto,
    @User() user: AuthUser,
  ) {
    return this.adminService.initiateRefund(id, refundDto, user.email);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get admin dashboard statistics (admin only)',
    description: 'Retrieve comprehensive statistics for the admin dashboard',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    type: AdminStatsDto,
  })
  async getStats(): Promise<AdminStatsDto> {
    return this.adminService.getStats();
  }

  // ==================== PROBLEM MANAGEMENT ====================

  @Get('problems')
  @ApiOperation({
    summary: 'Get all problem reports (admin only)',
    description: 'Retrieve all problem reports with filtering and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Problems retrieved successfully',
    type: ProblemsResponseDto,
  })
  async getProblems(@Query() queryDto: GetProblemsQueryDto): Promise<ProblemsResponseDto> {
    return this.adminService.getProblems(queryDto);
  }

  @Get('problems/:id')
  @ApiOperation({
    summary: 'Get problem by ID (admin only)',
    description: 'Retrieve detailed information about a specific problem report',
  })
  @ApiParam({ name: 'id', description: 'Problem ID' })
  @ApiResponse({
    status: 200,
    description: 'Problem retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Problem not found',
  })
  async getProblemById(@Param('id') id: string) {
    return this.adminService.getProblemById(id);
  }

  @Patch('problems/:id/status')
  @ApiOperation({
    summary: 'Update problem status (admin only)',
    description: 'Update the status of a problem report',
  })
  @ApiParam({ name: 'id', description: 'Problem ID' })
  @ApiResponse({
    status: 200,
    description: 'Problem status updated successfully',
  })
  async updateProblemStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @User() user: AuthUser,
  ) {
    return this.adminService.updateProblemStatus(id, status, user.email);
  }

  @Post('problems/:id/respond')
  @ApiOperation({
    summary: 'Add response to problem (admin only)',
    description: 'Add a response message to a problem report',
  })
  @ApiParam({ name: 'id', description: 'Problem ID' })
  @ApiResponse({
    status: 200,
    description: 'Response added successfully',
  })
  async addProblemResponse(
    @Param('id') id: string,
    @Body() responseDto: AddProblemResponseDto,
    @User() user: AuthUser,
  ) {
    return this.adminService.addProblemResponse(id, responseDto, user.email);
  }

  @Post('problems/:id/resolve')
  @ApiOperation({
    summary: 'Resolve a problem (admin only)',
    description: 'Resolve a problem report with optional refund',
  })
  @ApiParam({ name: 'id', description: 'Problem ID' })
  @ApiResponse({
    status: 200,
    description: 'Problem resolved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Problem already resolved or refund failed',
  })
  async resolveProblem(
    @Param('id') id: string,
    @Body() resolveDto: ResolveProblemDto,
    @User() user: AuthUser,
  ) {
    return this.adminService.resolveProblem(id, resolveDto, user.email);
  }
}

