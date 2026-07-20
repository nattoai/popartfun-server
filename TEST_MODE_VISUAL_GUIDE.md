# Test Mode Visual Guide

## Checkout Page - Test Mode OFF (Default)

```
┌─────────────────────────────────────────────────────────┐
│  CHECKOUT                                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Shipping Information            🧪 Test Mode     │  │
│  │─────────────────────────────────────────────────│  │
│  │ First Name: [________________]                   │  │
│  │ Last Name:  [________________]                   │  │
│  │ Address:    [________________]                   │  │
│  │ City:       [________________]                   │  │
│  │ State:      [________________]                   │  │
│  │ ZIP:        [________________]                   │  │
│  │ Country:    United States 🔒                     │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Payment Method                                    │  │
│  │─────────────────────────────────────────────────│  │
│  │ [Stripe Payment Element]                         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  [🔒 Place Order]                                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Checkout Page - Test Mode ON

```
┌─────────────────────────────────────────────────────────┐
│  CHECKOUT                                                │
├─────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🧪 Test Mode Active                                │ │
│  │ This order will be marked as a test purchase.     │ │
│  │ Use Stripe test card: 4242 4242 4242 4242         │ │
│  │                               [Exit Test Mode]     │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Shipping Information                              │  │
│  │─────────────────────────────────────────────────│  │
│  │ First Name: [John_______________] ✓              │  │
│  │ Last Name:  [Doe________________] ✓              │  │
│  │ Address:    [123 Test Street____] ✓              │  │
│  │ City:       [New York___________] ✓              │  │
│  │ State:      [NY_________________] ✓              │  │
│  │ ZIP:        [10001______________] ✓              │  │
│  │ Country:    United States 🔒                     │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Payment Method                                    │  │
│  │─────────────────────────────────────────────────│  │
│  │ ┌──────────────────────────────────────────────┐│  │
│  │ │ ℹ️ Stripe Test Cards                         ││  │
│  │ │ Success: 4242 4242 4242 4242                 ││  │
│  │ │ Declined: 4000 0000 0000 0002                ││  │
│  │ │ Any future expiry date and any 3-digit CVC   ││  │
│  │ └──────────────────────────────────────────────┘│  │
│  │                                                   │  │
│  │ [Stripe Payment Element]                         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  [🔒 Place Order]                                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## My Orders Page - With Test Orders

```
┌─────────────────────────────────────────────────────────────┐
│  MY ORDERS                     ☑️ Show Test Orders          │
│  View your order history and track shipments               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  COMPLETED ORDERS                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Order #A7B3C9E2  🧪 Test Order      [pending]      │   │
│  │ Placed October 15, 2024                             │   │
│  │─────────────────────────────────────────────────────│   │
│  │ Items:                                              │   │
│  │ 1x Unisex Staple T-Shirt          $25.00           │   │
│  │                                                     │   │
│  │ Shipping Address:                                   │   │
│  │ John Doe                                            │   │
│  │ 123 Test Street, Apt 4B                            │   │
│  │ New York, NY 10001                                 │   │
│  │ US                                                  │   │
│  │                                                     │   │
│  │ Subtotal:  $25.00                                   │   │
│  │ Shipping:  $5.00                                    │   │
│  │ Tax:       $2.50                                    │   │
│  │ Total:     $32.50                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│  ↑ Yellow Border                                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Order #B8C4D0F3              [processing]          │   │
│  │ Placed October 14, 2024                             │   │
│  │─────────────────────────────────────────────────────│   │
│  │ Items:                                              │   │
│  │ 2x Unisex Hoodie                  $80.00           │   │
│  │                                                     │   │
│  │ ... (production order details) ...                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## My Orders Page - Test Orders Hidden

```
┌─────────────────────────────────────────────────────────────┐
│  MY ORDERS                     ☐ Show Test Orders           │
│  View your order history and track shipments               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  COMPLETED ORDERS                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Order #B8C4D0F3              [processing]          │   │
│  │ Placed October 14, 2024                             │   │
│  │─────────────────────────────────────────────────────│   │
│  │ Items:                                              │   │
│  │ 2x Unisex Hoodie                  $80.00           │   │
│  │                                                     │   │
│  │ Shipping Address:                                   │   │
│  │ Jane Smith                                          │   │
│  │ 456 Real Street                                    │   │
│  │ Los Angeles, CA 90001                              │   │
│  │ US                                                  │   │
│  │                                                     │   │
│  │ Subtotal:  $80.00                                   │   │
│  │ Shipping:  $8.00                                    │   │
│  │ Tax:       $7.20                                    │   │
│  │ Total:     $95.20                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  (Test orders are hidden)                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Key Visual Elements

### Test Mode Banner (Yellow)
- Background: Yellow-50
- Border: Yellow-400
- Icon: 🧪 (Test Tube Emoji)
- Shows test card number prominently
- "Exit Test Mode" button on the right

### Test Order Card
- Border: 2px solid Yellow-300
- Badge: Yellow-100 background with 🧪 icon
- Placement: Next to order number in header

### Test Mode Toggle Button
- Default state: Gray background
- Hover: Darker gray
- Icon: 🧪 (Test Tube Emoji)
- Location: Shipping Information header

### Test Cards Info Box (Payment Section)
- Background: Blue-50
- Border: Blue-200
- Icon: ℹ️ (Information)
- Shows both success and declined test cards
- Displays formatting hint

## Color Scheme

```
Yellow Theme (Test Mode):
- Banner Background: #FFFBEB (yellow-50)
- Banner Border: #FBBF24 (yellow-400)
- Badge Background: #FEF3C7 (yellow-100)
- Badge Text: #92400E (yellow-800)
- Border Color: #FCD34D (yellow-300)

Blue Theme (Info):
- Background: #EFF6FF (blue-50)
- Border: #BFDBFE (blue-200)
- Text: #1E3A8A (blue-900)
```

## Icons Used

- 🧪 Test tube - Test mode indicator
- 🔒 Lock - Secure payment / locked country
- ℹ️ Information - Helpful info boxes
- ✓ Checkmark - Auto-filled fields
- 📦 Package - Empty orders state

## Interaction Flow

```
1. User clicks "🧪 Test Mode" button
   ↓
2. Yellow banner appears at top
   ↓
3. All form fields auto-fill
   ↓
4. Payment section shows test card info
   ↓
5. User enters test card details
   ↓
6. Submits order
   ↓
7. Order appears with 🧪 badge in My Orders
   ↓
8. Can be filtered using "Show Test Orders" toggle
```



