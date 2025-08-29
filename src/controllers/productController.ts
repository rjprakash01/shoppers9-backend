import { Request, Response } from 'express';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest, PaginationQuery, ProductFilters } from '../types';

/**
 * Get products with filters and pagination
 */
export const getProducts = async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 20,
    category,
    subCategory,
    brand,
    minPrice,
    maxPrice,
    sizes,
    colors,
    fabric,
    fit,
    material,
    microwaveSafe,
    inStock,
    sortBy = 'popularity',
    sortOrder = 'desc',
    search
  } = req.query as any;

  const skip = (page - 1) * limit;
  const query: any = { isActive: true };

  // Build filter query
  if (category) {
    query.category = category;
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

  if (sizes) {
    const sizeArray = sizes.split(',').map((s: string) => s.trim());
    query['variants.sizes.size'] = { $in: sizeArray };
  }

  if (colors) {
    const colorArray = colors.split(',').map((c: string) => c.trim());
    query['variants.color'] = { $in: colorArray };
  }

  if (fabric) {
    query['specifications.fabric'] = { $regex: fabric, $options: 'i' };
  }

  if (fit) {
    query['specifications.fit'] = { $regex: fit, $options: 'i' };
  }

  if (material) {
    query['specifications.material'] = { $regex: material, $options: 'i' };
  }

  if (microwaveSafe !== undefined) {
    query['specifications.microwaveSafe'] = microwaveSafe === 'true';
  }

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
      .populate('category', 'name slug')
      .sort(sortQuery)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Product.countDocuments(query)
  ]);

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  res.json({
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
    query.category = category;
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug')
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
  
  const matchQuery: any = { isActive: true };
  if (category) {
    matchQuery.category = category;
  }

  const [brands, colors, sizes, fabrics, materials] = await Promise.all([
    Product.distinct('brand', matchQuery),
    Product.distinct('variants.color', matchQuery),
    Product.distinct('variants.sizes.size', matchQuery),
    Product.distinct('specifications.fabric', matchQuery),
    Product.distinct('specifications.material', matchQuery)
  ]);

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
      brands: brands.filter(Boolean).sort(),
      colors: colors.filter(Boolean).sort(),
      sizes: sizes.filter(Boolean),
      fabrics: fabrics.filter(Boolean).sort(),
      materials: materials.filter(Boolean).sort(),
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

  const product = await Product.findOne({
    _id: productId,
    isActive: true
  })
    .populate('category', 'name slug')
    .lean();

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
    .populate('category', 'name slug')
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