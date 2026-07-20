import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserOrderDocument = UserOrder & Document;

export interface OrderRecipient {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state_code?: string;
  country_code: string;
  zip: string;
  email: string;
  phone?: string;
}

export interface OrderItem {
  customProductId?: string; // Reference to UserCustomProduct
  variantId: number;
  quantity: number;
  productType: string;
  price: string;
  design?: any;
}

export interface StatusHistoryEntry {
  status: string;
  timestamp: Date;
  note?: string;
  updatedBy?: string; // 'system', 'admin', 'printful'
}

export interface RefundInfo {
  refundId: string;
  amount: number;
  reason: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
}

@Schema({ timestamps: true })
export class UserOrder {
  @Prop({ required: true, index: true })
  userId: string; // Supabase user ID

  @Prop({ type: Object, required: true })
  recipient: OrderRecipient;

  @Prop({ type: Array, required: true })
  items: OrderItem[];

  @Prop()
  shippingMethod: string;

  @Prop({ default: 0 })
  shippingCost: number;

  @Prop({ default: 0 })
  taxAmount: number;

  @Prop({ default: 0 })
  subtotal: number;

  @Prop({ default: 0 })
  total: number;

  // Discount fields
  @Prop()
  discountCode?: string;

  @Prop({ default: 0 })
  discountAmount: number;

  @Prop({ default: 'pending' })
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'failed';

  // Payment fields
  @Prop({ required: true })
  paymentIntentId: string; // Stripe payment intent ID

  @Prop({ default: 'unpaid' })
  paymentStatus: 'unpaid' | 'paid' | 'failed' | 'refunded';

  @Prop()
  paidAt: Date;

  @Prop()
  printfulOrderId: number; // Printful order ID if created

  @Prop({ type: Object })
  printfulResponse: any; // Full Printful response

  @Prop()
  trackingNumber: string;

  @Prop()
  trackingUrl: string;

  @Prop()
  carrier: string; // Shipping carrier (USPS, UPS, FedEx, etc.)

  @Prop()
  estimatedDelivery: Date;

  @Prop({ type: Array, default: [] })
  statusHistory: StatusHistoryEntry[];

  @Prop()
  printfulStatus: string; // Raw status from Printful

  @Prop({ type: Object })
  refundInfo?: RefundInfo;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ default: false })
  isTest: boolean; // Flag for test orders
}

export const UserOrderSchema = SchemaFactory.createForClass(UserOrder);

// Create indexes for efficient queries
UserOrderSchema.index({ userId: 1, createdAt: -1 });
UserOrderSchema.index({ userId: 1, status: 1 });
UserOrderSchema.index({ printfulOrderId: 1 });
UserOrderSchema.index({ paymentIntentId: 1 });
UserOrderSchema.index({ status: 1, createdAt: -1 }); // For admin order listing
UserOrderSchema.index({ 'recipient.email': 1 }); // For customer email search

