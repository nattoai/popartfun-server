import { IsNumber, IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateMockupSimpleDto {
  @ApiProperty({ description: 'Printful product ID', example: 71 })
  @IsNumber()
  productId: number;

  @ApiProperty({ description: 'Design image URL (from GCS)' })
  @IsString()
  imageUrl: string;

  @ApiPropertyOptional({ description: 'Design placement', example: 'front', default: 'front' })
  @IsOptional()
  @IsString()
  placement?: string;

  @ApiPropertyOptional({ 
    description: 'Specific variant IDs (optional - will use all if not provided)',
    example: [4012, 4013]
  })
  @IsOptional()
  @IsArray()
  variantIds?: number[];

  @ApiPropertyOptional({ 
    description: 'Limit number of variants for mockup (default: 3)',
    example: 3
  })
  @IsOptional()
  @IsNumber()
  maxVariants?: number;
}











