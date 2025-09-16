# Automatic Product Deactivation Feature

## Overview

The system now automatically manages product visibility on the website based on stock availability. When all variants of a product run out of stock, the product is automatically removed from the main website by setting its `isActive` status to `false`. When stock becomes available again, the product is automatically reactivated.

## How It Works

### 1. Stock Monitoring
- The system monitors stock levels in real-time during inventory updates
- Total stock is calculated by summing all variant stock levels for a product
- Automatic deactivation/reactivation occurs during stock update operations

### 2. Deactivation Logic
```typescript
// When total stock reaches zero
if (totalStock === 0 && product.isActive) {
  product.isActive = false;
  console.log(`Product ${product.name} automatically deactivated - total stock is zero`);
}
```

### 3. Reactivation Logic
```typescript
// When stock becomes available again
if (totalStock > 0 && !product.isActive) {
  product.isActive = true;
  console.log(`Product ${product.name} automatically reactivated - stock available`);
}
```

## Implementation Details

### Modified Files

#### 1. `src/services/inventoryService.ts`
- **updateStock()**: Added automatic deactivation/reactivation logic
- **bulkUpdateStock()**: Added same logic for bulk operations
- Enhanced logging to show total stock levels

#### 2. Product Controller Filtering
All product retrieval methods already filter by `isActive: true`:
- `getProducts()` - Main product listing
- `searchProducts()` - Product search
- `getFeaturedProducts()` - Featured products
- `getTrendingProducts()` - Trending products
- `getRelatedProducts()` - Related products

### Trigger Points

Automatic deactivation/reactivation occurs during:

1. **Individual Stock Updates**
   - Order fulfillment (stock decrease)
   - Inventory restocking (stock increase)
   - Manual stock adjustments

2. **Bulk Stock Updates**
   - CSV imports
   - Admin bulk operations
   - Inventory management tools

## User Experience Impact

### For Customers
- **Seamless Experience**: Out-of-stock products automatically disappear from:
  - Product listings
  - Search results
  - Featured/trending sections
  - Related products
- **No Broken Links**: Products become unavailable gracefully
- **Automatic Return**: Products reappear when restocked

### For Administrators
- **Automatic Management**: No manual intervention required
- **Clear Logging**: Console logs track all deactivation/reactivation events
- **Inventory Insights**: Stock levels clearly displayed in logs

## Technical Benefits

### 1. Data Integrity
- Prevents customers from viewing unavailable products
- Maintains accurate product availability status
- Reduces customer frustration from out-of-stock items

### 2. Performance
- Reduces database queries for unavailable products
- Improves search and listing performance
- Optimizes frontend rendering

### 3. Business Logic
- Aligns system behavior with business requirements
- Supports inventory management best practices
- Enables better customer experience

## Logging and Monitoring

### Console Logs
The system provides detailed logging for tracking:

```
// Stock update logs
Stock updated for SKU-123: 5 → 0 (decrease 5). Total product stock: 0
Product Premium T-Shirt (60f7b3c4e1234567890abcde) automatically deactivated - total stock is zero

// Reactivation logs
Stock updated for SKU-123: 0 → 10 (increase 10). Total product stock: 10
Product Premium T-Shirt (60f7b3c4e1234567890abcde) automatically reactivated - stock available
```

### Monitoring Points
- Track deactivation frequency
- Monitor reactivation patterns
- Identify popular products that frequently go out of stock
- Analyze inventory turnover rates

## Testing

### Test Script
A comprehensive test script is available at:
`src/scripts/testAutoDeactivation.ts`

### Test Scenarios
1. **Stock Depletion**: Reduce all variant stock to zero
2. **Automatic Deactivation**: Verify `isActive` becomes `false`
3. **Stock Replenishment**: Add stock to any variant
4. **Automatic Reactivation**: Verify `isActive` becomes `true`

### Running Tests
```bash
# Navigate to backend directory
cd backend-shoppers9

# Run the test script
npx ts-node src/scripts/testAutoDeactivation.ts
```

## Configuration

### Customization Options
The feature can be customized by modifying:

1. **Threshold Logic**: Currently triggers at exactly 0 stock
2. **Logging Level**: Adjust console.log statements
3. **Reactivation Behavior**: Modify when products should reactivate

### Future Enhancements
- **Low Stock Warnings**: Alert before complete deactivation
- **Category-Specific Rules**: Different thresholds per category
- **Time-Based Reactivation**: Delay reactivation for quality control
- **Email Notifications**: Alert administrators of deactivations

## Best Practices

### For Inventory Management
1. **Regular Stock Monitoring**: Check inventory levels frequently
2. **Proactive Restocking**: Restock before complete depletion
3. **Demand Forecasting**: Predict stock needs based on sales patterns

### For Development
1. **Test Thoroughly**: Verify behavior in staging environment
2. **Monitor Logs**: Watch for unexpected deactivations
3. **Database Backups**: Maintain backups before bulk operations

## Troubleshooting

### Common Issues

1. **Product Not Deactivating**
   - Check if variants still have stock
   - Verify inventory service is being called
   - Review console logs for errors

2. **Product Not Reactivating**
   - Confirm stock was actually added
   - Check for database save errors
   - Verify product was previously deactivated

3. **Performance Issues**
   - Monitor database query performance
   - Consider indexing on `isActive` field
   - Optimize stock calculation logic

### Debug Commands
```javascript
// Check product status
db.products.findOne({_id: ObjectId('product_id')}, {name: 1, isActive: 1, variants: 1})

// Find deactivated products
db.products.find({isActive: false}, {name: 1, variants: 1})

// Calculate total stock for a product
db.products.aggregate([
  {$match: {_id: ObjectId('product_id')}},
  {$project: {name: 1, totalStock: {$sum: '$variants.stock'}}}
])
```

## Conclusion

The automatic product deactivation feature provides a robust, automated solution for managing product visibility based on stock availability. It enhances user experience, maintains data integrity, and reduces administrative overhead while providing clear monitoring and logging capabilities.