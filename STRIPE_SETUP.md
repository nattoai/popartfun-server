# Stripe Payment Integration - Testing Guide

## Setup Instructions

### 1. Backend Setup (popartfun-server)

Add the following environment variables to your `.env` file:

```bash
# Stripe Configuration (Get these from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 2. Frontend Setup (popartfun-webapp)

No additional environment variables needed. The publishable key is fetched from the backend API.

### 3. Start the Servers

**Backend:**
```bash
cd popartfun-server
npm run start:dev
```

**Frontend:**
```bash
cd popartfun-webapp
npm run dev
```

## Testing the Payment Flow

### Test Card Numbers

Use these Stripe test card numbers (from https://stripe.com/docs/testing):

#### Successful Payments
- **Card Number:** `4242 4242 4242 4242`
- **Expiry:** Any future date (e.g., `12/25`)
- **CVC:** Any 3 digits (e.g., `123`)
- **ZIP:** Any 5 digits (e.g., `12345`)

#### Declined Cards
- **Insufficient funds:** `4000 0000 0000 9995`
- **Generic decline:** `4000 0000 0000 0002`
- **Card velocity exceeded:** `4000 0000 0000 9987`

#### 3D Secure Authentication
- **Requires authentication:** `4000 0025 0000 3155` (will show authentication popup)

### Test Flow

1. **Navigate to your app** and create a custom product or add items to cart
2. **Go to checkout** - you should see:
   - Shipping form (auto-filled with user info)
   - Payment section with Stripe Payment Element
   - Order summary on the right
3. **Fill in shipping details** (if not auto-filled)
4. **Enter payment details** using test card `4242 4242 4242 4242`
5. **Click "Place Order"**
   - Payment should be confirmed
   - Order should be created in MongoDB
   - Order should be submitted to Printful
   - User should be redirected to "My Orders" page

### Expected Behavior

✅ **Success Path:**
1. Payment intent created on page load
2. User fills shipping and payment info
3. Payment confirms successfully
4. Backend verifies payment before creating order
5. Order created in MongoDB with payment info
6. Order submitted to Printful
7. User redirected to orders page

❌ **Failure Path:**
1. If payment fails: Error shown below payment form, user can retry
2. If Printful fails after payment: Order marked as failed, refund initiated automatically
3. If network error: User shown error message, can refresh and try again

## Testing Webhooks

### Local Webhook Testing with Stripe CLI

1. **Install Stripe CLI:**
```bash
brew install stripe/stripe-cli/stripe
```

2. **Login to Stripe:**
```bash
stripe login
```

3. **Forward webhooks to local server:**
```bash
stripe listen --forward-to localhost:8081/api/v1/payments/webhook
```

4. **Copy the webhook signing secret** from the CLI output and update `.env`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

5. **Trigger test webhook events:**
```bash
# Test successful payment
stripe trigger payment_intent.succeeded

# Test failed payment
stripe trigger payment_intent.payment_failed
```

## Checking Payment Status

### Stripe Dashboard
- Go to https://dashboard.stripe.com/test/payments
- You should see test payments appear here

### MongoDB
Check your orders in MongoDB:
```bash
mongosh
use popartfun
db.userorders.find().pretty()
```

Look for:
- `paymentIntentId`: Should match Stripe payment intent ID
- `paymentStatus`: Should be "paid" for successful orders
- `paidAt`: Timestamp of payment

## Common Issues

### Issue: "Payment system not ready"
**Solution:** Wait a few seconds for payment intent to be created, or refresh the page

### Issue: "Failed to initialize payment system"
**Solution:** Check that backend is running and Stripe keys are correct in `.env`

### Issue: Webhook signature verification failed
**Solution:** Make sure `STRIPE_WEBHOOK_SECRET` in `.env` matches the secret from Stripe CLI

### Issue: Payment succeeds but order not created
**Solution:** Check backend logs for errors. Payment may need to be refunded manually.

## Security Notes

⚠️ **Development Mode:**
- Using test API keys (starts with `sk_test_` and `pk_test_`)
- Test cards won't charge real money
- Webhooks forwarded via Stripe CLI for local testing

🔒 **Production Checklist:**
- Replace test keys with live keys (`sk_live_` and `pk_live_`)
- Set up production webhook endpoint (must be HTTPS)
- Enable 3D Secure authentication in Stripe Dashboard
- Set up monitoring for failed payments and refunds
- Test with real cards in small amounts
- Implement rate limiting on payment endpoints

## API Endpoints

### Payment Endpoints
- `POST /api/v1/payments/create-intent` - Create payment intent (authenticated)
- `POST /api/v1/payments/webhook` - Stripe webhook handler (no auth, signature verified)
- `GET /api/v1/payments/config` - Get publishable key (public)

### Order Endpoints
- `POST /api/v1/user-products/orders` - Create order with payment intent ID (authenticated)
- `GET /api/v1/user-products/orders` - List user orders (authenticated)

## Support

If you encounter issues:
1. Check backend logs for detailed error messages
2. Check browser console for frontend errors
3. Verify Stripe dashboard for payment status
4. Check MongoDB for order records

## References

- [Stripe Payment Element Docs](https://stripe.com/docs/payments/payment-element)
- [Stripe Testing Docs](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)



