# PopArtFun Server

PopArtFun e-commerce API server with Printful integration for creating and selling custom art products.

## Overview

This is a standalone NestJS-based API server that powers the PopArtFun e-commerce platform. It provides:

- **Store Management**: Product catalog, categories, and site tags
- **Printful Integration**: Print-on-demand product creation and mockup generation
- **User Products**: Custom product creation and order management
- **Scheduled Tasks**: Automated shipping rate updates

## Features

- 🛍️ Store product management with multi-site support
- 🎨 Printful API integration for print-on-demand products
- 🖼️ Mockup generation and image processing
- 📦 Shipping rate calculation and caching
- 🔐 Supabase authentication
- ☁️ Google Cloud Storage for image uploads
- 📊 MongoDB for data persistence

## Prerequisites

- Node.js 18+ and npm
- MongoDB 4.4+
- Printful account and API key
- Google Cloud Platform project with Storage enabled
- Supabase project (for authentication)

## Installation

```bash
# Install dependencies
npm install
```

## Configuration

Create a `.env` file in the root directory based on `.env.example`:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/popartfun

# Printful API Configuration
PRINTFUL_API_KEY=your_printful_api_key_here

# Google Cloud Storage Configuration
GCS_BUCKET_NAME=your-bucket-name
GCS_PROJECT_ID=your-gcp-project-id
GCS_KEY_FILENAME=/path/to/your/service-account-key.json

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Server Configuration
PORT=8081
```

## Running the Server

```bash
# Development mode with auto-reload
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

The server will start on `http://localhost:8081` by default.

## API Documentation

Once the server is running, you can access:

- **Swagger UI**: `http://localhost:8081/api`
- **API Endpoints**: Base URL `http://localhost:8081/api/v1`

## Key Endpoints

### Store
- `GET /api/v1/store/products` - List all products
- `GET /api/v1/store/products/:id` - Get product details
- `POST /api/v1/store/products` - Create new product (admin)
- `GET /api/v1/store/categories` - List categories
- `GET /api/v1/store/tags` - List site tags

### Printful
- `GET /api/v1/printful/catalog` - Get Printful catalog
- `POST /api/v1/printful/mockup/generate` - Generate product mockup
- `POST /api/v1/printful/upload-design` - Upload design to Printful
- `GET /api/v1/printful/shipping-rates/:productId` - Get shipping rates

### User Products
- `POST /api/v1/user-products/custom` - Create custom product
- `GET /api/v1/user-products/custom/:id` - Get custom product
- `POST /api/v1/user-products/orders` - Create order
- `GET /api/v1/user-products/orders/:id` - Get order details

## Database Migration

If you're migrating from nattoai-server, you'll need to export and import MongoDB collections:

```bash
# Export from nattoai database
mongodump --db nattoai --collection store_products --out ./backup
mongodump --db nattoai --collection site_tags --out ./backup
mongodump --db nattoai --collection product_categories --out ./backup
mongodump --db nattoai --collection printful_configs --out ./backup
mongodump --db nattoai --collection printful_sync_products --out ./backup
mongodump --db nattoai --collection printful_orders --out ./backup
mongodump --db nattoai --collection user_custom_products --out ./backup
mongodump --db nattoai --collection user_orders --out ./backup

# Import to popartfun database
mongorestore --db popartfun ./backup/nattoai/
```

## Project Structure

```
src/
├── auth/                 # Authentication guards and Supabase integration
├── common/              # Shared DTOs and utilities
├── gemini/              # GCS upload service for image storage
├── printful/            # Printful API integration
│   ├── dto/            # Data transfer objects
│   ├── schemas/        # MongoDB schemas
│   └── services/       # Business logic
├── store/              # Store management
│   ├── dto/            # Data transfer objects
│   ├── schemas/        # MongoDB schemas
│   └── services/       # Business logic
├── tasks/              # Scheduled tasks (shipping rate updates)
├── user-products/      # User custom products and orders
└── main.ts             # Application entry point
```

## Scheduled Tasks

The server runs scheduled tasks:

- **Shipping Rate Refresh**: Updates cached shipping rates daily at 2:00 AM UTC

## Development

```bash
# Run linter
npm run lint

# Format code
npm run format

# Run tests
npm run test

# Run tests with coverage
npm run test:cov
```

## Connecting with PopArtFun Webapp

Update the API base URL in your popartfun-webapp configuration:

```typescript
// popartfun-webapp/src/lib/api-config.ts
export const API_BASE_URL = 'http://localhost:8081';
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 8081
npm run kill:port
```

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod --dbpath /path/to/data`
- Check connection string in `.env`

### Printful API Errors
- Verify API key is valid
- Check Printful API status
- Review Printful API rate limits

### GCS Upload Failures
- Verify service account has Storage permissions
- Check bucket exists and is accessible
- Ensure GCS_KEY_FILENAME path is correct

## License

UNLICENSED - Private Project

## Support

For issues or questions, contact the development team.


