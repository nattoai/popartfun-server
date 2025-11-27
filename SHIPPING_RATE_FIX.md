# Shipping Rate Calculation Fix

## Problem
The shipping rate estimate for certain regions (countries) was incorrect or defaulting to $5.00. This was happening because the Printful API requires a `state_code` for shipping estimates to the United States (US), Canada (CA), and Australia (AU), but the initial region selection only provides a `country_code`.

When `getEstimatedShippingForCountry` was called with only `country_code` for these countries, the Printful API would likely fail to return a rate (or return an error), causing the backend to fall back to a hardcoded default of $5.00. This is significantly lower than the actual shipping cost for countries like Australia (typically $10-20+).

## Solution
Updated `popartfun-server/src/printful/printful.service.ts` to provide default state codes for these countries when calculating estimates:

- **United States (US)**: Defaults to 'CA' (California)
- **Canada (CA)**: Defaults to 'ON' (Ontario)
- **Australia (AU)**: Defaults to 'NSW' (New South Wales)

This ensures that the Printful API receives a valid request for estimation purposes and returns a realistic shipping rate for the selected region.

## Code Change
In `getEstimatedShippingForCountry`:

```typescript
// Add default state codes for countries that require them for accurate estimation
let stateCode = undefined;
if (dto.country_code === 'US') stateCode = 'CA'; // California as default
else if (dto.country_code === 'CA') stateCode = 'ON'; // Ontario as default
else if (dto.country_code === 'AU') stateCode = 'NSW'; // New South Wales as default

const printfulRequest = {
  recipient: {
    country_code: dto.country_code,
    state_code: stateCode,
  },
  // ...
};
```

## Verification
- Select "Australia" in the region switcher.
- The estimated shipping cost should now reflect a real rate from Printful (e.g., ~$10-15) instead of the fallback $5.00.

