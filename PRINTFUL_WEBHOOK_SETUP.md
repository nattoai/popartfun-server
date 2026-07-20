# Printful Webhook Setup Guide

## Overview

This guide explains how to configure Printful webhooks to automatically update order statuses when Printful processes and ships orders.

## Why Webhooks?

Without webhooks, you would need to manually check Printful or poll their API to get order status updates. Webhooks allow Printful to notify your system automatically when:

- Order is received by Printful
- Order status changes
- Order ships (with tracking information)
- Order fails or is canceled

## Prerequisites

1. Backend server deployed and accessible from the internet
2. HTTPS enabled (required for webhooks)
3. Domain configured (e.g., `api.popartfun.com`)

## Step 1: Configure Webhook URL

Your webhook endpoint is:
```
https://api.popartfun.com/api/v1/printful/webhook
```

Replace `api.popartfun.com` with your actual domain.

## Step 2: Set Up Webhook in Printful Dashboard

1. **Log in to Printful**
   - Go to https://printful.com
   - Sign in to your account

2. **Navigate to Settings**
   - Click on your profile (top right)
   - Select "Settings" or "Store Settings"

3. **Find Webhooks Section**
   - Look for "API" or "Webhooks" in the left sidebar
   - Click on "Webhooks"

4. **Add New Webhook**
   - Click "Add webhook" or similar button
   - Enter your webhook URL: `https://api.popartfun.com/api/v1/printful/webhook`

5. **Select Events to Listen For**
   Select these events:
   - ✅ `order_created` - Order received by Printful
   - ✅ `order_updated` - Status changed
   - ✅ `order_shipped` - Package shipped
   - ✅ `order_failed` - Production failed
   - ✅ `order_canceled` - Order canceled

6. **Save Webhook**
   - Click "Save" or "Create"
   - Note the webhook secret if provided

## Step 3: Configure Webhook Secret (Optional but Recommended)

If Printful provides a webhook secret:

1. Copy the webhook secret from Printful dashboard

2. Add to your `.env` file:
   ```bash
   PRINTFUL_WEBHOOK_SECRET=your_webhook_secret_here
   ```

3. Restart your server:
   ```bash
   npm run start:prod
   ```

**Note:** Webhook signature verification is logged but not yet enforced. This allows webhooks to work during initial setup. Full verification can be added when needed for production security.

## Step 4: Test the Webhook

### Method 1: Using Printful's Test Button

1. In Printful dashboard, find your webhook
2. Click "Test" or "Send Test Event"
3. Select event type (e.g., `order_updated`)
4. Click "Send"
5. Check your server logs to confirm receipt

### Method 2: Place a Test Order

1. Create a test order in your application
2. Use Printful's test/sample mode if available
3. Check your database to see if order status updates

### Expected Behavior

When webhook is received, you should see in server logs:
```
[PrintfulService] Received Printful webhook: order_created
[PrintfulService] Order created on Printful: 12345678
[PrintfulService] Order 60a1b2c3d4e5f6g7h8i9j0k1 marked as processing
```

And in your database, the order should be updated with:
- Status changed
- Status history entry added
- Printful status stored

## What Each Webhook Does

### `order_created`
**When:** Order is received by Printful  
**Action:**
- Sets order status to `processing`
- Adds history entry: "Order received by Printful"
- No email sent (customer already got order confirmation)

### `order_updated`
**When:** Order status changes on Printful  
**Action:**
- Maps Printful status to your status
- Updates order status
- Adds history entry with Printful status
- No email sent (unless failed)

**Status Mapping:**
- `draft` → `pending`
- `pending` → `processing`
- `failed` → `failed`
- `canceled` → `cancelled`
- `onhold` → `processing`
- `inprocess` → `processing`
- `fulfilled` → `shipped`

### `order_shipped`
**When:** Package ships from Printful  
**Action:**
- Sets order status to `shipped`
- Saves tracking number, URL, and carrier
- Adds history entry with tracking info
- **Sends shipping notification email to customer** ✉️

### `order_failed`
**When:** Production fails on Printful  
**Action:**
- Sets order status to `failed`
- Adds history entry with failure reason
- **Sends failure notification email to customer** ✉️
- Admin should review and refund if needed

### `order_canceled`
**When:** Order is canceled on Printful  
**Action:**
- Sets order status to `cancelled`
- Adds history entry
- No email sent (cancellation usually admin-initiated)

## Troubleshooting

### Webhook Not Receiving Events

**Check 1: Server Accessibility**
```bash
curl https://api.popartfun.com/health
```
Should return 200 OK.

**Check 2: Firewall/Security**
- Ensure port 443 (HTTPS) is open
- Check if firewall blocks Printful's IPs (usually not needed)

**Check 3: Server Logs**
```bash
# View recent logs
tail -f /var/log/your-app.log

# Or if using PM2
pm2 logs
```

**Check 4: Printful Webhook Logs**
- Go to Printful Dashboard → Webhooks
- Find your webhook
- Click "Logs" or "Recent Deliveries"
- Check response codes:
  - 200: Success ✅
  - 404: Endpoint not found ❌
  - 500: Server error ❌

### Webhook Receives But Doesn't Update Order

**Issue:** Webhook logged but order not found

**Cause:** Order doesn't have `printfulOrderId` set

**Solution:** Ensure your order creation code sets `printfulOrderId`:
```typescript
const order = await userOrderModel.create({
  // ... other fields
  printfulOrderId: printfulResponse.id, // ← Must be set
});
```

**Issue:** Order updates but no email sent

**Cause:** SendGrid not configured or email address missing

**Solution:**
1. Verify SendGrid API key is set
2. Check order has `recipient.email` field
3. Review server logs for email errors

### Testing in Development

**Problem:** Printful can't reach localhost

**Solution:** Use a tunneling service:

1. **Using ngrok:**
   ```bash
   ngrok http 8081
   ```
   
   Ngrok will provide a public URL like:
   ```
   https://abc123.ngrok.io
   ```

2. **Update webhook URL:**
   ```
   https://abc123.ngrok.io/api/v1/printful/webhook
   ```

3. **Test webhook**
   - Send test event from Printful
   - Watch ngrok terminal for requests
   - Check local server logs

**Alternative:** Use Printful's API to manually fetch order updates during development.

## Security Best Practices

### 1. Verify Webhook Signatures
Currently webhooks are accepted without verification for ease of setup. For production:

```typescript
// In printful.service.ts handleWebhook()
const webhookSecret = process.env.PRINTFUL_WEBHOOK_SECRET;
const signature = signatureHeader; // from x-printful-signature header

// Verify HMAC signature
const expectedSignature = crypto
  .createHmac('sha256', webhookSecret)
  .update(rawPayload)
  .digest('hex');

if (signature !== expectedSignature) {
  throw new UnauthorizedException('Invalid webhook signature');
}
```

### 2. Use HTTPS Only
Never use HTTP for webhooks in production. Printful requires HTTPS.

### 3. Rate Limiting
Consider adding rate limiting to webhook endpoint to prevent abuse:
```typescript
@Throttle(100, 60) // 100 requests per minute
async handleWebhook(...) { ... }
```

### 4. Log All Webhook Events
All webhooks are already logged with this format:
```
[PrintfulService] Received Printful webhook: order_shipped
```

Monitor logs for suspicious patterns.

## Monitoring

### Webhook Health Check

Check recent webhook activity:
```bash
# In your database
db.userorders.find({
  'statusHistory.updatedBy': 'printful'
}).sort({ updatedAt: -1 }).limit(10)
```

Should show recent orders updated by Printful.

### Email Delivery

Check if shipping emails are being sent:
```bash
# Server logs should show:
[EmailService] Email sent successfully to customer@example.com
[PrintfulService] Order 60a1b2... marked as shipped, email sent
```

### Error Monitoring

Watch for webhook processing errors:
```bash
grep "Failed to handle webhook" /var/log/your-app.log
```

## Webhook Payload Examples

### Order Shipped Event
```json
{
  "type": "order_shipped",
  "created": 1609459200,
  "data": {
    "id": 12345678,
    "status": "fulfilled",
    "shipment": {
      "tracking_number": "1Z999AA10123456784",
      "tracking_url": "https://www.ups.com/track?tracknum=1Z999AA10123456784",
      "carrier": "UPS",
      "service": "UPS Ground",
      "shipped_at": 1609459200
    }
  }
}
```

### Order Failed Event
```json
{
  "type": "order_failed",
  "created": 1609459200,
  "data": {
    "id": 12345678,
    "status": "failed",
    "reason": "Out of stock"
  }
}
```

## Next Steps

After webhook setup:

1. ✅ Place test order
2. ✅ Verify webhook updates order
3. ✅ Confirm customer receives shipping email
4. ✅ Monitor webhook logs for 24 hours
5. ✅ Implement signature verification for production
6. ✅ Set up alerts for failed webhooks

## Support

**Printful Webhook Issues:**
- Printful Support: https://printful.com/contact
- Printful API Docs: https://developers.printful.com/docs/

**Your Application Issues:**
- Check server logs
- Review this guide
- Test with curl:
  ```bash
  curl -X POST https://api.popartfun.com/api/v1/printful/webhook \
    -H "Content-Type: application/json" \
    -d '{"type":"order_updated","data":{"id":123,"status":"pending"}}'
  ```

---

**Last Updated:** December 26, 2025  
**Status:** Production Ready


