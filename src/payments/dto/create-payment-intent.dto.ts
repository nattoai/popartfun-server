import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsObject, Min } from 'class-validator';

export class CreatePaymentIntentDto {
  @ApiProperty({ description: 'Amount in cents (e.g., 2000 = $20.00)' })
  @IsNumber()
  @Min(50) // Stripe minimum is 50 cents
  amount: number;

  @ApiProperty({ description: 'Currency code (e.g., USD, EUR)', default: 'USD' })
  @IsString()
  currency: string;

  @ApiPropertyOptional({ description: 'Additional metadata for the payment' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}

export class UpdatePaymentIntentDto {
  @ApiProperty({ description: 'Payment Intent ID' })
  @IsString()
  paymentIntentId: string;

  @ApiProperty({ description: 'New amount in cents' })
  @IsNumber()
  @Min(50)
  amount: number;
}

