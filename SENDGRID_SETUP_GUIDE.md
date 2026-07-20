# SendGrid Email Service Setup Guide

## Overview

This guide walks you through setting up SendGrid for email notifications in PopArtFun. SendGrid provides reliable email delivery for order confirmations, shipping notifications, and contact form submissions.

## Step 1: Create SendGrid Account

1. Go to https://sendgrid.com
2. Click "Start for Free"
3. Complete the signup process
4. Verify your email address

**Free Tier Includes:**
- 100 emails per day (forever free)
- Perfect for getting started and testing
- Upgrade anytime for higher volume

## Step 2: Create API Key

1. Log in to SendGrid dashboard
2. Navigate to **Settings** → **API Keys**
3. Click **Create API Key**
4. Name your key (e.g., "PopArtFun Production")
5. Select **Full Access** or at minimum:
   - Mail Send (Full Access)
   - Template Engine (Read Access)
6. Click **Create & View**
7. **IMPORTANT:** Copy the API key immediately - it will only be shown once!
   - Format: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Step 3: Verify Sender Email

Before you can send emails, you must verify your sender email address.

### Option A: Single Sender Verification (Easiest)

1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in the form:
   - **From Name:** PopArtFun
   - **From Email Address:** noreply@popartfun.com
   - **Reply To:** support@popartfun.com
   - **Company Address:** Your business address
4. Click **Create**
5. Check your email inbox for verification link
6. Click the verification link
7. Status should show "Verified" in dashboard

### Option B: Domain Authentication (Recommended for Production)

1. Go to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Enter your domain: `popartfun.com`
4. Follow the DNS configuration steps:
   - Add CNAME records to your DNS provider
   - Wait for DNS propagation (up to 48 hours, usually faster)
5. Verify DNS records are active
6. All emails from `@popartfun.com` will now be authenticated

**Benefits of Domain Authentication:**
- Better email deliverability
- No "via sendgrid.net" in email headers
- Professional appearance
- Required for sending from multiple addresses

## Step 4: Configure Environment Variables

Add these variables to your `.env` file:

```bash
# SendGrid Email Service
SENDGRID_API_KEY=SG.your_actual_api_key_here
SENDGRID_FROM_EMAIL=noreply@popartfun.com
SENDGRID_FROM_NAME=PopArtFun
COMPANY_EMAIL=support@popartfun.com
```

**Variable Descriptions:**
- `SENDGRID_API_KEY` - Your API key from Step 2
- `SENDGRID_FROM_EMAIL` - Must match a verified sender from Step 3
- `SENDGRID_FROM_NAME` - Display name customers see
- `COMPANY_EMAIL` - Where contact form submissions go

## Step 5: Test Email Sending

### Using the Test Endpoint

1. Start your server:
   ```bash
   npm run start:dev
   ```

2. Send a test email using curl:
   ```bash
   curl -X POST http://localhost:8081/api/v1/test/email \
     -H "Content-Type: application/json" \
     -d '{"email":"your-email@example.com"}'
   ```

3. Check your email inbox (including spam folder)

### Expected Response

**Success:**
```json
true
```

**Failure:**
```json
false
```

Check server logs for error details if sending fails.

## Step 6: Verify Order Confirmation Emails

1. Place a test order through your application
2. Complete the checkout process
3. Check the customer's email inbox
4. Verify the order confirmation email:
   - Contains correct order number
   - Shows all ordered items
   - Displays correct pricing
   - Includes shipping address
   - Has proper formatting

## Troubleshooting

### Issue: "API key not configured" in logs

**Solution:**
- Verify `SENDGRID_API_KEY` is set in `.env`
- Restart your server after adding the variable
- Check for typos in the variable name

### Issue: "The from address does not match a verified Sender Identity"

**Solution:**
- Go to SendGrid → Settings → Sender Authentication
- Verify that `SENDGRID_FROM_EMAIL` matches a verified sender
- Complete single sender verification (Step 3)
- Wait a few minutes after verification

### Issue: Emails going to spam

**Solutions:**
1. Complete domain authentication (Step 3, Option B)
2. Add SPF and DKIM records to DNS
3. Avoid spam trigger words in subject lines
4. Include unsubscribe link for marketing emails
5. Warm up your sending domain gradually

### Issue: "Rate limit exceeded"

**Solution:**
- Free tier: 100 emails/day
- Upgrade to paid plan for higher limits
- Implement email queuing for high volume

### Issue: API key returns 403 Forbidden

**Solutions:**
- Regenerate API key with correct permissions
- Ensure "Mail Send" permission is enabled
- Check API key hasn't been revoked

## Email Templates

The system includes these pre-built email templates:

### Order Confirmation
- **Trigger:** After successful payment
- **Recipient:** Customer
- **Content:** Order details, items, total, shipping address

### Order Shipped
- **Trigger:** Printful webhook when order ships
- **Recipient:** Customer
- **Content:** Tracking number, tracking URL, carrier info

### Order Status Update
- **Trigger:** Admin updates order status
- **Recipient:** Customer
- **Content:** New status, custom message

### Contact Form Submission
- **Trigger:** Customer submits contact form
- **Recipient:** `COMPANY_EMAIL`
- **Content:** Customer message, reply-to address

## Monitoring Email Delivery

### SendGrid Dashboard

1. Log in to SendGrid
2. Go to **Activity**
3. View:
   - Delivery rates
   - Bounce rates
   - Spam reports
   - Opens and clicks (if tracking enabled)

### Key Metrics to Watch

- **Delivered:** Should be >95%
- **Bounced:** Should be <5%
- **Spam Reports:** Should be <0.1%
- **Opens:** Varies by email type

## Production Best Practices

1. **Use Domain Authentication**
   - Better deliverability
   - Professional appearance

2. **Monitor Your Sender Reputation**
   - Keep bounce rate low
   - Remove invalid emails from your list
   - Respond to spam complaints

3. **Set Up Email Templates**
   - Consistent branding
   - Easier to maintain
   - Better localization

4. **Implement Email Queuing**
   - Handle high volume
   - Retry failed sends
   - Rate limit compliance

5. **Add Unsubscribe Links**
   - Required for marketing emails
   - Improves sender reputation
   - Legal compliance (GDPR, CAN-SPAM)

6. **Test Regularly**
   - Send test orders
   - Check different email clients
   - Verify mobile rendering

## Upgrade Plans

When you need more than 100 emails/day:

| Plan | Price | Emails/Month |
|------|-------|--------------|
| Essentials | $19.95/mo | 50,000 |
| Pro | $89.95/mo | 100,000 |
| Premier | $449.95/mo | 1,000,000 |

Choose based on your expected order volume and email needs.

## Support Resources

- **SendGrid Docs:** https://docs.sendgrid.com
- **Email Activity API:** For programmatic monitoring
- **Support:** Available in SendGrid dashboard
- **Status Page:** https://status.sendgrid.com

## Security Notes

1. **Never commit API keys to Git**
   - Use `.env` file (already in `.gitignore`)
   - Use environment variables in production

2. **Rotate API keys regularly**
   - Every 6-12 months
   - Immediately if compromised

3. **Use minimal permissions**
   - Create separate keys for different purposes
   - Revoke unused keys

4. **Monitor API key usage**
   - Check for suspicious activity
   - Set up alerts for unusual volume

## Next Steps

After completing this setup:

1. ✅ SendGrid account created
2. ✅ API key generated
3. ✅ Sender email verified
4. ✅ Environment variables configured
5. ✅ Test email sent successfully
6. ✅ Order confirmation tested

You're ready to launch! Your customers will receive professional email notifications for all their orders.

## Questions?

If you encounter issues not covered in this guide:
1. Check SendGrid logs in dashboard
2. Review server logs for error details
3. Verify DNS records for domain authentication
4. Contact SendGrid support

---

**Last Updated:** December 26, 2025  
**Status:** Production Ready


