import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SiteTagDocument = SiteTag & Document;
export type ProductCategoryDocument = ProductCategory & Document;

@Schema({ timestamps: true })
export class SiteTag {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  displayName: string;

  @Prop()
  description?: string;

  @Prop({ default: '#8B5CF6' }) // Default purple color
  color: string;

  @Prop({ default: '🏷️' })
  icon: string;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: true })
  active: boolean;

  // Localization support for displayName and description
  @Prop({ type: Object })
  translations?: {
    displayName?: { [locale: string]: string };
    description?: { [locale: string]: string };
  };
}

@Schema({ timestamps: true })
export class ProductCategory {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  displayName: string;

  @Prop()
  description?: string;

  @Prop({ default: '#3B82F6' }) // Default blue color
  color: string;

  @Prop({ default: '📦' })
  icon: string;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: true })
  active: boolean;

  // Localization support for displayName and description
  @Prop({ type: Object })
  translations?: {
    displayName?: { [locale: string]: string };
    description?: { [locale: string]: string };
  };
}

export const SiteTagSchema = SchemaFactory.createForClass(SiteTag);
export const ProductCategorySchema = SchemaFactory.createForClass(ProductCategory);

// Create indexes for efficient queries
SiteTagSchema.index({ name: 1 });
SiteTagSchema.index({ active: 1, sortOrder: 1 });

ProductCategorySchema.index({ name: 1 });
ProductCategorySchema.index({ active: 1, sortOrder: 1 });

