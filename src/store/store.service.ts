import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  StoreProduct,
  StoreProductDocument,
  CachedData,
  StoreProductVariant,
} from './schemas/store-product.schema';
import {
  SiteTag,
  SiteTagDocument,
  ProductCategory,
  ProductCategoryDocument,
} from './schemas/category.schema';
import {
  CreateStoreProductDto,
  UpdateStoreProductDto,
  StoreProductResponseDto,
  StorefrontProductDto,
  ReorderProductsDto,
  ReorderProductsInCategoryDto,
  CreateSiteTagDto,
  UpdateSiteTagDto,
  SiteTagResponseDto,
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
  ProductCategoryResponseDto,
  ReorderDto,
} from './dto';
import { ImageProcessingService } from './image-processing.service';
import { PrintfulService } from '../printful/printful.service';
import { GCSUploadService } from '../gemini/gcs-upload.service';

@Injectable()
export class StoreService {
  private readonly logger = new Logger(StoreService.name);
  
  // Default markup percentage applied to base prices (50% = 1.5x)
  private readonly DEFAULT_MARKUP_PERCENTAGE = 0.50;;

  constructor(
    private configService: ConfigService,
    @InjectModel(StoreProduct.name)
    private storeProductModel: Model<StoreProductDocument>,
    @InjectModel(SiteTag.name)
    private siteTagModel: Model<SiteTagDocument>,
    @InjectModel(ProductCategory.name)
    private productCategoryModel: Model<ProductCategoryDocument>,
    private imageProcessingService: ImageProcessingService,
    private printfulService: PrintfulService,
    private gcsUploadService: GCSUploadService,
  ) {
    this.logger.log('Store service initialized successfully');
  }


  // ==================== STORE PRODUCTS MANAGEMENT ====================

  /**
   * Apply markup to base price
   */
  private applyMarkup(basePrice: number): number {
    return Math.round((basePrice * (1 + this.DEFAULT_MARKUP_PERCENTAGE)) * 100) / 100;
  }

  /**
   * Calculate marked up prices for variants
   */
  private calculateMarkedUpPrices(variantDetails: any[]): Array<{ variantId: number; price: number }> {
    return variantDetails.map(variant => ({
      variantId: variant.id,
      price: this.applyMarkup(parseFloat(variant.price)),
    }));
  }

  /**
   * Sync product data from Printful API
   */
  private async syncPrintfulProductData(
    printfulProductId: number,
  ): Promise<CachedData> {
    try {
      this.logger.log(
        `Syncing data for Printful product ${printfulProductId}`,
      );

      // Fetch product details from Printful
      const product = await this.printfulService.getProduct(printfulProductId);

      // Fetch variants for this product
      const variantsData = await this.printfulService.getProductVariants(printfulProductId);

      // Build cached data
      const cachedData: CachedData = {
        productTitle: product.title || product.type_name || `Product ${printfulProductId}`,
        productDescription: product.description || '',
        productType: product.type || '',
        brand: product.brand || '',
        images: product.image ? [product.image] : [],
        variantDetails: variantsData.variants || [],
      };

      return cachedData;
    } catch (error) {
      this.logger.error(`Failed to sync Printful product data: ${error.message}`);
      throw new BadRequestException(
        `Failed to sync Printful product data: ${error.message}`,
      );
    }
  }

  /**
   * Create a new store product
   */
  async createStoreProduct(
    createDto: CreateStoreProductDto,
  ): Promise<StoreProductResponseDto> {
    try {
      this.logger.log(
        `Creating store product for Printful product ${createDto.printfulProductId}`,
      );

      // Sync data from Printful
      const cachedData = await this.syncPrintfulProductData(
        createDto.printfulProductId,
      );

      // Apply automatic 50% markup to variant prices
      // If prices aren't provided in the DTO, calculate from base prices
      const variants = createDto.variants.map(v => {
        // Find the corresponding variant in cached data to get base price
        const cachedVariant = cachedData.variantDetails?.find(cv => cv.id === v.variantId);
        const basePrice = cachedVariant ? parseFloat(cachedVariant.price) : 0;
        
        return {
          variantId: v.variantId,
          // If price is explicitly provided, use it; otherwise apply markup
          price: v.price !== undefined ? v.price : this.applyMarkup(basePrice),
          enabled: v.enabled !== false,
        };
      });

      this.logger.log(
        `Applied ${this.DEFAULT_MARKUP_PERCENTAGE * 100}% markup to ${variants.length} variants`,
      );

      const storeProduct = new this.storeProductModel({
        printfulProductId: createDto.printfulProductId,
        variants,
        cachedData,
        lastSyncedAt: new Date(),
        customImages: createDto.customImages || [],
        visibility: createDto.visibility !== false,
        sortOrder: createDto.sortOrder || 0,
        featured: createDto.featured || false,
        categories: createDto.categories || [],
        translations: createDto.translations,
      });

      await storeProduct.save();

      return this.mapStoreProductToDto(storeProduct);
    } catch (error) {
      this.logger.error(`Failed to create store product: ${error.message}`);
      throw new BadRequestException(
        `Failed to create store product: ${error.message}`,
      );
    }
  }

  /**
   * Get all store products with optional filters
   */
  async getStoreProducts(
    visibility?: boolean,
    featured?: boolean,
  ): Promise<StoreProductResponseDto[]> {
    try {
      const query: any = {};
      if (visibility !== undefined) {
        query.visibility = visibility;
      }
      if (featured !== undefined) {
        query.featured = featured;
      }

      const products = await this.storeProductModel
        .find(query)
        .sort({ sortOrder: 1, createdAt: -1 });

      return products.map((p) => this.mapStoreProductToDto(p));
    } catch (error) {
      this.logger.error(`Failed to get store products: ${error.message}`);
      throw new BadRequestException(
        `Failed to get store products: ${error.message}`,
      );
    }
  }

  /**
   * Get a single store product by ID
   */
  async getStoreProduct(id: string): Promise<StoreProductResponseDto> {
    try {
      const product = await this.storeProductModel.findById(id);
      if (!product) {
        throw new NotFoundException(`Store product not found: ${id}`);
      }
      return this.mapStoreProductToDto(product);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to get store product: ${error.message}`);
      throw new BadRequestException(
        `Failed to get store product: ${error.message}`,
      );
    }
  }

  /**
   * Update a store product
   */
  async updateStoreProduct(
    id: string,
    updateDto: UpdateStoreProductDto,
  ): Promise<StoreProductResponseDto> {
    try {
      // Separate cachedData fields from other fields
      const { productTitle, productDescription, ...restUpdateDto } = updateDto;
      
      // Build update object
      const update: any = { $set: restUpdateDto };
      
      // Handle nested cachedData fields if provided
      if (productTitle !== undefined) {
        update.$set['cachedData.productTitle'] = productTitle;
      }
      if (productDescription !== undefined) {
        update.$set['cachedData.productDescription'] = productDescription;
      }

      const product = await this.storeProductModel.findByIdAndUpdate(
        id,
        update,
        { new: true },
      );

      if (!product) {
        throw new NotFoundException(`Store product not found: ${id}`);
      }

      return this.mapStoreProductToDto(product);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to update store product: ${error.message}`);
      throw new BadRequestException(
        `Failed to update store product: ${error.message}`,
      );
    }
  }

  /**
   * Delete a store product
   */
  async deleteStoreProduct(id: string): Promise<void> {
    try {
      const result = await this.storeProductModel.findByIdAndDelete(id);
      if (!result) {
        throw new NotFoundException(`Store product not found: ${id}`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to delete store product: ${error.message}`);
      throw new BadRequestException(
        `Failed to delete store product: ${error.message}`,
      );
    }
  }

  /**
   * Upload custom image for a store product
   */
  async uploadStoreProductImage(
    id: string,
    imageBuffer: Buffer,
    filename: string,
  ): Promise<string> {
    try {
      this.logger.log(`Uploading custom image for store product ${id}`);

      // Get product to verify it exists and check image count
      const product = await this.storeProductModel.findById(id);
      if (!product) {
        throw new NotFoundException(`Store product not found: ${id}`);
      }

      // Validate image count limit (max 10 images)
      if (product.customImages.length >= 10) {
        throw new BadRequestException(
          `Product already has maximum of 10 custom images`,
        );
      }

      // Determine mime type from filename
      const extension = filename.split('.').pop()?.toLowerCase();
      const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';

      // Upload to GCS
      const imageUrl = await this.gcsUploadService.uploadBuffer(
        imageBuffer,
        mimeType,
        `product-images/${id}`,
      );

      // Update store product with new image URL
      product.customImages.push(imageUrl);
      await product.save();

      this.logger.log(`Successfully uploaded image to GCS: ${imageUrl}`);
      return imageUrl;
    } catch (error) {
      this.logger.error(
        `Failed to upload store product image: ${error.message}`,
      );
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to upload store product image: ${error.message}`,
      );
    }
  }

  /**
   * Delete custom image from a store product
   */
  async deleteStoreProductImage(
    id: string,
    imageIndex: number,
  ): Promise<StoreProductResponseDto> {
    try {
      this.logger.log(`Deleting image ${imageIndex} from store product ${id}`);

      // Get product
      const product = await this.storeProductModel.findById(id);
      if (!product) {
        throw new NotFoundException(`Store product not found: ${id}`);
      }

      // Validate image index
      if (imageIndex < 0 || imageIndex >= product.customImages.length) {
        throw new BadRequestException(
          `Invalid image index: ${imageIndex}. Product has ${product.customImages.length} images.`,
        );
      }

      // Get the image URL to delete from GCS
      const imageUrl = product.customImages[imageIndex];
      
      // Remove from array
      product.customImages.splice(imageIndex, 1);
      await product.save();

      // Try to delete from GCS (don't fail if deletion fails)
      try {
        // Extract filename from GCS URL
        const urlParts = imageUrl.split('/');
        const fileName = urlParts.slice(-2).join('/'); // Get last two parts (folder/filename)
        
        // Note: GCS deletion would require additional implementation
        // For now we just remove from database
        this.logger.log(`Image removed from product. URL was: ${imageUrl}`);
      } catch (gcsError) {
        this.logger.warn(
          `Failed to delete image from GCS (non-critical): ${gcsError.message}`,
        );
      }

      this.logger.log(`Successfully deleted image ${imageIndex} from product ${id}`);
      return this.mapStoreProductToDto(product);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Failed to delete store product image: ${error.message}`,
      );
      throw new BadRequestException(
        `Failed to delete store product image: ${error.message}`,
      );
    }
  }

  /**
   * Toggle visibility of a store product
   */
  async toggleStoreProductVisibility(
    id: string,
    visibility: boolean,
  ): Promise<StoreProductResponseDto> {
    try {
      const product = await this.storeProductModel.findByIdAndUpdate(
        id,
        { $set: { visibility } },
        { new: true },
      );

      if (!product) {
        throw new NotFoundException(`Store product not found: ${id}`);
      }

      return this.mapStoreProductToDto(product);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to toggle store product visibility: ${error.message}`,
      );
      throw new BadRequestException(
        `Failed to toggle store product visibility: ${error.message}`,
      );
    }
  }

  /**
   * Reorder store products
   */
  async reorderStoreProducts(
    reorderDto: ReorderProductsDto,
  ): Promise<void> {
    try {
      const updates = reorderDto.productIds.map((id, index) =>
        this.storeProductModel.findByIdAndUpdate(id, { sortOrder: index }),
      );

      await Promise.all(updates);
    } catch (error) {
      this.logger.error(`Failed to reorder store products: ${error.message}`);
      throw new BadRequestException(
        `Failed to reorder store products: ${error.message}`,
      );
    }
  }

  /**
   * Reorder store products within a specific category
   */
  async reorderStoreProductsInCategory(
    reorderDto: ReorderProductsInCategoryDto,
  ): Promise<void> {
    try {
      const { category, productIds } = reorderDto;

      // Update categoryOrder for each product
      const updates = productIds.map((id, index) =>
        this.storeProductModel.findByIdAndUpdate(
          id,
          { [`categoryOrder.${category}`]: index },
          { new: true }
        ),
      );

      await Promise.all(updates);
      this.logger.log(`Reordered ${productIds.length} products in category "${category}"`);
    } catch (error) {
      this.logger.error(`Failed to reorder products in category: ${error.message}`);
      throw new BadRequestException(
        `Failed to reorder products in category: ${error.message}`,
      );
    }
  }

  /**
   * Get storefront products (public API)
   */
  async getStorefrontProducts(
    categories?: string[],
    featured?: boolean,
  ): Promise<StorefrontProductDto[]> {
    try {
      const query: any = { visibility: true };
      
      if (categories && categories.length > 0) {
        query.categories = { $in: categories };
      }
      if (featured !== undefined) {
        query.featured = featured;
      }

      let products = await this.storeProductModel
        .find(query)
        .sort({ sortOrder: 1, createdAt: -1 });

      // If filtering by a single category, sort by category-specific order
      if (categories && categories.length === 1) {
        const category = categories[0];
        products = products.sort((a, b) => {
          const aOrder = a.categoryOrder?.[category] ?? a.sortOrder ?? 999;
          const bOrder = b.categoryOrder?.[category] ?? b.sortOrder ?? 999;
          return aOrder - bOrder;
        });
      }

      return products.map((p) => this.mapProductToStorefrontDto(p));
    } catch (error) {
      this.logger.error(`Failed to get storefront products: ${error.message}`);
      throw new BadRequestException(
        `Failed to get storefront products: ${error.message}`,
      );
    }
  }

  /**
   * Get a single storefront product by ID (public API)
   */
  async getStorefrontProduct(id: string): Promise<StorefrontProductDto> {
    try {
      const product = await this.storeProductModel.findById(id);
      
      if (!product) {
        throw new NotFoundException(`Store product not found: ${id}`);
      }
      
      if (!product.visibility) {
        throw new NotFoundException(`Product is not visible: ${id}`);
      }
      
      return this.mapProductToStorefrontDto(product);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to get storefront product: ${error.message}`);
      throw new BadRequestException(
        `Failed to get storefront product: ${error.message}`,
      );
    }
  }

  /**
   * Refresh product cache (re-sync from Printful)
   */
  async refreshProductCache(id: string): Promise<StoreProductResponseDto> {
    try {
      const product = await this.storeProductModel.findById(id);
      if (!product) {
        throw new NotFoundException(`Store product not found: ${id}`);
      }

      // Sync fresh data from Printful
      const cachedData = await this.syncPrintfulProductData(
        product.printfulProductId,
      );

      product.cachedData = cachedData;
      product.lastSyncedAt = new Date();
      await product.save();

      return this.mapStoreProductToDto(product);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to refresh product cache: ${error.message}`);
      throw new BadRequestException(
        `Failed to refresh product cache: ${error.message}`,
      );
    }
  }

  /**
   * Refresh all product caches from Printful
   */
  async refreshAllProductCaches(): Promise<{ success: number; failed: number; total: number }> {
    try {
      const products = await this.storeProductModel.find();
      this.logger.log(`Starting sync for ${products.length} products`);

      let success = 0;
      let failed = 0;

      for (const product of products) {
        try {
          const cachedData = await this.syncPrintfulProductData(
            product.printfulProductId,
          );

          product.cachedData = cachedData;
          product.lastSyncedAt = new Date();
          await product.save();

          success++;
          this.logger.log(`Successfully synced product ${product.printfulProductId}`);
        } catch (error) {
          failed++;
          this.logger.error(
            `Failed to sync product ${product.printfulProductId}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Sync complete: ${success} succeeded, ${failed} failed out of ${products.length} total`,
      );

      return {
        success,
        failed,
        total: products.length,
      };
    } catch (error) {
      this.logger.error(`Failed to refresh all product caches: ${error.message}`);
      throw new BadRequestException(
        `Failed to refresh all product caches: ${error.message}`,
      );
    }
  }

  /**
   * Refresh shipping rates cache for a single product
   */
  async refreshShippingRatesCache(id: string): Promise<StoreProductResponseDto> {
    try {
      this.logger.log(`[SHIPPING CACHE] Starting refresh for product ${id}`);
      
      const product = await this.storeProductModel.findById(id);
      if (!product) {
        throw new NotFoundException(`Store product not found: ${id}`);
      }

      this.logger.log(`[SHIPPING CACHE] Found product ${product.printfulProductId}`);

      // Get the first enabled variant for estimation
      const sampleVariant = product.variants.find(v => v.enabled) || product.variants[0];
      if (!sampleVariant) {
        throw new BadRequestException('Product has no variants');
      }

      this.logger.log(`[SHIPPING CACHE] Using variant ${sampleVariant.variantId} for estimation`);

      // Popular shipping regions to cache
      const SHIPPING_REGIONS = [
        'US', 'GB', 'CA', 'AU', 'DE', 'FR', 'JP', 'HK', 'SG', 'MX',
      ];

      this.logger.log(`[SHIPPING CACHE] Fetching shipping estimates for ${SHIPPING_REGIONS.length} regions...`);

      const cachedRates: any = {};
      let successCount = 0;
      let failCount = 0;

      for (const countryCode of SHIPPING_REGIONS) {
        try {
          const shippingEstimate = await this.printfulService.getEstimatedShippingForCountry({
            country_code: countryCode,
            variant_id: sampleVariant.variantId,
          });

          if (shippingEstimate?.shipping_methods?.[0]) {
            const method = shippingEstimate.shipping_methods[0];
            cachedRates[countryCode] = {
              rate: method.rate,
              currency: method.currency || 'USD',
              lastUpdated: new Date(),
              delivery_estimate: method.delivery_estimate,
            };
            successCount++;
            this.logger.log(`[SHIPPING CACHE] ✓ ${countryCode}: $${method.rate}`);
          } else {
            failCount++;
            this.logger.warn(`[SHIPPING CACHE] ✗ ${countryCode}: No shipping methods found`);
          }
        } catch (error) {
          failCount++;
          this.logger.error(`[SHIPPING CACHE] ✗ ${countryCode}: ${error.message}`);
          // Store error state
          cachedRates[countryCode] = {
            error: true,
            lastUpdated: new Date(),
          };
        }
      }

      this.logger.log(`[SHIPPING CACHE] Fetch complete: ${successCount} succeeded, ${failCount} failed`);
      this.logger.log(`[SHIPPING CACHE] Cached rates object:`, JSON.stringify(cachedRates, null, 2));

      // Update product with cached shipping rates
      product.cachedShippingRates = cachedRates;
      product.shippingRatesLastSynced = new Date();
      
      this.logger.log(`[SHIPPING CACHE] Saving product to database...`);
      await product.save();
      this.logger.log(`[SHIPPING CACHE] ✓ Product saved successfully!`);

      this.logger.log(
        `[SHIPPING CACHE] Shipping cache updated for product ${product.printfulProductId}: ${successCount} succeeded, ${failCount} failed`
      );

      return this.mapStoreProductToDto(product);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`[SHIPPING CACHE] Failed to refresh shipping cache: ${error.message}`);
      this.logger.error(`[SHIPPING CACHE] Error stack:`, error.stack);
      throw new BadRequestException(
        `Failed to refresh shipping cache: ${error.message}`,
      );
    }
  }

  /**
   * Refresh shipping rates cache for all products
   */
  async refreshAllShippingRatesCaches(): Promise<{ 
    success: number; 
    failed: number; 
    total: number 
  }> {
    try {
      const products = await this.storeProductModel.find({ visibility: true });
      this.logger.log(`Refreshing shipping cache for ${products.length} products`);

      let success = 0;
      let failed = 0;

      for (const product of products) {
        try {
          await this.refreshShippingRatesCache((product._id as any).toString());
          success++;
        } catch (error) {
          failed++;
          this.logger.error(
            `Failed to refresh shipping for product ${product.printfulProductId}: ${error.message}`
          );
        }

        // Add delay to avoid rate limiting (Printful has rate limits)
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      this.logger.log(
        `Shipping cache refresh complete: ${success} succeeded, ${failed} failed out of ${products.length} total`
      );

      return { success, failed, total: products.length };
    } catch (error) {
      this.logger.error(`Failed to refresh all shipping caches: ${error.message}`);
      throw new BadRequestException(
        `Failed to refresh all shipping caches: ${error.message}`,
      );
    }
  }

  /**
   * Apply markup to all existing product prices
   * This updates all variant prices with the default markup percentage
   */
  async applyMarkupToAllProducts(): Promise<{ 
    success: number; 
    failed: number; 
    total: number;
    updatedVariants: number;
  }> {
    try {
      const products = await this.storeProductModel.find();
      this.logger.log(`Applying ${this.DEFAULT_MARKUP_PERCENTAGE * 100}% markup to ${products.length} products`);

      let success = 0;
      let failed = 0;
      let updatedVariants = 0;

      for (const product of products) {
        try {
          // Update each variant price with markup
          const updatedVariantsList = product.variants.map(variant => {
            // Find base price from cached data
            const cachedVariant = product.cachedData.variantDetails?.find(
              cv => cv.id === variant.variantId
            );
            
            if (cachedVariant) {
              const basePrice = parseFloat(cachedVariant.price);
              const markedUpPrice = this.applyMarkup(basePrice);
              updatedVariants++;
              
              return {
                ...variant,
                price: markedUpPrice,
              };
            }
            
            return variant;
          });

          product.variants = updatedVariantsList;
          await product.save();
          success++;
          
          this.logger.log(
            `Applied markup to product ${product.printfulProductId} (${product.cachedData.productTitle})`
          );
        } catch (error) {
          failed++;
          this.logger.error(
            `Failed to apply markup to product ${product.printfulProductId}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Markup application complete: ${success} products updated, ${updatedVariants} variants updated, ${failed} failed`,
      );

      return { success, failed, total: products.length, updatedVariants };
    } catch (error) {
      this.logger.error(`Failed to apply markup to products: ${error.message}`);
      throw new BadRequestException(
        `Failed to apply markup to products: ${error.message}`,
      );
    }
  }

  /**
   * Map StoreProductDocument to DTO
   */
  private mapStoreProductToDto(
    product: StoreProductDocument,
  ): StoreProductResponseDto {
    return {
      id: (product._id as any).toString(),
      printfulProductId: product.printfulProductId,
      variants: product.variants || [],
      cachedData: product.cachedData,
      lastSyncedAt: product.lastSyncedAt,
      customImages: product.customImages,
      visibility: product.visibility,
      sortOrder: product.sortOrder,
      featured: product.featured,
      categories: product.categories,
      categoryOrder: product.categoryOrder || {},
      imagesCount: product.customImages.length,
      translations: product.translations,
      cachedShippingRates: product.cachedShippingRates,
      shippingRatesLastSynced: product.shippingRatesLastSynced,
      createdAt: (product as any).createdAt || new Date(),
      updatedAt: (product as any).updatedAt || new Date(),
    };
  }

  /**
   * Map StoreProductDocument to Storefront DTO
   */
  private mapProductToStorefrontDto(
    product: StoreProductDocument,
  ): StorefrontProductDto {
    // Only include enabled variants
    const enabledVariants = product.variants.filter(v => v.enabled);

    return {
      id: (product._id as any).toString(),
      printfulProductId: product.printfulProductId,
      title: product.cachedData.productTitle,
      description: product.cachedData.productDescription,
      productType: product.cachedData.productType,
      brand: product.cachedData.brand,
      images: product.cachedData.images,
      customImages: product.customImages || [],
      variants: enabledVariants,
      variantDetails: product.cachedData.variantDetails || [],
      categories: product.categories,
      featured: product.featured,
      sortOrder: product.sortOrder,
      categoryOrder: product.categoryOrder || {},
      translations: product.translations,
    };
  }

  // ==================== Site Tags ====================

  /**
   * Create a new site tag
   */
  async createSiteTag(
    createSiteTagDto: CreateSiteTagDto,
  ): Promise<SiteTagResponseDto> {
    try {
      // Ensure name is slug-friendly
      const name = createSiteTagDto.name.toLowerCase().replace(/\s+/g, '-');

      // Check if name already exists
      const existing = await this.siteTagModel.findOne({ name });
      if (existing) {
        throw new BadRequestException(`Site tag with name "${name}" already exists`);
      }

      const siteTag = new this.siteTagModel({
        ...createSiteTagDto,
        name,
      });

      await siteTag.save();
      return this.mapSiteTagToDto(siteTag);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to create site tag: ${error.message}`);
      throw new BadRequestException(`Failed to create site tag: ${error.message}`);
    }
  }

  /**
   * Get all site tags
   */
  async getSiteTags(activeOnly = false): Promise<SiteTagResponseDto[]> {
    try {
      const query = activeOnly ? { active: true } : {};
      const siteTags = await this.siteTagModel
        .find(query)
        .sort({ sortOrder: 1, name: 1 })
        .exec();

      return siteTags.map((tag) => this.mapSiteTagToDto(tag));
    } catch (error) {
      this.logger.error(`Failed to fetch site tags: ${error.message}`);
      throw new BadRequestException(`Failed to fetch site tags: ${error.message}`);
    }
  }

  /**
   * Get a single site tag by ID
   */
  async getSiteTag(id: string): Promise<SiteTagResponseDto> {
    try {
      const siteTag = await this.siteTagModel.findById(id).exec();

      if (!siteTag) {
        throw new NotFoundException(`Site tag not found: ${id}`);
      }

      return this.mapSiteTagToDto(siteTag);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch site tag: ${error.message}`);
      throw new BadRequestException(`Failed to fetch site tag: ${error.message}`);
    }
  }

  /**
   * Update a site tag
   */
  async updateSiteTag(
    id: string,
    updateSiteTagDto: UpdateSiteTagDto,
  ): Promise<SiteTagResponseDto> {
    try {
      // If updating name, ensure it's slug-friendly and unique
      if (updateSiteTagDto.name) {
        const name = updateSiteTagDto.name.toLowerCase().replace(/\s+/g, '-');
        const existing = await this.siteTagModel.findOne({ name, _id: { $ne: id } });
        if (existing) {
          throw new BadRequestException(`Site tag with name "${name}" already exists`);
        }
        updateSiteTagDto.name = name;
      }

      const siteTag = await this.siteTagModel
        .findByIdAndUpdate(id, updateSiteTagDto, { new: true })
        .exec();

      if (!siteTag) {
        throw new NotFoundException(`Site tag not found: ${id}`);
      }

      return this.mapSiteTagToDto(siteTag);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to update site tag: ${error.message}`);
      throw new BadRequestException(`Failed to update site tag: ${error.message}`);
    }
  }

  /**
   * Delete a site tag
   */
  async deleteSiteTag(id: string): Promise<void> {
    try {
      // Check if any products use this tag
      const tagDoc = await this.siteTagModel.findById(id).exec();
      if (!tagDoc) {
        throw new NotFoundException(`Site tag not found: ${id}`);
      }

      const productsUsingTag = await this.storeProductModel
        .countDocuments({ categories: tagDoc.name })
        .exec();

      if (productsUsingTag > 0) {
        throw new BadRequestException(
          `Cannot delete site tag "${tagDoc.name}" because it is used by ${productsUsingTag} product(s)`,
        );
      }

      await this.siteTagModel.findByIdAndDelete(id).exec();
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to delete site tag: ${error.message}`);
      throw new BadRequestException(`Failed to delete site tag: ${error.message}`);
    }
  }

  /**
   * Reorder site tags
   */
  async reorderSiteTags(reorderDto: ReorderDto): Promise<void> {
    try {
      const updates = reorderDto.ids.map((id, index) =>
        this.siteTagModel.findByIdAndUpdate(id, { sortOrder: index }),
      );

      await Promise.all(updates);
    } catch (error) {
      this.logger.error(`Failed to reorder site tags: ${error.message}`);
      throw new BadRequestException(`Failed to reorder site tags: ${error.message}`);
    }
  }

  /**
   * Map SiteTagDocument to DTO
   */
  private mapSiteTagToDto(tag: SiteTagDocument): SiteTagResponseDto {
    return {
      id: (tag._id as any).toString(),
      name: tag.name,
      displayName: tag.displayName,
      description: tag.description,
      color: tag.color,
      icon: tag.icon,
      sortOrder: tag.sortOrder,
      active: tag.active,
      translations: tag.translations,
      createdAt: (tag as any).createdAt || new Date(),
      updatedAt: (tag as any).updatedAt || new Date(),
    };
  }

  // ==================== Product Categories ====================

  /**
   * Create a new product category
   */
  async createProductCategory(
    createProductCategoryDto: CreateProductCategoryDto,
  ): Promise<ProductCategoryResponseDto> {
    try {
      // Ensure name is slug-friendly
      const name = createProductCategoryDto.name.toLowerCase().replace(/\s+/g, '-');

      // Check if name already exists
      const existing = await this.productCategoryModel.findOne({ name });
      if (existing) {
        throw new BadRequestException(`Product category with name "${name}" already exists`);
      }

      const productCategory = new this.productCategoryModel({
        ...createProductCategoryDto,
        name,
      });

      await productCategory.save();
      return this.mapProductCategoryToDto(productCategory);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to create product category: ${error.message}`);
      throw new BadRequestException(`Failed to create product category: ${error.message}`);
    }
  }

  /**
   * Get all product categories
   */
  async getProductCategories(activeOnly = false): Promise<ProductCategoryResponseDto[]> {
    try {
      const query = activeOnly ? { active: true } : {};
      const productCategories = await this.productCategoryModel
        .find(query)
        .sort({ sortOrder: 1, name: 1 })
        .exec();

      return productCategories.map((category) => this.mapProductCategoryToDto(category));
    } catch (error) {
      this.logger.error(`Failed to fetch product categories: ${error.message}`);
      throw new BadRequestException(`Failed to fetch product categories: ${error.message}`);
    }
  }

  /**
   * Get a single product category by ID
   */
  async getProductCategory(id: string): Promise<ProductCategoryResponseDto> {
    try {
      const productCategory = await this.productCategoryModel.findById(id).exec();

      if (!productCategory) {
        throw new NotFoundException(`Product category not found: ${id}`);
      }

      return this.mapProductCategoryToDto(productCategory);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch product category: ${error.message}`);
      throw new BadRequestException(`Failed to fetch product category: ${error.message}`);
    }
  }

  /**
   * Update a product category
   */
  async updateProductCategory(
    id: string,
    updateProductCategoryDto: UpdateProductCategoryDto,
  ): Promise<ProductCategoryResponseDto> {
    try {
      // If updating name, ensure it's slug-friendly and unique
      if (updateProductCategoryDto.name) {
        const name = updateProductCategoryDto.name.toLowerCase().replace(/\s+/g, '-');
        const existing = await this.productCategoryModel.findOne({ name, _id: { $ne: id } });
        if (existing) {
          throw new BadRequestException(`Product category with name "${name}" already exists`);
        }
        updateProductCategoryDto.name = name;
      }

      const productCategory = await this.productCategoryModel
        .findByIdAndUpdate(id, updateProductCategoryDto, { new: true })
        .exec();

      if (!productCategory) {
        throw new NotFoundException(`Product category not found: ${id}`);
      }

      return this.mapProductCategoryToDto(productCategory);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to update product category: ${error.message}`);
      throw new BadRequestException(`Failed to update product category: ${error.message}`);
    }
  }

  /**
   * Delete a product category
   */
  async deleteProductCategory(id: string): Promise<void> {
    try {
      // Check if any products use this category
      const categoryDoc = await this.productCategoryModel.findById(id).exec();
      if (!categoryDoc) {
        throw new NotFoundException(`Product category not found: ${id}`);
      }

      const productsUsingCategory = await this.storeProductModel
        .countDocuments({ categories: categoryDoc.name })
        .exec();

      if (productsUsingCategory > 0) {
        throw new BadRequestException(
          `Cannot delete product category "${categoryDoc.name}" because it is used by ${productsUsingCategory} product(s)`,
        );
      }

      await this.productCategoryModel.findByIdAndDelete(id).exec();
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to delete product category: ${error.message}`);
      throw new BadRequestException(`Failed to delete product category: ${error.message}`);
    }
  }

  /**
   * Reorder product categories
   */
  async reorderProductCategories(reorderDto: ReorderDto): Promise<void> {
    try {
      const updates = reorderDto.ids.map((id, index) =>
        this.productCategoryModel.findByIdAndUpdate(id, { sortOrder: index }),
      );

      await Promise.all(updates);
    } catch (error) {
      this.logger.error(`Failed to reorder product categories: ${error.message}`);
      throw new BadRequestException(`Failed to reorder product categories: ${error.message}`);
    }
  }

  /**
   * Map ProductCategoryDocument to DTO
   */
  private mapProductCategoryToDto(category: ProductCategoryDocument): ProductCategoryResponseDto {
    return {
      id: (category._id as any).toString(),
      name: category.name,
      displayName: category.displayName,
      description: category.description,
      color: category.color,
      icon: category.icon,
      sortOrder: category.sortOrder,
      active: category.active,
      translations: category.translations,
      createdAt: (category as any).createdAt || new Date(),
      updatedAt: (category as any).updatedAt || new Date(),
    };
  }
}
