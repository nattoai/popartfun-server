import { Injectable } from '@nestjs/common';

export interface GCSConfig {
  bucketName: string;
  projectId: string;
  keyFilename?: string;
  credentials?: {
    client_email: string;
    private_key: string;
  };
  publicUrlBase?: string;
}

@Injectable()
export class GCSConfigService {
  private readonly config: GCSConfig;

  constructor() {
    // Load configuration from environment variables
    const bucketName = process.env.GCS_BUCKET_NAME;
    const projectId = process.env.GCS_PROJECT_ID;
    const keyFilename = process.env.GCS_KEY_FILENAME;
    const clientEmail = process.env.GCS_CLIENT_EMAIL;
    const privateKey = process.env.GCS_PRIVATE_KEY;
    const publicUrlBase = process.env.GCS_PUBLIC_URL_BASE;

    if (!bucketName || !projectId) {
      throw new Error(
        'GCS_BUCKET_NAME and GCS_PROJECT_ID must be set in environment variables',
      );
    }

    this.config = {
      bucketName,
      projectId,
      keyFilename,
      publicUrlBase,
    };

    // Use service account credentials if provided
    if (clientEmail && privateKey) {
      this.config.credentials = {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
      };
    }
  }

  getBucketName(): string {
    return this.config.bucketName;
  }

  getProjectId(): string {
    return this.config.projectId;
  }

  getKeyFilename(): string | undefined {
    return this.config.keyFilename;
  }

  getCredentials(): { client_email: string; private_key: string } | undefined {
    return this.config.credentials;
  }

  getPublicUrlBase(): string | undefined {
    return this.config.publicUrlBase;
  }

  isConfigured(): boolean {
    return !!(this.config.bucketName && this.config.projectId);
  }
}
