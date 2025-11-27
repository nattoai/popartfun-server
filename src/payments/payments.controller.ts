import { Controller, Post, Get, Body, Headers, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto, UpdatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { AuthGuard } from '../auth/auth.guard';
import type { Request } from 'express';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a payment intent for checkout' })
  @ApiResponse({ status: 201, description: 'Payment intent created successfully' })
  async createPaymentIntent(@Body() createPaymentIntentDto: CreatePaymentIntentDto) {
    const paymentIntent = await this.paymentsService.createPaymentIntent(
      createPaymentIntentDto.amount,
      createPaymentIntentDto.currency,
      createPaymentIntentDto.metadata,
    );

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  @Post('update-intent')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update payment intent amount' })
  @ApiResponse({ status: 200, description: 'Payment intent updated successfully' })
  async updatePaymentIntent(@Body() updatePaymentIntentDto: UpdatePaymentIntentDto) {
    const paymentIntent = await this.paymentsService.updatePaymentIntent(
      updatePaymentIntentDto.paymentIntentId,
      updatePaymentIntentDto.amount,
    );

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  @Get('config')
  @ApiOperation({ summary: 'Get Stripe publishable key' })
  @ApiResponse({ status: 200, description: 'Returns Stripe configuration' })
  getConfig() {
    return {
      publishableKey: this.paymentsService.getPublishableKey(),
    };
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: Request & { rawBody?: Buffer },
  ) {
    // Raw body is required for signature verification
    const rawBody = request.rawBody;
    
    if (!rawBody) {
      throw new Error('Raw body is required for webhook signature verification');
    }

    return await this.paymentsService.handleWebhook(signature, rawBody);
  }
}

