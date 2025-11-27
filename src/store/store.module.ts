import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StoreController } from './store.controller';
import { StoreLegacyController } from './store-legacy.controller';
import { StoreService } from './store.service';
import { ImageProcessingService } from './image-processing.service';
import { PrintfulModule } from '../printful/printful.module';
import { GeminiModule } from '../gemini/gemini.module';
import {
  StoreProduct,
  StoreProductSchema,
} from './schemas/store-product.schema';
import {
  SiteTag,
  SiteTagSchema,
  ProductCategory,
  ProductCategorySchema,
} from './schemas/category.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StoreProduct.name, schema: StoreProductSchema },
      { name: SiteTag.name, schema: SiteTagSchema },
      { name: ProductCategory.name, schema: ProductCategorySchema },
    ]),
    PrintfulModule,
    GeminiModule,
  ],
  controllers: [StoreController, StoreLegacyController],
  providers: [StoreService, ImageProcessingService],
  exports: [StoreService],
})
export class StoreModule {}
