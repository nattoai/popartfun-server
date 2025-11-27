import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PrintfulController } from './printful.controller';
import { PrintfulService } from './printful.service';
import { MockupService } from './mockup.service';
import { StorageService } from './storage.service';
import {
  PrintfulConfig,
  PrintfulConfigSchema,
} from './schemas/printful-config.schema';
import {
  PrintfulSyncProduct,
  PrintfulSyncProductSchema,
} from './schemas/sync-product.schema';
import {
  PrintfulOrder,
  PrintfulOrderSchema,
} from './schemas/printful-order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PrintfulConfig.name, schema: PrintfulConfigSchema },
      { name: PrintfulSyncProduct.name, schema: PrintfulSyncProductSchema },
      { name: PrintfulOrder.name, schema: PrintfulOrderSchema },
    ]),
  ],
  controllers: [PrintfulController],
  providers: [PrintfulService, MockupService, StorageService],
  exports: [PrintfulService, MockupService, StorageService],
})
export class PrintfulModule {}

