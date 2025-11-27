import { IsString, IsNumber, IsBoolean, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StoreProductVariantDto {
  @ApiProperty({ description: 'Printful variant ID' })
  @IsNumber()
  variantId: number;

  @ApiProperty({ description: 'Custom price for this variant' })
  @IsNumber()
  price: number;

  @ApiProperty({ description: 'Whether this variant is enabled', default: true })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

export class CreateStoreProductDto {
  @ApiProperty({ description: 'Product ID from Printful catalog' })
  @IsNumber()
  printfulProductId: number;

  @ApiProperty({ description: 'Product variants with pricing', type: [StoreProductVariantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StoreProductVariantDto)
  variants: StoreProductVariantDto[];

  @ApiPropertyOptional({ description: 'Custom image URLs' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  customImages?: string[];

  @ApiProperty({ description: 'Visibility on store', default: true })
  @IsBoolean()
  @IsOptional()
  visibility?: boolean;

  @ApiProperty({ description: 'Sort order', default: 0 })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @ApiProperty({ description: 'Featured product', default: false })
  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @ApiPropertyOptional({ description: 'Product categories' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categories?: string[];

  @ApiPropertyOptional({ description: 'Per-category sort orders', example: { 'apparel': 0, 'home-living': 5 } })
  @IsOptional()
  categoryOrder?: Record<string, number>;

  @ApiPropertyOptional({ 
    description: 'Translations for title and description',
    example: {
      title: { 'en-US': 'T-Shirt', 'ja': 'Tシャツ', 'zh-HK': 'T恤', 'zh-TW': 'T恤' },
      description: { 'en-US': 'Comfortable cotton t-shirt', 'ja': '快適なコットンTシャツ' }
    }
  })
  @IsOptional()
  translations?: {
    title?: { [locale: string]: string };
    description?: { [locale: string]: string };
  };
}

export class UpdateStoreProductDto {
  @ApiPropertyOptional({ description: 'Product variants with pricing', type: [StoreProductVariantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StoreProductVariantDto)
  @IsOptional()
  variants?: StoreProductVariantDto[];

  @ApiPropertyOptional({ description: 'Custom image URLs' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  customImages?: string[];

  @ApiPropertyOptional({ description: 'Visibility on store' })
  @IsBoolean()
  @IsOptional()
  visibility?: boolean;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Featured product' })
  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @ApiPropertyOptional({ description: 'Product categories' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categories?: string[];

  @ApiPropertyOptional({ description: 'Per-category sort orders', example: { 'apparel': 0, 'home-living': 5 } })
  @IsOptional()
  categoryOrder?: Record<string, number>;

  @ApiPropertyOptional({ description: 'Product title' })
  @IsString()
  @IsOptional()
  productTitle?: string;

  @ApiPropertyOptional({ description: 'Product description' })
  @IsString()
  @IsOptional()
  productDescription?: string;

  @ApiPropertyOptional({ 
    description: 'Translations for title and description',
    example: {
      title: { 'en-US': 'T-Shirt', 'ja': 'Tシャツ', 'zh-HK': 'T恤', 'zh-TW': 'T恤' },
      description: { 'en-US': 'Comfortable cotton t-shirt', 'ja': '快適なコットンTシャツ' }
    }
  })
  @IsOptional()
  translations?: {
    title?: { [locale: string]: string };
    description?: { [locale: string]: string };
  };
}

export class CachedDataDto {
  @ApiProperty()
  productTitle: string;

  @ApiProperty()
  productDescription: string;

  @ApiProperty()
  productType: string;

  @ApiProperty()
  brand: string;

  @ApiProperty()
  images: string[];

  @ApiPropertyOptional()
  variantDetails?: any[];
}

export class StoreProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  printfulProductId: number;

  @ApiProperty({ type: [StoreProductVariantDto] })
  variants: StoreProductVariantDto[];

  @ApiProperty({ type: CachedDataDto })
  cachedData: CachedDataDto;

  @ApiPropertyOptional()
  lastSyncedAt?: Date;

  @ApiProperty()
  customImages: string[];

  @ApiProperty()
  visibility: boolean;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  featured: boolean;

  @ApiProperty()
  categories: string[];

  @ApiProperty({ description: 'Per-category sort orders' })
  categoryOrder: Record<string, number>;

  @ApiProperty()
  imagesCount: number;

  @ApiPropertyOptional({ 
    description: 'Translations for title and description',
    example: {
      title: { 'en-US': 'T-Shirt', 'ja': 'Tシャツ', 'zh-HK': 'T恤', 'zh-TW': 'T恤' },
      description: { 'en-US': 'Comfortable cotton t-shirt', 'ja': '快適なコットンTシャツ' }
    }
  })
  translations?: {
    title?: { [locale: string]: string };
    description?: { [locale: string]: string };
  };

  @ApiPropertyOptional({ 
    description: 'Cached shipping rates by country code',
    example: {
      'US': { rate: 4.99, currency: 'USD', lastUpdated: '2024-01-01T00:00:00.000Z' },
      'GB': { rate: 6.50, currency: 'USD', lastUpdated: '2024-01-01T00:00:00.000Z' }
    }
  })
  cachedShippingRates?: {
    [countryCode: string]: {
      rate: number;
      currency: string;
      lastUpdated: Date;
      delivery_estimate?: string;
    };
  };

  @ApiPropertyOptional({ description: 'Last time shipping rates were synced' })
  shippingRatesLastSynced?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class StorefrontProductDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  printfulProductId: number;

  @ApiProperty({ description: 'Product title from Printful' })
  title: string;

  @ApiProperty({ description: 'Product description from Printful' })
  description: string;

  @ApiProperty({ description: 'Product type' })
  productType: string;

  @ApiProperty({ description: 'Brand name' })
  brand: string;

  @ApiProperty({ description: 'Product images from Printful' })
  images: string[];

  @ApiProperty({ description: 'Custom uploaded images' })
  customImages: string[];

  @ApiProperty({ description: 'Enabled variants with pricing', type: [StoreProductVariantDto] })
  variants: StoreProductVariantDto[];

  @ApiProperty({ description: 'Full variant details from Printful' })
  variantDetails: any[];

  @ApiProperty({ description: 'Product categories' })
  categories: string[];

  @ApiProperty({ description: 'Featured product' })
  featured: boolean;

  @ApiProperty({ description: 'Sort order' })
  sortOrder: number;

  @ApiProperty({ description: 'Per-category sort orders' })
  categoryOrder: Record<string, number>;

  @ApiPropertyOptional({ 
    description: 'Translations for title and description',
    example: {
      title: { 'en-US': 'T-Shirt', 'ja': 'Tシャツ', 'zh-HK': 'T恤', 'zh-TW': 'T恤' },
      description: { 'en-US': 'Comfortable cotton t-shirt', 'ja': '快適なコットンTシャツ' }
    }
  })
  translations?: {
    title?: { [locale: string]: string };
    description?: { [locale: string]: string };
  };
}

export class ReorderProductsDto {
  @ApiProperty({ description: 'Array of product IDs in new order' })
  @IsArray()
  @IsString({ each: true })
  productIds: string[];
}

export class ReorderProductsInCategoryDto {
  @ApiProperty({ description: 'Category name (slug)' })
  @IsString()
  category: string;

  @ApiProperty({ description: 'Array of product IDs in new order' })
  @IsArray()
  @IsString({ each: true })
  productIds: string[];
}


