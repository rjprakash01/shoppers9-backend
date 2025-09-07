/**
 * Utility functions for currency formatting
 */

/**
 * Format price in Indian Rupees
 * @param price - Price in number format
 * @param showSymbol - Whether to show ₹ symbol (default: true)
 * @returns Formatted price string
 */
export const formatPrice = (price: number, showSymbol: boolean = true): string => {
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

  if (!showSymbol) {
    return formattedPrice.replace('₹', '').trim();
  }

  return formattedPrice;
};

/**
 * Format price range for products with multiple variants
 * @param minPrice - Minimum price
 * @param maxPrice - Maximum price
 * @returns Formatted price range string
 */
export const formatPriceRange = (minPrice: number, maxPrice: number): string => {
  if (minPrice === maxPrice) {
    return formatPrice(minPrice);
  }
  return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
};

/**
 * Calculate discount percentage
 * @param originalPrice - Original price
 * @param discountedPrice - Discounted price
 * @returns Discount percentage
 */
export const calculateDiscountPercentage = (originalPrice: number, discountedPrice: number): number => {
  if (originalPrice <= 0) return 0;
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
};

/**
 * Format discount percentage
 * @param originalPrice - Original price
 * @param discountedPrice - Discounted price
 * @returns Formatted discount string
 */
export const formatDiscount = (originalPrice: number, discountedPrice: number): string => {
  const discount = calculateDiscountPercentage(originalPrice, discountedPrice);
  return discount > 0 ? `${discount}% OFF` : '';
};

/**
 * Get savings amount
 * @param originalPrice - Original price
 * @param discountedPrice - Discounted price
 * @returns Savings amount
 */
export const getSavings = (originalPrice: number, discountedPrice: number): number => {
  return Math.max(0, originalPrice - discountedPrice);
};

/**
 * Format savings amount
 * @param originalPrice - Original price
 * @param discountedPrice - Discounted price
 * @returns Formatted savings string
 */
export const formatSavings = (originalPrice: number, discountedPrice: number): string => {
  const savings = getSavings(originalPrice, discountedPrice);
  return savings > 0 ? `Save ${formatPrice(savings)}` : '';
};