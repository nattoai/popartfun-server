import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { StoreModule } from './store/store.module';
import { PrintfulModule } from './printful/printful.module';
import { AuthModule } from './auth/auth.module';
import { UserProductsModule } from './user-products/user-products.module';
import { TasksModule } from './tasks/tasks.module';
import { GeminiModule } from './gemini/gemini.module';
import { PaymentsModule } from './payments/payments.module';
import { CommonModule } from './common/common.module';
import { AdminModule } from './admin/admin.module';
import { DiscountsModule } from './discounts/discounts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Rate limiting: 100 requests per minute globally
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute window in milliseconds
        limit: 100, // 100 requests per minute
      },
    ]),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/popartfun',
    ),
    CommonModule,
    AuthModule,
    GeminiModule,
    StoreModule,
    PrintfulModule,
    UserProductsModule,
    TasksModule,
    PaymentsModule,
    AdminModule,
    DiscountsModule,
  ],
  controllers: [],
  providers: [
    // Apply rate limiting globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}


