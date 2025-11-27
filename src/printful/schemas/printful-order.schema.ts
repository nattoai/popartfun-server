import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PrintfulOrderDocument = PrintfulOrder & Document;

@Schema({ timestamps: true })
export class PrintfulOrder {
  @Prop()
  printfulOrderId?: number;

  @Prop({ required: true })
  shopifyOrderId: string;

  @Prop({ required: true })
  shopifyOrderNumber: string;

  @Prop({ required: true })
  customerEmail: string;

  @Prop({ required: true })
  customerName: string;

  @Prop({ type: Array, required: true })
  items: Array<{
    syncVariantId: number;
    quantity: number;
    name: string;
    price: number;
  }>;

  @Prop({ required: true })
  totalAmount: number;

  @Prop({
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @Prop()
  trackingNumber?: string;

  @Prop()
  trackingUrl?: string;

  @Prop({ type: Object })
  costs?: {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
  };

  @Prop()
  shippedAt?: Date;

  @Prop({ type: Object })
  shippingAddress?: Record<string, any>;
}

export const PrintfulOrderSchema = SchemaFactory.createForClass(PrintfulOrder);

// Create indexes for efficient queries
PrintfulOrderSchema.index({ printfulOrderId: 1 });
PrintfulOrderSchema.index({ shopifyOrderId: 1 });
PrintfulOrderSchema.index({ shopifyOrderNumber: 1 });
PrintfulOrderSchema.index({ customerEmail: 1 });
PrintfulOrderSchema.index({ status: 1 });
PrintfulOrderSchema.index({ createdAt: -1 });

