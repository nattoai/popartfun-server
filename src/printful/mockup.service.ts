import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';
import {
  PrintfulSyncProduct,
  PrintfulSyncProductDocument,
} from './schemas/sync-product.schema';

@Injectable()
export class MockupService {
  private readonly logger = new Logger(MockupService.name);
  private readonly apiClient: AxiosInstance;
  private readonly apiBaseUrl = 'https://api.printful.com';

  constructor(
    private configService: ConfigService,
    @InjectModel(PrintfulSyncProduct.name)
    private syncProductModel: Model<PrintfulSyncProductDocument>,
  ) {
    const apiKey = this.configService.get<string>('PRINTFUL_API_KEY');

    this.apiClient = axios.create({
      baseURL: this.apiBaseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Generate mockup and poll until completion
   */
  async generateAndWaitForMockup(
    productId: number,
    variantIds: number[],
    files: Array<{ placement: string; image_url: string; position?: any }>,
    options?: any,
  ): Promise<string[]> {
    try {
      // Create mockup generation task
      const taskKey = await this.createMockupTask(productId, variantIds, files, options);

      // Poll for completion
      const mockups = await this.pollMockupStatus(taskKey);

      return mockups;
    } catch (error) {
      this.logger.error(`Failed to generate mockup: ${error.message}`);
      throw new BadRequestException(`Failed to generate mockup: ${error.message}`);
    }
  }

  /**
   * Create mockup generation task
   */
  private async createMockupTask(
    productId: number,
    variantIds: number[],
    files: Array<{ placement: string; image_url: string; position?: any }>,
    options?: any,
  ): Promise<string> {
    try {
      const response = await this.apiClient.post(
        `/mockup-generator/create-task/${productId}`,
        {
          variant_ids: variantIds,
          files: files,
          options: options || {},
        },
      );

      return response.data.result.task_key;
    } catch (error) {
      this.logger.error(`Failed to create mockup task: ${error.message}`);
      throw new BadRequestException(`Failed to create mockup task: ${error.message}`);
    }
  }

  /**
   * Poll mockup status until complete
   */
  private async pollMockupStatus(
    taskKey: string,
    maxAttempts: number = 30,
    intervalMs: number = 2000,
  ): Promise<string[]> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await this.apiClient.get('/mockup-generator/task', {
          params: { task_key: taskKey },
        });

        const result = response.data.result;

        if (result.status === 'completed') {
          // Extract mockup URLs
          const mockupUrls = result.mockups.map((m: any) => m.mockup_url);
          this.logger.log(`Mockup generation completed: ${mockupUrls.length} mockups`);
          return mockupUrls;
        }

        if (result.status === 'failed') {
          throw new Error(`Mockup generation failed: ${result.error || 'Unknown error'}`);
        }

        // Still pending, wait and retry
        await this.sleep(intervalMs);
        attempts++;
      } catch (error) {
        if (error.response?.status === 404) {
          // Task not found yet, wait and retry
          await this.sleep(intervalMs);
          attempts++;
        } else {
          throw error;
        }
      }
    }

    throw new Error('Mockup generation timeout');
  }

  /**
   * Update sync product with mockup URLs
   */
  async updateProductMockups(
    syncProductId: string,
    mockupUrls: string[],
  ): Promise<void> {
    try {
      await this.syncProductModel.findByIdAndUpdate(syncProductId, {
        mockupUrls: mockupUrls,
        syncStatus: 'created',
      });

      this.logger.log(`Updated product ${syncProductId} with ${mockupUrls.length} mockups`);
    } catch (error) {
      this.logger.error(`Failed to update product mockups: ${error.message}`);
    }
  }

  /**
   * Generate mockup for existing sync product
   */
  async regenerateMockup(syncProductId: string): Promise<string[]> {
    try {
      const product = await this.syncProductModel.findById(syncProductId);

      if (!product) {
        throw new BadRequestException('Sync product not found');
      }

      // Extract data from metadata
      const metadata = product.metadata as any;
      const syncProduct = metadata.syncProduct;

      if (!syncProduct) {
        throw new BadRequestException('Product metadata missing');
      }

      // Get first variant for mockup generation
      const firstVariant = syncProduct.sync_variants[0];
      if (!firstVariant) {
        throw new BadRequestException('No variants found');
      }

      // Get file info
      const file = firstVariant.files[0];
      if (!file) {
        throw new BadRequestException('No design file found');
      }

      // Generate mockup
      const mockupUrls = await this.generateAndWaitForMockup(
        firstVariant.product.product_id,
        [firstVariant.variant_id],
        [
          {
            placement: file.placement || 'front',
            image_url: file.preview_url || file.url,
            position: file.position,
          },
        ],
      );

      // Update product
      await this.updateProductMockups(syncProductId, mockupUrls);

      return mockupUrls;
    } catch (error) {
      this.logger.error(`Failed to regenerate mockup: ${error.message}`);
      throw new BadRequestException(`Failed to regenerate mockup: ${error.message}`);
    }
  }

  /**
   * Helper: Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

