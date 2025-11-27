# Migration Complete! 🎉

All PopArtFun-related code has been successfully moved from `nattoai-server` to `popartfun-server`.

## What Was Moved

### From nattoai-server to popartfun-server:
- ✅ `src/store/` - Store products, categories, and site tags
- ✅ `src/printful/` - Printful API integration and mockup services
- ✅ `src/user-products/` - User custom products and orders
- ✅ `src/tasks/` - Scheduled shipping rate refresh
- ✅ `src/gemini/` - GCS upload service (simplified)
- ✅ `src/auth/` - Authentication guards and Supabase integration

### Removed from nattoai-server:
- ✅ All store, printful, user-products, and tasks modules
- ✅ PopArtFun CORS origins from main.ts
- ✅ PopArtFun webapp from api.sh script

## Configuration Changes

### popartfun-server
- **Port**: 8081 (to avoid conflict with nattoai-server on 8080)
- **Database**: `mongodb://localhost:27017/popartfun`
- **CORS**: Includes ports 3007 (popartfun-webapp)

### nattoai-server  
- **Port**: 8080 (unchanged)
- **Database**: `mongodb://localhost:27017/nattoai`
- **CORS**: Removed popartfun-webapp ports (3003, 3005, 3007)

## Next Steps

### 1. Update popartfun-webapp Configuration

The webapp is currently pointing to port 8080. You need to update it to use port 8081.

**Option A: Using Environment Variable (Recommended)**

Create or update `.env.local` in popartfun-webapp:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8081/api/v1
```

**Option B: Manual Code Update**

If you prefer not to use environment variables, update the following files:

- `src/lib/api-client.ts` (line 1)
- `src/app/admin/products/[id]/page.tsx` (line 6)
- `src/app/admin/products/page.tsx` (line 6)
- `src/app/admin/products/[id]/utils/api.ts` (line 2)
- `src/app/admin/categories/page.tsx` (line 6)
- `src/app/admin/printful/page.tsx` (line 17)

Change `http://localhost:8080` to `http://localhost:8081`

### 2. Database Migration

Export data from nattoai database and import to popartfun database:

```bash
# Export collections from nattoai database
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

### 3. Environment Setup

Copy and configure `.env` for popartfun-server:

```bash
cd popartfun-server
cp .env.example .env
# Edit .env with your actual credentials
```

Required environment variables:
- `MONGODB_URI` - MongoDB connection string
- `PRINTFUL_API_KEY` - Printful API key
- `GCS_BUCKET_NAME`, `GCS_PROJECT_ID`, `GCS_KEY_FILENAME` - Google Cloud Storage
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` - Supabase credentials

### 4. Install Dependencies

```bash
cd popartfun-server
npm install
```

### 5. Start Both Servers

**Terminal 1 - NattoAI Server:**
```bash
cd nattoai-server
npm run start:dev
# Runs on http://localhost:8080
```

**Terminal 2 - PopArtFun Server:**
```bash
cd popartfun-server
npm run start:dev
# Runs on http://localhost:8081
```

### 6. Verify Everything Works

1. **Check nattoai-server**: http://localhost:8080/api
2. **Check popartfun-server**: http://localhost:8081/api
3. **Test popartfun-webapp**: Ensure it connects to the new server

## Build Verification

Both servers have been successfully built:
- ✅ popartfun-server: 58 TypeScript files compiled
- ✅ nattoai-server: 42 TypeScript files compiled

## API Documentation

- **NattoAI API Docs**: http://localhost:8080/api/docs
- **PopArtFun API Docs**: http://localhost:8081/api

## Troubleshooting

### Port Already in Use
```bash
# For popartfun-server (port 8081)
lsof -ti:8081 | xargs kill -9

# For nattoai-server (port 8080)
lsof -ti:8080 | xargs kill -9
```

### Module Not Found Errors
```bash
# Reinstall dependencies
cd popartfun-server
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Issues
- Ensure MongoDB is running
- Check connection strings in `.env` files
- Verify database names are correct

## Summary

The migration is complete! Both servers are now independent:

- **nattoai-server**: Focuses on AI services (Gemini, News, Services, Tracing)
- **popartfun-server**: Dedicated to e-commerce (Store, Printful, User Products)

Each server has its own database, can be deployed independently, and has no cross-dependencies.


