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
  Header,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiHeader,
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

/**
 * Legacy controller for backward compatibility
 * @deprecated Use StoreController with /store routes instead
 * 
 * This controller maintains the old /printify/* routes for backward compatibility.
 * All requests are forwarded to the StoreService and include a deprecation warning
 * in the response headers.
 * 
 * Migration: Replace /api/v1/printify/* with /api/v1/store/*
 */
@ApiTags('Store (Legacy - Deprecated)')
@ApiHeader({
  name: 'X-Deprecation-Warning',
  description: 'This API endpoint is deprecated. Use /store/* routes instead.',
})
@Controller('printify')
export class StoreLegacyController {
  constructor(private readonly storeService: StoreService) {}

  // Add deprecation header to all responses
  private readonly DEPRECATION_HEADER = 'This endpoint is deprecated. Please migrate to /api/v1/store/* routes. See docs/PRINTIFY_TO_STORE_MIGRATION.md';

  // ==================== STORE PRODUCTS ====================

  @Get('storefront/products/:id')
  @Header('X-Deprecation-Warning', 'This endpoint is deprecated. Please migrate to /api/v1/store/storefront/products/:id')
  @ApiOperation({
    summary: '[DEPRECATED] Get a single storefront product by ID',
    description: '⚠️ DEPRECATED: Use /store/storefront/products/:id instead. This endpoint will be removed in a future version.',
  })
  @ApiParam({ name: 'id', description: 'Store product ID' })
  @ApiResponse({
    status: 200,
    description: 'Store product details',
    type: StorefrontProductDto,
  })
  async getStorefrontProduct(@Param('id') id: string): Promise<StorefrontProductDto> {
    return this.storeService.getStorefrontProduct(id);
  }

  @Get('storefront/products')
  @Header('X-Deprecation-Warning', 'This endpoint is deprecated. Please migrate to /api/v1/store/storefront/products')
  @ApiOperation({
    summary: '[DEPRECATED] Get storefront products',
    description: '⚠️ DEPRECATED: Use /store/storefront/products instead. This endpoint will be removed in a future version.',
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

  @Post('store-products')
  @Header('X-Deprecation-Warning', 'This endpoint is deprecated. Please migrate to /api/v1/store/store-products')
  @ApiOperation({
    summary: '[DEPRECATED] Create a new store product',
    description: '⚠️ DEPRECATED: Use /store/store-products instead. This endpoint will be removed in a future version.',
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
  @Header('X-Deprecation-Warning', 'This endpoint is deprecated. Please migrate to /api/v1/store/store-products')
  @ApiOperation({
    summary: '[DEPRECATED] Get all store products',
    description: '⚠️ DEPRECATED: Use /store/store-products instead. This endpoint will be removed in a future version.',
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
  @Header('X-Deprecation-Warning', 'This endpoint is deprecated. Please migrate to /api/v1/store/store-products/:id')
  @ApiOperation({
    summary: '[DEPRECATED] Get a single store product',
    description: '⚠️ DEPRECATED: Use /store/store-products/:id instead. This endpoint will be removed in a future version.',
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
  @Header('X-Deprecation-Warning', 'This endpoint is deprecated. Please migrate to /api/v1/store/store-products/:id')
  @ApiOperation({
    summary: '[DEPRECATED] Update a store product',
    description: '⚠️ DEPRECATED: Use /store/store-products/:id instead. This endpoint will be removed in a future version.',
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
  @Header('X-Deprecation-Warning', 'This endpoint is deprecated. Please migrate to /api/v1/store/store-products/:id')
  @ApiOperation({
    summary: '[DEPRECATED] Delete a store product',
    description: '⚠️ DEPRECATED: Use /store/store-products/:id instead. This endpoint will be removed in a future version.',
  })
  @ApiParam({ name: 'id', description: 'Store product ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteStoreProduct(@Param('id') id: string): Promise<void> {
    return this.storeService.deleteStoreProduct(id);
  }

  @Post('store-products/:id/images')
  @Header('X-Deprecation-Warning', 'This endpoint is deprecated. Please migrate to /api/v1/store/store-products/:id/images')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({
    summary: '[DEPRECATED] Upload custom image for store product',
    description: '⚠️ DEPRECATED: Use /store/store-products/:id/images instead. This endpoint will be removed in a future version.',
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

  @Patch('store-products/:id/visibility')
  @Header('X-Deprecation-Warning', 'This endpoint is deprecated. Please migrate to /api/v1/store/store-products/:id/visibility')
  @ApiOperation({
    summary: '[DEPRECATED] Toggle store product visibility',
    description: '⚠️ DEPRECATED: Use /store/store-products/:id/visibility instead. This endpoint will be removed in a future version.',
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
  @Header('X-Deprecation-Warning', 'This endpoint is deprecated. Please migrate to /api/v1/store/store-products/reorder')
  @ApiOperation({
    summary: '[DEPRECATED] Reorder store products',
    description: '⚠️ DEPRECATED: Use /store/store-products/reorder instead. This endpoint will be removed in a future version.',
  })
  @ApiResponse({ status: 200, description: 'Products reordered successfully' })
  async reorderProducts(@Body() reorderDto: ReorderProductsDto): Promise<void> {
    return this.storeService.reorderStoreProducts(reorderDto);
  }

  @Patch('store-products/reorder-in-category')
  @Header('X-Deprecation-Warning', 'This endpoint is deprecated. Please migrate to /api/v1/store/store-products/reorder-in-category')
  @ApiOperation({
    summary: '[DEPRECATED] Reorder store products within a specific category',
    description: '⚠️ DEPRECATED: Use /store/store-products/reorder-in-category instead. This endpoint will be removed in a future version.',
  })
  @ApiResponse({ status: 200, description: 'Products reordered successfully in category' })
  async reorderProductsInCategory(@Body() reorderDto: ReorderProductsInCategoryDto): Promise<void> {
    return this.storeService.reorderStoreProductsInCategory(reorderDto);
  }

  @Post('store-products/:id/sync')
  @Header('X-Deprecation-Warning', 'This endpoint is deprecated. Please migrate to /api/v1/store/store-products/:id/sync')
  @ApiOperation({
    summary: '[DEPRECATED] Refresh product cache',
    description: '⚠️ DEPRECATED: Use /store/store-products/:id/sync instead. This endpoint will be removed in a future version.',
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
  @Header('X-Deprecation-Warning', 'This endpoint is deprecated. Please migrate to /api/v1/store/store-products/sync-all')
  @ApiOperation({
    summary: '[DEPRECATED] Refresh all product caches',
    description: '⚠️ DEPRECATED: Use /store/store-products/sync-all instead. This endpoint will be removed in a future version.',
  })
  @ApiResponse({
    status: 200,
    description: 'All product caches refreshed',
  })
  async refreshAllProductCaches(): Promise<{ success: number; failed: number; total: number }> {
    return this.storeService.refreshAllProductCaches();
  }

  @Post('store-products/apply-markup')
  @Header('X-Deprecation-Warning', 'This endpoint is deprecated. Please migrate to /api/v1/store/store-products/apply-markup')
  @ApiOperation({
    summary: '[DEPRECATED] Apply markup to all product prices',
    description: '⚠️ DEPRECATED: Use /store/store-products/apply-markup instead. This endpoint will be removed in a future version.',
  })
  @ApiResponse({
    status: 200,
    description: 'Markup applied to products',
  })
  async applyMarkupToAllProducts(): Promise<{ 
    success: number; 
    failed: number; 
    total: number;
    updatedVariants: number;
  }> {
    return this.storeService.applyMarkupToAllProducts();
  }

  // ==================== SITE TAGS ====================

  @Post('site-tags')
  @Header('X-Deprecation-Warning', 'This endpoint is deprecated. Please migrate to /api/v1/store/site-tags')
  @ApiOperation({
    summary: '[DEPRECATED] Create a new site tag',
    description: '⚠️ DEPRECATED: Use /store/site-tags instead. This endpoint will be removed in a future version.',
  })
  @ApiResponse({ status: 201, description: 'Site tag created', type: SiteTagResponseDto })
  async createSiteTag(@Body() createDto: CreateSiteTagDto): Promise<SiteTagResponseDto> {
    return this.storeService.createSiteTag(createDto);
  }

  @Get('site-tags')
  @Header('X-Deprecation-Warning', 'This endpoint is deprecated. Please migrate to /api/v1/store/site-tags')
  @ApiOperation({
    summary: '[DEPRECATED] Get all site tags',
    description: '⚠️ DEPRECATED: Use /store/site-tags instead. This endpoint will be removed in a future version.',
  })
  @ApiResponse({ status: 200, description: 'List of site tags', type: [SiteTagResponseDto] })
  async getSiteTags(): Promise<SiteTagResponseDto[]> {
    return this.storeService.getSiteTags();
  }

  @Get('site-tags/:id')
  @Header('X-Deprecation-Warning', 'This endpoint is deprecated. Please migrate to /api/v1/store/site-tags/:id')
  @ApiOperation({
    summary: '[DEPRECATED] Get a single site tag',
    description: '⚠️ DEPRECATED: Use /store/site-tags/:id instead. This endpoint will be removed in a future version.',
  })
  @ApiParam({ name: 'id', description: 'Site tag ID' })
  @ApiResponse({ status: 200, description: 'Site tag details', type: SiteTagResponseDto })
  async getSiteTag(@Param('id') id: string): Promise<SiteTagResponseDto> {
    return this.storeService.getSiteTag(id);
  }

  @Patch('site-tags/:id')
  @Header('X-Deprecation-Warning', 'This endpoint is deprecated. Please migrate to /api/v1/store/site-tags/:id')
  @ApiOperation({
    summary: '[DEPRECATED] Update a site tag',
    description: '⚠️ DEPRECATED: Use /store/site-tags/:id instead. This endpoint will be removed in a future version.',
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
  @Header('X-Deprecation-Warning', 'This endpoint is deprecated. Please migrate to /api/v1/store/site-tags/:id')
  @ApiOperation({
    summary: '[DEPRECATED] Delete a site tag',
    description: '⚠️ DEPRECATED: Use /store/site-tags/:id instead. This endpoint will be removed in a future version.',
  })
  @ApiParam({ name: 'id', description: 'Site tag ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSiteTag(@Param('id') id: string): Promise<void> {
    return this.storeService.deleteSiteTag(id);
  }

  @Patch('site-tags/reorder')
  @Header('X-Deprecation-Warning', 'This endpoint is deprecated. Please migrate to /api/v1/store/site-tags/reorder')
  @ApiOperation({
    summary: '[DEPRECATED] Reorder site tags',
    description: '⚠️ DEPRECATED: Use /store/site-tags/reorder instead. This endpoint will be removed in a future version.',
  })
  @ApiResponse({ status: 200, description: 'Site tags reordered successfully' })
  async reorderSiteTags(@Body() reorderDto: ReorderDto): Promise<void> {
    return this.storeService.reorderSiteTags(reorderDto);
  }

  // ==================== PRODUCT CATEGORIES ====================

  @Post('product-categories')
  @Header('X-Deprecation-Warning', 'This endpoint is deprecated. Please migrate to /api/v1/store/product-categories')
  @ApiOperation({
    summary: '[DEPRECATED] Create a new product category',
    description: '⚠️ DEPRECATED: Use /store/product-categories instead. This endpoint will be removed in a future version.',
  })
  @ApiResponse({ status: 201, description: 'Product category created', type: ProductCategoryResponseDto })
  async createProductCategory(
    @Body() createDto: CreateProductCategoryDto,
  ): Promise<ProductCategoryResponseDto> {
    return this.storeService.createProductCategory(createDto);
  }

  @Get('product-categories')
  @Header('X-Deprecation-Warning', 'This endpoint is deprecated. Please migrate to /api/v1/store/product-categories')
  @ApiOperation({
    summary: '[DEPRECATED] Get all product categories',
    description: '⚠️ DEPRECATED: Use /store/product-categories instead. This endpoint will be removed in a future version.',
  })
  @ApiResponse({ status: 200, description: 'List of product categories', type: [ProductCategoryResponseDto] })
  async getProductCategories(): Promise<ProductCategoryResponseDto[]> {
    return this.storeService.getProductCategories();
  }

  @Get('product-categories/:id')
  @Header('X-Deprecation-Warning', 'This endpoint is deprecated. Please migrate to /api/v1/store/product-categories/:id')
  @ApiOperation({
    summary: '[DEPRECATED] Get a single product category',
    description: '⚠️ DEPRECATED: Use /store/product-categories/:id instead. This endpoint will be removed in a future version.',
  })
  @ApiParam({ name: 'id', description: 'Product category ID' })
  @ApiResponse({ status: 200, description: 'Product category details', type: ProductCategoryResponseDto })
  async getProductCategory(@Param('id') id: string): Promise<ProductCategoryResponseDto> {
    return this.storeService.getProductCategory(id);
  }

  @Patch('product-categories/:id')
  @Header('X-Deprecation-Warning', 'This endpoint is deprecated. Please migrate to /api/v1/store/product-categories/:id')
  @ApiOperation({
    summary: '[DEPRECATED] Update a product category',
    description: '⚠️ DEPRECATED: Use /store/product-categories/:id instead. This endpoint will be removed in a future version.',
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
  @Header('X-Deprecation-Warning', 'This endpoint is deprecated. Please migrate to /api/v1/store/product-categories/:id')
  @ApiOperation({
    summary: '[DEPRECATED] Delete a product category',
    description: '⚠️ DEPRECATED: Use /store/product-categories/:id instead. This endpoint will be removed in a future version.',
  })
  @ApiParam({ name: 'id', description: 'Product category ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProductCategory(@Param('id') id: string): Promise<void> {
    return this.storeService.deleteProductCategory(id);
  }

  @Patch('product-categories/reorder')
  @Header('X-Deprecation-Warning', 'This endpoint is deprecated. Please migrate to /api/v1/store/product-categories/reorder')
  @ApiOperation({
    summary: '[DEPRECATED] Reorder product categories',
    description: '⚠️ DEPRECATED: Use /store/product-categories/reorder instead. This endpoint will be removed in a future version.',
  })
  @ApiResponse({ status: 200, description: 'Product categories reordered successfully' })
  async reorderProductCategories(@Body() reorderDto: ReorderDto): Promise<void> {
    return this.storeService.reorderProductCategories(reorderDto);
  }
}

