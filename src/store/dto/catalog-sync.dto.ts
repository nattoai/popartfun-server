import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsString } from 'class-validator';

export class SyncCatalogDto {
  @ApiProperty({
    description: 'Force full sync even if recently synced',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;

  @ApiProperty({
    description: 'Sync only specific blueprint IDs (comma-separated)',
    required: false,
  })
  @IsOptional()
  @IsString()
  blueprintIds?: string;
}

export class CatalogSyncResponseDto {
  @ApiProperty({ description: 'Number of blueprints synced' })
  blueprintsSynced: number;

  @ApiProperty({ description: 'Number of variants synced' })
  variantsSynced: number;

  @ApiProperty({ description: 'Sync duration in milliseconds' })
  duration: number;

  @ApiProperty({ description: 'Timestamp of sync' })
  syncedAt: string;

  @ApiProperty({ description: 'Any errors encountered during sync' })
  errors?: string[];
}

export class CatalogBlueprintResponseDto {
  @ApiProperty()
  blueprintId: number;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  brand?: string;

  @ApiProperty({ required: false })
  model?: string;

  @ApiProperty({ type: [String], required: false })
  images?: string[];

  @ApiProperty({ required: false })
  printAreas?: Record<string, any>;

  @ApiProperty({ required: false })
  isFavorite?: boolean;

  @ApiProperty()
  syncedAt: string;
}

export class CatalogVariantResponseDto {
  @ApiProperty()
  blueprintId: number;

  @ApiProperty()
  printProviderId: number;

  @ApiProperty()
  variantId: number;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  sku?: string;

  @ApiProperty({ required: false })
  cost?: number;

  @ApiProperty({ required: false })
  price?: number;

  @ApiProperty({ required: false })
  currency?: string;

  @ApiProperty({ required: false })
  options?: Record<string, any>;

  @ApiProperty({ required: false })
  isFavorite?: boolean;

  @ApiProperty()
  syncedAt: string;
}

export class SearchCatalogDto {
  @ApiProperty({
    description: 'Search query for title, description, brand, or model',
    required: false,
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiProperty({
    description: 'Filter by user ID to include favorites',
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    description: 'Show only favorites',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  favoritesOnly?: boolean;
}
