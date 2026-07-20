import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DiscountDocument = Discount & Document;

export type DiscountType = 'percentage' | 'fixed';

@Schema({ timestamps: true })
export class Discount {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string; // e.g., "WELCOME10"

  @Prop({ required: true, enum: ['percentage', 'fixed'] })
  type: DiscountType;

  @Prop({ required: true })
  value: number; // 10 for 10% or $10

  @Prop()
  description?: string;

  @Prop({ default: 0 })
  minOrderAmount: number; // Minimum order amount to apply discount

  @Prop()
  maxUses?: number; // Maximum total uses (null = unlimited)

  @Prop({ default: 0 })
  usedCount: number;

  @Prop()
  expiresAt?: Date;

  @Prop({ default: true })
  active: boolean;
}

export const DiscountSchema = SchemaFactory.createForClass(Discount);

// Create compound index for efficient queries
// Note: code index is already created by unique: true in @Prop decorator
DiscountSchema.index({ active: 1, expiresAt: 1 });
