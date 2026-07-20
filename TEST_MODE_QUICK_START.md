# Quick Start: Test Mode

## 🚀 How to Use Test Mode

### 1. Access Checkout Page
Navigate to the checkout page with a design:
```
http://localhost:3000/checkout?designId=YOUR_DESIGN_ID
```

### 2. Enable Test Mode
Click the **"🧪 Test Mode"** button in the top right of the Shipping Information section.

The form will automatically fill with:
- ✅ Test name and contact info
- ✅ Complete shipping address for your selected country
- ✅ All required fields

### 3. Payment Information
In test mode, you'll see helpful payment test cards:

**For Successful Payment:**
```
Card Number: 4242 4242 4242 4242
Expiry: 12/34 (any future date)
CVC: 123 (any 3 digits)
```

**For Declined Payment (testing error handling):**
```
Card Number: 4000 0000 0000 0002
Expiry: 12/34
CVC: 123
```

### 4. Complete Purchase
1. Review the test data
2. Click "Place Order"
3. Order will be marked as a test purchase

### 5. View Test Orders
Go to **My Orders** page:
- Test orders have a **🧪 Test Order** badge
- Yellow border for easy identification
- Use the "Show Test Orders" toggle to filter

## 📋 Available Test Addresses

Test data is available for these countries:
- 🇺🇸 United States
- 🇨🇦 Canada
- 🇬🇧 United Kingdom
- 🇦🇺 Australia
- 🇭🇰 Hong Kong
- 🇸🇬 Singapore
- 🇯🇵 Japan
- 🇩🇪 Germany
- 🇫🇷 France

The system automatically loads the appropriate test address based on your shipping region selection.

## 🔍 Filter Test Orders

### In My Orders Page
- Toggle the **"Show Test Orders"** checkbox
- Unchecking hides all test orders
- Test orders are stored with `isTest: true` flag

### In Database
```javascript
// Find all test orders
db.userorders.find({ isTest: true })

// Find only production orders
db.userorders.find({ isTest: { $ne: true } })
```

## 💡 Tips

1. **Quick Testing**: Test mode saves time by pre-filling all form fields
2. **Visual Feedback**: Yellow banner shows you're in test mode
3. **Easy Identification**: Test orders are clearly marked in My Orders
4. **No Manual Entry**: No need to remember test addresses or card numbers
5. **Toggle Off**: Click "Exit Test Mode" to return to normal checkout

## ⚠️ Important Notes

- Test orders still create real Stripe payment intents (in test mode)
- Test orders may still be submitted to Printful (consider this for production)
- Test mode state doesn't persist across page reloads
- Always use Stripe test cards when in test mode

## 🎯 Use Cases

### Development
- Quickly test checkout flow
- Test different countries/regions
- Test payment success/failure scenarios
- Test order creation and display

### QA/Testing
- Automated testing with known test data
- Manual testing without data entry
- Regression testing
- Edge case testing

### Demo/Presentation
- Clean demo with professional-looking test data
- Quick order creation for demos
- Easily distinguishable from real orders

## 🔐 Security

- Test data is static and contains no real personal information
- Email addresses use `@test.com` domain
- Phone numbers are clearly test numbers
- All test orders are flagged in the database

## 📝 Related Documentation

- Full implementation details: `TEST_MODE_IMPLEMENTATION.md`
- Test data definitions: `popartfun-webapp/src/lib/test-data.ts`
- Stripe test cards: https://stripe.com/docs/testing



