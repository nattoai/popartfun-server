import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  ValidateIf,
} from 'class-validator';

export enum FavoriteTypeDto {
  BLUEPRINT = 'blueprint',
  VARIANT = 'variant',
}

export class CreateFavoriteDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Type of favorite',
    enum: FavoriteTypeDto,
  })
  @IsEnum(FavoriteTypeDto)
  type: FavoriteTypeDto;

  @ApiProperty({ description: 'Blueprint ID' })
  @IsNumber()
  blueprintId: number;

  @ApiProperty({
    description: 'Print provider ID (required for variant favorites)',
    required: false,
  })
  @ValidateIf((o) => o.type === FavoriteTypeDto.VARIANT)
  @IsNumber()
  printProviderId?: number;

  @ApiProperty({
    description: 'Variant ID (required for variant favorites)',
    required: false,
  })
  @ValidateIf((o) => o.type === FavoriteTypeDto.VARIANT)
  @IsNumber()
  variantId?: number;

  @ApiProperty({ description: 'Optional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class FavoriteResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: FavoriteTypeDto })
  type: FavoriteTypeDto;

  @ApiProperty()
  blueprintId: number;

  @ApiProperty({ required: false })
  printProviderId?: number;

  @ApiProperty({ required: false })
  variantId?: number;

  @ApiProperty({ required: false })
  notes?: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class DeleteFavoriteDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Type of favorite',
    enum: FavoriteTypeDto,
  })
  @IsEnum(FavoriteTypeDto)
  type: FavoriteTypeDto;

  @ApiProperty({ description: 'Blueprint ID' })
  @IsNumber()
  blueprintId: number;

  @ApiProperty({
    description: 'Print provider ID (required for variant favorites)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  printProviderId?: number;

  @ApiProperty({
    description: 'Variant ID (required for variant favorites)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  variantId?: number;
}
