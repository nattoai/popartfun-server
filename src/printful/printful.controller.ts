import {
  Controller,
  Get,
  Post,
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
import { PrintfulService } from './printful.service';
import { MockupService } from './mockup.service';
import {
  CreatePrintfulConfigDto,
  PrintfulConfigResponseDto,
  UploadDesignDto,
  UploadDesignResponseDto,
  CreatePrintfulProductDto,
  PrintfulProductResponseDto,
  GenerateMockupDto,
  MockupResponseDto,
  CalculateShippingRatesDto,
  EstimateShippingDto,
  ShippingRatesResponseDto,
  CalculateTaxDto,
  TaxCalculationResponseDto,
} from './dto';

@ApiTags('Printful')
@Controller('printful')
export class PrintfulController {
  constructor(
    private readonly printfulService: PrintfulService,
    private readonly mockupService: MockupService,
  ) {}

  // ==================== Configuration ====================

  @Post('config')
  @ApiOperation({
    summary: 'Save Printful configuration',
    description: 'Configure Printful API key and settings',
  })
  @ApiResponse({
    status: 201,
    description: 'Configuration saved',
    type: PrintfulConfigResponseDto,
  })
  async saveConfig(
    @Body() createConfigDto: CreatePrintfulConfigDto,
  ): Promise<PrintfulConfigResponseDto> {
    return this.printfulService.saveConfig(createConfigDto);
  }

  @Get('config')
  @ApiOperation({
    summary: 'Get Printful configuration',
    description: 'Retrieve current Printful configuration',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuration retrieved',
    type: PrintfulConfigResponseDto,
  })
  async getConfig(): Promise<PrintfulConfigResponseDto | null> {
    return this.printfulService.getConfig();
  }

  @Get('test-connection')
  @ApiOperation({
    summary: 'Test Printful API connection',
    description: 'Verify API credentials are valid',
  })
  @ApiResponse({ status: 200, description: 'Connection test result' })
  async testConnection(): Promise<{ success: boolean; message: string; storeInfo?: any }> {
    return this.printfulService.testConnection();
  }

  @Get('test-gcs')
  @ApiOperation({
    summary: 'Test Google Cloud Storage connection',
    description: 'Verify GCS is configured and accessible',
  })
  @ApiResponse({ status: 200, description: 'GCS connection test result' })
  async testGCS(): Promise<{ success: boolean; message: string; bucketName?: string }> {
    return this.printfulService.testGCSConnection();
  }

  // ==================== File Library ====================

  @Post('upload-design')
  @ApiOperation({
    summary: 'Upload design to Printful',
    description: 'Upload customer design file to Printful File Library',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponse({
    status: 201,
    description: 'Design uploaded successfully',
    type: UploadDesignResponseDto,
  })
  async uploadDesign(
    @UploadedFile() file: Express.Multer.File,
    @Body('customerId') customerId?: string,
  ): Promise<UploadDesignResponseDto> {
    // Convert file buffer to base64
    const base64File = file.buffer.toString('base64');

    const uploadDto: UploadDesignDto = {
      file: base64File,
      filename: file.originalname,
      customerId,
    };

    return this.printfulService.uploadDesign(uploadDto);
  }

  @Get('files/:fileId')
  @ApiOperation({
    summary: 'Get file details',
    description: 'Retrieve file information from Printful Library',
  })
  @ApiParam({ name: 'fileId', description: 'Printful file ID' })
  @ApiResponse({ status: 200, description: 'File details' })
  async getFile(@Param('fileId') fileId: number): Promise<any> {
    return this.printfulService.getFile(fileId);
  }

  // ==================== Products ====================

  @Post('create-product')
  @ApiOperation({
    summary: 'Create product with design',
    description: 'Create Printful sync product with customer design',
  })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: PrintfulProductResponseDto,
  })
  async createProduct(
    @Body() createProductDto: CreatePrintfulProductDto,
  ): Promise<PrintfulProductResponseDto> {
    return this.printfulService.createCustomerProduct(createProductDto);
  }

  @Get('sync-products')
  @ApiOperation({
    summary: 'List sync products',
    description: 'Get all Printful sync products from database',
  })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by sync status' })
  @ApiResponse({ status: 200, description: 'List of sync products' })
  async listSyncProducts(@Query('status') status?: string): Promise<any[]> {
    return this.printfulService.listSyncProducts(status);
  }

  @Get('sync-products/:syncProductId')
  @ApiOperation({
    summary: 'Get sync product details',
    description: 'Retrieve detailed information about a sync product',
  })
  @ApiParam({ name: 'syncProductId', description: 'Printful sync product ID' })
  @ApiResponse({ status: 200, description: 'Sync product details' })
  async getSyncProduct(@Param('syncProductId') syncProductId: number): Promise<any> {
    return this.printfulService.getSyncProduct(syncProductId);
  }

  // ==================== Helper Endpoints ====================

  @Get('products')
  @ApiOperation({
    summary: 'List all Printful products',
    description: 'Get list of all available Printful products with their IDs',
  })
  @ApiResponse({ status: 200, description: 'Products list' })
  async listProducts(): Promise<any> {
    return this.printfulService.listProducts();
  }

  @Get('products/:productId/variants')
  @ApiOperation({
    summary: 'Get variants for a product',
    description: 'Get all available variants (sizes, colors) for a specific product',
  })
  @ApiParam({ name: 'productId', description: 'Printful product ID' })
  @ApiResponse({ status: 200, description: 'Product variants' })
  async getProductVariants(@Param('productId') productId: number): Promise<any> {
    return this.printfulService.getProductVariants(productId);
  }

  @Post('calculate-position')
  @ApiOperation({
    summary: 'Calculate optimal design position',
    description: 'Calculate the correct position parameters for a design based on print area dimensions',
  })
  @ApiResponse({
    status: 200,
    description: 'Position calculated successfully',
  })
  async calculatePosition(@Body() calculateDto: any): Promise<any> {
    return this.printfulService.calculatePosition(calculateDto);
  }

  // ==================== Mockup Generator ====================

  @Post('generate-mockup-simple')
  @ApiOperation({
    summary: '✨ Generate mockup (EASY - Recommended)',
    description: 'Simplified mockup generation that auto-fetches variants and calculates positioning. Just provide product ID and image URL!',
  })
  @ApiResponse({
    status: 201,
    description: 'Mockup task created',
    type: MockupResponseDto,
  })
  async generateMockupSimple(
    @Body() dto: any,
  ): Promise<MockupResponseDto> {
    return this.printfulService.generateMockupSimple(dto);
  }

  @Post('generate-mockup')
  @ApiOperation({
    summary: 'Generate product mockup',
    description: 'Create mockup generation task in Printful',
  })
  @ApiResponse({
    status: 201,
    description: 'Mockup task created',
    type: MockupResponseDto,
  })
  async generateMockup(
    @Body() generateMockupDto: GenerateMockupDto,
  ): Promise<MockupResponseDto> {
    return this.printfulService.generateMockup(generateMockupDto);
  }

  @Get('mockup-status/:taskKey')
  @ApiOperation({
    summary: 'Check mockup generation status',
    description: 'Poll mockup generation task status',
  })
  @ApiParam({ name: 'taskKey', description: 'Mockup task key' })
  @ApiResponse({
    status: 200,
    description: 'Mockup status',
    type: MockupResponseDto,
  })
  async getMockupStatus(@Param('taskKey') taskKey: string): Promise<MockupResponseDto> {
    return this.printfulService.getMockupStatus(taskKey);
  }

  @Post('sync-products/:syncProductId/regenerate-mockup')
  @ApiOperation({
    summary: 'Regenerate mockup for existing product',
    description: 'Generate new mockups for an existing sync product',
  })
  @ApiParam({ name: 'syncProductId', description: 'Database sync product ID' })
  @ApiResponse({ status: 200, description: 'Mockup regeneration successful' })
  async regenerateMockup(
    @Param('syncProductId') syncProductId: string,
  ): Promise<{ mockupUrls: string[] }> {
    const mockupUrls = await this.mockupService.regenerateMockup(syncProductId);
    return { mockupUrls };
  }

  // ==================== Catalog ====================

  @Get('catalog')
  @ApiOperation({
    summary: 'Get Printful catalog',
    description: 'Retrieve all available Printful products',
  })
  @ApiResponse({ status: 200, description: 'Product catalog' })
  async getCatalog(): Promise<any[]> {
    return this.printfulService.getCatalog();
  }

  @Get('catalog/:productId')
  @ApiOperation({
    summary: 'Get product details',
    description: 'Get detailed information about a specific Printful product',
  })
  @ApiParam({ name: 'productId', description: 'Printful product ID' })
  @ApiResponse({ status: 200, description: 'Product details' })
  async getProduct(@Param('productId') productId: number): Promise<any> {
    return this.printfulService.getProduct(productId);
  }

  @Get('catalog/:productId/size-guide')
  @ApiOperation({
    summary: 'Get size guide',
    description: 'Get size guide/size table for a specific Printful product',
  })
  @ApiParam({ name: 'productId', description: 'Printful product ID' })
  @ApiResponse({ status: 200, description: 'Size guide data' })
  async getSizeGuide(@Param('productId') productId: number): Promise<any> {
    return this.printfulService.getSizeGuide(productId);
  }

  @Get('catalog/:productId/variants')
  @ApiOperation({
    summary: 'Get product variants',
    description: 'Get all variants (sizes, colors) for a product',
  })
  @ApiParam({ name: 'productId', description: 'Printful product ID' })
  @ApiResponse({ status: 200, description: 'Product variants' })
  async getCatalogProductVariants(@Param('productId') productId: number): Promise<any[]> {
    return this.printfulService.getProductVariants(productId);
  }

  // ==================== Orders ====================

  @Post('orders/complete')
  @ApiOperation({
    summary: 'Create complete order with custom design',
    description: 'Uploads design, creates sync product, and creates order in one step',
  })
  @ApiResponse({ status: 201, description: 'Order created' })
  async createCompleteOrder(@Body() orderData: any): Promise<any> {
    // This endpoint handles the full workflow:
    // 1. Upload design (if base64 data provided)
    // 2. Create sync product
    // 3. Create order in Printful
    return this.printfulService.createCompleteOrder(orderData);
  }

  @Post('orders')
  @ApiOperation({
    summary: 'Create order (manual fulfillment)',
    description: 'Manually create a Printful order',
  })
  @ApiResponse({ status: 201, description: 'Order created' })
  async createOrder(@Body() orderData: any): Promise<any> {
    return this.printfulService.createOrder(orderData);
  }

  @Get('orders')
  @ApiOperation({
    summary: 'List orders',
    description: 'Get all Printful orders',
  })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by order status' })
  @ApiResponse({ status: 200, description: 'List of orders' })
  async listOrders(@Query('status') status?: string): Promise<any[]> {
    return this.printfulService.listOrders(status);
  }

  @Get('orders/:orderId')
  @ApiOperation({
    summary: 'Get order details',
    description: 'Retrieve details for a specific order',
  })
  @ApiParam({ name: 'orderId', description: 'Printful order ID' })
  @ApiResponse({ status: 200, description: 'Order details' })
  async getOrder(@Param('orderId') orderId: number): Promise<any> {
    return this.printfulService.getOrder(orderId);
  }

  // ==================== Shipping ====================

  @Post('shipping/calculate')
  @ApiOperation({
    summary: 'Calculate shipping rates with multiple methods',
    description: 'Get detailed shipping cost estimates with available shipping methods (Standard, Express, etc.)',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Shipping rates with available methods',
    type: ShippingRatesResponseDto,
  })
  async calculateShippingRates(
    @Body() dto: CalculateShippingRatesDto,
  ): Promise<ShippingRatesResponseDto> {
    return this.printfulService.calculateShippingRates(dto);
  }

  @Post('shipping/estimate')
  @ApiOperation({
    summary: 'Estimate shipping cost by country',
    description: 'Get a simplified shipping estimate based on country code only (for product browsing)',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Estimated shipping rate',
    type: ShippingRatesResponseDto,
  })
  async estimateShipping(
    @Body() dto: EstimateShippingDto,
  ): Promise<ShippingRatesResponseDto> {
    return this.printfulService.getEstimatedShippingForCountry(dto);
  }

  @Post('shipping/calculate-legacy')
  @ApiOperation({
    summary: 'Calculate shipping rates (legacy endpoint)',
    description: 'Legacy endpoint for backward compatibility',
  })
  @ApiResponse({ status: 200, description: 'Shipping rates' })
  async calculateShippingLegacy(
    @Body() body: { recipient: any; items: any[] },
  ): Promise<any> {
    return this.printfulService.calculateShipping(body.recipient, body.items);
  }

  // ==================== Tax ====================

  @Post('tax/calculate')
  @ApiOperation({
    summary: 'Calculate tax for order',
    description: 'Calculate applicable taxes based on shipping address and order details',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Tax calculation result',
    type: TaxCalculationResponseDto,
  })
  async calculateTax(
    @Body() dto: CalculateTaxDto,
  ): Promise<TaxCalculationResponseDto> {
    return this.printfulService.calculateTax(dto);
  }
}

