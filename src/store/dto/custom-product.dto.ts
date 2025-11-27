import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Simplified DTO for users to customize a product
 * This combines image upload, product type selection, and variant selection
 */
export class CustomizeProductDto {
  @ApiProperty({
    description: 'User ID',
    example: 'user123',
  })
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({
    description: 'Base64 encoded image or image URL',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
  })
  @IsString()
  @IsNotEmpty()
  image: string;

  @ApiProperty({
    description: 'Image filename',
    example: 'my-design.png',
  })
  @IsString()
  @IsNotEmpty()
  image_filename: string;

  @ApiProperty({
    description: 'Product type/category',
    example: 'tshirt',
    enum: [
      'tshirt',
      'hoodie',
      'sweatshirt',
      'mug',
      'poster',
      'canvas',
      'phone-case',
      'tote-bag',
      'sticker',
      'pillow',
      'blanket',
    ],
  })
  @IsString()
  @IsNotEmpty()
  product_type: string;

  @ApiPropertyOptional({
    description: 'Product title',
    example: 'My Custom T-Shirt',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'A beautiful custom design',
  })
  @IsString()
  @IsOptional()
  description?: string;
}

/**
 * Response with product mockup/preview
 */
export class ProductMockupDto {
  @ApiProperty({ description: 'Temporary product ID for this customization' })
  customization_id: string;

  @ApiProperty({ description: 'Uploaded image ID' })
  image_id: string;

  @ApiProperty({ description: 'Image preview URL' })
  image_preview_url: string;

  @ApiProperty({ description: 'Product type' })
  product_type: string;

  @ApiProperty({ description: 'Blueprint ID' })
  blueprint_id: number;

  @ApiProperty({ description: 'Print provider ID' })
  print_provider_id: number;

  @ApiProperty({ description: 'Product title' })
  title: string;

  @ApiProperty({ description: 'Product description' })
  description: string;

  @ApiProperty({
    description: 'Available variants with pricing',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        variant_id: { type: 'number' },
        title: { type: 'string' },
        size: { type: 'string' },
        color: { type: 'string' },
        price: { type: 'number', description: 'Price in cents' },
        mockup_url: { type: 'string', description: 'Preview image URL' },
      },
    },
  })
  variants: Array<{
    variant_id: number;
    title: string;
    size?: string;
    color?: string;
    price: number;
    mockup_url?: string;
  }>;

  @ApiProperty({ description: 'Print areas configuration' })
  print_areas: Array<{
    position: string;
    variant_ids: number[];
  }>;
}

/**
 * DTO for confirming product customization and creating order
 */
export class ConfirmCustomizationDto {
  @ApiProperty({ description: 'Customization ID from preview' })
  @IsString()
  @IsNotEmpty()
  customization_id: string;

  @ApiProperty({
    description: 'Selected variants with quantities',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        variant_id: { type: 'number' },
        quantity: { type: 'number' },
      },
    },
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantSelectionDto)
  variants: VariantSelectionDto[];
}

export class VariantSelectionDto {
  @ApiProperty({ description: 'Variant ID' })
  @IsNumber()
  variant_id: number;

  @ApiProperty({ description: 'Quantity to order' })
  @IsNumber()
  quantity: number;
}

/**
 * DTO for calculating order total before checkout
 */
export class CalculateOrderDto {
  @ApiProperty({ description: 'Customization ID' })
  @IsString()
  @IsNotEmpty()
  customization_id: string;

  @ApiProperty({
    description: 'Selected variants with quantities',
    type: [VariantSelectionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantSelectionDto)
  variants: VariantSelectionDto[];

  @ApiProperty({
    description: 'Shipping country code',
    example: 'US',
  })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiPropertyOptional({
    description: 'Shipping region/state',
    example: 'CA',
  })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({
    description: 'ZIP/Postal code',
    example: '90210',
  })
  @IsString()
  @IsOptional()
  zip?: string;
}

/**
 * Response with order pricing breakdown
 */
export class OrderCalculationDto {
  @ApiProperty({ description: 'Subtotal in cents' })
  subtotal: number;

  @ApiProperty({ description: 'Shipping cost in cents' })
  shipping: number;

  @ApiProperty({ description: 'Tax in cents' })
  tax: number;

  @ApiProperty({ description: 'Total in cents' })
  total: number;

  @ApiProperty({
    description: 'Line items breakdown',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        variant_id: { type: 'number' },
        variant_title: { type: 'string' },
        quantity: { type: 'number' },
        unit_price: { type: 'number' },
        total_price: { type: 'number' },
      },
    },
  })
  line_items: Array<{
    variant_id: number;
    variant_title: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;

  @ApiProperty({ description: 'Currency code' })
  currency: string;
}

/**
 * Complete order DTO with shipping and payment info
 */
export class CompleteOrderDto {
  @ApiProperty({ description: 'Customization ID' })
  @IsString()
  @IsNotEmpty()
  customization_id: string;

  @ApiProperty({
    description: 'Selected variants with quantities',
    type: [VariantSelectionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantSelectionDto)
  variants: VariantSelectionDto[];

  @ApiProperty({ description: 'Shipping first name' })
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({ description: 'Shipping last name' })
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiProperty({ description: 'Email address' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: 'Address line 1' })
  @IsString()
  @IsNotEmpty()
  address1: string;

  @ApiPropertyOptional({ description: 'Address line 2' })
  @IsString()
  @IsOptional()
  address2?: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiPropertyOptional({ description: 'Region/State' })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiProperty({ description: 'Country code (e.g., US, GB)' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ description: 'ZIP/Postal code' })
  @IsString()
  @IsNotEmpty()
  zip: string;

  @ApiPropertyOptional({
    description: 'Payment method ID (from your payment processor)',
  })
  @IsString()
  @IsOptional()
  payment_method_id?: string;

  @ApiPropertyOptional({
    description: 'Payment intent ID (from Stripe, etc.)',
  })
  @IsString()
  @IsOptional()
  payment_intent_id?: string;
}

/**
 * Complete order response
 */
export class CompleteOrderResponseDto {
  @ApiProperty({ description: 'Order ID' })
  order_id: string;

  @ApiProperty({ description: 'Product ID' })
  product_id: string;

  @ApiProperty({ description: 'Order status' })
  status: string;

  @ApiProperty({ description: 'Total amount in cents' })
  total_amount: number;

  @ApiProperty({ description: 'Currency' })
  currency: string;

  @ApiProperty({ description: 'Tracking URL (if available)' })
  tracking_url?: string;

  @ApiProperty({ description: 'Estimated delivery date' })
  estimated_delivery?: string;

  @ApiProperty({ description: 'Created at timestamp' })
  created_at: string;
}

