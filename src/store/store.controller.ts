import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { StoreService } from './store.service';
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

@ApiTags('Store')
@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  // ==================== STORE PRODUCTS ====================

  // PUBLIC STOREFRONT API (must come before parameterized routes)
  @Get('storefront/products/:id')
  @ApiOperation({
    summary: 'Get a single storefront product by ID (public API)',
    description: 'Get a visible product by ID for display on the storefront',
  })
  @ApiParam({ name: 'id', description: 'Store product ID' })
  @ApiResponse({
    status: 200,
    description: 'Store product details',
    type: StorefrontProductDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found or not visible',
  })
  async getStorefrontProduct(@Param('id') id: string): Promise<StorefrontProductDto> {
    return this.storeService.getStorefrontProduct(id);
  }

  @Get('storefront/products')
  @ApiOperation({
    summary: 'Get storefront products (public API)',
    description: 'Get visible products for display on the storefront',
  })
  @ApiQuery({
    name: 'categories',
    required: false,
    type: [String],
    description: 'Filter by categories',
  })
  @ApiQuery({
    name: 'featured',
    required: false,
    type: Boolean,
    description: 'Filter by featured status',
  })
  @ApiResponse({
    status: 200,
    description: 'List of visible store products',
    type: [StorefrontProductDto],
  })
  async getStorefrontProducts(
    @Query('categories') categories?: string | string[],
    @Query('featured') featured?: string,
  ): Promise<StorefrontProductDto[]> {
    const categoryArray = categories
      ? Array.isArray(categories)
        ? categories
        : [categories]
      : undefined;
    const featuredBool = featured === 'true' ? true : featured === 'false' ? false : undefined;
    return this.storeService.getStorefrontProducts(categoryArray, featuredBool);
  }

  // ADMIN ROUTES
  @Post('store-products')
  @ApiOperation({
    summary: 'Create a new store product',
    description: 'Create a store product with Printful integration',
  })
  @ApiResponse({
    status: 201,
    description: 'Store product created',
    type: StoreProductResponseDto,
  })
  async createStoreProduct(
    @Body() createDto: CreateStoreProductDto,
  ): Promise<StoreProductResponseDto> {
    return this.storeService.createStoreProduct(createDto);
  }

  @Get('store-products')
  @ApiOperation({
    summary: 'Get all store products',
    description: 'Retrieve all store products with optional filters',
  })
  @ApiQuery({
    name: 'visibility',
    required: false,
    type: Boolean,
    description: 'Filter by visibility',
  })
  @ApiQuery({
    name: 'featured',
    required: false,
    type: Boolean,
    description: 'Filter by featured status',
  })
  @ApiResponse({
    status: 200,
    description: 'List of store products',
    type: [StoreProductResponseDto],
  })
  async getStoreProducts(
    @Query('visibility') visibility?: boolean,
    @Query('featured') featured?: boolean,
  ): Promise<StoreProductResponseDto[]> {
    return this.storeService.getStoreProducts(visibility, featured);
  }

  @Get('store-products/:id')
  @ApiOperation({
    summary: 'Get a single store product',
    description: 'Retrieve a store product by ID',
  })
  @ApiParam({ name: 'id', description: 'Store product ID' })
  @ApiResponse({
    status: 200,
    description: 'Store product details',
    type: StoreProductResponseDto,
  })
  async getStoreProduct(@Param('id') id: string): Promise<StoreProductResponseDto> {
    return this.storeService.getStoreProduct(id);
  }

  @Patch('store-products/:id')
  @ApiOperation({
    summary: 'Update a store product',
    description: 'Update store product details',
  })
  @ApiParam({ name: 'id', description: 'Store product ID' })
  @ApiResponse({
    status: 200,
    description: 'Store product updated',
    type: StoreProductResponseDto,
  })
  async updateStoreProduct(
    @Param('id') id: string,
    @Body() updateDto: UpdateStoreProductDto,
  ): Promise<StoreProductResponseDto> {
    return this.storeService.updateStoreProduct(id, updateDto);
  }

  @Delete('store-products/:id')
  @ApiOperation({
    summary: 'Delete a store product',
    description: 'Remove a store product from the database',
  })
  @ApiParam({ name: 'id', description: 'Store product ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteStoreProduct(@Param('id') id: string): Promise<void> {
    return this.storeService.deleteStoreProduct(id);
  }

  @Post('store-products/:id/images')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({
    summary: 'Upload custom image for store product',
    description: 'Add a custom image to a store product (max 10 images per product)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Store product ID' })
  @ApiResponse({
    status: 200,
    description: 'Image uploaded and product updated',
  })
  async uploadStoreProductImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ imageUrl: string }> {
    const imageUrl = await this.storeService.uploadStoreProductImage(id, file.buffer, file.originalname);
    return { imageUrl };
  }

  @Delete('store-products/:id/images/:imageIndex')
  @ApiOperation({
    summary: 'Delete custom image from store product',
    description: 'Remove a specific custom image by index',
  })
  @ApiParam({ name: 'id', description: 'Store product ID' })
  @ApiParam({ name: 'imageIndex', description: 'Image index (0-based)' })
  @ApiResponse({
    status: 200,
    description: 'Image deleted and product updated',
    type: StoreProductResponseDto,
  })
  async deleteStoreProductImage(
    @Param('id') id: string,
    @Param('imageIndex') imageIndex: string,
  ): Promise<StoreProductResponseDto> {
    return this.storeService.deleteStoreProductImage(id, parseInt(imageIndex, 10));
  }

  @Patch('store-products/:id/visibility')
  @ApiOperation({
    summary: 'Toggle store product visibility',
    description: 'Show or hide a product on the store',
  })
  @ApiParam({ name: 'id', description: 'Store product ID' })
  @ApiResponse({
    status: 200,
    description: 'Visibility toggled',
    type: StoreProductResponseDto,
  })
  async toggleProductVisibility(
    @Param('id') id: string,
    @Body() body: { visibility: boolean },
  ): Promise<StoreProductResponseDto> {
    return this.storeService.toggleStoreProductVisibility(id, body.visibility);
  }

  @Patch('store-products/reorder')
  @ApiOperation({
    summary: 'Reorder store products',
    description: 'Update the sort order of multiple products',
  })
  @ApiResponse({ status: 200, description: 'Products reordered successfully' })
  async reorderProducts(@Body() reorderDto: ReorderProductsDto): Promise<void> {
    return this.storeService.reorderStoreProducts(reorderDto);
  }

  @Patch('store-products/reorder-in-category')
  @ApiOperation({
    summary: 'Reorder store products within a specific category',
    description: 'Update the sort order of products within a category',
  })
  @ApiResponse({ status: 200, description: 'Products reordered successfully in category' })
  async reorderProductsInCategory(@Body() reorderDto: ReorderProductsInCategoryDto): Promise<void> {
    return this.storeService.reorderStoreProductsInCategory(reorderDto);
  }

  @Post('store-products/:id/sync')
  @ApiOperation({
    summary: 'Refresh product cache',
    description: 'Re-sync product data from Printful',
  })
  @ApiParam({ name: 'id', description: 'Store product ID' })
  @ApiResponse({
    status: 200,
    description: 'Product cache refreshed',
    type: StoreProductResponseDto,
  })
  async refreshProductCache(@Param('id') id: string): Promise<StoreProductResponseDto> {
    return this.storeService.refreshProductCache(id);
  }

  @Post('store-products/sync-all')
  @ApiOperation({
    summary: 'Refresh all product caches',
    description: 'Re-sync all product data from Printful',
  })
  @ApiResponse({
    status: 200,
    description: 'All product caches refreshed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'number', description: 'Number of successfully synced products' },
        failed: { type: 'number', description: 'Number of failed syncs' },
        total: { type: 'number', description: 'Total number of products' },
      },
    },
  })
  async refreshAllProductCaches(): Promise<{ success: number; failed: number; total: number }> {
    return this.storeService.refreshAllProductCaches();
  }

  @Post('store-products/apply-markup')
  @ApiOperation({
    summary: 'Apply markup to all product prices',
    description: 'Updates all variant prices with the default 50% markup based on current base prices',
  })
  @ApiResponse({
    status: 200,
    description: 'Markup applied to products',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'number', description: 'Number of successfully updated products' },
        failed: { type: 'number', description: 'Number of failed updates' },
        total: { type: 'number', description: 'Total number of products' },
        updatedVariants: { type: 'number', description: 'Total number of variants updated' },
      },
    },
  })
  async applyMarkupToAllProducts(): Promise<{ 
    success: number; 
    failed: number; 
    total: number;
    updatedVariants: number;
  }> {
    return this.storeService.applyMarkupToAllProducts();
  }

  @Post('store-products/:id/refresh-shipping-cache')
  @ApiOperation({
    summary: 'Refresh shipping rates cache for a product',
    description: 'Fetch and cache shipping estimates for popular regions',
  })
  @ApiParam({ name: 'id', description: 'Store product ID' })
  @ApiResponse({
    status: 200,
    description: 'Shipping cache refreshed',
    type: StoreProductResponseDto,
  })
  async refreshShippingCache(@Param('id') id: string): Promise<StoreProductResponseDto> {
    return this.storeService.refreshShippingRatesCache(id);
  }

  @Post('store-products/refresh-all-shipping-caches')
  @ApiOperation({
    summary: 'Refresh shipping caches for all products',
    description: 'Fetch and cache shipping estimates for all visible products',
  })
  @ApiResponse({
    status: 200,
    description: 'All shipping caches refreshed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'number', description: 'Number of successfully refreshed products' },
        failed: { type: 'number', description: 'Number of failed refreshes' },
        total: { type: 'number', description: 'Total number of products' },
      },
    },
  })
  async refreshAllShippingCaches(): Promise<{ success: number; failed: number; total: number }> {
    return this.storeService.refreshAllShippingRatesCaches();
  }

  // ==================== SITE TAGS ====================

  @Post('site-tags')
  @ApiOperation({
    summary: 'Create a new site tag',
    description: 'Create a site-level tag/badge',
  })
  @ApiResponse({ status: 201, description: 'Site tag created', type: SiteTagResponseDto })
  async createSiteTag(@Body() createDto: CreateSiteTagDto): Promise<SiteTagResponseDto> {
    return this.storeService.createSiteTag(createDto);
  }

  @Get('site-tags')
  @ApiOperation({
    summary: 'Get all site tags',
    description: 'Retrieve all site tags ordered by sort order',
  })
  @ApiResponse({ status: 200, description: 'List of site tags', type: [SiteTagResponseDto] })
  async getSiteTags(): Promise<SiteTagResponseDto[]> {
    return this.storeService.getSiteTags();
  }

  @Get('site-tags/:id')
  @ApiOperation({
    summary: 'Get a single site tag',
    description: 'Retrieve a site tag by ID',
  })
  @ApiParam({ name: 'id', description: 'Site tag ID' })
  @ApiResponse({ status: 200, description: 'Site tag details', type: SiteTagResponseDto })
  async getSiteTag(@Param('id') id: string): Promise<SiteTagResponseDto> {
    return this.storeService.getSiteTag(id);
  }

  @Patch('site-tags/:id')
  @ApiOperation({
    summary: 'Update a site tag',
    description: 'Update site tag details',
  })
  @ApiParam({ name: 'id', description: 'Site tag ID' })
  @ApiResponse({ status: 200, description: 'Site tag updated', type: SiteTagResponseDto })
  async updateSiteTag(
    @Param('id') id: string,
    @Body() updateDto: UpdateSiteTagDto,
  ): Promise<SiteTagResponseDto> {
    return this.storeService.updateSiteTag(id, updateDto);
  }

  @Delete('site-tags/:id')
  @ApiOperation({
    summary: 'Delete a site tag',
    description: 'Remove a site tag',
  })
  @ApiParam({ name: 'id', description: 'Site tag ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSiteTag(@Param('id') id: string): Promise<void> {
    return this.storeService.deleteSiteTag(id);
  }

  @Patch('site-tags/reorder')
  @ApiOperation({
    summary: 'Reorder site tags',
    description: 'Update the sort order of multiple site tags',
  })
  @ApiResponse({ status: 200, description: 'Site tags reordered successfully' })
  async reorderSiteTags(@Body() reorderDto: ReorderDto): Promise<void> {
    return this.storeService.reorderSiteTags(reorderDto);
  }

  // ==================== PRODUCT CATEGORIES ====================

  @Post('product-categories')
  @ApiOperation({
    summary: 'Create a new product category',
    description: 'Create a product category',
  })
  @ApiResponse({ status: 201, description: 'Product category created', type: ProductCategoryResponseDto })
  async createProductCategory(
    @Body() createDto: CreateProductCategoryDto,
  ): Promise<ProductCategoryResponseDto> {
    return this.storeService.createProductCategory(createDto);
  }

  @Get('product-categories')
  @ApiOperation({
    summary: 'Get all product categories',
    description: 'Retrieve all product categories ordered by sort order',
  })
  @ApiResponse({ status: 200, description: 'List of product categories', type: [ProductCategoryResponseDto] })
  async getProductCategories(): Promise<ProductCategoryResponseDto[]> {
    return this.storeService.getProductCategories();
  }

  @Get('product-categories/:id')
  @ApiOperation({
    summary: 'Get a single product category',
    description: 'Retrieve a product category by ID',
  })
  @ApiParam({ name: 'id', description: 'Product category ID' })
  @ApiResponse({ status: 200, description: 'Product category details', type: ProductCategoryResponseDto })
  async getProductCategory(@Param('id') id: string): Promise<ProductCategoryResponseDto> {
    return this.storeService.getProductCategory(id);
  }

  @Patch('product-categories/:id')
  @ApiOperation({
    summary: 'Update a product category',
    description: 'Update product category details',
  })
  @ApiParam({ name: 'id', description: 'Product category ID' })
  @ApiResponse({ status: 200, description: 'Product category updated', type: ProductCategoryResponseDto })
  async updateProductCategory(
    @Param('id') id: string,
    @Body() updateDto: UpdateProductCategoryDto,
  ): Promise<ProductCategoryResponseDto> {
    return this.storeService.updateProductCategory(id, updateDto);
  }

  @Delete('product-categories/:id')
  @ApiOperation({
    summary: 'Delete a product category',
    description: 'Remove a product category',
  })
  @ApiParam({ name: 'id', description: 'Product category ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProductCategory(@Param('id') id: string): Promise<void> {
    return this.storeService.deleteProductCategory(id);
  }

  @Patch('product-categories/reorder')
  @ApiOperation({
    summary: 'Reorder product categories',
    description: 'Update the sort order of multiple product categories',
  })
  @ApiResponse({ status: 200, description: 'Product categories reordered successfully' })
  async reorderProductCategories(@Body() reorderDto: ReorderDto): Promise<void> {
    return this.storeService.reorderProductCategories(reorderDto);
  }
}
