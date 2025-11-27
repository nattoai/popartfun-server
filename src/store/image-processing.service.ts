import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';

export interface OptimizedImage {
  thumbnail: Buffer; // 400px
  medium: Buffer; // 800px
  large: Buffer; // 1200px
}

export interface ImageDimensions {
  width: number;
  height: number;
}

@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);

  /**
   * Optimize an image to multiple sizes
   * @param imageBuffer Original image buffer
   * @returns Optimized images in different sizes
   */
  async optimizeImage(imageBuffer: Buffer): Promise<OptimizedImage> {
    try {
      this.logger.log('Starting image optimization');

      // Process all sizes in parallel
      const [thumbnail, medium, large] = await Promise.all([
        this.resizeImage(imageBuffer, 400),
        this.resizeImage(imageBuffer, 800),
        this.resizeImage(imageBuffer, 1200),
      ]);

      this.logger.log('Image optimization completed');
      
      return { thumbnail, medium, large };
    } catch (error) {
      this.logger.error(`Image optimization failed: ${error.message}`);
      throw new Error(`Failed to optimize image: ${error.message}`);
    }
  }

  /**
   * Resize and optimize image to specific width
   * @param imageBuffer Original image buffer
   * @param width Target width
   * @returns Optimized image buffer
   */
  private async resizeImage(imageBuffer: Buffer, width: number): Promise<Buffer> {
    return sharp(imageBuffer)
      .resize(width, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 85,
        progressive: true,
      })
      .toBuffer();
  }

  /**
   * Get image dimensions
   * @param imageBuffer Image buffer
   * @returns Image dimensions
   */
  async getImageDimensions(imageBuffer: Buffer): Promise<ImageDimensions> {
    const metadata = await sharp(imageBuffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  }

  /**
   * Convert image to base64 data URL
   * @param imageBuffer Image buffer
   * @param mimeType MIME type (default: image/jpeg)
   * @returns Base64 data URL
   */
  async toDataUrl(imageBuffer: Buffer, mimeType = 'image/jpeg'): Promise<string> {
    const base64 = imageBuffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  }

  /**
   * Validate image file
   * @param imageBuffer Image buffer
   * @returns true if valid image
   */
  async validateImage(imageBuffer: Buffer): Promise<boolean> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      return !!(metadata.format && metadata.width && metadata.height);
    } catch (error) {
      return false;
    }
  }
}


