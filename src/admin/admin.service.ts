import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserOrder, UserOrderDocument } from '../user-products/schemas/user-order.schema';
import { OrderProblem, OrderProblemDocument } from '../user-products/schemas/order-problem.schema';
import { PaymentsService } from '../payments/payments.service';
import { EmailService } from '../common/services/email.service';
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

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel(UserOrder.name) private userOrderModel: Model<UserOrderDocument>,
    @InjectModel(OrderProblem.name) private orderProblemModel: Model<OrderProblemDocument>,
    private paymentsService: PaymentsService,
    private emailService: EmailService,
  ) {}

  async getOrders(queryDto: GetOrdersQueryDto): Promise<OrdersResponseDto> {
    const {
      status,
      userId,
      customerEmail,
      isTest,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryDto;

    // Build query filters
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (userId) {
      filter.userId = userId;
    }

    if (customerEmail) {
      filter['recipient.email'] = new RegExp(customerEmail, 'i');
    }

    if (isTest !== undefined) {
      filter.isTest = isTest;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [orders, total] = await Promise.all([
      this.userOrderModel
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.userOrderModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      orders,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getOrderById(orderId: string): Promise<UserOrderDocument> {
    const order = await this.userOrderModel.findById(orderId).exec();

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    return order;
  }

  async updateOrderStatus(
    orderId: string,
    updateDto: UpdateOrderStatusDto,
    adminEmail: string,
  ): Promise<UserOrderDocument> {
    const order = await this.getOrderById(orderId);

    const oldStatus = order.status;
    order.status = updateDto.status as any;

    // Add to status history
    if (!order.statusHistory) {
      order.statusHistory = [];
    }

    order.statusHistory.push({
      status: updateDto.status,
      timestamp: new Date(),
      note: updateDto.note,
      updatedBy: `admin:${adminEmail}`,
    });

    await order.save();

    this.logger.log(
      `Order ${orderId} status updated from ${oldStatus} to ${updateDto.status} by ${adminEmail}`,
    );

    // Send email notifications for specific status changes
    if (updateDto.status === 'delivered' && oldStatus !== 'delivered') {
      this.emailService.sendOrderDeliveredEmail({
        orderNumber: orderId,
        customerEmail: order.recipient.email,
        customerName: order.recipient.name,
      }).catch((error) => {
        this.logger.error(`Failed to send delivered email: ${error.message}`);
      });
    } else if (updateDto.status === 'cancelled' && oldStatus !== 'cancelled') {
      this.emailService.sendOrderCancelledEmail({
        orderNumber: orderId,
        customerEmail: order.recipient.email,
        customerName: order.recipient.name,
        reason: updateDto.note,
      }).catch((error) => {
        this.logger.error(`Failed to send cancelled email: ${error.message}`);
      });
    }

    return order;
  }

  async initiateRefund(
    orderId: string,
    refundDto: InitiateRefundDto,
    adminEmail: string,
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    const order = await this.getOrderById(orderId);

    if (order.paymentStatus === 'refunded') {
      throw new BadRequestException('Order has already been refunded');
    }

    if (!order.paymentIntentId) {
      throw new BadRequestException('Order has no payment intent ID');
    }

    try {
      // Convert amount to cents for Stripe
      const amountInCents = Math.round(refundDto.amount * 100);

      const refund = await this.paymentsService.createRefund(
        order.paymentIntentId,
        amountInCents,
      );

      // Update order with refund info
      order.paymentStatus = 'refunded';
      order.refundInfo = {
        refundId: refund.id,
        amount: refundDto.amount,
        reason: refundDto.reason,
        timestamp: new Date(),
        status: 'completed',
      };

      // Add to status history
      if (!order.statusHistory) {
        order.statusHistory = [];
      }

      order.statusHistory.push({
        status: 'refunded',
        timestamp: new Date(),
        note: `Refunded $${refundDto.amount}: ${refundDto.reason}`,
        updatedBy: `admin:${adminEmail}`,
      });

      await order.save();

      this.logger.log(
        `Refund of $${refundDto.amount} initiated for order ${orderId} by ${adminEmail}`,
      );

      // Send refund email
      this.emailService.sendRefundProcessedEmail({
        orderNumber: orderId,
        customerEmail: order.recipient.email,
        customerName: order.recipient.name,
        refundAmount: refundDto.amount,
        reason: refundDto.reason,
      }).catch((error) => {
        this.logger.error(`Failed to send refund email: ${error.message}`);
      });

      return {
        success: true,
        refundId: refund.id,
      };
    } catch (error) {
      this.logger.error(`Failed to refund order ${orderId}:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getStats(): Promise<AdminStatsDto> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all orders (excluding test orders for stats)
    const allOrders = await this.userOrderModel
      .find({ isTest: { $ne: true } })
      .lean()
      .exec();

    // Calculate totals
    const totalOrders = allOrders.length;
    const totalRevenue = allOrders.reduce((sum, order) => sum + (order.total || 0), 0);

    // Orders by status
    const ordersByStatus = allOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Today's stats
    const ordersToday = allOrders.filter(
      (order) => new Date((order as any).createdAt) >= startOfToday,
    );
    const revenueToday = ordersToday.reduce((sum, order) => sum + (order.total || 0), 0);

    // This week's stats
    const ordersThisWeek = allOrders.filter(
      (order) => new Date((order as any).createdAt) >= startOfWeek,
    );
    const revenueThisWeek = ordersThisWeek.reduce((sum, order) => sum + (order.total || 0), 0);

    // This month's stats
    const ordersThisMonth = allOrders.filter(
      (order) => new Date((order as any).createdAt) >= startOfMonth,
    );
    const revenueThisMonth = ordersThisMonth.reduce(
      (sum, order) => sum + (order.total || 0),
      0,
    );

    // Recent orders
    const recentOrders = await this.userOrderModel
      .find({ isTest: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
      .exec();

    // Count open problems
    const openProblems = await this.orderProblemModel.countDocuments({
      status: { $in: ['open', 'in_review'] },
    }).exec();

    return {
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      ordersByStatus,
      ordersToday: ordersToday.length,
      revenueToday: Math.round(revenueToday * 100) / 100,
      ordersThisWeek: ordersThisWeek.length,
      revenueThisWeek: Math.round(revenueThisWeek * 100) / 100,
      ordersThisMonth: ordersThisMonth.length,
      revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
      recentOrders,
      openProblems,
    };
  }

  // ==================== PROBLEM MANAGEMENT ====================

  async getProblems(queryDto: GetProblemsQueryDto): Promise<ProblemsResponseDto> {
    const {
      status,
      problemType,
      orderId,
      page = 1,
      limit = 20,
    } = queryDto;

    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (problemType) {
      filter.problemType = problemType;
    }

    if (orderId) {
      filter.orderId = orderId;
    }

    const skip = (page - 1) * limit;

    const [problems, total] = await Promise.all([
      this.orderProblemModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.orderProblemModel.countDocuments(filter).exec(),
    ]);

    // Enrich problems with order info
    const enrichedProblems = await Promise.all(
      problems.map(async (problem) => {
        const order = await this.userOrderModel.findById(problem.orderId).lean().exec();
        return {
          ...problem,
          order: order ? {
            _id: order._id,
            recipient: order.recipient,
            total: order.total,
            status: order.status,
            createdAt: (order as any).createdAt,
          } : null,
        };
      })
    );

    return {
      problems: enrichedProblems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getProblemById(problemId: string): Promise<OrderProblemDocument> {
    const problem = await this.orderProblemModel.findById(problemId).exec();

    if (!problem) {
      throw new NotFoundException(`Problem with ID ${problemId} not found`);
    }

    return problem;
  }

  async updateProblemStatus(
    problemId: string,
    status: string,
    adminEmail: string,
  ): Promise<OrderProblemDocument> {
    const problem = await this.getProblemById(problemId);

    problem.status = status as any;

    if (!problem.responses) {
      problem.responses = [];
    }

    problem.responses.push({
      message: `Status updated to ${status}`,
      respondedBy: `admin:${adminEmail}`,
      timestamp: new Date(),
      isInternal: true,
    });

    await problem.save();

    this.logger.log(`Problem ${problemId} status updated to ${status} by ${adminEmail}`);

    return problem;
  }

  async addProblemResponse(
    problemId: string,
    responseDto: AddProblemResponseDto,
    adminEmail: string,
  ): Promise<OrderProblemDocument> {
    const problem = await this.getProblemById(problemId);

    if (!problem.responses) {
      problem.responses = [];
    }

    problem.responses.push({
      message: responseDto.message,
      respondedBy: `admin:${adminEmail}`,
      timestamp: new Date(),
      isInternal: responseDto.isInternal || false,
    });

    // If not internal, update status to in_review if it was open
    if (!responseDto.isInternal && problem.status === 'open') {
      problem.status = 'in_review';
    }

    await problem.save();

    this.logger.log(`Response added to problem ${problemId} by ${adminEmail}`);

    return problem;
  }

  async resolveProblem(
    problemId: string,
    resolveDto: ResolveProblemDto,
    adminEmail: string,
  ): Promise<{ success: boolean; problem: OrderProblemDocument; refundId?: string }> {
    const problem = await this.getProblemById(problemId);

    if (problem.status === 'resolved' || problem.status === 'closed') {
      throw new BadRequestException('Problem is already resolved or closed');
    }

    const order = await this.userOrderModel.findById(problem.orderId).exec();
    if (!order) {
      throw new NotFoundException('Associated order not found');
    }

    let refundId: string | undefined;

    // Process refund if applicable
    if ((resolveDto.resolution === 'refund' || resolveDto.resolution === 'partial_refund') && resolveDto.refundAmount) {
      if (order.paymentStatus === 'refunded') {
        throw new BadRequestException('Order has already been refunded');
      }

      if (!order.paymentIntentId) {
        throw new BadRequestException('Order has no payment intent ID');
      }

      try {
        const amountInCents = Math.round(resolveDto.refundAmount * 100);
        const refund = await this.paymentsService.createRefund(order.paymentIntentId, amountInCents);
        refundId = refund.id;

        // Update order with refund info
        if (resolveDto.resolution === 'refund') {
          order.paymentStatus = 'refunded';
        }
        order.refundInfo = {
          refundId: refund.id,
          amount: resolveDto.refundAmount,
          reason: `Problem resolution: ${problem.problemType}`,
          timestamp: new Date(),
          status: 'completed',
        };

        if (!order.statusHistory) {
          order.statusHistory = [];
        }

        order.statusHistory.push({
          status: 'refunded',
          timestamp: new Date(),
          note: `Problem resolution refund: $${resolveDto.refundAmount}`,
          updatedBy: `admin:${adminEmail}`,
        });

        await order.save();

        this.logger.log(`Refund of $${resolveDto.refundAmount} processed for problem ${problemId}`);
      } catch (error) {
        this.logger.error(`Failed to process refund for problem ${problemId}: ${error.message}`);
        throw new BadRequestException(`Failed to process refund: ${error.message}`);
      }
    }

    // Update problem
    problem.status = 'resolved';
    problem.resolution = resolveDto.resolution as any;
    problem.resolutionNote = resolveDto.resolutionNote;
    problem.resolvedAt = new Date();
    problem.resolvedBy = adminEmail;
    problem.refundId = refundId;
    problem.refundAmount = resolveDto.refundAmount;

    if (!problem.responses) {
      problem.responses = [];
    }

    problem.responses.push({
      message: `Problem resolved: ${resolveDto.resolution}${resolveDto.resolutionNote ? ` - ${resolveDto.resolutionNote}` : ''}`,
      respondedBy: `admin:${adminEmail}`,
      timestamp: new Date(),
      isInternal: false,
    });

    await problem.save();

    // Send resolution email to customer
    this.emailService.sendProblemResolvedEmail({
      orderNumber: problem.orderId,
      customerEmail: order.recipient.email,
      customerName: order.recipient.name,
      resolution: resolveDto.resolution,
      resolutionNote: resolveDto.resolutionNote,
      refundAmount: resolveDto.refundAmount,
    }).catch((error) => {
      this.logger.error(`Failed to send problem resolved email: ${error.message}`);
    });

    this.logger.log(`Problem ${problemId} resolved by ${adminEmail}`);

    return {
      success: true,
      problem,
      refundId,
    };
  }
}

