# Order Visibility System Documentation

## Overview

The Shoppers9 admin system implements a comprehensive role-based order visibility system that ensures admins can only see orders relevant to their role and permissions.

## System Architecture

### Role-Based Access Control

1. **Super Admin (`super_admin`)**
   - Can view ALL orders in the system
   - No filtering applied
   - Full administrative access

2. **Regular Admin (`admin`)**
   - Can only view orders containing their own products
   - Filtered by `items.sellerId` matching admin's ID
   - Limited to their own business scope

3. **Sub Admin (`moderator`)**
   - Similar to regular admin
   - Can only view orders containing their own products
   - Operational access level

## Technical Implementation

### Backend Components

#### 1. Data Filter Middleware
**File:** `src/middleware/dataFilter.ts`

```typescript
export const applyPaginationWithFilter = (req: AuthRequest, baseQuery: any, model: string) => {
  const admin = req.admin;
  const role = admin?.primaryRole || admin?.role;
  
  if (role === 'super_admin') {
    // Super admin sees everything
    return { query: baseQuery, pagination };
  } else {
    // Regular admins see only their orders
    const filteredQuery = {
      ...baseQuery,
      'items.sellerId': admin._id
    };
    return { query: filteredQuery, pagination };
  }
};
```

#### 2. Order Controller
**File:** `src/controllers/orderController.ts`

- Applies role-based filtering using `applyPaginationWithFilter`
- Supports search, status, and date filtering
- Maintains pagination and sorting
- Logs detailed debugging information

#### 3. Authentication Middleware
**File:** `src/middleware/auth.ts`

- Validates JWT tokens
- Extracts admin user information
- Sets up `req.admin` and `req.dataFilter` objects

### Frontend Components

#### 1. Admin Orders Page
**File:** `src/pages/Orders.tsx`

- Fetches orders using `authService.getAllOrders()`
- Displays orders with proper role-based filtering
- Supports status filtering and pagination
- Shows order details and management options

#### 2. Auth Service
**File:** `src/services/authService.ts`

- Makes authenticated API calls to `/admin/orders`
- Handles token management
- Transforms API responses for frontend consumption

## API Endpoints

### GET /api/admin/orders

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `page` (number): Page number for pagination
- `limit` (number): Items per page
- `status` (string): Filter by order status
- `search` (string): Search by order number
- `startDate` (string): Filter by date range
- `endDate` (string): Filter by date range

**Response Format:**
```json
{
  "success": true,
  "data": {
    "orders": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

## Database Schema

### Orders Collection

```javascript
{
  _id: ObjectId,
  orderNumber: String,
  userId: ObjectId,
  items: [{
    product: ObjectId,
    sellerId: ObjectId,  // Key field for filtering
    quantity: Number,
    price: Number,
    // ...
  }],
  orderStatus: String,
  paymentStatus: String,
  totalAmount: Number,
  finalAmount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Admins Collection

```javascript
{
  _id: ObjectId,
  email: String,
  primaryRole: String,  // 'super_admin', 'admin', 'moderator'
  role: String,         // Fallback role field
  isActive: Boolean,
  createdAt: Date
}
```

## Security Features

### 1. Token-Based Authentication
- JWT tokens with expiration
- Role information embedded in token
- Secure token validation

### 2. Role-Based Filtering
- Server-side filtering prevents data leakage
- No client-side filtering dependencies
- Consistent across all API endpoints

### 3. Data Isolation
- Admins cannot access other admins' orders
- Super admins have full visibility for management
- Proper error handling for unauthorized access

## Testing

### Automated Tests

**File:** `comprehensive-order-visibility-tests.js`

Tests include:
- Role-based order visibility
- API authentication
- Edge cases (invalid tokens, no tokens)
- Database-level verification
- Order distribution analysis

### Manual Testing Scenarios

1. **Super Admin Login**
   - Should see all orders from all admins
   - Can filter and search across all orders
   - Has full management capabilities

2. **Regular Admin Login**
   - Should see only orders containing their products
   - Filtering and search limited to their orders
   - Cannot see other admins' orders

3. **API Security**
   - Invalid tokens rejected with 401
   - Missing tokens rejected with 401
   - Proper error messages returned

## Troubleshooting

### Common Issues

1. **Admin sees no orders**
   - Check if admin has created products
   - Verify orders contain items with correct `sellerId`
   - Run data migration script if needed

2. **Super admin sees limited orders**
   - Verify `primaryRole` is set to `super_admin`
   - Check authentication middleware
   - Review role detection logic

3. **Orders missing sellerId**
   - Run `fix-order-visibility.js` script
   - Check product creation process
   - Verify order creation workflow

### Debug Commands

```bash
# Check admin roles
node check-admin-users.js

# Verify order distribution
node check-admin-orders.js

# Fix missing seller IDs
node fix-order-visibility.js

# Test API endpoints
node test-admin-order-api.js
```

## Migration Scripts

### fix-order-visibility.js
- Fixes orphaned orders missing `sellerId`
- Links orders to correct admin based on products
- Updates existing orders in database

### migrate-orders.js
- Comprehensive order data migration
- Handles bulk updates
- Maintains data integrity

## Performance Considerations

1. **Database Indexing**
   - Index on `items.sellerId` for fast filtering
   - Compound indexes for common query patterns
   - Regular index maintenance

2. **Query Optimization**
   - Efficient aggregation pipelines
   - Proper use of MongoDB operators
   - Pagination to limit result sets

3. **Caching Strategy**
   - Consider Redis for frequently accessed data
   - Cache user roles and permissions
   - Implement cache invalidation

## Future Enhancements

1. **Advanced Filtering**
   - Date range filters
   - Customer-based filtering
   - Product category filtering

2. **Analytics Dashboard**
   - Role-specific analytics
   - Order trends and insights
   - Performance metrics

3. **Audit Logging**
   - Track order access patterns
   - Log administrative actions
   - Compliance reporting

## Conclusion

The order visibility system provides secure, role-based access to order data while maintaining performance and usability. The system is designed to scale with business growth and can be extended with additional features as needed.

For technical support or questions, refer to the troubleshooting section or contact the development team.