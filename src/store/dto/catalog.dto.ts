import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class GetCatalogQueryDto {
  @ApiPropertyOptional({ description: 'Page number for pagination' })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page' })
  @IsNumber()
  @IsOptional()
  limit?: number;
}

export class BlueprintDto {
  @ApiProperty({ description: 'Blueprint ID' })
  id: number;

  @ApiProperty({ description: 'Blueprint title' })
  title: string;

  @ApiProperty({ description: 'Blueprint description' })
  description: string;

  @ApiProperty({ description: 'Brand name' })
  brand: string;

  @ApiProperty({ description: 'Model name' })
  model: string;

  @ApiProperty({ description: 'List of available images' })
  images: string[];
}

export class PrintProviderDto {
  @ApiProperty({ description: 'Print provider ID' })
  id: number;

  @ApiProperty({ description: 'Print provider title' })
  title: string;

  @ApiProperty({ description: 'Location information' })
  location: {
    address1: string;
    address2?: string;
    city: string;
    country: string;
    region?: string;
    zip?: string;
  };
}

export class VariantDto {
  @ApiProperty({ description: 'Variant ID' })
  id: number;

  @ApiProperty({ description: 'Variant title' })
  title: string;

  @ApiProperty({ description: 'Variant options (size, color, etc.)' })
  options: Record<string, string>;

  @ApiProperty({ description: 'Available placeholders for this variant' })
  placeholders: Array<{
    position: string;
    height: number;
    width: number;
  }>;
}

export class BlueprintDetailsDto {
  @ApiProperty({ description: 'Blueprint ID' })
  id: number;

  @ApiProperty({ description: 'Blueprint title' })
  title: string;

  @ApiProperty({ description: 'Blueprint description' })
  description: string;

  @ApiProperty({ description: 'Brand name' })
  brand: string;

  @ApiProperty({ description: 'Model name' })
  model: string;

  @ApiProperty({ description: 'Available variants', type: [VariantDto] })
  variants: VariantDto[];

  @ApiProperty({
    description: 'Print providers offering this blueprint',
    type: [PrintProviderDto],
  })
  print_providers: PrintProviderDto[];

  @ApiProperty({ description: 'List of available images', required: false })
  images?: string[];

  @ApiProperty({ description: 'Print areas configuration', required: false })
  print_areas?: Record<string, any>;
}
