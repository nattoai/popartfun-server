# Store User Flow - README

> **IMPORTANT NOTE:** This documentation is LEGACY and references old Printify API integration. 
> 
> **The Store module now uses Printful API exclusively**, not Printify API. The routes shown below may not work as documented.
>
> **For current API documentation, see:**
> - `docs/STORE_CMS_GUIDE.md` - Current store management guide
> - `docs/PRINTIFY_TO_STORE_MIGRATION.md` - Migration guide from old Printify routes to new Store routes
> - The Store module provides product management features using Printful as the backend provider

---

## LEGACY Documentation (Printify API - No Longer Used)

### Overview

This module **previously** implemented a print-on-demand e-commerce flow for Printify API. This is no longer in use.

### Environment Variables (DEPRECATED)

The following environment variables are NO LONGER USED:

```env
# DEPRECATED - No longer needed
PRINTIFY_API_TOKEN=not_used
PRINTIFY_SHOP_ID=not_used
```

### 2. Test the Flow

```bash
# Step 1: Customize a product
curl -X POST http://localhost:3000/printify/customize \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "image": "data:image/png;base64,...",
    "image_filename": "design.png",
    "product_type": "tshirt"
  }'

# Save the customization_id from the response

# Step 2: Calculate order
curl -X POST http://localhost:3000/printify/calculate-order \
  -H "Content-Type: application/json" \
  -d '{
    "customization_id": "custom_xxx",
    "variants": [{"variant_id": 123, "quantity": 1}],
    "country": "US"
  }'

# Step 3: Complete order (WARNING: Creates real order!)
curl -X POST http://localhost:3000/printify/complete-order \
  -H "Content-Type: application/json" \
  -d '{
    "customization_id": "custom_xxx",
    "variants": [{"variant_id": 123, "quantity": 1}],
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "address1": "123 Test St",
    "city": "Test City",
    "country": "US",
    "zip": "12345"
  }'
```

## API Endpoints

### Simplified User Flow

| Endpoint                    | Method | Description                               |
| --------------------------- | ------ | ----------------------------------------- |
| `/printify/customize`       | POST   | Upload image & select product type        |
| `/printify/customize/:id`   | GET    | Get customization details                 |
| `/printify/calculate-order` | POST   | Calculate order total with shipping & tax |
| `/printify/complete-order`  | POST   | Create product and place order            |

### Traditional Endpoints (Still Available)

All existing Printify endpoints remain functional:

- Image management: `/printify/images/*`
- Catalog: `/printify/catalog/*`
- Products: `/printify/products/*`
- Orders: `/printify/orders/*`

## Supported Product Types

- `tshirt` - T-Shirt
- `hoodie` - Hoodie
- `sweatshirt` - Sweatshirt
- `mug` - Mug
- `poster` - Poster
- `canvas` - Canvas
- `phone-case` - Phone Case
- `tote-bag` - Tote Bag
- `sticker` - Sticker
- `pillow` - Pillow
- `blanket` - Blanket

## File Structure

```
src/printify/
├── dto/
│   ├── custom-product.dto.ts       # New DTOs for simplified flow
│   ├── product.dto.ts               # Existing product DTOs
│   ├── create-order.dto.ts          # Existing order DTOs
│   └── ...
├── schemas/
│   ├── customization.schema.ts      # New: Temporary customizations
│   ├── product.schema.ts            # Existing: Products
│   ├── order.schema.ts              # Existing: Orders
│   └── image.schema.ts              # Existing: Images
├── printify.controller.ts           # Updated with new endpoints
├── printify.service.ts              # Updated with new methods
├── printify.module.ts               # Updated with new schema
└── README_USER_FLOW.md              # This file
```

## Documentation

Comprehensive documentation is available in the `docs/` directory:

1. **Complete Guide:** `docs/PRINTIFY_USER_FLOW.md`
   - Detailed API documentation
   - Frontend integration examples
   - Production considerations

2. **Quick Start:** `docs/PRINTIFY_USER_FLOW_QUICKSTART.md`
   - Step-by-step testing guide
   - cURL examples
   - Troubleshooting tips

3. **Frontend Example:** `docs/PRINTIFY_FRONTEND_EXAMPLE.tsx`
   - Complete React/Next.js component
   - Ready to use in your webapp
   - Includes all steps of the flow

4. **Implementation Summary:** `docs/PRINTIFY_USER_FLOW_SUMMARY.md`
   - Architecture overview
   - Database schema
   - Production checklist

## Key Features

### ✅ User-Friendly

- Single API call to upload and preview
- Automatic product type mapping
- Pre-calculated pricing

### ✅ Flexible

- Support for 11+ product types
- Easy to add more products
- Customizable pricing

### ✅ Complete

- Image upload
- Product preview
- Price calculation
- Order placement
- Order tracking

### ✅ Production-Ready

- Database persistence
- Error handling
- Swagger documentation
- TypeScript types

## How It Works

### Step 1: Customize Product

```typescript
// User uploads image and selects product type
const customization = await customizeProduct({
  user_id: 'user123',
  image: base64Image,
  product_type: 'tshirt',
});

// Returns:
// - customization_id (save this!)
// - Available variants with pricing
// - Image preview URL
```

### Step 2: Calculate Order

```typescript
// User selects variants and quantities
const calculation = await calculateOrder({
  customization_id: 'custom_xxx',
  variants: [{ variant_id: 123, quantity: 2 }],
  country: 'US',
});

// Returns:
// - Subtotal, shipping, tax, total
// - Line items breakdown
```

### Step 3: Complete Order

```typescript
// User provides shipping info and payment
const order = await completeOrder({
  customization_id: 'custom_xxx',
  variants: [...],
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  address1: '123 Main St',
  // ... other shipping details
  payment_intent_id: 'pi_xxx' // From Stripe/PayPal
});

// Returns:
// - order_id
// - product_id
// - status
```

## Database Schema

### Customization (New)

Temporary storage for product customizations (expires after 24 hours):

```typescript
{
  customization_id: string;
  user_id: string;
  image_id: string;
  product_type: string;
  variants: Variant[];
  expires_at: Date;
}
```

### Product (Existing)

Permanent storage for created products:

```typescript
{
  printify_product_id: string;
  user_id: string;
  title: string;
  blueprint_id: number;
  variants: Variant[];
}
```

### Order (Existing)

Order records:

```typescript
{
  printify_order_id: string;
  user_id: string;
  status: string;
  address_to: Address;
  line_items: LineItem[];
}
```

## Frontend Integration

Use the provided React component (`docs/PRINTIFY_FRONTEND_EXAMPLE.tsx`) or build your own:

```typescript
// 1. Upload & Customize
const customization = await fetch('/api/printify/customize', {
  method: 'POST',
  body: JSON.stringify({ image, product_type }),
});

// 2. Show variants, let user select

// 3. Calculate order
const calculation = await fetch('/api/printify/calculate-order', {
  method: 'POST',
  body: JSON.stringify({ customization_id, variants, country }),
});

// 4. Collect shipping info and payment

// 5. Complete order
const order = await fetch('/api/printify/complete-order', {
  method: 'POST',
  body: JSON.stringify({ customization_id, variants, shipping_info }),
});
```

## Payment Integration

The flow includes placeholders for payment processing. You need to integrate with:

- **Stripe** (recommended): https://stripe.com/docs
- **PayPal**: https://developer.paypal.com/
- **Square**: https://developer.squareup.com/

Example Stripe flow:

1. Create payment intent with order total
2. Collect payment details on frontend
3. Confirm payment
4. Pass `payment_intent_id` to `complete-order` endpoint

## Testing

### Using Swagger UI

Navigate to: `http://localhost:3000/api`

- Find the "Printify" section
- Look for "SIMPLIFIED USER FLOW" endpoints
- Try each endpoint with the "Try it out" button

### Using cURL

See `docs/PRINTIFY_USER_FLOW_QUICKSTART.md` for detailed cURL examples.

### Using Frontend

Copy `docs/PRINTIFY_FRONTEND_EXAMPLE.tsx` to your webapp and customize.

## Production Checklist

Before going live:

- [ ] Update blueprint mappings with correct IDs
- [ ] Implement real shipping calculation
- [ ] Integrate tax calculation service
- [ ] Add payment processor (Stripe/PayPal)
- [ ] Set up order webhooks
- [ ] Implement email notifications
- [ ] Add rate limiting
- [ ] Set up error monitoring
- [ ] Configure production database
- [ ] Test complete flow end-to-end

## Troubleshooting

### "Customization not found"

- Customizations expire after 24 hours
- Make sure you're using the correct `customization_id`

### "Unsupported product type"

- Check spelling of product type
- See list of supported types above

### "No print providers available"

- Some blueprints may not be available in your region
- Try a different product type

### Image upload fails

- Check image format (PNG, JPG supported)
- Verify image size (Printify has limits)
- Ensure base64 encoding is correct

## Support

- **Documentation:** See `docs/` directory
- **API Reference:** http://localhost:3000/api (Swagger)
- **Printify API:** https://developers.printify.com/
- **Server Logs:** `tail -f server.log`

## Next Steps

1. **Test the API** - Use the Quick Start guide
2. **Build Frontend** - Use the example component
3. **Add Payment** - Integrate Stripe/PayPal
4. **Deploy** - Follow production checklist

---

**Need help?** Check the comprehensive guides in the `docs/` directory!

