import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StoreProductDocument = StoreProduct & Document;

export interface StoreProductVariant {
  variantId: number;
  price: number;
  enabled: boolean;
}

export interface CachedData {
  productTitle: string;
  productDescription: string;
  productType: string;
  brand: string;
  images: string[];
  variantDetails?: any[]; // Full variant info from Printful
}

@Schema({ timestamps: true })
export class StoreProduct {
  @Prop({ required: true })
  printfulProductId: number;

  @Prop({ type: Array, required: true })
  variants: StoreProductVariant[];

  @Prop({ type: Object, required: true })
  cachedData: CachedData;

  @Prop()
  lastSyncedAt: Date;

  // Legacy fields - kept for backwards compatibility
  @Prop()
  title?: string;

  @Prop()
  description?: string;

  @Prop({ type: [String], default: [] })
  customImages: string[];

  @Prop({ default: true })
  visibility: boolean;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: false })
  featured: boolean;

  @Prop({ type: [String], default: [] })
  categories: string[];

  // Per-category sort orders: { 'apparel': 0, 'home-living': 5, 'all': 2 }
  @Prop({ type: Object, default: {} })
  categoryOrder: Record<string, number>;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  // Localization support for title and description
  @Prop({ type: Object })
  translations?: {
    title?: { [locale: string]: string };
    description?: { [locale: string]: string };
  };

  // Cached shipping estimates by country code
  @Prop({ type: Object })
  cachedShippingRates?: {
    [countryCode: string]: {
      rate: number;
      currency: string;
      lastUpdated: Date;
    };
  };

  // Last time shipping rates were updated
  @Prop()
  shippingRatesLastSynced?: Date;
}

export const StoreProductSchema = SchemaFactory.createForClass(StoreProduct);

// Create index for efficient queries
StoreProductSchema.index({ printfulProductId: 1 });
StoreProductSchema.index({ visibility: 1, sortOrder: 1 });
StoreProductSchema.index({ featured: 1 });


