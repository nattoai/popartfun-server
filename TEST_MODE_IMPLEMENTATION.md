# Test Mode Implementation

## Overview
This document describes the test mode feature that allows developers to quickly test the checkout flow with pre-filled test data and easily identify test purchases.

## Features

### 1. Frontend Test Mode (Checkout Page)

#### Location
- `/popartfun-webapp/src/app/[locale]/checkout/CheckoutPageContent.tsx`
- `/popartfun-webapp/src/app/[locale]/checkout/components/PaymentSection.tsx`

#### Functionality
- **Test Mode Toggle Button**: Located in the shipping information section header
- **Auto-Fill Test Data**: When enabled, automatically fills in test shipping information based on the selected country
- **Visual Indicators**: 
  - Yellow banner at the top of the checkout page when test mode is active
  - Shows Stripe test card numbers in the payment section
  - "Exit Test Mode" button to quickly disable

#### Test Data Available
Pre-configured test addresses for multiple countries (see `/popartfun-webapp/src/lib/test-data.ts`):
- United States (US)
- Canada (CA)
- United Kingdom (GB)
- Australia (AU)
- Hong Kong (HK)
- Singapore (SG)
- Japan (JP)
- Germany (DE)
- France (FR)

#### Stripe Test Cards
When in test mode, the payment section displays:
- **Success Card**: `4242 4242 4242 4242`
- **Declined Card**: `4000 0000 0000 0002`

### 2. Backend Support

#### Database Schema
**Location**: `/popartfun-server/src/user-products/schemas/user-order.schema.ts`

Added `isTest` field to UserOrder schema:
```typescript
@Prop({ default: false })
isTest: boolean; // Flag for test orders
```

#### DTO Updates
**Location**: `/popartfun-server/src/user-products/dto/create-user-order.dto.ts`

Added optional `isTest` field to CreateUserOrderDto:
```typescript
@ApiPropertyOptional({ description: 'Whether this is a test order' })
@IsOptional()
@IsBoolean()
isTest?: boolean;
```

#### Service Logic
**Location**: `/popartfun-server/src/user-products/user-products.service.ts`

The service now:
- Accepts `isTest` flag during order creation
- Stores the flag in the database for filtering later

### 3. Order Management (My Orders Page)

#### Location
- `/popartfun-webapp/src/app/[locale]/my-orders/page.tsx`

#### Features
- **Filter Toggle**: Checkbox to show/hide test orders
- **Visual Indicators**: 
  - Yellow border around test order cards
  - 🧪 "Test Order" badge next to order number
- **Default Behavior**: Shows all orders (including test orders) by default

## Usage

### For Developers/Testers

1. **Navigate to Checkout**
   - Go to any checkout page (e.g., `http://localhost:3000/checkout?designId=xxx`)

2. **Enable Test Mode**
   - Click the "🧪 Test Mode" button in the shipping information section
   - The form will auto-fill with test data for your selected country
   - A yellow banner appears at the top with Stripe test card info

3. **Complete Test Purchase**
   - Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date (e.g., 12/34)
   - Any 3-digit CVC (e.g., 123)
   - Complete the checkout

4. **View Test Orders**
   - Go to My Orders page
   - Test orders are marked with 🧪 badge and yellow border
   - Use the "Show Test Orders" checkbox to filter them

### For Production

Test mode is available in all environments. Orders created in test mode:
- Are marked with `isTest: true` in the database
- Can be filtered out in reports and analytics
- Are visually distinguishable in the admin interface

## Database Queries

### Find All Test Orders
```javascript
db.userorders.find({ isTest: true })
```

### Find Production Orders Only
```javascript
db.userorders.find({ isTest: { $ne: true } })
```

### Count Test vs Production Orders
```javascript
db.userorders.aggregate([
  {
    $group: {
      _id: "$isTest",
      count: { $sum: 1 }
    }
  }
])
```

## Environment Considerations

### Development
- Use test mode freely for all testing
- Stripe test API keys should be configured

### Production
- Test mode still available but use with caution
- Ensure Stripe live API keys are configured
- Test orders will still create real Printful orders (consider adding Printful test mode check)

## Future Enhancements

1. **Printful Integration**: Prevent test orders from being submitted to Printful
2. **Admin Dashboard**: Add test order filter in admin interface
3. **Auto-Cleanup**: Scheduled job to clean up old test orders
4. **Test Mode API**: Endpoint to bulk delete test orders
5. **Analytics Exclusion**: Automatically exclude test orders from analytics

## Files Modified

### Frontend (popartfun-webapp)
- `src/lib/test-data.ts` (new)
- `src/app/[locale]/checkout/CheckoutPageContent.tsx`
- `src/app/[locale]/checkout/components/PaymentSection.tsx`
- `src/app/[locale]/my-orders/page.tsx`

### Backend (popartfun-server)
- `src/user-products/dto/create-user-order.dto.ts`
- `src/user-products/schemas/user-order.schema.ts`
- `src/user-products/user-products.service.ts`

## Testing Checklist

- [ ] Test mode toggle works on checkout page
- [ ] Address auto-fills correctly for different countries
- [ ] Test card information displays in payment section
- [ ] Orders created with test mode have `isTest: true` flag
- [ ] Test orders appear with badge in My Orders page
- [ ] Filter toggle shows/hides test orders correctly
- [ ] Stripe test payments process successfully
- [ ] Payment intent includes test mode metadata

## Notes

- Test mode state is not persisted across page reloads
- Test data is static and defined in `test-data.ts`
- Test orders use real Stripe payment processing (test mode)
- The `isTest` flag is stored in both payment intent metadata and order document



