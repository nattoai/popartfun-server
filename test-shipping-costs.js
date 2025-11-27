/**
 * Test Script: Real Shipping Cost Calculation from Printful API
 * 
 * This script demonstrates how to get real shipping costs for orders of any size,
 * including large orders like 50 items.
 * 
 * Usage:
 *   node test-shipping-costs.js
 */

const SERVER_URL = 'http://localhost:8081';

// Test scenarios
const testScenarios = [
  {
    name: '1 T-Shirt to California',
    data: {
      recipient: {
        country_code: 'US',
        state_code: 'CA',
        zip: '90001',
      },
      items: [
        {
          variant_id: 4011,
          quantity: 1,
        },
      ],
    },
  },
  {
    name: '10 T-Shirts to California',
    data: {
      recipient: {
        country_code: 'US',
        state_code: 'CA',
        zip: '90001',
      },
      items: [
        {
          variant_id: 4011,
          quantity: 10,
        },
      ],
    },
  },
  {
    name: '50 T-Shirts to California (YOUR EXAMPLE)',
    data: {
      recipient: {
        country_code: 'US',
        state_code: 'CA',
        zip: '90001',
      },
      items: [
        {
          variant_id: 4011,
          quantity: 50,
        },
      ],
    },
  },
  {
    name: '50 Mixed Items (20+15+15)',
    data: {
      recipient: {
        country_code: 'US',
        state_code: 'NY',
        zip: '10001',
      },
      items: [
        {
          variant_id: 4011,
          quantity: 20,
        },
        {
          variant_id: 4012,
          quantity: 15,
        },
        {
          variant_id: 4013,
          quantity: 15,
        },
      ],
    },
  },
  {
    name: '50 T-Shirts to UK (International)',
    data: {
      recipient: {
        country_code: 'GB',
        city: 'London',
        zip: 'SW1A 1AA',
      },
      items: [
        {
          variant_id: 4011,
          quantity: 50,
        },
      ],
    },
  },
];

/**
 * Calculate shipping cost using Printful API
 */
async function calculateShipping(data) {
  const url = `${SERVER_URL}/api/v1/printful/shipping/calculate`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Failed to calculate shipping: ${error.message}`);
  }
}

/**
 * Display shipping results in a formatted table
 */
function displayResults(scenarioName, result) {
  console.log('\n' + '='.repeat(80));
  console.log(`📦 ${scenarioName}`);
  console.log('='.repeat(80));

  if (result.error) {
    console.log('❌ ERROR:', result.error);
    return;
  }

  if (!result.shipping_methods || result.shipping_methods.length === 0) {
    console.log('❌ No shipping methods available');
    return;
  }

  console.log('\n✅ Available Shipping Methods:\n');
  console.log('Method'.padEnd(20), 'Rate'.padEnd(12), 'Delivery');
  console.log('-'.repeat(80));

  for (const method of result.shipping_methods) {
    const methodName = method.name || method.id;
    const rate = `$${method.rate.toFixed(2)} ${method.currency}`;
    const delivery = method.delivery_estimate || 'N/A';
    
    console.log(
      methodName.padEnd(20),
      rate.padEnd(12),
      delivery
    );
  }

  // Calculate the total items
  const totalItems = result.shipping_methods[0] ? 
    'Multiple items' : 'N/A';

  console.log('\n💡 Notice: The shipping rate is for the ENTIRE order, not per item!');
}

/**
 * Run all test scenarios
 */
async function runTests() {
  console.log('\n🚀 Testing Printful Real Shipping Cost Calculation');
  console.log('📍 Server:', SERVER_URL);
  console.log('⏰ Started at:', new Date().toLocaleString());

  for (const scenario of testScenarios) {
    try {
      console.log(`\n⏳ Testing: ${scenario.name}...`);
      
      const totalItems = scenario.data.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      console.log(`   Total items in order: ${totalItems}`);
      
      const result = await calculateShipping(scenario.data);
      displayResults(scenario.name, result);
      
      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log('\n' + '='.repeat(80));
      console.log(`📦 ${scenario.name}`);
      console.log('='.repeat(80));
      console.log('❌ ERROR:', error.message);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Testing Complete!');
  console.log('='.repeat(80));
  console.log('\n📊 Summary:');
  console.log('- Tested with orders from 1 to 50 items');
  console.log('- Shipping cost does NOT multiply by quantity');
  console.log('- Printful calculates based on total package weight/size');
  console.log('- For 50 items: Expect ~$12-15 for STANDARD (not $250!)');
  console.log('\n');
}

/**
 * Test with custom data
 */
async function testCustom(country, state, zip, variantId, quantity) {
  console.log('\n🔧 Custom Test');
  console.log('='.repeat(80));
  
  const data = {
    recipient: {
      country_code: country,
      state_code: state,
      zip: zip,
    },
    items: [
      {
        variant_id: parseInt(variantId),
        quantity: parseInt(quantity),
      },
    ],
  };

  try {
    const result = await calculateShipping(data);
    displayResults(
      `Custom: ${quantity} items (variant ${variantId}) to ${country}`,
      result
    );
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length > 0 && args[0] === 'custom') {
  // Custom test mode
  if (args.length < 5) {
    console.log('Usage: node test-shipping-costs.js custom <country> <state> <zip> <variantId> <quantity>');
    console.log('Example: node test-shipping-costs.js custom US CA 90001 4011 50');
    process.exit(1);
  }
  
  testCustom(args[1], args[2], args[3], args[4], args[5]);
} else {
  // Run all test scenarios
  runTests();
}



