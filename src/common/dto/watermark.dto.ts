import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class WatermarkOptionsDto {
  @ApiProperty({
    description: 'Whether to add watermark to the image',
    example: true,
    default: false,
  })
  @IsBoolean()
  addWatermark: boolean;

  @ApiProperty({
    description: 'Brand name to display in watermark',
    example: 'PopArtCreator.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  brandName?: string;

  @ApiProperty({
    description: 'Width of the white border around the image (in pixels)',
    example: 60,
    minimum: 10,
    maximum: 200,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(200)
  borderWidth?: number;

  @ApiProperty({
    description: 'Color of the border (hex color)',
    example: '#FFFFFF',
    required: false,
  })
  @IsOptional()
  @IsString()
  borderColor?: string;

  @ApiProperty({
    description: 'Color of the watermark text (hex color)',
    example: '#666666',
    required: false,
  })
  @IsOptional()
  @IsString()
  textColor?: string;

  @ApiProperty({
    description: 'Font size of the watermark text (in pixels)',
    example: 24,
    minimum: 12,
    maximum: 48,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(12)
  @Max(48)
  fontSize?: number;

  @ApiProperty({
    description: 'Font family for the watermark text',
    example: 'Arial',
    required: false,
  })
  @IsOptional()
  @IsString()
  fontFamily?: string;
}


