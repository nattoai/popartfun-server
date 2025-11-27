import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CalculatePositionDto {
  @ApiProperty({ description: 'Printful product ID' })
  @IsNumber()
  productId: number;

  @ApiProperty({ description: 'Variant ID' })
  @IsNumber()
  variantId: number;

  @ApiProperty({ description: 'Design image width in pixels' })
  @IsNumber()
  imageWidth: number;

  @ApiProperty({ description: 'Design image height in pixels' })
  @IsNumber()
  imageHeight: number;

  @ApiPropertyOptional({ description: 'Placement area (default: front)', example: 'front' })
  @IsOptional()
  @IsString()
  placement?: string;
}

export class PositionResponseDto {
  @ApiProperty({ description: 'Calculated position for Printful API' })
  position: {
    area_width: number;
    area_height: number;
    width: number;
    height: number;
    top: number;
    left: number;
  };

  @ApiProperty({ description: 'Print area dimensions from Printful' })
  printArea: {
    width: number;
    height: number;
    placement: string;
  };

  @ApiProperty({ description: 'Design dimensions' })
  design: {
    width: number;
    height: number;
    aspectRatio: number;
  };
}











