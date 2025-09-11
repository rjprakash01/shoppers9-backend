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
        
        // Get all descendant categories recursively
        const getAllDescendants = async (parentId: any): Promise<any[]> => {
          const children = await Category.find({
            parentCategory: parentId,
            isActive: true
          }).lean();
          
          let allDescendants = [...children];
          
          // Recursively get descendants of each child
          for (const child of children) {
            const grandChildren = await getAllDescendants(child._id);
            allDescendants = allDescendants.concat(grandChildren);
          }
          
          return allDescendants;
        };
        
        // Find all subcategories (level 2 and 3) under this category
        const allSubcategories = await getAllDescendants(categoryDoc._id);

        allSubcategories.forEach(subcat => {
          // Process subcategory
        });
        
        // Create array of category IDs (parent + all subcategories) as strings
        // Since the Product schema defines category as String type
        const categoryIds = [categoryDoc._id.toString()];
        allSubcategories.forEach(subcat => {
          categoryIds.push(subcat._id.toString());
        });

        // Separate category IDs by level for proper field matching
        const mainCategoryId = categoryDoc._id;
        const subCategoryIds = allSubcategories
          .filter(cat => cat.level === 2)
          .map(cat => cat._id);
        const subSubCategoryIds = allSubcategories
          .filter(cat => cat.level === 3)
          .map(cat => cat._id);

        // Build query conditions for proper field matching with ObjectIds
        const orConditions = [];
        
        // Match main category (ObjectId)
        orConditions.push({ category: mainCategoryId });
        
        // Match subcategories in subCategory field (ObjectIds)
        if (subCategoryIds.length > 0) {
          orConditions.push({ subCategory: { $in: subCategoryIds } });
        }
        
        // Match sub-subcategories in subSubCategory field (ObjectIds)
        if (subSubCategoryIds.length > 0) {
          orConditions.push({ subSubCategory: { $in: subSubCategoryIds } });
        }
        
        // Also allow products that have any of the subcategory IDs as their main category
        // (for flexibility in data structure)
        if (subCategoryIds.length > 0) {
          orConditions.push({ category: { $in: subCategoryIds } });
        }
        
        query.$or = orConditions;
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

  // Test the exact query
  const testCount = await Product.countDocuments(query);

  // Test without sort
  const testProductsNoSort = await Product.find(query).limit(5);
  
  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug level parentCategory')
      .populate('subCategory', 'name slug level parentCategory')
      .sort(sortQuery)
      .skip(skip)
      .limit(Number(limit)),
    Product.countDocuments(query)
  ]);

  if (products.length > 0) {
    // Products found, continue processing
  }

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  // Transform products to ensure proper image and pricing display
  const transformedProducts = products.map(product => {
    const productObj = (product as any).toObject ? (product as any).toObject() : product;
    const firstVariant = productObj.variants?.[0];
    
    // Use first image from first available color, fallback to variant images, then main images
    const firstColorImages = productObj.availableColors?.[0]?.images || [];
    const defaultImage = firstColorImages.length > 0 ? firstColorImages[0] : 
                        (firstVariant?.images?.[0] || productObj.images?.[0] || '');
    
    return {
      ...productObj,
      images: defaultImage ? [defaultImage, ...productObj.images.filter((img: string) => img !== defaultImage)] : productObj.images,
      price: firstVariant?.price || productObj.price || 0,
      originalPrice: firstVariant?.originalPrice || productObj.originalPrice || firstVariant?.price || productObj.price || 0
    };
  });

    return res.json({
      success: true,
      data: {
        products: transformedProducts,
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
  // Only get level 1 categories (those without a parent)
  const categories = await Category.find({ 
    isActive: true,
    $or: [
      { parentCategory: { $exists: false } },
      { parentCategory: null },
      { parentCategory: '' }
    ]
  })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  res.json({
    success: true,
    data: {
      categories: categories
    }
  });
};

/**
 * Get available filters
 */
export const getFilters = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    
    // Build match query for category filtering
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
          // Get all descendant categories
          const getAllDescendants = async (parentId: any) => {
            const children = await Category.find({
              parentCategory: parentId,
              isActive: true
            }).lean();
            
            let allDescendants = [...children];
            for (const child of children) {
              const grandChildren = await getAllDescendants(child._id);
              allDescendants = allDescendants.concat(grandChildren);
            }
            return allDescendants;
          };
          
          const descendants = await getAllDescendants(categoryDoc._id);
          const categoryIds = [categoryDoc._id, ...descendants.map(d => d._id)];
          
          matchQuery.$or = [
            { category: { $in: categoryIds } },
            { subCategory: { $in: categoryIds } },
            { subSubCategory: { $in: categoryIds } }
          ];
        }
      } catch (error) {
        
      }
    }
    
    // Get price range
    const priceRange = await Product.aggregate([
      { $match: matchQuery },
      { $unwind: '$variants' },
      { $unwind: '$variants.sizes' },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$variants.sizes.price' },
          maxPrice: { $max: '$variants.sizes.price' }
        }
      }
    ]);
    
    // Get available brands
    const brands = await Product.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$brand', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // Get available sizes
    const sizes = await Product.aggregate([
      { $match: matchQuery },
      { $unwind: '$variants' },
      { $unwind: '$variants.sizes' },
      { $group: { _id: '$variants.sizes.size', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // Get available colors
    const colors = await Product.aggregate([
      { $match: matchQuery },
      { $unwind: '$variants' },
      { $group: { _id: { color: '$variants.color', colorCode: '$variants.colorCode' }, count: { $sum: 1 } } },
      { $sort: { '_id.color': 1 } }
    ]);
    
    // Get available materials (from specifications)
    const materials = await Product.aggregate([
      { $match: matchQuery },
      { $match: { 
          'specifications.material': { 
            $exists: true, 
            $ne: null, 
            $not: { $eq: '' } 
          } 
        } 
      },
      { $group: { _id: '$specifications.material', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // Get available fabrics (from specifications)
    const fabrics = await Product.aggregate([
      { $match: matchQuery },
      { $match: { 
          'specifications.fabric': { 
            $exists: true, 
            $ne: null, 
            $not: { $eq: '' } 
          } 
        } 
      },
      { $group: { _id: '$specifications.fabric', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // Get subcategories for the current category
    let subcategories: any[] = [];
    if (category) {
      try {
        const categoryDoc = await Category.findOne({ 
          $or: [
            { name: { $regex: new RegExp(`^${category}$`, 'i') } },
            { slug: category }
          ]
        });
        if (categoryDoc) {
          subcategories = await Category.find({
            parentCategory: categoryDoc._id,
            isActive: true
          }).select('name slug').lean();
        }
      } catch (error) {
        
      }
    }
    
    res.json({
      success: true,
      data: {
        priceRange: priceRange[0] || { minPrice: 0, maxPrice: 10000 },
        brands: brands.map(b => ({ name: b._id, count: b.count })),
        sizes: sizes.map(s => ({ name: s._id, count: s.count })),
        colors: colors.map(c => ({ 
          name: c._id.color, 
          colorCode: c._id.colorCode, 
          count: c.count 
        })),
        materials: materials.map(m => ({ name: m._id, count: m.count })),
        fabrics: fabrics.map(f => ({ name: f._id, count: f.count })),
        subcategories: subcategories
      }
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Failed to get filters',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
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
    .limit(20);

  // Transform products to ensure proper image and pricing display
  const transformedProducts = products.map(product => {
    const productObj = (product as any).toObject ? (product as any).toObject() : product;
    const firstVariant = productObj.variants?.[0];
    
    // Use first image from first available color, fallback to variant images, then main images
    const firstColorImages = productObj.availableColors?.[0]?.images || [];
    const defaultImage = firstColorImages.length > 0 ? firstColorImages[0] : 
                        (firstVariant?.images?.[0] || productObj.images?.[0] || '');
    
    return {
      ...productObj,
      images: defaultImage ? [defaultImage, ...productObj.images.filter((img: string) => img !== defaultImage)] : productObj.images,
      price: firstVariant?.price || productObj.price || 0,
      originalPrice: firstVariant?.originalPrice || productObj.originalPrice || firstVariant?.price || productObj.price || 0
    };
  });

  res.json({
    success: true,
    data: {
      products: transformedProducts
    }
  });
};

/**
 * Get trending products
 */
export const getTrendingProducts = async (req: Request, res: Response) => {
  const products = await Product.find({
    isActive: true,
    isTrending: true
  })
    .populate('category', 'name slug')
    .sort({ popularity: -1, salesCount: -1, createdAt: -1 })
    .limit(20);

  // Transform products to ensure proper image and pricing display
  const transformedProducts = products.map(product => {
    const productObj = (product as any).toObject ? (product as any).toObject() : product;
    const firstVariant = productObj.variants?.[0];
    
    // Use first image from first available color, fallback to variant images, then main images
    const firstColorImages = productObj.availableColors?.[0]?.images || [];
    const defaultImage = firstColorImages.length > 0 ? firstColorImages[0] : 
                        (firstVariant?.images?.[0] || productObj.images?.[0] || '');
    
    return {
      ...productObj,
      images: defaultImage ? [defaultImage, ...productObj.images.filter((img: string) => img !== defaultImage)] : productObj.images,
      price: firstVariant?.price || productObj.price || 0,
      originalPrice: firstVariant?.originalPrice || productObj.originalPrice || firstVariant?.price || productObj.price || 0
    };
  });

  res.json({
    success: true,
    data: {
      products: transformedProducts
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
    .populate('subCategory', 'name slug level parentCategory');

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Increment view count
  await Product.findByIdAndUpdate(productId, {
    $inc: { viewCount: 1 }
  });

  // Transform product to ensure proper image and pricing display
  const productObj = (product as any).toObject ? (product as any).toObject() : product;
  const firstVariant = productObj.variants?.[0];
  
  // Use first image from first available color, fallback to variant images, then main images
  const firstColorImages = productObj.availableColors?.[0]?.images || [];
  const defaultImage = firstColorImages.length > 0 ? firstColorImages[0] : 
                      (firstVariant?.images?.[0] || productObj.images?.[0] || '');
  
  const transformedProduct = {
    ...productObj,
    images: defaultImage ? [defaultImage, ...productObj.images.filter((img: string) => img !== defaultImage)] : productObj.images,
    price: firstVariant?.price || productObj.price || 0,
    originalPrice: firstVariant?.originalPrice || productObj.originalPrice || firstVariant?.price || productObj.price || 0
  };

  res.json({
    success: true,
    data: {
      product: transformedProduct
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
  getFilters,
  getFeaturedProducts,
  getTrendingProducts,
  getRecommendations,
  getProductById,
  getRelatedProducts,
  getProductReviews
};