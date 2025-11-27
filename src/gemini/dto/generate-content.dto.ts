import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { WatermarkOptionsDto } from '../../common/dto/watermark.dto';

export class GenerateContentDto {
  @ApiProperty({
    description: 'The content/prompt to generate AI response for',
    example: 'Write a short story about a robot learning to paint',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  contents: string;

  @ApiProperty({
    description: 'The Gemini model to use for content generation',
    example: 'gemini-2.5-flash-image-preview',
    default: 'gemini-2.5-flash-image-preview',
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  model?: string = 'gemini-2.5-flash-image-preview';

  @ApiProperty({
    description: 'Whether to generate an image based on the prompt',
    example: false,
    default: false,
    required: false,
    type: Boolean,
  })
  @IsBoolean()
  @IsOptional()
  generateImage?: boolean = false;

  @ApiProperty({
    description: 'Whether to search for latest news from the internet',
    example: false,
    default: false,
    required: false,
    type: Boolean,
  })
  @IsBoolean()
  @IsOptional()
  searchNews?: boolean = false;

  @ApiProperty({
    description:
      'Array of image URLs or base64 encoded images for multimodal input',
    example: ['https://example.com/image.jpg'],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsOptional()
  images?: string[];

  @ApiProperty({
    description: 'Watermark options for generated images',
    required: false,
    type: WatermarkOptionsDto,
  })
  @ValidateNested()
  @Type(() => WatermarkOptionsDto)
  @IsOptional()
  watermarkOptions?: WatermarkOptionsDto;

  @ApiProperty({
    description: 'Background removal options for generated images',
    required: false,
    example: {
      removeBackground: true,
      outputFormat: 'png',
      quality: 90,
      threshold: 10,
    },
  })
  @IsOptional()
  backgroundRemovalOptions?: {
    removeBackground: boolean;
    outputFormat?: 'png' | 'webp';
    quality?: number;
    threshold?: number;
  };
}
