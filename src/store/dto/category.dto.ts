import { IsString, IsOptional, IsBoolean, IsNumber, IsHexColor } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

// Site Tag DTOs
export class CreateSiteTagDto {
  @ApiProperty({ description: 'Unique name (slug-friendly)', example: 'popartfun' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Display name', example: 'PopArtFun' })
  @IsString()
  displayName: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Main PopArtFun site' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Hex color code', example: '#8B5CF6' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Icon (emoji or icon name)', example: '🎨' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Sort order', example: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Active status', example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ 
    description: 'Translations for displayName and description',
    example: {
      displayName: { 'en-US': 'PopArtFun', 'ja': 'ポップアートファン', 'zh-HK': 'PopArtFun', 'zh-TW': 'PopArtFun' },
      description: { 'en-US': 'Main site', 'ja': 'メインサイト' }
    }
  })
  @IsOptional()
  translations?: {
    displayName?: { [locale: string]: string };
    description?: { [locale: string]: string };
  };
}

export class UpdateSiteTagDto extends PartialType(CreateSiteTagDto) {}

export class SiteTagResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  displayName: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  color: string;

  @ApiProperty()
  icon: string;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  active: boolean;

  @ApiPropertyOptional({ 
    description: 'Translations for displayName and description',
    example: {
      displayName: { 'en-US': 'PopArtFun', 'ja': 'ポップアートファン', 'zh-HK': 'PopArtFun', 'zh-TW': 'PopArtFun' },
      description: { 'en-US': 'Main site', 'ja': 'メインサイト' }
    }
  })
  translations?: {
    displayName?: { [locale: string]: string };
    description?: { [locale: string]: string };
  };

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// Product Category DTOs
export class CreateProductCategoryDto {
  @ApiProperty({ description: 'Unique name (slug-friendly)', example: 'apparel' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Display name', example: 'Apparel' })
  @IsString()
  displayName: string;

  @ApiPropertyOptional({ description: 'Description', example: 'T-shirts, hoodies, and clothing' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Hex color code', example: '#3B82F6' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Icon (emoji or icon name)', example: '👕' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Sort order', example: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Active status', example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ 
    description: 'Translations for displayName and description',
    example: {
      displayName: { 'en-US': 'Apparel', 'ja': 'アパレル', 'zh-HK': '服飾', 'zh-TW': '服飾' },
      description: { 'en-US': 'T-shirts, hoodies, and clothing', 'ja': 'Tシャツ、パーカー、衣類' }
    }
  })
  @IsOptional()
  translations?: {
    displayName?: { [locale: string]: string };
    description?: { [locale: string]: string };
  };
}

export class UpdateProductCategoryDto extends PartialType(CreateProductCategoryDto) {}

export class ProductCategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  displayName: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  color: string;

  @ApiProperty()
  icon: string;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  active: boolean;

  @ApiPropertyOptional({ 
    description: 'Translations for displayName and description',
    example: {
      displayName: { 'en-US': 'Apparel', 'ja': 'アパレル', 'zh-HK': '服飾', 'zh-TW': '服飾' },
      description: { 'en-US': 'T-shirts, hoodies, and clothing', 'ja': 'Tシャツ、パーカー、衣類' }
    }
  })
  translations?: {
    displayName?: { [locale: string]: string };
    description?: { [locale: string]: string };
  };

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// Reorder DTOs
export class ReorderDto {
  @ApiProperty({ description: 'Array of IDs in desired order', type: [String] })
  @IsString({ each: true })
  ids: string[];
}

