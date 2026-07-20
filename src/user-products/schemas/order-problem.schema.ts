import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrderProblemDocument = OrderProblem & Document;

export type ProblemType = 
  | 'damaged'
  | 'wrong_item'
  | 'missing_item'
  | 'quality_issue'
  | 'shipping_issue'
  | 'not_received'
  | 'other';

export type ProblemStatus = 
  | 'open'
  | 'in_review'
  | 'resolved'
  | 'closed';

export type ProblemResolution = 
  | 'refund'
  | 'replacement'
  | 'partial_refund'
  | 'no_action'
  | 'other';

export interface ProblemResponse {
  message: string;
  respondedBy: string;
  timestamp: Date;
  isInternal?: boolean;
}

@Schema({ timestamps: true })
export class OrderProblem {
  @Prop({ required: true, index: true })
  orderId: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  problemType: ProblemType;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], default: [] })
  imageUrls: string[]; // URLs to uploaded images showing the problem

  @Prop({ default: 'open' })
  status: ProblemStatus;

  @Prop()
  resolution?: ProblemResolution;

  @Prop()
  resolutionNote?: string;

  @Prop()
  resolvedAt?: Date;

  @Prop()
  resolvedBy?: string;

  @Prop({ type: Array, default: [] })
  responses: ProblemResponse[];

  @Prop()
  refundId?: string; // If a refund was issued

  @Prop({ default: 0 })
  refundAmount?: number;
}

export const OrderProblemSchema = SchemaFactory.createForClass(OrderProblem);

// Create indexes for efficient queries
OrderProblemSchema.index({ orderId: 1 });
OrderProblemSchema.index({ userId: 1, createdAt: -1 });
OrderProblemSchema.index({ status: 1, createdAt: -1 });


