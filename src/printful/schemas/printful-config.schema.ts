import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PrintfulConfigDocument = PrintfulConfig & Document;

@Schema({ timestamps: true })
export class PrintfulConfig {
  @Prop({ required: true })
  apiKey: string; // Encrypted in production

  @Prop()
  storeId?: string;

  @Prop()
  webhookUrl?: string;

  @Prop({ default: true })
  autoFulfill: boolean;

  @Prop({ default: true })
  active: boolean;
}

export const PrintfulConfigSchema = SchemaFactory.createForClass(PrintfulConfig);

// Create index for efficient queries
PrintfulConfigSchema.index({ active: 1 });

