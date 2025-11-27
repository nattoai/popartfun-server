import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreatePrintfulConfigDto {
  @ApiProperty({ description: 'Printful API key', example: 'your-api-key' })
  @IsString()
  apiKey: string;

  @ApiPropertyOptional({ description: 'Printful store ID' })
  @IsOptional()
  @IsString()
  storeId?: string;

  @ApiPropertyOptional({ description: 'Webhook URL' })
  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @ApiPropertyOptional({ description: 'Auto-fulfill orders', example: true })
  @IsOptional()
  @IsBoolean()
  autoFulfill?: boolean;
}

export class UpdatePrintfulConfigDto extends PartialType(CreatePrintfulConfigDto) {}

export class PrintfulConfigResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  apiKey: string;

  @ApiPropertyOptional()
  storeId?: string;

  @ApiPropertyOptional()
  webhookUrl?: string;

  @ApiProperty()
  autoFulfill: boolean;

  @ApiProperty()
  active: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

