import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios, { AxiosInstance } from 'axios';
import {
  PrintfulConfig,
  PrintfulConfigDocument,
} from './schemas/printful-config.schema';
import {
  PrintfulSyncProduct,
  PrintfulSyncProductDocument,
} from './schemas/sync-product.schema';
import {
  PrintfulOrder,
  PrintfulOrderDocument,
} from './schemas/printful-order.schema';
import {
  CreatePrintfulConfigDto,
  UpdatePrintfulConfigDto,
  PrintfulConfigResponseDto,
  UploadDesignDto,
  UploadDesignResponseDto,
  CreatePrintfulProductDto,
  PrintfulProductResponseDto,
  GenerateMockupDto,
  MockupStatusDto,
  MockupResponseDto,
} from './dto';
import { StorageService } from './storage.service';

@Injectable()
export class PrintfulService {
  private readonly logger = new Logger(PrintfulService.name);
  private readonly apiClient: AxiosInstance;
  private readonly apiBaseUrl = 'https://api.printful.com';

  constructor(
    private configService: ConfigService,
    private storageService: StorageService,
    @InjectModel(PrintfulConfig.name)
    private printfulConfigModel: Model<PrintfulConfigDocument>,
    @InjectModel(PrintfulSyncProduct.name)
    private syncProductModel: Model<PrintfulSyncProductDocument>,
    @InjectModel(PrintfulOrder.name)
    private orderModel: Model<PrintfulOrderDocument>,
  ) {
    const apiKey = this.configService.get<string>('PRINTFUL_API_KEY');

    // Initialize Axios client with Printful API
    this.apiClient = axios.create({
      baseURL: this.apiBaseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 seconds for file uploads
    });

    if (!apiKey) {
      this.logger.warn('PRINTFUL_API_KEY not configured');
    }
  }

  // ==================== Configuration ====================

  /**
   * Create or update Printful configuration
   */
  async saveConfig(
    createConfigDto: CreatePrintfulConfigDto,
  ): Promise<PrintfulConfigResponseDto> {
    try {
      // Check if config already exists
      const existing = await this.printfulConfigModel.findOne();

      if (existing) {
        // Update existing
        Object.assign(existing, createConfigDto);
        await existing.save();
        return this.mapConfigToDto(existing);
      }

      // Create new
      const config = new this.printfulConfigModel(createConfigDto);
      await config.save();
      return this.mapConfigToDto(config);
    } catch (error) {
      this.logger.error(`Failed to save config: ${error.message}`);
      throw new BadRequestException(`Failed to save config: ${error.message}`);
    }
  }

  /**
   * Get current Printful configuration
   */
  async getConfig(): Promise<PrintfulConfigResponseDto | null> {
    try {
      const config = await this.printfulConfigModel.findOne();
      return config ? this.mapConfigToDto(config) : null;
    } catch (error) {
      this.logger.error(`Failed to get config: ${error.message}`);
      throw new BadRequestException(`Failed to get config: ${error.message}`);
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<{ success: boolean; message: string; storeInfo?: any }> {
    try {
      // Use products catalog endpoint instead of store (doesn't require store permissions)
      const response = await this.apiClient.get('/products');
      return {
        success: true,
        message: 'Connection successful - Printful API is working',
        storeInfo: {
          productsCount: response.data.result?.length || 0,
          apiVersion: 'v1',
        },
      };
    } catch (error) {
      this.logger.error(`Connection test failed: ${error.message}`);
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
      };
    }
  }

  async testGCSConnection(): Promise<{ success: boolean; message: string; bucketName?: string }> {
    try {
      this.logger.log('Testing Google Cloud Storage connection...');
      
      const isConnected = await this.storageService.testConnection();
      
      if (isConnected) {
        return {
          success: true,
          message: 'Successfully connected to Google Cloud Storage',
          bucketName: process.env.GCS_BUCKET_NAME,
        };
      } else {
        return {
          success: false,
          message: 'GCS bucket not accessible or does not exist',
        };
      }
    } catch (error) {
      this.logger.error(`GCS connection failed: ${error.message}`);
      return {
        success: false,
        message: `GCS connection failed: ${error.message}`,
      };
    }
  }

  // ==================== File Library ====================

  /**
   * Upload design file to Printful File Library
   */
  async uploadDesign(
    uploadDesignDto: UploadDesignDto,
  ): Promise<UploadDesignResponseDto> {
    try {
      this.logger.log(`Uploading design file: ${uploadDesignDto.filename}`);

      // Validate file format
      const allowedFormats = ['.png', '.jpg', '.jpeg', '.pdf', '.ai', '.eps'];
      const fileExt = uploadDesignDto.filename.toLowerCase().match(/\.[^.]+$/)?.[0];
      
      if (!fileExt || !allowedFormats.includes(fileExt)) {
        throw new BadRequestException(
          `Invalid file format. Allowed: ${allowedFormats.join(', ')}`,
        );
      }

      // Determine MIME type
      const mimeTypes: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.pdf': 'application/pdf',
        '.ai': 'application/postscript',
        '.eps': 'application/postscript',
      };

      // For now, use a placeholder approach or URL
      // Printful's file API is complex and may require posting to a temp URL first
      // Let's use a simpler approach: just return the base64 data URL
      // The mockup generator can use this directly
      
      const mimeType = mimeTypes[fileExt] || 'application/octet-stream';
      const dataUrl = `data:${mimeType};base64,${uploadDesignDto.file}`;
      
      // Upload to Google Cloud Storage for public access
      this.logger.log('Uploading design to Google Cloud Storage...');
      
      const buffer = Buffer.from(uploadDesignDto.file, 'base64');
      const fileId = Date.now();
      
      try {
        // Upload to GCS
        const publicUrl = await this.storageService.uploadFile(
          buffer,
          uploadDesignDto.filename,
          mimeType,
        );
        
        this.logger.log(`File uploaded to GCS. Public URL: ${publicUrl}`);
        
        return {
          fileId,
          url: publicUrl,
          thumbnailUrl: publicUrl,
          type: 'default',
          size: buffer.length,
        };
      } catch (gcsError) {
        this.logger.error(`GCS upload failed: ${gcsError.message}`);
        this.logger.error(`GCS error stack: ${gcsError.stack}`);
        
        // Don't fall back to local storage - throw error instead
        // Localhost URLs won't work with Printful's mockup generator
        throw new BadRequestException(`Failed to upload design to cloud storage: ${gcsError.message}`);
      }
    } catch (error) {
      this.logger.error(`Failed to upload design: ${error.message}`);
      if (error.response?.data) {
        this.logger.error(`Printful API response: ${JSON.stringify(error.response.data)}`);
      }
      throw new BadRequestException(`Failed to upload design: ${error.message}`);
    }
  }

  /**
   * Get file from Printful Library
   */
  async getFile(fileId: number): Promise<any> {
    try {
      const response = await this.apiClient.get(`/files/${fileId}`);
      return response.data.result;
    } catch (error) {
      this.logger.error(`Failed to get file: ${error.message}`);
      throw new NotFoundException(`File not found: ${fileId}`);
    }
  }

  // ==================== Sync Products ====================

  /**
   * Create customer product with design
   */
  async createCustomerProduct(
    createProductDto: CreatePrintfulProductDto,
  ): Promise<PrintfulProductResponseDto> {
    try {
      this.logger.log(`Creating Printful product: ${createProductDto.productName}`);

      // For the minimal flow, we'll just save to our database
      // and skip creating in Printful's sync products (which requires more setup)
      // The mockup generator can work directly with product IDs and design URLs
      
      // Generate a mock sync product ID
      const mockSyncProductId = Date.now();
      const mockSyncVariantId = mockSyncProductId + 1;

      // Save to our database
      const dbProduct = new this.syncProductModel({
        printfulSyncProductId: mockSyncProductId,
        printfulSyncVariantIds: [mockSyncVariantId],
        printfulFileId: createProductDto.fileId,
        customerDesignUrl: '', // Store original if needed
        productType: createProductDto.productType,
        productName: createProductDto.productName,
        syncStatus: 'created',
        customerId: createProductDto.customerId,
        metadata: {
          variantId: createProductDto.variantId,
          placement: createProductDto.placement,
        },
      });

      await dbProduct.save();

      this.logger.log(`Product saved to database with ID: ${dbProduct._id}`);

      return {
        syncProductId: mockSyncProductId,
        syncVariantIds: [mockSyncVariantId],
        productName: createProductDto.productName,
        productType: createProductDto.productType,
        fileId: createProductDto.fileId,
        thumbnailUrl: '',
        status: 'created',
      };
    } catch (error) {
      this.logger.error(`Failed to create product: ${error.message}`);
      throw new BadRequestException(`Failed to create product: ${error.message}`);
    }
  }

  /**
   * Get sync product by ID
   */
  async getSyncProduct(syncProductId: number): Promise<any> {
    try {
      const response = await this.apiClient.get(`/sync/products/${syncProductId}`);
      return response.data.result;
    } catch (error) {
      this.logger.error(`Failed to get sync product: ${error.message}`);
      throw new NotFoundException(`Sync product not found: ${syncProductId}`);
    }
  }

  /**
   * List all sync products
   */
  async listSyncProducts(status?: string): Promise<PrintfulSyncProductDocument[]> {
    try {
      const query = status ? { syncStatus: status } : {};
      return await this.syncProductModel
        .find(query)
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      this.logger.error(`Failed to list sync products: ${error.message}`);
      throw new BadRequestException(`Failed to list sync products: ${error.message}`);
    }
  }

  // ==================== Products ====================

  /**
   * List all Printful products
   */
  async listProducts(): Promise<any> {
    try {
      const response = await this.retryWithBackoff(() =>
        this.apiClient.get('/products')
      );
      
      return {
        products: response.data.result.map((product: any) => ({
          id: product.id,
          type: product.type,
          type_name: product.type_name,
          brand: product.brand,
          model: product.model,
          image: product.image,
          variant_count: product.variants?.length || 0,
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to list products: ${error.message}`);
      throw new BadRequestException(`Failed to list products: ${error.message}`);
    }
  }

  /**
   * Get variants for a specific product
   */
  async getProductVariants(productId: number): Promise<any> {
    try {
      const response = await this.retryWithBackoff(() =>
        this.apiClient.get(`/products/${productId}`)
      );
      
      const product = response.data.result;
      
      return {
        product: {
          id: product.id,
          type: product.type,
          type_name: product.type_name,
          brand: product.brand,
          model: product.model,
        },
        variants: product.variants.map((variant: any) => ({
          id: variant.id,
          name: variant.name,
          size: variant.size,
          color: variant.color,
          color_code: variant.color_code,
          image: variant.image,
          // Printful returns prices in format "109.00" which represents $10.90 USD
          // We need to divide by 10 to get the actual USD price
          price: (parseFloat(variant.price) / 10).toFixed(2),
          in_stock: variant.in_stock,
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to get product variants: ${error.message}`);
      throw new BadRequestException(`Failed to get product variants: ${error.message}`);
    }
  }

  // ==================== Mockup Generator ====================

  /**
   * Generate mockup - SIMPLIFIED version that auto-fetches variants
   * This is the recommended endpoint to use from the frontend
   */
  async generateMockupSimple(dto: any): Promise<MockupResponseDto> {
    try {
      this.logger.log(`[SIMPLE] Generating mockup for product: ${dto.productId}`);
      
      // Step 1: Fetch product details to get variants
      const productResponse = await this.retryWithBackoff(() =>
        this.apiClient.get(`/products/${dto.productId}`)
      );
      const product = productResponse.data.result;
      
      // Step 2: Select variants (use specified or pick first few)
      let variantIds: number[];
      if (dto.variantIds && dto.variantIds.length > 0) {
        variantIds = dto.variantIds;
        this.logger.log(`Using specified variants: ${variantIds.join(', ')}`);
      } else {
        // Auto-select first N in-stock variants
        const maxVariants = dto.maxVariants || 3;
        const inStockVariants = product.variants
          .filter((v: any) => v.in_stock !== false)
          .slice(0, maxVariants)
          .map((v: any) => v.id);
        
        if (inStockVariants.length === 0) {
          throw new BadRequestException('No in-stock variants available for this product');
        }
        
        variantIds = inStockVariants;
        this.logger.log(`Auto-selected ${variantIds.length} variants: ${variantIds.join(', ')}`);
      }
      
      // Step 3: Auto-detect image dimensions
      this.logger.log('Downloading image to detect dimensions...');
      const axios = require('axios');
      const imageResponse = await axios.get(dto.imageUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(imageResponse.data);
      
      const sharp = require('sharp');
      const metadata = await sharp(buffer).metadata();
      
      if (!metadata.width || !metadata.height) {
        throw new BadRequestException('Could not determine image dimensions');
      }
      
      this.logger.log(`Image dimensions: ${metadata.width}x${metadata.height}`);
      
      // Step 4: Calculate position
      const positionResult = await this.calculatePosition({
        productId: dto.productId,
        variantId: variantIds[0],
        imageWidth: metadata.width,
        imageHeight: metadata.height,
        placement: dto.placement || 'front',
      });
      
      // Step 5: Generate mockup
      return await this.generateMockup({
        productId: dto.productId,
        variantIds: variantIds,
        files: [{
          placement: dto.placement || 'front',
          image_url: dto.imageUrl,
          position: positionResult.position,
        }],
      });
    } catch (error) {
      this.logger.error(`[SIMPLE] Failed to generate mockup: ${error.message}`);
      throw new BadRequestException(`Failed to generate mockup: ${error.message}`);
    }
  }

  /**
   * Generate product mockups (ADVANCED version - requires manual setup)
   * Use generateMockupSimple() instead for easier integration
   */
  async generateMockup(generateMockupDto: GenerateMockupDto): Promise<MockupResponseDto> {
    try {
      this.logger.log(`Generating mockup for product: ${generateMockupDto.productId}, variants: ${generateMockupDto.variantIds.join(', ')}`);
      
      // Validate that variants belong to the product
      try {
        const productResponse = await this.retryWithBackoff(() =>
          this.apiClient.get(`/products/${generateMockupDto.productId}`)
        );
        const product = productResponse.data.result;
        const productVariantIds = product.variants.map((v: any) => v.id);
        
        const invalidVariants = generateMockupDto.variantIds.filter(
          vid => !productVariantIds.includes(vid)
        );
        
        if (invalidVariants.length > 0) {
          this.logger.error(
            `Invalid variant IDs for product ${generateMockupDto.productId}: ${invalidVariants.join(', ')}`
          );
          this.logger.error(`Valid variant IDs for this product: ${productVariantIds.join(', ')}`);
          throw new BadRequestException(
            `Variant IDs [${invalidVariants.join(', ')}] do not belong to product ${generateMockupDto.productId}. ` +
            `Valid variants: [${productVariantIds.slice(0, 5).join(', ')}${productVariantIds.length > 5 ? '...' : ''}]`
          );
        }
      } catch (validationError) {
        if (validationError instanceof BadRequestException) {
          throw validationError;
        }
        this.logger.warn(`Could not validate variants: ${validationError.message}`);
      }
      
      // Process files
      const processedFiles = await Promise.all(
        generateMockupDto.files.map(async (file) => {
          let imageUrl = file.image_url;
          
          // If it's a data URL, we need to convert it to a public URL
          if (imageUrl.startsWith('data:')) {
            this.logger.log('Data URL detected - converting to public URL');
            
            try {
              // Extract base64 and filename from data URL
              const matches = imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
              if (matches && matches[2]) {
                const base64Data = matches[2];
                const mimeType = matches[1];
                const extension = mimeType.includes('png') ? 'png' : 'jpg';
                
                const uploadResult = await this.uploadDesign({
                  file: base64Data,
                  filename: `design_${Date.now()}.${extension}`,
                });
                
                imageUrl = uploadResult.url; // Use the public URL
                this.logger.log(`File saved. Using URL: ${imageUrl}`);
              }
            } catch (uploadError) {
              this.logger.error(`Failed to save file for mockup: ${uploadError.message}`);
              throw new BadRequestException('Failed to save design file');
            }
          } else if (imageUrl.startsWith('http://localhost') || imageUrl.startsWith('http://127.0.0.1')) {
            // This should not happen anymore - all files should be uploaded to GCS first
            this.logger.error('Localhost URL detected - this indicates GCS upload failed');
            throw new BadRequestException('Design file must be publicly accessible. Localhost URLs cannot be used.');
          } else {
            this.logger.log(`Using provided URL: ${imageUrl}`);
          }
          
          // If position is not provided, try to auto-calculate it
          let position = file.position;
          
          if (!position) {
            this.logger.warn('Position not provided, attempting to auto-calculate...');
            
            try {
              // Try to get image dimensions from the URL
              // This is a fallback - ideally the frontend should calculate and send position
              const axios = require('axios');
              const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
              const buffer = Buffer.from(imageResponse.data);
              
              // Get image dimensions using sharp
              const sharp = require('sharp');
              const metadata = await sharp(buffer).metadata();
              
              if (metadata.width && metadata.height) {
                this.logger.log(`Auto-detected image dimensions: ${metadata.width}x${metadata.height}`);
                
                // Calculate position for this product/variant
                const positionCalc = await this.calculatePosition({
                  productId: generateMockupDto.productId,
                  variantId: generateMockupDto.variantIds[0], // Use first variant
                  imageWidth: metadata.width,
                  imageHeight: metadata.height,
                  placement: file.placement || 'front',
                });
                
                position = positionCalc.position;
                this.logger.log(`Auto-calculated position: ${JSON.stringify(position)}`);
              } else {
                throw new Error('Could not determine image dimensions');
              }
            } catch (autoCalcError) {
              this.logger.error(`Failed to auto-calculate position: ${autoCalcError.message}`);
              
              // Use sensible defaults as last resort
              this.logger.warn('Using default position as fallback');
              position = {
                area_width: 1800,
                area_height: 2400,
                width: 1800,
                height: 2400,
                top: 0,
                left: 0,
              };
            }
          }

          return {
            placement: file.placement,
            image_url: imageUrl,
            position: position,
          };
        }),
      );
      
      const requestBody = {
        variant_ids: generateMockupDto.variantIds,
        format: 'jpg',
        files: processedFiles,
      };
      
      this.logger.debug(`Mockup request body: ${JSON.stringify(requestBody, null, 2)}`);

      // Create mockup task (with retry logic for rate limiting)
      const response = await this.retryWithBackoff(() =>
        this.apiClient.post(
          `/mockup-generator/create-task/${generateMockupDto.productId}`,
          requestBody,
        )
      );

      const result = response.data.result;

      return {
        taskKey: result.task_key,
        status: result.status,
      };
    } catch (error) {
      this.logger.error(`Failed to generate mockup: ${error.message}`);
      if (error.response?.data) {
        this.logger.error(`Printful error details: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      throw new BadRequestException(`Failed to generate mockup: ${error.message}`);
    }
  }

  /**
   * Check mockup generation status
   */
  async getMockupStatus(taskKey: string): Promise<MockupResponseDto> {
    try {
      const response = await this.apiClient.get(
        `/mockup-generator/task`,
        { params: { task_key: taskKey } },
      );

      const result = response.data.result;

      return {
        taskKey: result.task_key,
        status: result.status,
        mockups: result.mockups || [],
        error: result.error,
      };
    } catch (error) {
      this.logger.error(`Failed to get mockup status: ${error.message}`);
      throw new BadRequestException(`Failed to get mockup status: ${error.message}`);
    }
  }

  // ==================== Catalog ====================

  /**
   * Get Printful catalog products
   */
  async getCatalog(): Promise<any[]> {
    try {
      const response = await this.apiClient.get('/products');
      return response.data.result;
    } catch (error) {
      this.logger.error(`Failed to get catalog: ${error.message}`);
      throw new BadRequestException(`Failed to get catalog: ${error.message}`);
    }
  }

  /**
   * Get product details by ID
   */
  async getProduct(productId: number): Promise<any> {
    try {
      const response = await this.apiClient.get(`/products/${productId}`);
      return response.data.result.product; // Return the product object directly
    } catch (error) {
      this.logger.error(`Failed to get product: ${error.message}`);
      throw new NotFoundException(`Product not found: ${productId}`);
    }
  }

  /**
   * Get size guide/size table for a product
   */
  async getSizeGuide(productId: number): Promise<any> {
    try {
      const response = await this.apiClient.get(`/products/${productId}`);
      const product = response.data.result.product;
      
      // Printful returns size_tables as an array
      return {
        productId: product.id,
        productName: product.type_name,
        sizeTables: product.size_tables || [],
      };
    } catch (error) {
      this.logger.error(`Failed to get size guide: ${error.message}`);
      throw new NotFoundException(`Size guide not found for product: ${productId}`);
    }
  }

  // ==================== Orders ====================

  /**
   * Create complete order with custom design (full workflow)
   * 1. Upload design file to GCS
   * 2. Create sync product in Printful
   * 3. Create order in Printful
   */
  async createCompleteOrder(orderData: any): Promise<any> {
    try {
      this.logger.log('=== Starting Complete Order Workflow ===');
      const { recipient, items, shipping_method, shipping_cost, tax_amount } = orderData;
      
      // Log shipping details if provided
      if (shipping_method) {
        this.logger.log(`Shipping method: ${shipping_method}`);
        this.logger.log(`Shipping cost: $${shipping_cost || 0}`);
        this.logger.log(`Tax amount: $${tax_amount || 0}`);
      }
      
      // Process each item
      const processedItems: Array<{ sync_variant_id: number; quantity: number }> = [];
      
      for (const item of items) {
        this.logger.log(`Processing item: ${item.productType}`);
        
        let syncVariantId = item.variantId;
        
        // If item has custom design, we need to create a sync product
        if (item.design && item.design.fileDataUrl) {
          this.logger.log('Item has custom design, creating sync product...');
          
          // Step 1: Extract base64 data and upload to GCS
          const base64Match = item.design.fileDataUrl.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
          if (!base64Match) {
            throw new BadRequestException('Invalid image data format');
          }
          
          const extension = base64Match[1] === 'jpeg' ? 'jpg' : base64Match[1];
          const base64Data = base64Match[2];
          
          const uploadResult = await this.uploadDesign({
            file: base64Data,
            filename: `custom_design_${Date.now()}.${extension}`,
          });
          
          this.logger.log(`Design uploaded to: ${uploadResult.url}`);
          
          // Step 2: Create sync product with the design
          const syncProductData = {
            sync_product: {
              name: `Custom ${item.productType} - ${Date.now()}`,
              thumbnail: uploadResult.url,
            },
            sync_variants: [
              {
                variant_id: item.variantId,
                retail_price: item.price || '25.00',
                files: [
                  {
                    url: uploadResult.url,
                  },
                ],
              },
            ],
          };
          
          this.logger.log('Creating sync product in Printful...');
          this.logger.log(JSON.stringify(syncProductData, null, 2));
          
          const syncResponse = await this.apiClient.post('/store/products', syncProductData);
          const createdProduct = syncResponse.data.result;
          
          this.logger.log('Sync product created:');
          this.logger.log(JSON.stringify(createdProduct, null, 2));
          
          // The create response only returns basic info, need to fetch full product details
          const syncProductId = createdProduct.id;
          this.logger.log(`Fetching full sync product details for ID: ${syncProductId}`);
          
          const fullProductResponse = await this.apiClient.get(`/store/products/${syncProductId}`);
          const fullProduct = fullProductResponse.data.result;
          
          this.logger.log('Full sync product details:');
          this.logger.log(JSON.stringify(fullProduct, null, 2));
          
          // Get the sync variant ID from the full product details
          if (!fullProduct.sync_variants || fullProduct.sync_variants.length === 0) {
            throw new BadRequestException('Sync product was created but has no variants');
          }
          
          syncVariantId = fullProduct.sync_variants[0].id;
          
          this.logger.log(`Sync variant ID: ${syncVariantId}`);
        }
        
        // Add to processed items
        processedItems.push({
          sync_variant_id: syncVariantId,
          quantity: item.quantity,
        });
      }
      
      // Step 3: Create order in Printful
      this.logger.log('=== Step 3: Creating Order in Printful ===');
      this.logger.log(`Processed ${processedItems.length} items`);
      
      // Clean up recipient data - remove undefined values
      const cleanRecipient: any = {
        name: recipient.name,
        address1: recipient.address1,
        city: recipient.city,
        country_code: recipient.country_code,
        zip: recipient.zip,
      };
      
      // Add optional fields only if they exist
      if (recipient.address2) cleanRecipient.address2 = recipient.address2;
      if (recipient.state_code) cleanRecipient.state_code = recipient.state_code;
      if (recipient.email) cleanRecipient.email = recipient.email;
      if (recipient.phone) cleanRecipient.phone = recipient.phone;
      
      const printfulOrderData: any = {
        recipient: cleanRecipient,
        items: processedItems,
        confirm: false, // Create as draft order
      };
      
      // Add shipping method if provided
      if (shipping_method) {
        printfulOrderData.shipping = shipping_method;
      }
      
      // Add retail costs (what customer paid) for tracking
      if (shipping_cost !== undefined || tax_amount !== undefined) {
        printfulOrderData.retail_costs = {
          shipping: shipping_cost ? shipping_cost.toFixed(2) : undefined,
          tax: tax_amount ? tax_amount.toFixed(2) : undefined,
        };
      }
      
      this.logger.log('Order data to send to Printful:');
      this.logger.log(JSON.stringify(printfulOrderData, null, 2));
      
      try {
        this.logger.log('Calling Printful API: POST /orders');
        const orderResponse = await this.apiClient.post('/orders', printfulOrderData);
        const createdOrder = orderResponse.data.result;
        
        this.logger.log('=== Order Created Successfully ===');
        this.logger.log(`Order ID: ${createdOrder.id}`);
        this.logger.log(`Order Status: ${createdOrder.status}`);
        this.logger.log('Full order details:');
        this.logger.log(JSON.stringify(createdOrder, null, 2));
        
        // Enhance the response with our custom shipping/tax data
        return {
          ...createdOrder,
          custom_shipping_cost: shipping_cost,
          custom_tax_amount: tax_amount,
          custom_shipping_method: shipping_method,
        };
      } catch (orderError) {
        this.logger.error('=== Order Creation Failed ===');
        this.logger.error(`Error message: ${orderError.message}`);
        
        if (orderError.response) {
          this.logger.error(`HTTP Status: ${orderError.response.status}`);
          this.logger.error('Printful API Error Response:');
          this.logger.error(JSON.stringify(orderError.response.data, null, 2));
          
          if (orderError.response.data?.error) {
            this.logger.error(`Printful Error Code: ${orderError.response.data.error.code}`);
            this.logger.error(`Printful Error Message: ${orderError.response.data.error.message}`);
          }
        }
        
        throw orderError; // Re-throw to be caught by outer catch
      }
      
    } catch (error) {
      this.logger.error(`Failed to create complete order: ${error.message}`);
      
      if (error.response) {
        this.logger.error('Printful API Response:');
        this.logger.error(JSON.stringify(error.response.data, null, 2));
      }
      
      const errorMessage = error.response?.data?.error?.message || error.message;
      throw new BadRequestException(`Failed to create order: ${errorMessage}`);
    }
  }

  /**
   * Create order in Printful (manual fulfillment)
   */
  async createOrder(orderData: any): Promise<any> {
    try {
      this.logger.log('Creating Printful order with data:');
      this.logger.log(JSON.stringify(orderData, null, 2));
      
      const response = await this.apiClient.post('/orders', orderData);
      return response.data.result;
    } catch (error) {
      this.logger.error(`Failed to create order: ${error.message}`);
      
      // Log detailed error from Printful
      if (error.response) {
        this.logger.error('Printful API Response:');
        this.logger.error(JSON.stringify(error.response.data, null, 2));
      }
      
      const errorMessage = error.response?.data?.error?.message || error.message;
      throw new BadRequestException(`Failed to create order: ${errorMessage}`);
    }
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: number): Promise<any> {
    try {
      const response = await this.apiClient.get(`/orders/${orderId}`);
      return response.data.result;
    } catch (error) {
      this.logger.error(`Failed to get order: ${error.message}`);
      throw new NotFoundException(`Order not found: ${orderId}`);
    }
  }

  /**
   * List orders
   */
  async listOrders(status?: string): Promise<any[]> {
    try {
      const params = status ? { status } : {};
      const response = await this.apiClient.get('/orders', { params });
      return response.data.result;
    } catch (error) {
      this.logger.error(`Failed to list orders: ${error.message}`);
      throw new BadRequestException(`Failed to list orders: ${error.message}`);
    }
  }

  // ==================== Shipping ====================

  /**
   * Calculate shipping rates with multiple methods
   */
  async calculateShippingRates(dto: any): Promise<any> {
    try {
      this.logger.log(`Calculating shipping rates for ${dto.recipient.country_code}`);

      // Add default state codes if missing for countries that require it (US, CA, AU)
      // This prevents 400 Bad Request errors when user hasn't provided a state
      let stateCode = dto.recipient.state_code;
      if (!stateCode) {
        if (dto.recipient.country_code === 'US') stateCode = 'CA'; // California
        else if (dto.recipient.country_code === 'CA') stateCode = 'ON'; // Ontario
        else if (dto.recipient.country_code === 'AU') stateCode = 'NSW'; // New South Wales
        
        if (stateCode) {
          this.logger.log(`Using default state code '${stateCode}' for ${dto.recipient.country_code}`);
        }
      }

      // Build Printful shipping request
      const printfulRequest = {
        recipient: {
          country_code: dto.recipient.country_code,
          state_code: stateCode,
          city: dto.recipient.city,
          zip: dto.recipient.zip,
        },
        items: dto.items.map((item: any) => ({
          variant_id: item.variant_id,
          quantity: item.quantity,
        })),
        currency: dto.currency || 'USD',
      };

      const response = await this.retryWithBackoff(() =>
        this.apiClient.post('/shipping/rates', printfulRequest)
      );

      const shippingRates = response.data.result || [];
      
      // Transform Printful response to our format
      const shippingMethods = shippingRates.map((rate: any) => ({
        id: rate.id,
        name: rate.name || rate.id,
        rate: parseFloat(rate.rate || '0'),
        currency: dto.currency || 'USD',
        min_delivery_days: rate.minDeliveryDays,
        max_delivery_days: rate.maxDeliveryDays,
        delivery_estimate: this.formatDeliveryEstimate(rate.minDeliveryDays, rate.maxDeliveryDays),
      }));

      this.logger.log(`Found ${shippingMethods.length} shipping methods`);

      return {
        shipping_methods: shippingMethods,
        currency: dto.currency || 'USD',
        is_estimated: false,
      };
    } catch (error) {
      this.logger.error(`Failed to calculate shipping rates: ${error.message}`);
      if (error.response?.data) {
        this.logger.error(`Printful API error: ${JSON.stringify(error.response.data)}`);
      }
      throw new BadRequestException(`Failed to calculate shipping rates: ${error.message}`);
    }
  }

  /**
   * Get estimated shipping for a country (simplified for product browsing)
   */
  async getEstimatedShippingForCountry(dto: any): Promise<any> {
    try {
      this.logger.log(`Estimating shipping for country: ${dto.country_code}`);

      // Use a sample item for estimation
      // Using variant ID 4011 (Bella + Canvas 3001 Unisex T-Shirt - Small/White) as a standard reference
      const sampleVariantId = dto.variant_id || 4011;

      // Add default state codes for countries that require them for accurate estimation
      let stateCode: string | undefined;
      if (dto.country_code === 'US') stateCode = 'CA'; // California as default
      else if (dto.country_code === 'CA') stateCode = 'ON'; // Ontario as default
      else if (dto.country_code === 'AU') stateCode = 'NSW'; // New South Wales as default

      const printfulRequest = {
        recipient: {
          country_code: dto.country_code,
          state_code: stateCode,
        },
        items: [
          {
            variant_id: sampleVariantId,
            quantity: 1,
          },
        ],
        currency: 'USD',
      };

      const response = await this.retryWithBackoff(() =>
        this.apiClient.post('/shipping/rates', printfulRequest)
      );

      const shippingRates = response.data.result || [];
      
      // Return the cheapest (standard) shipping option as estimate
      const standardShipping = shippingRates.find((rate: any) => 
        rate.id === 'STANDARD' || rate.name?.toLowerCase().includes('standard')
      ) || shippingRates[0];

      if (!standardShipping) {
        this.logger.warn(`No shipping rates found for ${dto.country_code}, using default`);
        return {
          shipping_methods: [{
            id: 'STANDARD',
            name: 'STANDARD',
            rate: 5.00, // Default fallback
            currency: 'USD',
            delivery_estimate: '7-14 business days',
          }],
          currency: 'USD',
          is_estimated: true,
        };
      }

      const shippingMethods = [{
        id: standardShipping.id,
        name: standardShipping.name || 'STANDARD',
        rate: parseFloat(standardShipping.rate || '0'),
        currency: 'USD',
        min_delivery_days: standardShipping.minDeliveryDays,
        max_delivery_days: standardShipping.maxDeliveryDays,
        delivery_estimate: this.formatDeliveryEstimate(
          standardShipping.minDeliveryDays,
          standardShipping.maxDeliveryDays
        ),
      }];

      this.logger.log(`Estimated shipping for ${dto.country_code}: $${shippingMethods[0].rate}`);

      return {
        shipping_methods: shippingMethods,
        currency: 'USD',
        is_estimated: true,
      };
    } catch (error) {
      this.logger.error(`Failed to estimate shipping: ${error.message}`);
      
      // Return a reasonable default instead of failing
      return {
        shipping_methods: [{
          id: 'STANDARD',
          name: 'STANDARD',
          rate: 5.00,
          currency: 'USD',
          delivery_estimate: '7-14 business days',
        }],
        currency: 'USD',
        is_estimated: true,
      };
    }
  }

  /**
   * Calculate tax for order
   */
  async calculateTax(dto: any): Promise<any> {
    try {
      this.logger.log(`Calculating tax for ${dto.recipient.country_code}`);

      // Printful includes tax in their order calculation
      // For now, we'll implement a simplified tax calculation
      // In production, you may want to integrate with a tax service like TaxJar or Avalara

      const taxRates: Record<string, number> = {
        // US states with sales tax (simplified - actual rates vary by county/city)
        'US-CA': 0.0725, // California
        'US-NY': 0.04,   // New York
        'US-TX': 0.0625, // Texas
        'US-FL': 0.06,   // Florida
        // EU countries with VAT
        'GB': 0.20,      // UK VAT
        'DE': 0.19,      // Germany VAT
        'FR': 0.20,      // France VAT
        'IT': 0.22,      // Italy VAT
        'ES': 0.21,      // Spain VAT
        'NL': 0.21,      // Netherlands VAT
        // Other countries
        'CA': 0.05,      // Canada GST (provinces add PST)
        'AU': 0.10,      // Australia GST
        'JP': 0.10,      // Japan consumption tax
        'HK': 0.00,      // Hong Kong - no sales tax
        'SG': 0.08,      // Singapore GST
      };

      // Determine tax key (country code or country-state for US)
      let taxKey = dto.recipient.country_code;
      if (dto.recipient.country_code === 'US' && dto.recipient.state_code) {
        taxKey = `US-${dto.recipient.state_code}`;
      }

      const taxRate = taxRates[taxKey] || 0;
      const taxableAmount = dto.subtotal + (dto.shipping_cost || 0);
      const totalTax = Math.round(taxableAmount * taxRate * 100) / 100;

      const taxRequired = taxRate > 0;
      const taxType = dto.recipient.country_code === 'US' ? 'Sales Tax' : 
                      ['GB', 'DE', 'FR', 'IT', 'ES', 'NL'].includes(dto.recipient.country_code) ? 'VAT' :
                      'Tax';

      this.logger.log(`Tax calculation: ${taxableAmount} * ${taxRate} = ${totalTax}`);

      return {
        total_tax: totalTax,
        currency: dto.currency || 'USD',
        breakdown: taxRequired ? [{
          type: taxType,
          rate: taxRate * 100, // Convert to percentage
          amount: totalTax,
        }] : [],
        tax_required: taxRequired,
      };
    } catch (error) {
      this.logger.error(`Failed to calculate tax: ${error.message}`);
      // Return zero tax on error rather than failing
      return {
        total_tax: 0,
        currency: dto.currency || 'USD',
        breakdown: [],
        tax_required: false,
      };
    }
  }

  /**
   * Calculate shipping rates (legacy method for backward compatibility)
   */
  async calculateShipping(recipient: any, items: any[]): Promise<any> {
    try {
      const response = await this.apiClient.post('/shipping/rates', {
        recipient,
        items,
      });
      return response.data.result;
    } catch (error) {
      this.logger.error(`Failed to calculate shipping: ${error.message}`);
      throw new BadRequestException(`Failed to calculate shipping: ${error.message}`);
    }
  }

  /**
   * Helper: Format delivery estimate from days
   */
  private formatDeliveryEstimate(minDays?: number, maxDays?: number): string {
    if (!minDays && !maxDays) {
      return '7-14 business days';
    }
    if (minDays && maxDays) {
      return `${minDays}-${maxDays} business days`;
    }
    if (minDays) {
      return `${minDays}+ business days`;
    }
    return `Up to ${maxDays} business days`;
  }

  // ==================== Helper Methods ====================

  /**
   * Helper: Retry logic for rate-limited requests
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000,
  ): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        // Check if it's a rate limit error (429)
        const isRateLimit = error.response?.status === 429 || error.response?.data?.code === 429;
        const retryAfter = error.response?.data?.error?.message?.match(/after (\d+) seconds/)?.[1];
        
        if (isRateLimit && attempt < maxRetries) {
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : initialDelay * Math.pow(2, attempt);
          this.logger.warn(
            `Rate limited by Printful. Retrying after ${delay}ms (attempt ${attempt + 1}/${maxRetries})`,
          );
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // If not rate limit or max retries reached, throw the error
        throw error;
      }
    }
    throw new Error('Max retries exceeded');
  }

  /**
   * Calculate optimal position for design based on print area
   */
  async calculatePosition(calculateDto: any): Promise<any> {
    try {
      // Get mockup generator template for accurate dimensions
      this.logger.log(`Fetching mockup template for product ${calculateDto.productId}...`);
      
      const templateResponse = await this.retryWithBackoff(() =>
        this.apiClient.get(`/mockup-generator/templates/${calculateDto.productId}`)
      );
      
      const templates = templateResponse.data.result.templates;
      if (!templates || templates.length === 0) {
        throw new BadRequestException('No mockup templates found for this product');
      }
      
      // Use the first template (or find a specific one by style)
      const template = templates[0];
      
      // Find the print area for the requested placement
      const placement = calculateDto.placement || 'default';
      const printArea = template.print_areas?.find((pa: any) => 
        pa.placement === placement || 
        (placement === 'front' && pa.placement === 'default')
      );
      
      if (!printArea) {
        this.logger.warn(`Placement "${placement}" not found, using first available print area`);
        const firstPrintArea = template.print_areas?.[0];
        if (!firstPrintArea) {
          throw new BadRequestException('No print areas found in template');
        }
        return this.calculatePositionFromPrintArea(firstPrintArea, calculateDto);
      }

      return this.calculatePositionFromPrintArea(printArea, calculateDto);
    } catch (error) {
      this.logger.error(`Failed to calculate position: ${error.message}`);
      throw new BadRequestException(`Failed to calculate position: ${error.message}`);
    }
  }

  /**
   * Helper to calculate position from print area info
   */
  private calculatePositionFromPrintArea(printArea: any, calculateDto: any): any {
    // Print area dimensions from Printful template (in pixels)
    const printAreaWidth = printArea.width || 1800;
    const printAreaHeight = printArea.height || 2400;
    const placement = printArea.placement || calculateDto.placement || 'default';

    // Design dimensions
    const designWidth = calculateDto.imageWidth;
    const designHeight = calculateDto.imageHeight;
    const designAspectRatio = designWidth / designHeight;
    const printAreaAspectRatio = printAreaWidth / printAreaHeight;

    // Calculate scaled dimensions to fit within print area
    let scaledWidth: number;
    let scaledHeight: number;

    if (designAspectRatio > printAreaAspectRatio) {
      // Design is wider relative to print area - fit to width
      scaledWidth = printAreaWidth;
      scaledHeight = printAreaWidth / designAspectRatio;
    } else {
      // Design is taller relative to print area - fit to height
      scaledHeight = printAreaHeight;
      scaledWidth = printAreaHeight * designAspectRatio;
    }

    // Center the design in the print area
    const top = (printAreaHeight - scaledHeight) / 2;
    const left = (printAreaWidth - scaledWidth) / 2;

    const position = {
      area_width: printAreaWidth,
      area_height: printAreaHeight,
      width: Math.round(scaledWidth),
      height: Math.round(scaledHeight),
      top: Math.round(top),
      left: Math.round(left),
    };

    this.logger.log(`Calculated position for ${placement}: ${JSON.stringify(position)}`);
    this.logger.log(`Print area: ${printAreaWidth}x${printAreaHeight}, Design: ${designWidth}x${designHeight} (AR: ${designAspectRatio.toFixed(2)})`);
    this.logger.log(`Scaled: ${scaledWidth}x${scaledHeight}, Offset: top=${top}, left=${left}`);

    return {
      position,
      printArea: {
        width: printAreaWidth,
        height: printAreaHeight,
        placement,
      },
      design: {
        width: designWidth,
        height: designHeight,
        aspectRatio: designAspectRatio,
      },
    };
  }

  /**
   * Map config document to DTO
   */
  private mapConfigToDto(config: PrintfulConfigDocument): PrintfulConfigResponseDto {
    return {
      id: (config._id as any).toString(),
      apiKey: config.apiKey,
      storeId: config.storeId,
      webhookUrl: config.webhookUrl,
      autoFulfill: config.autoFulfill,
      active: config.active,
      createdAt: (config as any).createdAt || new Date(),
      updatedAt: (config as any).updatedAt || new Date(),
    };
  }
}

