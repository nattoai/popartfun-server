import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsObject, IsOptional, IsEmail, Min } from 'class-validator';

export class OrderRecipientDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  address1: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address2?: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state_code?: string;

  @ApiProperty()
  @IsString()
  country_code: string;

  @ApiProperty()
  @IsString()
  zip: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;
}

export class OrderItemDto {
  @ApiPropertyOptional({ description: 'Reference to UserCustomProduct ID' })
  @IsOptional()
  @IsString()
  customProductId?: string;

  @ApiProperty()
  @IsNumber()
  variantId: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty()
  @IsString()
  productType: string;

  @ApiProperty()
  @IsString()
  price: string;

  @ApiPropertyOptional()
  @IsOptional()
  design?: any;
}

export class CreateUserOrderDto {
  @ApiProperty({ type: OrderRecipientDto })
  @IsObject()
  recipient: OrderRecipientDto;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  items: OrderItemDto[];

  @ApiProperty()
  @IsString()
  shippingMethod: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  shippingCost: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  taxAmount: number;

  @ApiProperty({ description: 'Stripe payment intent ID' })
  @IsString()
  paymentIntentId: string;

  @ApiPropertyOptional()
  @IsOptional()
  productConfig?: any[];
}

