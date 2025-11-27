#!/bin/bash

echo "Testing Printful Shipping Cost API - 50 Items Example"
echo "======================================================"
echo ""
echo "Request: 50 T-Shirts to California"
echo ""

curl -X POST http://localhost:8081/api/v1/printful/shipping/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": {
      "country_code": "US",
      "state_code": "CA",
      "zip": "90001"
    },
    "items": [
      {
        "variant_id": 4011,
        "quantity": 50
      }
    ]
  }' | jq '.'

echo ""
echo "======================================================"
echo "Notice: The shipping rate is for ALL 50 items combined,"
echo "        NOT $5 × 50 = $250!"
echo ""
echo "Expected result: ~$12-15 for STANDARD shipping"
echo "======================================================"
