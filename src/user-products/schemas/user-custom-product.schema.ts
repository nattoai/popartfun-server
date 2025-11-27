import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserCustomProductDocument = UserCustomProduct & Document;

export interface DesignData {
  fileDataUrl: string;
  scale: number;
  positionX: number;
  positionY: number;
  rotation: number;
  printfulFileId?: number;
}

@Schema({ timestamps: true })
export class UserCustomProduct {
  @Prop({ required: true, index: true })
  userId: string; // Supabase user ID

  @Prop({ required: true })
  productId: string; // Reference to StoreProduct

  @Prop({ required: true })
  variantId: number; // Printful variant ID

  @Prop()
  variantTitle: string;

  @Prop()
  productTitle: string;

  @Prop({ type: Object, required: true })
  designData: DesignData;

  @Prop()
  mockupUrl: string;

  @Prop({ type: [String], default: [] })
  mockupUrls: string[]; // Multiple mockup images

  @Prop({ default: 'draft' })
  status: 'draft' | 'completed' | 'archived';

  @Prop()
  name: string; // User-given name for the design

  @Prop()
  notes: string; // User notes

  @Prop({ default: 0 })
  price: number; // Captured price at time of creation
}

export const UserCustomProductSchema = SchemaFactory.createForClass(UserCustomProduct);

// Create indexes for efficient queries
UserCustomProductSchema.index({ userId: 1, createdAt: -1 });
UserCustomProductSchema.index({ userId: 1, status: 1 });

