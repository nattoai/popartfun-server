import { IsString, IsNumber, IsArray, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePrintfulProductDto {
  @ApiProperty({ description: 'Printful file ID (design)' })
  @IsNumber()
  fileId: number;

  @ApiProperty({ description: 'Printful variant ID (product template)', example: 4011 })
  @IsNumber()
  variantId: number;

  @ApiProperty({ description: 'Product name', example: 'Customer Design - T-Shirt' })
  @IsString()
  productName: string;

  @ApiProperty({ description: 'Product type', example: 't-shirt' })
  @IsString()
  productType: string;

  @ApiPropertyOptional({ description: 'Design placement', example: 'front' })
  @IsOptional()
  @IsString()
  placement?: string;

  @ApiPropertyOptional({ description: 'Design position and dimensions' })
  @IsOptional()
  @IsObject()
  position?: {
    area_width: number;
    area_height: number;
    width: number;
    height: number;
    top: number;
    left: number;
  };

  @ApiPropertyOptional({ description: 'Customer ID' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Additional variant IDs for sizes/colors' })
  @IsOptional()
  @IsArray()
  additionalVariantIds?: number[];
}

export class PrintfulProductResponseDto {
  @ApiProperty()
  syncProductId: number;

  @ApiProperty()
  syncVariantIds: number[];

  @ApiProperty()
  productName: string;

  @ApiProperty()
  productType: string;

  @ApiProperty()
  fileId: number;

  @ApiProperty()
  thumbnailUrl: string;

  @ApiProperty()
  status: string;
}

