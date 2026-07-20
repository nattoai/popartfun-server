import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  UserCustomProduct,
  UserCustomProductDocument,
} from './schemas/user-custom-product.schema';
import {
  UserOrder,
  UserOrderDocument,
} from './schemas/user-order.schema';
import {
  OrderProblem,
  OrderProblemDocument,
} from './schemas/order-problem.schema';
import {
  CreateCustomProductDto,
  UpdateCustomProductDto,
  CreateUserOrderDto,
  CancelOrderDto,
  CancelOrderResponseDto,
  ReportProblemDto,
  ReportProblemResponseDto,
} from './dto';
import { PrintfulService } from '../printful/printful.service';
import { PaymentsService } from '../payments/payments.service';
import { EmailService } from '../common/services/email.service';
import { DiscountsService } from '../discounts/discounts.service';

@Injectable()
export class UserProductsService {
  private readonly logger = new Logger(UserProductsService.name);

  constructor(
    @InjectModel(UserCustomProduct.name)
    private customProductModel: Model<UserCustomProductDocument>,
    @InjectModel(UserOrder.name)
    private userOrderModel: Model<UserOrderDocument>,
    @InjectModel(OrderProblem.name)
    private orderProblemModel: Model<OrderProblemDocument>,
    private printfulService: PrintfulService,
    private paymentsService: PaymentsService,
    private emailService: EmailService,
    @Inject(forwardRef(() => DiscountsService))
    private discountsService: DiscountsService,
  ) {}

  // ==================== CUSTOM PRODUCTS ====================

  async createCustomProduct(
    userId: string,
    createDto: CreateCustomProductDto,
  ): Promise<UserCustomProductDocument> {
    const customProduct = new this.customProductModel({
      ...createDto,
      userId,
      status: 'draft',
    });

    return customProduct.save();
  }

  async getUserCustomProducts(
    userId: string,
    status?: string,
  ): Promise<UserCustomProductDocument[]> {
    const filter: any = { userId };
    if (status) {
      filter.status = status;
    }

    return this.customProductModel
      .find(filter)
      .sort({ createdAt: -1 })
      .exec();
  }

  async getCustomProduct(
    userId: string,
    productId: string,
  ): Promise<UserCustomProductDocument> {
    const product = await this.customProductModel.findById(productId).exec();

    if (!product) {
      throw new NotFoundException('Custom product not found');
    }

    if (product.userId !== userId) {
      throw new ForbiddenException('Access denied to this product');
    }

    return product;
  }

  async updateCustomProduct(
    userId: string,
    productId: string,
    updateDto: UpdateCustomProductDto,
  ): Promise<UserCustomProductDocument> {
    const product = await this.getCustomProduct(userId, productId);

    Object.assign(product, updateDto);
    return product.save();
  }

  async deleteCustomProduct(userId: string, productId: string): Promise<void> {
    const product = await this.getCustomProduct(userId, productId);
    await product.deleteOne();
  }

  // ==================== USER ORDERS ====================

  async createUserOrder(
    userId: string,
    createDto: CreateUserOrderDto,
  ): Promise<UserOrderDocument> {
    // Verify payment intent succeeded before creating order
    const paymentConfirmed = await this.paymentsService.confirmPayment(
      createDto.paymentIntentId,
    );

    if (!paymentConfirmed) {
      throw new BadRequestException(
        'Payment has not been confirmed. Please complete payment before creating order.',
      );
    }

    // Calculate totals
    const subtotal = createDto.items.reduce(
      (sum, item) => sum + parseFloat(item.price) * item.quantity,
      0,
    );
    const discountAmount = createDto.discountAmount || 0;
    const total = subtotal - discountAmount + createDto.shippingCost + createDto.taxAmount;

    // Create order in database with payment info
    const userOrder = new this.userOrderModel({
      userId,
      recipient: createDto.recipient,
      items: createDto.items,
      shippingMethod: createDto.shippingMethod,
      shippingCost: createDto.shippingCost,
      taxAmount: createDto.taxAmount,
      discountCode: createDto.discountCode,
      discountAmount: discountAmount,
      subtotal,
      total,
      status: 'pending',
      paymentIntentId: createDto.paymentIntentId,
      paymentStatus: 'paid',
      paidAt: new Date(),
      isTest: createDto.isTest || false,
    });

    // Increment discount usage if a discount was applied
    if (createDto.discountCode) {
      this.discountsService.incrementUsage(createDto.discountCode).catch((error) => {
        console.error('Failed to increment discount usage:', error);
        // Don't fail the order if this fails
      });
    }

    const savedOrder = await userOrder.save();

    // Send order confirmation email asynchronously
    this.sendOrderConfirmationEmail(savedOrder).catch((error) => {
      console.error('Failed to send order confirmation email:', error);
      // Don't fail the order if email fails
    });

    // Submit order to Printful asynchronously
    this.submitToPrintful(savedOrder, createDto.productConfig).catch(async (error) => {
      console.error('Failed to submit order to Printful:', error);
      // Update order status to failed
      await this.userOrderModel.findByIdAndUpdate(savedOrder._id, { status: 'failed' }).exec();
      
      // Initiate refund since Printful submission failed
      try {
        await this.paymentsService.refundPayment(createDto.paymentIntentId);
        await this.userOrderModel.findByIdAndUpdate(savedOrder._id, { 
          paymentStatus: 'refunded' 
        }).exec();
        console.log(`Refund initiated for order ${savedOrder._id}`);
      } catch (refundError) {
        console.error('Failed to refund payment:', refundError);
        // Log this for manual intervention
      }
    });

    return savedOrder;
  }

  private async submitToPrintful(
    order: UserOrderDocument,
    productConfig?: any[],
  ): Promise<void> {
    try {
      // Prepare Printful order data
      const printfulOrder: any = {
        recipient: order.recipient,
        items: order.items.map((item, index) => ({
          variant_id: item.variantId,
          quantity: item.quantity,
          retail_price: item.price,
          files: productConfig?.[index]?.customDesign
            ? [
                {
                  url: productConfig[index].customDesign.fileDataUrl,
                },
              ]
            : undefined,
        })),
      };

      // Add shipping method if provided (this ensures Printful uses the correct shipping method)
      if (order.shippingMethod) {
        printfulOrder.shipping = order.shippingMethod;
      }

      // Add retail costs (what customer paid) for tracking and verification
      if (order.shippingCost !== undefined || order.taxAmount !== undefined) {
        printfulOrder.retail_costs = {
          shipping: order.shippingCost ? order.shippingCost.toFixed(2) : undefined,
          tax: order.taxAmount ? order.taxAmount.toFixed(2) : undefined,
        };
      }

      // Create order via Printful service
      const response = await this.printfulService.createOrder(printfulOrder);

      // Update order with Printful details
      await this.userOrderModel.findByIdAndUpdate(order._id, {
        status: 'processing',
        printfulOrderId: response.id,
        printfulResponse: response,
      }).exec();
    } catch (error) {
      console.error('Error submitting to Printful:', error);
      throw error;
    }
  }

  private async sendOrderConfirmationEmail(order: UserOrderDocument): Promise<void> {
    try {
      const currencySymbol = '$'; // TODO: Get from order currency when multi-currency is implemented
      
      await this.emailService.sendOrderConfirmation({
        orderNumber: order._id.toString(),
        customerName: order.recipient.name,
        customerEmail: order.recipient.email,
        items: order.items.map((item) => ({
          name: item.productType,
          quantity: item.quantity,
          price: `${currencySymbol}${parseFloat(item.price).toFixed(2)}`,
        })),
        subtotal: `${currencySymbol}${order.subtotal.toFixed(2)}`,
        shippingCost: `${currencySymbol}${order.shippingCost.toFixed(2)}`,
        taxAmount: `${currencySymbol}${order.taxAmount.toFixed(2)}`,
        total: `${currencySymbol}${order.total.toFixed(2)}`,
        shippingAddress: {
          name: order.recipient.name,
          address1: order.recipient.address1,
          address2: order.recipient.address2,
          city: order.recipient.city,
          stateCode: order.recipient.state_code,
          zip: order.recipient.zip,
          countryCode: order.recipient.country_code,
        },
      });
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
      throw error;
    }
  }

  async getUserOrders(userId: string): Promise<UserOrderDocument[]> {
    return this.userOrderModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getUserOrder(
    userId: string,
    orderId: string,
  ): Promise<UserOrderDocument> {
    const order = await this.userOrderModel.findById(orderId).exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('Access denied to this order');
    }

    return order;
  }

  // ==================== CANCEL ORDER ====================

  async cancelOrder(
    userId: string,
    orderId: string,
    cancelDto: CancelOrderDto,
  ): Promise<CancelOrderResponseDto> {
    const order = await this.getUserOrder(userId, orderId);

    // Check if order can be cancelled
    const cancellableStatuses = ['pending', 'processing'];
    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestException(
        `Cannot cancel order with status "${order.status}". Orders can only be cancelled when pending or processing.`
      );
    }

    // If order is already in Printful, try to cancel there first
    if (order.printfulOrderId) {
      try {
        await this.printfulService.cancelOrder(order.printfulOrderId);
        this.logger.log(`Cancelled Printful order ${order.printfulOrderId}`);
      } catch (error) {
        this.logger.error(`Failed to cancel Printful order: ${error.message}`);
        // If Printful order is already in production, we can't cancel
        if (error.message?.includes('cannot be canceled') || error.message?.includes('in production')) {
          throw new BadRequestException(
            'This order is already in production and cannot be cancelled. Please contact support for assistance.'
          );
        }
      }
    }

    // Process refund
    let refundId: string | undefined;
    let refundAmount: number | undefined;

    if (order.paymentStatus === 'paid' && order.paymentIntentId) {
      try {
        const refund = await this.paymentsService.refundPayment(order.paymentIntentId);
        refundId = refund.id;
        refundAmount = order.total;

        order.paymentStatus = 'refunded';
        order.refundInfo = {
          refundId: refund.id,
          amount: order.total,
          reason: cancelDto.reason || 'Customer requested cancellation',
          timestamp: new Date(),
          status: 'completed',
        };

        this.logger.log(`Refund processed for order ${orderId}: ${refundId}`);
      } catch (error) {
        this.logger.error(`Failed to process refund: ${error.message}`);
        // Continue with cancellation even if refund fails - admin can handle manually
      }
    }

    // Update order status
    order.status = 'cancelled';

    if (!order.statusHistory) {
      order.statusHistory = [];
    }

    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: cancelDto.reason || 'Cancelled by customer',
      updatedBy: 'customer',
    });

    await order.save();

    // Send cancellation email
    this.emailService.sendOrderCancelledEmail({
      orderNumber: orderId,
      customerEmail: order.recipient.email,
      customerName: order.recipient.name,
      reason: cancelDto.reason,
      refundAmount,
    }).catch((error) => {
      this.logger.error(`Failed to send cancellation email: ${error.message}`);
    });

    return {
      success: true,
      message: refundAmount 
        ? `Order cancelled successfully. A refund of $${refundAmount.toFixed(2)} has been initiated.`
        : 'Order cancelled successfully.',
      refundId,
      refundAmount,
    };
  }

  // ==================== REPORT PROBLEM ====================

  async reportProblem(
    userId: string,
    orderId: string,
    reportDto: ReportProblemDto,
  ): Promise<ReportProblemResponseDto> {
    const order = await this.getUserOrder(userId, orderId);

    // Check if order is in a state where problems can be reported
    const reportableStatuses = ['shipped', 'delivered'];
    if (!reportableStatuses.includes(order.status)) {
      throw new BadRequestException(
        `Cannot report a problem for an order with status "${order.status}". Problems can only be reported for shipped or delivered orders.`
      );
    }

    // Check if there's already an open problem for this order
    const existingProblem = await this.orderProblemModel.findOne({
      orderId,
      userId,
      status: { $in: ['open', 'in_review'] },
    }).exec();

    if (existingProblem) {
      throw new BadRequestException(
        'You already have an open problem report for this order. Please wait for it to be resolved before submitting a new one.'
      );
    }

    // Create problem report
    const problem = new this.orderProblemModel({
      orderId,
      userId,
      problemType: reportDto.problemType,
      description: reportDto.description,
      imageUrls: reportDto.imageUrls || [],
      status: 'open',
    });

    const savedProblem = await problem.save();

    // Send confirmation email
    this.emailService.sendProblemReportConfirmation({
      orderNumber: orderId,
      customerEmail: order.recipient.email,
      customerName: order.recipient.name,
      problemType: reportDto.problemType,
      problemId: savedProblem._id.toString(),
    }).catch((error) => {
      this.logger.error(`Failed to send problem report confirmation email: ${error.message}`);
    });

    this.logger.log(`Problem reported for order ${orderId}: ${savedProblem._id}`);

    return {
      success: true,
      problemId: savedProblem._id.toString(),
      message: 'Your problem report has been submitted. Our team will review it and get back to you within 1-2 business days.',
    };
  }

  async getUserProblems(userId: string): Promise<OrderProblemDocument[]> {
    return this.orderProblemModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getOrderProblems(userId: string, orderId: string): Promise<OrderProblemDocument[]> {
    // Verify user owns the order
    await this.getUserOrder(userId, orderId);

    return this.orderProblemModel
      .find({ orderId, userId })
      .sort({ createdAt: -1 })
      .exec();
  }
}

