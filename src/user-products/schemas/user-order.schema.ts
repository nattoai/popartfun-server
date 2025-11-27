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
  estimatedDelivery: Date;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const UserOrderSchema = SchemaFactory.createForClass(UserOrder);

// Create indexes for efficient queries
UserOrderSchema.index({ userId: 1, createdAt: -1 });
UserOrderSchema.index({ userId: 1, status: 1 });
UserOrderSchema.index({ printfulOrderId: 1 });
UserOrderSchema.index({ paymentIntentId: 1 });

