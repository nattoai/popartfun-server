# Admin Panel Setup Guide

## Overview

The admin panel allows authorized users to view and manage all customer orders, update statuses, process refunds, and view dashboard statistics.

## Backend Complete ✅

The backend admin system is fully implemented with:

### API Endpoints

All endpoints require admin authentication:

1. **GET /api/v1/admin/orders** - List all orders with filters
   - Query params: status, userId, customerEmail, isTest, startDate, endDate, page, limit, sortBy, sortOrder
   - Returns paginated order list

2. **GET /api/v1/admin/orders/:id** - Get order details
   - Returns complete order information including status history

3. **PATCH /api/v1/admin/orders/:id/status** - Update order status
   - Body: `{ status: string, note?: string }`
   - Tracks who made the change and when

4. **POST /api/v1/admin/orders/:id/refund** - Initiate refund
   - Body: `{ amount: number, reason: string }`
   - Processes refund through Stripe

5. **GET /api/v1/admin/stats** - Dashboard statistics
   - Returns order counts, revenue, breakdowns by status

### Authentication

Admin access is controlled by email whitelist in `.env`:

```bash
ADMIN_EMAILS=admin@popartfun.com,your-email@example.com
```

Only users with emails in this list can access admin endpoints.

## Frontend Implementation Required

To complete the admin panel, create these React/Next.js pages in the webapp:

### 1. Admin Orders List Page

**Path:** `/admin/orders/page.tsx`

**Features Needed:**
- Table showing all orders
- Columns: Order #, Customer, Date, Items, Total, Status, Actions
- Filters: Status dropdown, date range picker, search by email
- Pagination controls
- Status badges with color coding
- Click row to view details
- "Update Status" quick action

**API Calls:**
```typescript
const { orders, total, totalPages } = await fetch(
  `${API_URL}/admin/orders?page=1&limit=20&status=processing`,
  { headers: { Authorization: `Bearer ${token}` } }
).then(r => r.json());
```

### 2. Order Detail Page

**Path:** `/admin/orders/[id]/page.tsx`

**Features Needed:**
- Order summary card
- Customer information
- Items list with images
- Payment details
- Printful order ID with link
- Status history timeline
- Update status form
- Refund button with modal
- Tracking information (if shipped)

**API Calls:**
```typescript
const order = await fetch(
  `${API_URL}/admin/orders/${orderId}`,
  { headers: { Authorization: `Bearer ${token}` } }
).then(r => r.json());
```

### 3. Update Admin Dashboard

**Path:** `/admin/page.tsx` (already exists, needs update)

**Changes Needed:**
- Replace mock data with real API calls
- Show actual order counts
- Display real revenue
- Recent orders list
- Orders by status breakdown

**API Calls:**
```typescript
const stats = await fetch(
  `${API_URL}/admin/stats`,
  { headers: { Authorization: `Bearer ${token}` } }
).then(r => r.json());
```

### 4. Update Admin Navigation

**Path:** `/admin/layout.tsx`

**Changes Needed:**
Add "Orders" link to sidebar:
```tsx
<Link href="/admin/orders">
  Orders
</Link>
```

### 5. API Client Methods

**Path:** `/lib/api-client.ts`

Add these methods:
```typescript
class ApiClient {
  async getAdminOrders(filters: any, token: string) {
    const params = new URLSearchParams(filters);
    return this.fetch(`/admin/orders?${params}`, token);
  }

  async getAdminOrder(id: string, token: string) {
    return this.fetch(`/admin/orders/${id}`, token);
  }

  async updateOrderStatus(id: string, status: string, note: string, token: string) {
    return this.fetch(`/admin/orders/${id}/status`, token, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    });
  }

  async initiateRefund(id: string, amount: number, reason: string, token: string) {
    return this.fetch(`/admin/orders/${id}/refund`, token, {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    });
  }

  async getAdminStats(token: string) {
    return this.fetch('/admin/stats', token);
  }
}
```

## Quick Start for Admin

### 1. Configure Admin Emails

Edit `/Users/lok/Projects/nattoai/popartfun-server/.env`:

```bash
ADMIN_EMAILS=admin@popartfun.com,lok@example.com
```

### 2. Sign Up with Admin Email

1. Go to your webapp
2. Sign up with one of the admin emails
3. You now have admin access

### 3. Access Admin Panel

1. Navigate to `/admin`
2. View dashboard (currently has mock data)
3. Once frontend is built, access `/admin/orders`

## Testing Admin Features

### Test Order Management

```bash
# Get all orders
curl -X GET http://localhost:8081/api/v1/admin/orders \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get specific order
curl -X GET http://localhost:8081/api/v1/admin/orders/ORDER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update order status
curl -X PATCH http://localhost:8081/api/v1/admin/orders/ORDER_ID/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"shipped","note":"Shipped via UPS"}'

# Get dashboard stats
curl -X GET http://localhost:8081/api/v1/admin/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Refund

```bash
curl -X POST http://localhost:8081/api/v1/admin/orders/ORDER_ID/refund \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":29.99,"reason":"Customer request"}'
```

## Security Notes

1. **Email-Based Access**
   - Only emails in `ADMIN_EMAILS` can access admin endpoints
   - Admins must still authenticate normally (Supabase)
   - Admin check happens on every request

2. **Audit Trail**
   - Every status update is logged with admin email
   - Status history tracks who made changes
   - Timestamps recorded for all actions

3. **Refund Safety**
   - Refunds require admin authentication
   - Can't refund already-refunded orders
   - Full audit trail in order document

## Status Flow

```
pending → processing → shipped → delivered
                    ↘ failed
                    ↘ cancelled
```

Admin can manually move between any statuses with a note explaining why.

## Next Steps

1. ✅ Backend complete and ready
2. ⏳ Build frontend admin pages (instructions above)
3. ⏳ Test admin workflow end-to-end
4. ⏳ Deploy to production
5. ⏳ Train staff on admin panel use

## Frontend Code Examples

### Order Status Badge Component

```tsx
function StatusBadge({ status }: { status: string }) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    failed: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
```

### Order Table Row

```tsx
function OrderRow({ order }: { order: any }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">{order._id.slice(-8)}</td>
      <td className="px-6 py-4">{order.recipient.email}</td>
      <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
      <td className="px-6 py-4">{order.items.length} items</td>
      <td className="px-6 py-4">${order.total.toFixed(2)}</td>
      <td className="px-6 py-4">
        <StatusBadge status={order.status} />
      </td>
      <td className="px-6 py-4">
        <Link href={`/admin/orders/${order._id}`} className="text-blue-600 hover:underline">
          View
        </Link>
      </td>
    </tr>
  );
}
```

## Support

For questions about:
- **Backend:** All endpoints are documented in Swagger at `http://localhost:8081/api`
- **Authentication:** Check `ADMIN_EMAILS` in `.env`
- **Permissions:** Verify user is authenticated and email is in admin list
- **Testing:** Use curl examples above or Swagger UI

---

**Backend Status:** ✅ Complete and Production Ready  
**Frontend Status:** ⏳ Implementation needed (instructions provided)  
**Last Updated:** December 26, 2025


