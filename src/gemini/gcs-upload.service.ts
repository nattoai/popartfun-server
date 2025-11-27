import { Injectable, Logger } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { GCSConfigService } from './gcs.config';
import * as crypto from 'crypto';

@Injectable()
export class GCSUploadService {
  private readonly logger = new Logger(GCSUploadService.name);
  private readonly storage: Storage;
  private readonly gcsConfig: GCSConfigService;

  constructor() {
    this.gcsConfig = new GCSConfigService();

    if (!this.gcsConfig.isConfigured()) {
      this.logger.warn(
        'GCS is not properly configured. Image uploads will be disabled.',
      );
      return;
    }

    // Initialize Google Cloud Storage
    const storageOptions: any = {
      projectId: this.gcsConfig.getProjectId(),
    };

    // Use service account key file if provided
    if (this.gcsConfig.getKeyFilename()) {
      storageOptions.keyFilename = this.gcsConfig.getKeyFilename();
    }
    // Use service account credentials if provided
    else if (this.gcsConfig.getCredentials()) {
      storageOptions.credentials = this.gcsConfig.getCredentials();
    }

    this.storage = new Storage(storageOptions);
    this.logger.log('GCS Upload Service initialized successfully');
  }

  /**
   * Upload a base64 image to Google Cloud Storage
   * @param base64Data The base64 encoded image data (with or without data URL prefix)
   * @param mimeType The MIME type of the image (e.g., 'image/png', 'image/jpeg')
   * @param folder Optional folder path within the bucket
   * @returns Promise<string> The public URL of the uploaded image
   */
  async uploadBase64Image(
    base64Data: string,
    mimeType: string,
    folder: string = 'generated-images',
  ): Promise<string> {
    if (!this.gcsConfig.isConfigured()) {
      throw new Error('GCS is not properly configured');
    }

    try {
      // Remove data URL prefix if present
      const cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');

      // Convert base64 to buffer
      const imageBuffer = Buffer.from(cleanBase64, 'base64');

      // Generate unique filename
      const timestamp = Date.now();
      const randomHash = crypto.randomBytes(8).toString('hex');
      const extension = this.getFileExtension(mimeType);
      const fileName = `${folder}/${timestamp}-${randomHash}.${extension}`;

      // Get bucket reference
      const bucket = this.storage.bucket(this.gcsConfig.getBucketName());
      const file = bucket.file(fileName);

      // Upload the file
      await file.save(imageBuffer, {
        metadata: {
          contentType: mimeType,
          cacheControl: 'public, max-age=31536000', // 1 year cache
        },
        // Don't set public: true for uniform bucket-level access
      });

      // Try to make the file publicly readable (will work if bucket allows it)
      try {
        await file.makePublic();
      } catch (error) {
        // If makePublic fails due to uniform bucket-level access, that's okay
        // The file will still be accessible if the bucket is configured for public access
        this.logger.warn(
          'Could not set public ACL on file (uniform bucket-level access may be enabled):',
          error.message,
        );
      }

      // Generate URL (signed or public based on configuration)
      const useSignedUrls = process.env.GCS_USE_SIGNED_URLS === 'true';
      let imageUrl: string;

      if (useSignedUrls) {
        // Use signed URLs for secure access
        imageUrl = await this.generateSignedUrl(fileName, 24); // 24 hour expiry
        this.logger.log(
          `Successfully uploaded image with signed URL: ${fileName}`,
        );
      } else {
        // Use public URLs (requires bucket to be public)
        imageUrl = this.generatePublicUrl(fileName);
        this.logger.log(
          `Successfully uploaded image with public URL: ${fileName}`,
        );
      }

      return imageUrl;
    } catch (error) {
      this.logger.error('Failed to upload image to GCS:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  /**
   * Upload a buffer to Google Cloud Storage
   * @param buffer The image buffer
   * @param mimeType The MIME type of the image
   * @param folder Optional folder path within the bucket
   * @returns Promise<string> The public URL of the uploaded image
   */
  async uploadBuffer(
    buffer: Buffer,
    mimeType: string,
    folder: string = 'generated-images',
  ): Promise<string> {
    if (!this.gcsConfig.isConfigured()) {
      throw new Error('GCS is not properly configured');
    }

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomHash = crypto.randomBytes(8).toString('hex');
      const extension = this.getFileExtension(mimeType);
      const fileName = `${folder}/${timestamp}-${randomHash}.${extension}`;

      // Get bucket reference
      const bucket = this.storage.bucket(this.gcsConfig.getBucketName());
      const file = bucket.file(fileName);

      // Upload the file
      await file.save(buffer, {
        metadata: {
          contentType: mimeType,
          cacheControl: 'public, max-age=31536000', // 1 year cache
        },
        // Don't set public: true for uniform bucket-level access
      });

      // Try to make the file publicly readable (will work if bucket allows it)
      try {
        await file.makePublic();
      } catch (error) {
        // If makePublic fails due to uniform bucket-level access, that's okay
        // The file will still be accessible if the bucket is configured for public access
        this.logger.warn(
          'Could not set public ACL on file (uniform bucket-level access may be enabled):',
          error.message,
        );
      }

      // Generate URL (signed or public based on configuration)
      const useSignedUrls = process.env.GCS_USE_SIGNED_URLS === 'true';
      let imageUrl: string;

      if (useSignedUrls) {
        // Use signed URLs for secure access
        imageUrl = await this.generateSignedUrl(fileName, 24); // 24 hour expiry
        this.logger.log(
          `Successfully uploaded image with signed URL: ${fileName}`,
        );
      } else {
        // Use public URLs (requires bucket to be public)
        imageUrl = this.generatePublicUrl(fileName);
        this.logger.log(
          `Successfully uploaded image with public URL: ${fileName}`,
        );
      }

      return imageUrl;
    } catch (error) {
      this.logger.error('Failed to upload buffer to GCS:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  /**
   * Check if GCS is properly configured
   */
  isConfigured(): boolean {
    return this.gcsConfig.isConfigured();
  }

  /**
   * Get file extension from MIME type
   */
  private getFileExtension(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
    };

    return mimeToExt[mimeType.toLowerCase()] || 'jpg';
  }

  /**
   * Generate signed URL for the uploaded file (secure alternative to public URLs)
   */
  async generateSignedUrl(
    fileName: string,
    expiresInHours: number = 24,
  ): Promise<string> {
    if (!this.gcsConfig.isConfigured()) {
      throw new Error('GCS is not properly configured');
    }

    try {
      const bucket = this.storage.bucket(this.gcsConfig.getBucketName());
      const file = bucket.file(fileName);

      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresInHours * 60 * 60 * 1000, // Convert hours to milliseconds
      });

      return signedUrl;
    } catch (error) {
      this.logger.error('Failed to generate signed URL:', error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  /**
   * Generate public URL for the uploaded file
   */
  private generatePublicUrl(fileName: string): string {
    // Use custom public URL base if provided
    const publicUrlBase = this.gcsConfig.getPublicUrlBase();
    if (publicUrlBase) {
      return `${publicUrlBase}/${fileName}`;
    }

    // Default GCS public URL format
    return `https://storage.googleapis.com/${this.gcsConfig.getBucketName()}/${fileName}`;
  }
}
