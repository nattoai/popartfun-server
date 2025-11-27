import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsObject, IsOptional, Min, Max } from 'class-validator';

export class DesignDataDto {
  @ApiProperty({ description: 'Base64 encoded design file' })
  @IsString()
  fileDataUrl: string;

  @ApiProperty({ description: 'Design scale', minimum: 0.1, maximum: 3 })
  @IsNumber()
  @Min(0.1)
  @Max(3)
  scale: number;

  @ApiProperty({ description: 'X position (percentage)', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  positionX: number;

  @ApiProperty({ description: 'Y position (percentage)', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  positionY: number;

  @ApiProperty({ description: 'Rotation in degrees', minimum: 0, maximum: 360 })
  @IsNumber()
  @Min(0)
  @Max(360)
  rotation: number;

  @ApiPropertyOptional({ description: 'Printful file ID if already uploaded' })
  @IsOptional()
  @IsNumber()
  printfulFileId?: number;
}

export class CreateCustomProductDto {
  @ApiProperty({ description: 'Store product ID' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Printful variant ID' })
  @IsNumber()
  variantId: number;

  @ApiPropertyOptional({ description: 'Variant title' })
  @IsOptional()
  @IsString()
  variantTitle?: string;

  @ApiPropertyOptional({ description: 'Product title' })
  @IsOptional()
  @IsString()
  productTitle?: string;

  @ApiProperty({ description: 'Design data', type: DesignDataDto })
  @IsObject()
  designData: DesignDataDto;

  @ApiPropertyOptional({ description: 'Mockup URL' })
  @IsOptional()
  @IsString()
  mockupUrl?: string;

  @ApiPropertyOptional({ description: 'Multiple mockup URLs', type: [String] })
  @IsOptional()
  mockupUrls?: string[];

  @ApiPropertyOptional({ description: 'User-given name for the design' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'User notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Price at time of creation' })
  @IsOptional()
  @IsNumber()
  price?: number;
}

