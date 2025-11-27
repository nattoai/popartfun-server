import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { DesignDataDto } from './create-custom-product.dto';

export class UpdateCustomProductDto {
  @ApiPropertyOptional({ description: 'Design data', type: DesignDataDto })
  @IsOptional()
  designData?: DesignDataDto;

  @ApiPropertyOptional({ description: 'Mockup URL' })
  @IsOptional()
  @IsString()
  mockupUrl?: string;

  @ApiPropertyOptional({ description: 'Multiple mockup URLs', type: [String] })
  @IsOptional()
  mockupUrls?: string[];

  @ApiPropertyOptional({ description: 'Status', enum: ['draft', 'completed', 'archived'] })
  @IsOptional()
  @IsEnum(['draft', 'completed', 'archived'])
  status?: 'draft' | 'completed' | 'archived';

  @ApiPropertyOptional({ description: 'User-given name for the design' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'User notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

