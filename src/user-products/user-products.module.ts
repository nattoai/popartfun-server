import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserProductsController } from './user-products.controller';
import { UserProductsService } from './user-products.service';
import {
  UserCustomProduct,
  UserCustomProductSchema,
} from './schemas/user-custom-product.schema';
import {
  UserOrder,
  UserOrderSchema,
} from './schemas/user-order.schema';
import {
  OrderProblem,
  OrderProblemSchema,
} from './schemas/order-problem.schema';
import { PrintfulModule } from '../printful/printful.module';
import { PaymentsModule } from '../payments/payments.module';
import { CommonModule } from '../common/common.module';
import { DiscountsModule } from '../discounts/discounts.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserCustomProduct.name, schema: UserCustomProductSchema },
      { name: UserOrder.name, schema: UserOrderSchema },
      { name: OrderProblem.name, schema: OrderProblemSchema },
    ]),
    PrintfulModule,
    PaymentsModule,
    CommonModule,
    forwardRef(() => DiscountsModule),
  ],
  controllers: [UserProductsController],
  providers: [UserProductsService],
  exports: [UserProductsService],
})
export class UserProductsModule {}

