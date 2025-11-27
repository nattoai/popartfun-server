import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsOptional,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PrintAreaDto {
  @ApiProperty({ description: 'Variant IDs this print area applies to' })
  @IsArray()
  variant_ids: number[];

  @ApiProperty({
    description: 'Position name (e.g., "front", "back", "default")',
  })
  @IsString()
  position: string;

  @ApiProperty({ description: 'Image ID to print' })
  @IsString()
  image_id: string;

  @ApiPropertyOptional({ description: 'Image X position (0-1, default 0.5)' })
  @IsNumber()
  @IsOptional()
  x?: number;

  @ApiPropertyOptional({ description: 'Image Y position (0-1, default 0.5)' })
  @IsNumber()
  @IsOptional()
  y?: number;

  @ApiPropertyOptional({ description: 'Image scale (default 1)' })
  @IsNumber()
  @IsOptional()
  scale?: number;

  @ApiPropertyOptional({ description: 'Image rotation angle (default 0)' })
  @IsNumber()
  @IsOptional()
  angle?: number;
}

export class CreateProductDto {
  @ApiProperty({ description: 'Product title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Product description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Blueprint ID (product type, e.g., t-shirt)' })
  @IsNumber()
  @IsNotEmpty()
  blueprint_id: number;

  @ApiProperty({ description: 'Print provider ID' })
  @IsNumber()
  @IsNotEmpty()
  print_provider_id: number;

  @ApiProperty({ description: 'Array of variant IDs to enable' })
  @IsArray()
  @IsNotEmpty()
  variants: number[];

  @ApiProperty({
    description: 'Print areas configuration',
    type: [PrintAreaDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrintAreaDto)
  print_areas: PrintAreaDto[];

  @ApiPropertyOptional({ description: 'User ID who created the product' })
  @IsString()
  @IsOptional()
  user_id?: string;
}

export class ProductVariantDto {
  @ApiProperty({ description: 'Variant ID' })
  id: number;

  @ApiProperty({ description: 'SKU' })
  sku: string;

  @ApiProperty({ description: 'Cost in cents' })
  cost: number;

  @ApiProperty({ description: 'Price in cents' })
  price: number;

  @ApiProperty({ description: 'Title/name of variant' })
  title: string;

  @ApiProperty({ description: 'Variant options (size, color, etc.)' })
  options: Record<string, string>;

  @ApiProperty({ description: 'Is this variant enabled' })
  is_enabled: boolean;

  @ApiPropertyOptional({ description: 'Is this variant available' })
  is_available?: boolean;
}

export class ProductResponseDto {
  @ApiProperty({ description: 'Product ID' })
  id: string;

  @ApiProperty({ description: 'Product title' })
  title: string;

  @ApiProperty({ description: 'Product description' })
  description: string;

  @ApiProperty({ description: 'Product tags' })
  tags: string[];

  @ApiProperty({ description: 'Product variants', type: [ProductVariantDto] })
  variants: ProductVariantDto[];

  @ApiProperty({ description: 'Product images URLs' })
  images: string[];

  @ApiProperty({ description: 'Creation timestamp' })
  created_at: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updated_at: string;

  @ApiProperty({ description: 'Is product visible' })
  visible: boolean;

  @ApiProperty({ description: 'Blueprint ID' })
  blueprint_id: number;

  @ApiProperty({ description: 'Print provider ID' })
  print_provider_id: number;
}
