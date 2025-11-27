import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadDesignDto {
  @ApiProperty({ description: 'Base64 encoded file or file buffer' })
  @IsString()
  file: string;

  @ApiProperty({ description: 'Original filename', example: 'design.png' })
  @IsString()
  filename: string;

  @ApiPropertyOptional({ description: 'Customer ID who uploaded' })
  @IsOptional()
  @IsString()
  customerId?: string;
}

export class UploadDesignResponseDto {
  @ApiProperty({ description: 'Printful file ID' })
  fileId: number;

  @ApiProperty({ description: 'File URL in Printful' })
  url: string;

  @ApiProperty({ description: 'Thumbnail URL' })
  thumbnailUrl: string;

  @ApiProperty({ description: 'File type' })
  type: string;

  @ApiProperty({ description: 'File size in bytes' })
  size: number;
}

