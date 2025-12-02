# Quick Start Guide - Stripe Payment Integration

## 🚀 Get Started in 5 Minutes

### Step 1: Get Stripe API Keys (2 minutes)
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

### Step 2: Configure Backend (1 minute)
Add to `popartfun-server/.env`:
```bash
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

### Step 3: Start Servers (1 minute)
```bash
# Terminal 1 - Backend
cd popartfun-server
npm run start:dev

# Terminal 2 - Frontend
cd popartfun-webapp
npm run dev
```

### Step 4: Test Payment (1 minute)
1. Open http://localhost:3007 (or your webapp port)
2. Create a design or add product to cart
3. Go to checkout
4. Use test card: **4242 4242 4242 4242**
   - Expiry: 12/25
   - CVC: 123
   - ZIP: 12345
5. Click "Place Order" ✅

## 🎉 That's It!

Your payment system is now working. Orders will be:
- ✅ Charged via Stripe
- ✅ Saved to MongoDB
- ✅ Sent to Printful for fulfillment

## 📝 Test Cards

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | ✅ Success |
| 4000 0000 0000 0002 | ❌ Declined |
| 4000 0025 0000 3155 | 🔐 Requires 3D Secure |

## 🔍 View Test Payments

- **Stripe Dashboard**: https://dashboard.stripe.com/test/payments
- **MongoDB**: `db.userorders.find().pretty()`

## 📚 Full Documentation

See these files for detailed information:
- `STRIPE_SETUP.md` - Complete setup and testing guide
- `STRIPE_IMPLEMENTATION_SUMMARY.md` - Technical implementation details

## 🆘 Troubleshooting

**Payment not working?**
1. Check backend logs for errors
2. Verify Stripe keys in `.env`
3. Make sure both servers are running
4. Check browser console for errors

**Need help?**
- Check the documentation files above
- Review Stripe Dashboard for payment details
- Check MongoDB for order records

## 🔒 Security Note

⚠️ You're currently using **TEST** mode (keys start with `sk_test_` and `pk_test_`). 

Test mode means:
- No real money is charged
- Use test card numbers only
- Perfect for development and testing

When ready for production, replace with **LIVE** keys from Stripe Dashboard.

---

**Ready to go live?** See the "Deployment Checklist" in `STRIPE_IMPLEMENTATION_SUMMARY.md`





