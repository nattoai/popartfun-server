import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddressDto {
  @ApiProperty({ description: 'First name' })
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({ description: 'Last name' })
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Country code (e.g., US, GB)' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ description: 'Region/State' })
  @IsString()
  @IsOptional()
  region?: string;

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

  @ApiPropertyOptional({ description: 'ZIP/Postal code' })
  @IsString()
  @IsOptional()
  zip?: string;
}

export class LineItemDto {
  @ApiProperty({ description: 'Printify product ID' })
  @IsString()
  @IsNotEmpty()
  product_id: string;

  @ApiProperty({ description: 'Variant ID of the product' })
  @IsNumber()
  @IsNotEmpty()
  variant_id: number;

  @ApiProperty({ description: 'Quantity to order' })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({ description: 'Print provider ID' })
  @IsNumber()
  @IsNotEmpty()
  print_provider_id: number;

  @ApiPropertyOptional({ description: 'Blueprint ID (product type)' })
  @IsNumber()
  @IsOptional()
  blueprint_id?: number;
}

export class CreateOrderDto {
  @ApiPropertyOptional({ description: 'External order ID for tracking' })
  @IsString()
  @IsOptional()
  external_id?: string;

  @ApiPropertyOptional({ description: 'User ID who placed the order' })
  @IsString()
  @IsOptional()
  user_id?: string;

  @ApiProperty({ description: 'Shipping address', type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  address_to: AddressDto;

  @ApiProperty({
    description: 'Array of line items (products) to order',
    type: [LineItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemDto)
  line_items: LineItemDto[];

  @ApiPropertyOptional({ description: 'Send shipment notifications' })
  @IsBoolean()
  @IsOptional()
  send_shipping_notification?: boolean;
}

