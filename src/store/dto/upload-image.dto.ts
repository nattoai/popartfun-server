import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UploadImageDto {
  @ApiProperty({ description: 'Image file name' })
  @IsString()
  @IsNotEmpty()
  file_name: string;

  @ApiProperty({ description: 'Base64 encoded image data or URL' })
  @IsString()
  @IsNotEmpty()
  contents: string;
}

export class ImageUploadResponseDto {
  @ApiProperty({ description: 'Printify image ID' })
  id: string;

  @ApiProperty({ description: 'Image file name' })
  file_name: string;

  @ApiProperty({ description: 'Image height in pixels' })
  height: number;

  @ApiProperty({ description: 'Image width in pixels' })
  width: number;

  @ApiProperty({ description: 'File size in bytes' })
  size: number;

  @ApiProperty({ description: 'MIME type' })
  mime_type: string;

  @ApiProperty({ description: 'Image preview URL' })
  preview_url: string;

  @ApiProperty({ description: 'Image upload URL' })
  upload_time: string;
}















