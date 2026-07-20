import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsDateString,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateDiscountDto {
  @ApiProperty({ description: 'Discount code (e.g., WELCOME10)', example: 'WELCOME10' })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  code: string;

  @ApiProperty({ description: 'Discount type', enum: ['percentage', 'fixed'] })
  @IsEnum(['percentage', 'fixed'])
  type: 'percentage' | 'fixed';

  @ApiProperty({ description: 'Discount value (10 for 10% or $10)', example: 10 })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiPropertyOptional({ description: 'Description of the discount' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Minimum order amount to apply discount', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum total uses (null = unlimited)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUses?: number;

  @ApiPropertyOptional({ description: 'Expiration date (ISO string)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Whether the discount is active', default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateDiscountDto {
  @ApiPropertyOptional({ description: 'Description of the discount' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Minimum order amount to apply discount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum total uses' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUses?: number;

  @ApiPropertyOptional({ description: 'Expiration date (ISO string)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Whether the discount is active' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class ValidateDiscountDto {
  @ApiProperty({ description: 'Discount code to validate', example: 'WELCOME10' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Order subtotal to check against minimum', example: 50 })
  @IsNumber()
  @Min(0)
  subtotal: number;
}

export class DiscountResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty({ enum: ['percentage', 'fixed'] })
  type: 'percentage' | 'fixed';

  @ApiProperty()
  value: number;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  minOrderAmount: number;

  @ApiPropertyOptional()
  maxUses?: number;

  @ApiProperty()
  usedCount: number;

  @ApiPropertyOptional()
  expiresAt?: Date;

  @ApiProperty()
  active: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ValidateDiscountResponseDto {
  @ApiProperty({ description: 'Whether the discount code is valid' })
  valid: boolean;

  @ApiPropertyOptional({ description: 'Error message if invalid' })
  error?: string;

  @ApiPropertyOptional({ description: 'Discount code' })
  code?: string;

  @ApiPropertyOptional({ description: 'Discount type', enum: ['percentage', 'fixed'] })
  type?: 'percentage' | 'fixed';

  @ApiPropertyOptional({ description: 'Discount value' })
  value?: number;

  @ApiPropertyOptional({ description: 'Calculated discount amount for the given subtotal' })
  discountAmount?: number;

  @ApiPropertyOptional({ description: 'Description of the discount' })
  description?: string;
}

