import { IsNumber, IsArray, IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateMockupDto {
  @ApiProperty({ description: 'Printful product ID (template)' })
  @IsNumber()
  productId: number;

  @ApiProperty({ description: 'Variant IDs to generate mockups for' })
  @IsArray()
  @IsNumber({}, { each: true })
  variantIds: number[];

  @ApiProperty({ description: 'File placements' })
  @IsArray()
  files: Array<{
    placement: string;
    image_url: string;
    position?: {
      area_width: number;
      area_height: number;
      width: number;
      height: number;
      top: number;
      left: number;
    };
  }>;

  @ApiPropertyOptional({ description: 'Mockup options' })
  @IsOptional()
  @IsObject()
  options?: {
    product_options?: object;
    option_groups?: string[];
    options?: string[];
  };
}

export class MockupStatusDto {
  @ApiProperty({ description: 'Task key for polling' })
  @IsString()
  taskKey: string;
}

export class MockupResponseDto {
  @ApiProperty()
  taskKey: string;

  @ApiProperty()
  status: string; // pending, completed, failed

  @ApiPropertyOptional()
  mockups?: Array<{
    placement: string;
    variant_ids: number[];
    mockup_url: string;
    extra: any[];
  }>;

  @ApiPropertyOptional()
  error?: string;
}

