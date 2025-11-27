import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { StoreModule } from './store/store.module';
import { PrintfulModule } from './printful/printful.module';
import { AuthModule } from './auth/auth.module';
import { UserProductsModule } from './user-products/user-products.module';
import { TasksModule } from './tasks/tasks.module';
import { GeminiModule } from './gemini/gemini.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/popartfun',
    ),
    AuthModule,
    GeminiModule,
    StoreModule,
    PrintfulModule,
    UserProductsModule,
    TasksModule,
    PaymentsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}


