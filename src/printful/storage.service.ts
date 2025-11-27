import { Injectable, Logger } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private storage: Storage;
  private bucketName: string;

  constructor() {
    // Initialize Google Cloud Storage
    this.bucketName = process.env.GCS_BUCKET_NAME || 'printful-designs';
    
    try {
      const storageConfig: any = {
        projectId: process.env.GCS_PROJECT_ID,
      };

      // Support both key file path and credentials JSON
      if (process.env.GCS_KEY_FILENAME) {
        storageConfig.keyFilename = process.env.GCS_KEY_FILENAME;
        this.logger.log(`Using GCS key file: ${process.env.GCS_KEY_FILENAME}`);
      } else if (process.env.GCS_CREDENTIALS) {
        storageConfig.credentials = JSON.parse(process.env.GCS_CREDENTIALS);
        this.logger.log('Using GCS credentials from environment variable');
      } else {
        this.logger.log('Using Application Default Credentials for GCS');
      }

      this.storage = new Storage(storageConfig);
      
      this.logger.log(`Google Cloud Storage initialized. Bucket: ${this.bucketName}`);
    } catch (error) {
      this.logger.error(`Failed to initialize Google Cloud Storage: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upload a file to Google Cloud Storage
   * @param buffer File buffer
   * @param filename Original filename
   * @param contentType MIME type
   * @returns Public URL of the uploaded file
   */
  async uploadFile(
    buffer: Buffer,
    filename: string,
    contentType: string,
  ): Promise<string> {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const extension = filename.split('.').pop();
      const uniqueFilename = `designs/${timestamp}_${Math.random().toString(36).substring(7)}.${extension}`;

      this.logger.log(`Uploading file to GCS: ${uniqueFilename}`);

      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(uniqueFilename);

      // Upload the file
      await file.save(buffer, {
        contentType,
        metadata: {
          cacheControl: 'public, max-age=31536000',
        },
        // Don't use public: true - bucket has uniform bucket-level access
        // Public access must be configured at bucket level via IAM
      });

      // Get public URL
      // With uniform bucket-level access, files are public if bucket IAM is configured
      const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${uniqueFilename}`;
      
      this.logger.log(`File uploaded successfully: ${publicUrl}`);
      this.logger.log('Note: File is publicly accessible if bucket has allUsers:objectViewer role');

      return publicUrl;
    } catch (error) {
      this.logger.error(`Failed to upload file to GCS: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a file from Google Cloud Storage
   * @param fileUrl Public URL of the file
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract filename from URL
      const filename = fileUrl.split(`${this.bucketName}/`)[1];
      if (!filename) {
        this.logger.warn(`Invalid GCS URL: ${fileUrl}`);
        return;
      }

      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(filename);

      await file.delete();
      
      this.logger.log(`File deleted: ${filename}`);
    } catch (error) {
      this.logger.error(`Failed to delete file from GCS: ${error.message}`);
      // Don't throw - deletion failure shouldn't break the flow
    }
  }

  /**
   * Check if Google Cloud Storage is properly configured
   */
  async testConnection(): Promise<boolean> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const [exists] = await bucket.exists();
      
      if (!exists) {
        this.logger.warn(`Bucket ${this.bucketName} does not exist`);
        return false;
      }
      
      this.logger.log('Google Cloud Storage connection successful');
      return true;
    } catch (error) {
      this.logger.error(`GCS connection test failed: ${error.message}`);
      return false;
    }
  }
}

