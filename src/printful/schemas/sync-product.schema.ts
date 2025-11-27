import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PrintfulSyncProductDocument = PrintfulSyncProduct & Document;

@Schema({ timestamps: true })
export class PrintfulSyncProduct {
  @Prop({ required: true })
  printfulSyncProductId: number;

  @Prop({ type: [Number], default: [] })
  printfulSyncVariantIds: number[];

  @Prop({ required: true })
  printfulFileId: number;

  @Prop({ required: false, default: '' })
  customerDesignUrl: string;

  @Prop({ required: true })
  productType: string; // e.g., 't-shirt', 'mug', 'poster'

  @Prop({ required: true })
  productName: string;

  @Prop({ type: [String], default: [] })
  mockupUrls: string[];

  @Prop()
  shopifyProductId?: string;

  @Prop({ type: Object })
  shopifyVariantIds?: Record<string, string>; // Map Printful variant ID to Shopify variant ID

  @Prop({
    type: String,
    enum: ['pending', 'created', 'synced', 'error'],
    default: 'pending',
  })
  syncStatus: string;

  @Prop()
  errorMessage?: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop()
  customerId?: string; // Track which customer created this
}

export const PrintfulSyncProductSchema =
  SchemaFactory.createForClass(PrintfulSyncProduct);

// Create indexes for efficient queries
PrintfulSyncProductSchema.index({ printfulSyncProductId: 1 });
PrintfulSyncProductSchema.index({ shopifyProductId: 1 });
PrintfulSyncProductSchema.index({ syncStatus: 1 });
PrintfulSyncProductSchema.index({ customerId: 1 });
PrintfulSyncProductSchema.index({ createdAt: -1 });

