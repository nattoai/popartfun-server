import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum, IsDateString, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetOrdersQueryDto {
  @ApiPropertyOptional({ description: 'Filter by order status' })
  @IsOptional()
  @IsEnum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'failed'])
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by customer email' })
  @IsOptional()
  @IsString()
  customerEmail?: string;

  @ApiPropertyOptional({ description: 'Filter by test orders only' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isTest?: boolean;

  @ApiPropertyOptional({ description: 'Filter orders from this date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter orders until this date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort field', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', default: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class UpdateOrderStatusDto {
  @ApiProperty({ description: 'New order status', enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'failed'] })
  @IsEnum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'failed'])
  status: string;

  @ApiPropertyOptional({ description: 'Optional note about the status change' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class InitiateRefundDto {
  @ApiProperty({ description: 'Refund amount in dollars' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Reason for refund' })
  @IsString()
  reason: string;
}

export class OrdersResponseDto {
  @ApiProperty({ description: 'Array of orders' })
  orders: any[];

  @ApiProperty({ description: 'Total count of orders matching filters' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;
}

export class AdminStatsDto {
  @ApiProperty({ description: 'Total number of orders' })
  totalOrders: number;

  @ApiProperty({ description: 'Total revenue in dollars' })
  totalRevenue: number;

  @ApiProperty({ description: 'Orders by status breakdown' })
  ordersByStatus: Record<string, number>;

  @ApiProperty({ description: 'Revenue today' })
  revenueToday: number;

  @ApiProperty({ description: 'Orders today' })
  ordersToday: number;

  @ApiProperty({ description: 'Revenue this week' })
  revenueThisWeek: number;

  @ApiProperty({ description: 'Orders this week' })
  ordersThisWeek: number;

  @ApiProperty({ description: 'Revenue this month' })
  revenueThisMonth: number;

  @ApiProperty({ description: 'Orders this month' })
  ordersThisMonth: number;

  @ApiProperty({ description: 'Recent orders (last 10)' })
  recentOrders: any[];

  @ApiPropertyOptional({ description: 'Open problem reports count' })
  openProblems?: number;
}

// ==================== PROBLEM MANAGEMENT ====================

export class GetProblemsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by problem status' })
  @IsOptional()
  @IsEnum(['open', 'in_review', 'resolved', 'closed'])
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by problem type' })
  @IsOptional()
  @IsEnum(['damaged', 'wrong_item', 'missing_item', 'quality_issue', 'shipping_issue', 'not_received', 'other'])
  problemType?: string;

  @ApiPropertyOptional({ description: 'Filter by order ID' })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class ResolveProblemDto {
  @ApiProperty({ 
    description: 'Resolution type',
    enum: ['refund', 'replacement', 'partial_refund', 'no_action', 'other']
  })
  @IsEnum(['refund', 'replacement', 'partial_refund', 'no_action', 'other'])
  resolution: string;

  @ApiPropertyOptional({ description: 'Note about the resolution' })
  @IsOptional()
  @IsString()
  resolutionNote?: string;

  @ApiPropertyOptional({ description: 'Refund amount if applicable' })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  refundAmount?: number;
}

export class AddProblemResponseDto {
  @ApiProperty({ description: 'Response message to the customer' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Whether this is an internal note (not visible to customer)' })
  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}

export class ProblemsResponseDto {
  @ApiProperty({ description: 'Array of problems' })
  problems: any[];

  @ApiProperty({ description: 'Total count of problems matching filters' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;
}

