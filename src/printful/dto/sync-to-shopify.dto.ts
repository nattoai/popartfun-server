import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SyncToShopifyDto {
  @ApiProperty({ description: 'Printful sync product ID' })
  @IsString()
  syncProductId: string;

  @ApiPropertyOptional({ description: 'Custom product title for Shopify' })
  @IsOptional()
  @IsString()
  productTitle?: string;

  @ApiPropertyOptional({ description: 'Custom description for Shopify' })
  @IsOptional()
  @IsString()
  productDescription?: string;

  @ApiPropertyOptional({ description: 'Price markup percentage', example: 50 })
  @IsOptional()
  @IsNumber()
  markupPercentage?: number;
}

export class SyncToShopifyResponseDto {
  @ApiProperty()
  shopifyProductId: string;

  @ApiProperty()
  shopifyProductUrl: string;

  @ApiProperty()
  printfulSyncProductId: number;

  @ApiProperty()
  syncStatus: string;

  @ApiProperty()
  message: string;
}

