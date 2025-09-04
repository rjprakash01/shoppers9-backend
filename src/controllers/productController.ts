import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest, PaginationQuery, ProductFilters } from '../types';

// Helper function to get filter option IDs by values
const getFilterOptionIds = async (filterId: any, values: string[]) => {
  // Simplified implementation - return empty array for now
  return [];
};

/**
 * Get products with filters and pagination
 */
export const getProducts = async (req: Request, res: Response) => {
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.log('Database readyState (products):', mongoose.connection.readyState);
      return res.status(503).json({
        success: false,
        message: 'Database connection not available'
      });
    }

    const {
      page = 1,
      limit = 20,
      category,
      subCategory,
      brand,
      minPrice,
      maxPrice,
      inStock,
      sortBy = 'popularity',
      sortOrder = 'desc',
      search,
      ...dynamicFilters
    } = req.query as any;

  const skip = (page - 1) * limit;
  const query: any = { isActive: true };

  // Build filter query
  if (category) {
    // Handle category filtering by slug or name
    try {
      const categoryDoc = await Category.findOne({ 
        $or: [
          { slug: category },
          { name: { $regex: new RegExp(`^${category}$`, 'i') } }
        ],
        isActive: true
      });
      if (categoryDoc) {
        // Use ObjectId for filtering since products store category as ObjectId
        query.category = categoryDoc._id;
      } else {
        // Fallback to direct category matching (for backward compatibility)
        query.category = category;
      }
    } catch (error) {
      // Fallback to direct category name matching
      query.category = category;
    }
  }

  if (subCategory) {
    query.subCategory = subCategory;
  }

  if (brand) {
    query.brand = { $regex: brand, $options: 'i' };
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  // Handle dynamic filters - simplified implementation
  // TODO: Implement proper filter system when models are available
  // For now, skip dynamic filtering

  if (inStock) {
    query.totalStock = { $gt: 0 };
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  // Build sort query
  const sortQuery: any = {};
  switch (sortBy) {
    case 'price':
      sortQuery.price = sortOrder === 'asc' ? 1 : -1;
      break;
    case 'name':
      sortQuery.name = sortOrder === 'asc' ? 1 : -1;
      break;
    case 'createdAt':
      sortQuery.createdAt = sortOrder === 'asc' ? 1 : -1;
      break;
    case 'popularity':
    default:
      sortQuery.popularity = -1;
      sortQuery.createdAt = -1;
      break;
  }

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug level parentCategory')
      .populate('subCategory', 'name slug level parentCategory')
      .populate({
        path: 'filterValues',
        populate: [
          { path: 'filter', select: 'name displayName type' },
          { path: 'filterOption', select: 'value displayValue colorCode' }
        ]
      })
      .sort(sortQuery)
      .skip(skip)
      .limit(Number(limit)),
    Product.countDocuments(query)
  ]);

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

    return res.json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalItems: total,
          itemsPerPage: Number(limit),
          hasNextPage,
          hasPrevPage
        }
      }
    });
  } catch (error) {
    console.error('Error in getProducts:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching products'
    });
  }
};

/**
 * Search products
 */
export const searchProducts = async (req: Request, res: Response) => {
  const {
    q,
    page = 1,
    limit = 20,
    category,
    minPrice,
    maxPrice
  } = req.query as any;

  const skip = (page - 1) * limit;
  const query: any = {
    isActive: true,
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { brand: { $regex: q, $options: 'i' } },
      { tags: { $in: [new RegExp(q, 'i')] } }
    ]
  };

  if (category) {
    try {
      const categoryDoc = await Category.findOne({ 
        $or: [
          { slug: category },
          { name: { $regex: new RegExp(`^${category}$`, 'i') } }
        ],
        isActive: true
      });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      } else {
        query.category = category;
      }
    } catch (error) {
      query.category = category;
    }
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug level parentCategory')
      .populate('subCategory', 'name slug level parentCategory')
      .populate({
        path: 'filterValues',
        populate: [
          { path: 'filter', select: 'name displayName type' },
          { path: 'filterOption', select: 'value displayValue colorCode' }
        ]
      })
      .sort({ popularity: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Product.countDocuments(query)
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: {
      products,
      searchQuery: q,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalItems: total,
        itemsPerPage: Number(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  });
};

/**
 * Get all categories
 */
export const getCategories = async (req: Request, res: Response) => {
  const categories = await Category.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  // Group categories by parent
  const categoryTree = categories.reduce((acc: any, category: any) => {
    if (!category.parent) {
      // Root category
      acc[category._id] = {
        ...category,
        children: []
      };
    } else {
      // Child category
      if (acc[category.parent]) {
        acc[category.parent].children.push(category);
      }
    }
    return acc;
  }, {});

  res.json({
    success: true,
    data: {
      categories: Object.values(categoryTree)
    }
  });
};

/**
 * Get all brands
 */
export const getBrands = async (req: Request, res: Response) => {
  const brands = await Product.distinct('brand', { isActive: true });
  
  res.json({
    success: true,
    data: {
      brands: brands.filter(Boolean).sort()
    }
  });
};

/**
 * Get available filters
 */
export const getFilters = async (req: Request, res: Response) => {
  const { category } = req.query;
  
  let filters: any[] = [];
  
  // Simplified implementation - return empty filters for now
  // TODO: Implement proper filter system when models are available
  
  // Get price range from products
  const matchQuery: any = { isActive: true };
  if (category) {
    try {
      const categoryDoc = await Category.findOne({ 
        $or: [
          { name: { $regex: new RegExp(`^${category}$`, 'i') } },
          { slug: category }
        ]
      });
      if (categoryDoc) {
        matchQuery.category = categoryDoc._id;
      }
    } catch (error) {
      matchQuery.category = category;
    }
  }
  
  const priceRange = await Product.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      filters,
      priceRange: priceRange[0] || { minPrice: 0, maxPrice: 0 }
    }
  });
};

/**
 * Get featured products
 */
export const getFeaturedProducts = async (req: Request, res: Response) => {
  const products = await Product.find({
    isActive: true,
    isFeatured: true
  })
    .populate('category', 'name slug')
    .sort({ popularity: -1, createdAt: -1 })
    .limit(20)
    .lean();

  res.json({
    success: true,
    data: {
      products
    }
  });
};

/**
 * Get trending products
 */
export const getTrendingProducts = async (req: Request, res: Response) => {
  const products = await Product.find({
    isActive: true
  })
    .populate('category', 'name slug')
    .sort({ popularity: -1, salesCount: -1, createdAt: -1 })
    .limit(20)
    .lean();

  res.json({
    success: true,
    data: {
      products
    }
  });
};

/**
 * Get product recommendations
 */
export const getRecommendations = async (req: AuthenticatedRequest, res: Response) => {
  // For now, return popular products
  // TODO: Implement ML-based recommendations based on user behavior
  const products = await Product.find({
    isActive: true
  })
    .populate('category', 'name slug')
    .sort({ popularity: -1, createdAt: -1 })
    .limit(10)
    .lean();

  res.json({
    success: true,
    data: {
      products
    }
  });
};

/**
 * Get product by ID
 */
export const getProductById = async (req: Request, res: Response) => {
  const { productId } = req.params;

  // Check database connection
  if (mongoose.connection.readyState !== 1) {
    console.log('Database readyState (getProductById):', mongoose.connection.readyState);
    res.status(503).json({
      success: false,
      message: 'Database connection unavailable'
    });
    return;
  }

  const product = await Product.findOne({
    _id: productId,
    isActive: true
  })
    .populate('category', 'name slug level parentCategory')
    .populate('subCategory', 'name slug level parentCategory')
    .populate({
      path: 'filterValues',
      populate: [
        { path: 'filter', select: 'name displayName type dataType' },
        { path: 'filterOption', select: 'value displayValue colorCode' }
      ]
    });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Increment view count
  await Product.findByIdAndUpdate(productId, {
    $inc: { viewCount: 1 }
  });

  res.json({
    success: true,
    data: {
      product
    }
  });
};

/**
 * Get related products
 */
export const getRelatedProducts = async (req: Request, res: Response) => {
  const { productId } = req.params;

  const product = await Product.findById(productId).lean();
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const relatedProducts = await Product.find({
    _id: { $ne: productId },
    isActive: true,
    $or: [
      { category: product.category },
      { subCategory: product.subCategory },
      { brand: product.brand }
    ]
  })
    .populate('category', 'name slug level parentCategory')
    .populate('subCategory', 'name slug level parentCategory')
    .populate({
      path: 'filterValues',
      populate: [
        { path: 'filter', select: 'name displayName type' },
        { path: 'filterOption', select: 'value displayValue colorCode' }
      ]
    })
    .sort({ popularity: -1, createdAt: -1 })
    .limit(12)
    .lean();

  res.json({
    success: true,
    data: {
      products: relatedProducts
    }
  });
};

/**
 * Get product reviews
 */
export const getProductReviews = async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { page = 1, limit = 10 } = req.query as any;

  const product = await Product.findById(productId).lean();
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // TODO: Implement reviews model and fetch reviews
  // For now, return empty reviews
  res.json({
    success: true,
    data: {
      reviews: [],
      pagination: {
        currentPage: Number(page),
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: Number(limit),
        hasNextPage: false,
        hasPrevPage: false
      },
      summary: {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0
        }
      }
    }
  });
};

export const productController = {
  getProducts,
  searchProducts,
  getCategories,
  getBrands,
  getFilters,
  getFeaturedProducts,
  getTrendingProducts,
  getRecommendations,
  getProductById,
  getRelatedProducts,
  getProductReviews
};