import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
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
  CreateCustomProductDto,
  UpdateCustomProductDto,
  CreateUserOrderDto,
} from './dto';
import { PrintfulService } from '../printful/printful.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class UserProductsService {
  constructor(
    @InjectModel(UserCustomProduct.name)
    private customProductModel: Model<UserCustomProductDocument>,
    @InjectModel(UserOrder.name)
    private userOrderModel: Model<UserOrderDocument>,
    private printfulService: PrintfulService,
    private paymentsService: PaymentsService,
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
    const total = subtotal + createDto.shippingCost + createDto.taxAmount;

    // Create order in database with payment info
    const userOrder = new this.userOrderModel({
      userId,
      recipient: createDto.recipient,
      items: createDto.items,
      shippingMethod: createDto.shippingMethod,
      shippingCost: createDto.shippingCost,
      taxAmount: createDto.taxAmount,
      subtotal,
      total,
      status: 'pending',
      paymentIntentId: createDto.paymentIntentId,
      paymentStatus: 'paid',
      paidAt: new Date(),
    });

    const savedOrder = await userOrder.save();

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
}

