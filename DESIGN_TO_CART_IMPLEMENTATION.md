# Design to Cart Implementation

## Overview

This document explains how designs are saved to both the cart and server when users arrive at the checkout page with a `designId` parameter.

## Flow Diagram

```
Design Page → Save to Server → Navigate to Checkout → Load Design → Add to Cart
```

## Implementation Details

### 1. Design Page (`popartfun-webapp/src/app/[locale]/design/page.tsx`)

When a user completes their design and clicks "Generate Preview" or proceeds to checkout:

**Lines 243-280:**
```typescript
const handleGeneratePreview = async () => {
  // Check authentication
  if (!user) {
    setShowAuthModal(true);
    return;
  }

  // Prepare design data
  const customProductData = {
    productId: selectedProduct.id || selectedProduct._id,
    variantId: selectedVariant.variantId,
    variantTitle: selectedVariant.title,
    productTitle: selectedProduct.title,
    designData: {
      fileDataUrl: filePreview,
      scale,
      positionX,
      positionY,
      rotation,
      printfulFileId: printfulFileId || undefined,
    },
    price: selectedVariant.price,
  };

  // Save to server (MongoDB)
  const savedProduct = await apiClient.saveCustomProduct(customProductData, token);
  setSavedProductId(savedProduct._id);

  // Navigate to checkout with the saved design ID
  router.push(`/${locale}/checkout?designId=${savedProduct._id}`);
}
```

**Key Actions:**
- ✅ Design is saved to MongoDB via API call to `/user-products` endpoint
- ✅ Returns saved product with `_id`
- ✅ Navigates to checkout page with `designId` query parameter

### 2. Backend API (`popartfun-server/src/user-products/`)

**Controller (`user-products.controller.ts`):**
- Endpoint: `POST /api/v1/user-products`
- Protected by `AuthGuard` (requires authentication)
- Saves custom product design to MongoDB

**Service (`user-products.service.ts`):**
```typescript
async createCustomProduct(
  userId: string,
  createDto: CreateCustomProductDto,
): Promise<UserCustomProductDocument> {
  const customProduct = new this.customProductModel({
    ...createDto,
    userId,
    status: 'draft',
  });

  return customProduct.save();
}
```

**Schema (`schemas/user-custom-product.schema.ts`):**
- Stores: `userId`, `productId`, `variantId`, `designData`, `mockupUrl`, `price`
- Status: Initially saved as `'draft'` (pending payment)
- Indexed by `userId` for fast retrieval

### 3. Checkout Page (`popartfun-webapp/src/app/[locale]/checkout/page.tsx`)

**Updated Implementation (Lines 92-143):**

```typescript
// Check auth and load design
useEffect(() => {
  if (!authLoading) {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    const designId = searchParams.get('designId');
    if (designId) {
      loadDesign(designId);
    } else {
      // Fallback to session storage cart (legacy)
      const cartData = sessionStorage.getItem('cart');
      if (!cartData) {
        router.push(`/${locale}/category/all`);
        return;
      }
      setCart(JSON.parse(cartData));
    }
  }
}, [authLoading, user, searchParams, router, locale]);

const loadDesign = async (designId: string) => {
  try {
    const token = await getAccessToken();
    if (!token) return;

    // Fetch design from server
    const design = await apiClient.getCustomProduct(designId, token);
    setDesignData(design);
    
    // Create cart item from design
    const basePrice = design.price || 0;
    const totalPrice = basePrice + estimatedShipping;
    
    const cartItem: CartItem = {
      productType: design.productTitle,
      variantId: design.variantId,
      variantTitle: design.variantTitle,
      quantity: 1,
      price: totalPrice,
      basePrice: basePrice,
      shippingCost: estimatedShipping,
      image: design.mockupUrl || design.designData?.fileDataUrl,
      customDesign: design.designData,
    };
    
    // Set cart for checkout display
    setCart([cartItem]);
    
    // ✅ NEW: Save to CartContext for persistence (pending payment)
    // This ensures the design is available in the cart across the app
    addToCart(cartItem);
  } catch (error) {
    console.error('Failed to load design:', error);
    router.push(`/${locale}/my-designs`);
  }
};
```

**Key Changes:**
- ✅ Added `useCart()` hook import
- ✅ Calls `addToCart(cartItem)` to save design to global cart context
- ✅ Design is now available in the cart sidebar across the entire app
- ✅ Design persists in `sessionStorage` via CartContext

### 4. Cart Context (`popartfun-webapp/src/contexts/CartContext.tsx`)

The CartContext provides global cart state management:

```typescript
const addToCart = (newItem: CartItem) => {
  const existingIndex = cart.findIndex(
    (item) => item.variantId === newItem.variantId
  );

  if (existingIndex >= 0) {
    const newCart = [...cart];
    newCart[existingIndex].quantity += newItem.quantity || 1;
    setCart(newCart);
  } else {
    setCart([...cart, newItem]);
  }
  
  setShowCart(true);
};

// Auto-save to sessionStorage
useEffect(() => {
  if (cart.length > 0) {
    sessionStorage.setItem('cart', JSON.stringify(cart));
  } else {
    sessionStorage.removeItem('cart');
  }
}, [cart]);
```

**Benefits:**
- Cart is synchronized with `sessionStorage` automatically
- Cart data persists across page navigation
- Cart is accessible from any page via the navigation header
- Cart badge shows item count in real-time

## Design Status Flow

```
Draft → Pending Payment → Paid → Processing → Shipped
  ↑           ↑
  |           |
Saved    Added to Cart
```

### Status Definitions:

1. **`draft`** - Design created and saved to server (MongoDB)
2. **Pending Payment** - Design loaded into checkout, added to cart
3. **`completed`** - Payment successful, order created
4. **`processing`** - Order submitted to Printful
5. **`shipped`** - Order fulfilled and shipped

## Data Persistence

### Server-Side (MongoDB)
- **Collection:** `UserCustomProduct`
- **Stored Data:**
  - `userId` - Supabase user ID
  - `productId` - Reference to store product
  - `variantId` - Printful variant ID
  - `designData` - Design parameters (scale, position, rotation, fileDataUrl)
  - `mockupUrl` - Generated mockup preview
  - `price` - Product price at time of creation
  - `status` - Current status (`draft`, `completed`, `archived`)
  - `createdAt`, `updatedAt` - Timestamps

### Client-Side (sessionStorage)
- **Key:** `'cart'`
- **Format:** JSON array of `CartItem` objects
- **Managed by:** `CartContext`
- **Lifetime:** Session (cleared on browser close)

## Security & Authorization

### Authentication Required
- Design page requires login to save designs
- Checkout page requires login to proceed
- All API calls use JWT bearer tokens

### Authorization
- Users can only access their own designs
- `userId` is verified on backend for all operations
- Designs are filtered by `userId` in database queries

## API Endpoints Used

### Save Design
```
POST /api/v1/user-products
Authorization: Bearer <token>
Body: {
  productId, variantId, variantTitle, productTitle,
  designData: { fileDataUrl, scale, positionX, positionY, rotation },
  price
}
```

### Load Design
```
GET /api/v1/user-products/:id
Authorization: Bearer <token>
Returns: UserCustomProduct document
```

### Create Order
```
POST /api/v1/user-products/orders
Authorization: Bearer <token>
Body: {
  recipient, items, shippingMethod, shippingCost,
  taxAmount, paymentIntentId
}
```

## Testing

### Test Flow
1. Navigate to design page: `http://localhost:3000/{locale}/design?product={id}&variant={id}`
2. Upload and adjust design
3. Click "Generate Preview" or "Proceed to Checkout"
4. Verify design is saved to server (check MongoDB)
5. Verify navigation to checkout with `designId` parameter
6. Verify design is loaded and added to cart
7. Check cart sidebar - design should appear
8. Navigate to other pages - cart should persist

### Verification Points
- ✅ Design saved in MongoDB with `status: 'draft'`
- ✅ Design appears in checkout page
- ✅ Design appears in cart sidebar
- ✅ Cart persists across page navigation
- ✅ Cart count badge updates in navigation header

## Future Enhancements

1. **Cart Synchronization** - Save cart to server for cross-device access
2. **Draft Recovery** - Auto-load incomplete designs
3. **Multiple Designs** - Support adding multiple designs to cart
4. **Status Updates** - Real-time order status updates via webhooks
5. **Design Versioning** - Save multiple versions of the same design

## Files Modified

### Frontend (popartfun-webapp)
- `src/app/[locale]/checkout/page.tsx` - Added cart integration
- `src/contexts/CartContext.tsx` - Already implemented (no changes)
- `src/lib/api-client.ts` - Already implemented (no changes)

### Backend (popartfun-server)
- No changes required - already implemented correctly

## Summary

✅ **Design is saved to server** when user proceeds from design page
✅ **Design is saved to cart** when user arrives at checkout with `designId`
✅ **Design persists** in both MongoDB and sessionStorage
✅ **Cart is accessible** from anywhere in the app via CartContext
✅ **Payment is pending** until order is completed and confirmed

The implementation ensures a seamless user experience where designs are properly saved and tracked throughout the entire purchase flow, from creation to checkout to order fulfillment.


