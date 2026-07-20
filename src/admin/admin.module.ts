import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UserOrder, UserOrderSchema } from '../user-products/schemas/user-order.schema';
import { OrderProblem, OrderProblemSchema } from '../user-products/schemas/order-problem.schema';
import { PaymentsModule } from '../payments/payments.module';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserOrder.name, schema: UserOrderSchema },
      { name: OrderProblem.name, schema: OrderProblemSchema },
    ]),
    PaymentsModule,
    AuthModule,
    CommonModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

