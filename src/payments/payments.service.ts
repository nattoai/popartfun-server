import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    
    if (!stripeSecretKey) {
      this.logger.warn('STRIPE_SECRET_KEY not found in environment variables');
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables.');
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-11-17.clover',
    });

    this.logger.log('Stripe service initialized successfully');
  }

  /**
   * Create a payment intent with automatic payment methods
   */
  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, string>,
  ): Promise<Stripe.PaymentIntent> {
    try {
      this.logger.log(`Creating payment intent for ${amount} ${currency}`);

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount), // Ensure it's an integer
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true, // Enable cards, Apple Pay, Google Pay automatically
        },
        metadata: metadata || {},
      });

      this.logger.log(`Payment intent created: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to create payment intent: ${error.message}`);
      throw new BadRequestException(`Failed to create payment intent: ${error.message}`);
    }
  }

  /**
   * Update payment intent amount (e.g., if cart changes)
   */
  async updatePaymentIntent(
    paymentIntentId: string,
    amount: number,
  ): Promise<Stripe.PaymentIntent> {
    try {
      this.logger.log(`Updating payment intent ${paymentIntentId} to ${amount}`);

      const paymentIntent = await this.stripe.paymentIntents.update(paymentIntentId, {
        amount: Math.round(amount),
      });

      this.logger.log(`Payment intent updated: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to update payment intent: ${error.message}`);
      throw new BadRequestException(`Failed to update payment intent: ${error.message}`);
    }
  }

  /**
   * Confirm payment status (verify payment succeeded)
   */
  async confirmPayment(paymentIntentId: string): Promise<boolean> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      this.logger.log(`Payment intent ${paymentIntentId} status: ${paymentIntent.status}`);

      return paymentIntent.status === 'succeeded';
    } catch (error) {
      this.logger.error(`Failed to confirm payment: ${error.message}`);
      throw new BadRequestException(`Failed to confirm payment: ${error.message}`);
    }
  }

  /**
   * Get payment intent details
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      this.logger.error(`Failed to retrieve payment intent: ${error.message}`);
      throw new BadRequestException(`Failed to retrieve payment intent: ${error.message}`);
    }
  }

  /**
   * Refund a payment (used if order fails after payment)
   */
  async refundPayment(
    paymentIntentId: string,
    amount?: number,
  ): Promise<Stripe.Refund> {
    try {
      this.logger.log(`Refunding payment intent ${paymentIntentId}${amount ? ` amount: ${amount}` : ' (full refund)'}`);

      const refundData: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundData.amount = Math.round(amount);
      }

      const refund = await this.stripe.refunds.create(refundData);

      this.logger.log(`Refund created: ${refund.id}, status: ${refund.status}`);
      return refund;
    } catch (error) {
      this.logger.error(`Failed to refund payment: ${error.message}`);
      throw new BadRequestException(`Failed to refund payment: ${error.message}`);
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(signature: string, rawBody: Buffer): Promise<any> {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      this.logger.warn('STRIPE_WEBHOOK_SECRET not configured, skipping signature verification');
      throw new BadRequestException('Webhook secret not configured');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );

      this.logger.log(`Webhook received: ${event.type}`);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.canceled':
          await this.handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
          break;
        default:
          this.logger.log(`Unhandled webhook event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Webhook error: ${error.message}`);
      throw new BadRequestException(`Webhook error: ${error.message}`);
    }
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(`Payment succeeded: ${paymentIntent.id}`);
    // Additional logic can be added here (e.g., update order status in database)
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(`Payment failed: ${paymentIntent.id}`);
    // Additional logic can be added here (e.g., notify user, update order)
  }

  private async handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(`Payment canceled: ${paymentIntent.id}`);
    // Additional logic can be added here
  }

  /**
   * Get Stripe publishable key for frontend
   */
  getPublishableKey(): string {
    const publishableKey = this.configService.get<string>('STRIPE_PUBLISHABLE_KEY');
    
    if (!publishableKey) {
      this.logger.warn('STRIPE_PUBLISHABLE_KEY not found in environment variables');
      throw new BadRequestException('Stripe publishable key not configured');
    }

    return publishableKey;
  }
}

