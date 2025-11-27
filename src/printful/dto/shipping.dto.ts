import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

// ==================== Shipping Rate Calculation ====================

/**
 * Item for shipping calculation
 */
export class ShippingItemDto {
  @ApiProperty({ description: 'Printful variant ID' })
  @IsNumber()
  @IsNotEmpty()
  variant_id: number;

  @ApiProperty({ description: 'Quantity of items' })
  @IsNumber()
  @Min(1)
  quantity: number;
}

/**
 * Recipient address for shipping calculation
 */
export class ShippingRecipientDto {
  @ApiProperty({ description: 'Country code (e.g., US, GB, JP)' })
  @IsString()
  @IsNotEmpty()
  country_code: string;

  @ApiPropertyOptional({ description: 'State/province code (required for US, CA, AU)' })
  @IsString()
  @IsOptional()
  state_code?: string;

  @ApiPropertyOptional({ description: 'City name' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'ZIP/postal code' })
  @IsString()
  @IsOptional()
  zip?: string;
}

/**
 * Request DTO for calculating shipping rates
 */
export class CalculateShippingRatesDto {
  @ApiProperty({ description: 'Recipient address', type: ShippingRecipientDto })
  @ValidateNested()
  @Type(() => ShippingRecipientDto)
  recipient: ShippingRecipientDto;

  @ApiProperty({ description: 'Items to ship', type: [ShippingItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShippingItemDto)
  items: ShippingItemDto[];

  @ApiPropertyOptional({ description: 'Currency code (default: USD)' })
  @IsString()
  @IsOptional()
  currency?: string;
}

/**
 * Simplified request for estimating shipping by country only
 */
export class EstimateShippingDto {
  @ApiProperty({ description: 'Country code (e.g., US, GB, JP)' })
  @IsString()
  @IsNotEmpty()
  country_code: string;

  @ApiPropertyOptional({ description: 'Sample variant ID for estimation (optional)' })
  @IsNumber()
  @IsOptional()
  variant_id?: number;
}

/**
 * Single shipping method/option
 */
export class ShippingMethodDto {
  @ApiProperty({ description: 'Shipping method ID' })
  id: string;

  @ApiProperty({ description: 'Shipping method name (e.g., "STANDARD", "EXPRESS")' })
  name: string;

  @ApiProperty({ description: 'Shipping rate in USD' })
  rate: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiPropertyOptional({ description: 'Minimum delivery days' })
  min_delivery_days?: number;

  @ApiPropertyOptional({ description: 'Maximum delivery days' })
  max_delivery_days?: number;

  @ApiPropertyOptional({ description: 'Estimated delivery time description' })
  delivery_estimate?: string;
}

/**
 * Response DTO for shipping rate calculation
 */
export class ShippingRatesResponseDto {
  @ApiProperty({ description: 'Available shipping methods', type: [ShippingMethodDto] })
  shipping_methods: ShippingMethodDto[];

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiPropertyOptional({ description: 'Whether rates are estimated (for country-only calculation)' })
  is_estimated?: boolean;
}

// ==================== Tax Calculation ====================

/**
 * Request DTO for calculating tax
 */
export class CalculateTaxDto {
  @ApiProperty({ description: 'Recipient address', type: ShippingRecipientDto })
  @ValidateNested()
  @Type(() => ShippingRecipientDto)
  recipient: ShippingRecipientDto;

  @ApiProperty({ description: 'Items for tax calculation', type: [ShippingItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShippingItemDto)
  items: ShippingItemDto[];

  @ApiProperty({ description: 'Subtotal amount (products only, excluding shipping)' })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiPropertyOptional({ description: 'Shipping cost (if applicable)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  shipping_cost?: number;

  @ApiPropertyOptional({ description: 'Currency code (default: USD)' })
  @IsString()
  @IsOptional()
  currency?: string;
}

/**
 * Tax breakdown by type
 */
export class TaxBreakdownDto {
  @ApiProperty({ description: 'Tax type (e.g., "VAT", "Sales Tax")' })
  type: string;

  @ApiProperty({ description: 'Tax rate percentage' })
  rate: number;

  @ApiProperty({ description: 'Tax amount' })
  amount: number;
}

/**
 * Response DTO for tax calculation
 */
export class TaxCalculationResponseDto {
  @ApiProperty({ description: 'Total tax amount' })
  total_tax: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiPropertyOptional({ description: 'Tax breakdown by type', type: [TaxBreakdownDto] })
  breakdown?: TaxBreakdownDto[];

  @ApiPropertyOptional({ description: 'Whether tax calculation is required for this region' })
  tax_required?: boolean;
}

// ==================== Order Creation with Shipping ====================

/**
 * Order creation with shipping details
 */
export class CreateOrderWithShippingDto {
  @ApiProperty({ description: 'Selected shipping method ID' })
  @IsString()
  @IsNotEmpty()
  shipping_method: string;

  @ApiProperty({ description: 'Calculated shipping cost' })
  @IsNumber()
  @Min(0)
  shipping_cost: number;

  @ApiPropertyOptional({ description: 'Calculated tax amount' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  tax_amount?: number;

  @ApiPropertyOptional({ description: 'Currency code (default: USD)' })
  @IsString()
  @IsOptional()
  currency?: string;
}





