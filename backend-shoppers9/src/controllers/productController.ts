import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest, PaginationQuery, ProductFilters } from '../types';

// Import FilterAssignment model
let FilterAssignment: any;
try {
  FilterAssignment = require('../models/FilterAssignment').default || require('../models/FilterAssignment');
} catch (error) {
  console.warn('FilterAssignment model not found, using fallback');
  FilterAssignment = null;
}

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
    console.log('✅ Products route hit with query:', req.query);
    
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️  Database not connected, returning mock data');
      
      // Return mock data with proper category filtering for development
      const { category } = req.query;
      
      if (category) {
        console.log('🔍 Category filtering requested for:', category);
        
        const mockProducts = {
          'men-clothing-t-shirt': [
            { 
              _id: '1', 
              name: 'Cotton T-Shirt', 
              price: 25,
              images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop'],
              description: 'Comfortable cotton t-shirt for everyday wear',
              category: { name: 'Men', slug: 'men' },
              subCategory: { name: 'Clothing', slug: 'clothing' },
              subSubCategory: { name: 'T-Shirts', slug: 't-shirt' }
            },
            { 
              _id: '2', 
              name: 'Premium T-Shirt', 
              price: 35,
              images: ['https://images.unsplash.com/photo-1583743814966-8936f37f4678?w=400&h=400&fit=crop'],
              description: 'Premium quality t-shirt with superior comfort',
              category: { name: 'Men', slug: 'men' },
              subCategory: { name: 'Clothing', slug: 'clothing' },
              subSubCategory: { name: 'T-Shirts', slug: 't-shirt' }
            }
          ],
          'men-clothing-jeans': [
            { 
              _id: '3', 
              name: 'Slim Fit Jeans', 
              price: 60,
              images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop'],
              description: 'Modern slim fit jeans for a stylish look',
              category: { name: 'Men', slug: 'men' },
              subCategory: { name: 'Clothing', slug: 'clothing' },
              subSubCategory: { name: 'Jeans', slug: 'jeans' }
            },
            { 
              _id: '4', 
              name: 'Regular Jeans', 
              price: 50,
              images: ['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=400&fit=crop'],
              description: 'Classic regular fit jeans for comfort',
              category: { name: 'Men', slug: 'men' },
              subCategory: { name: 'Clothing', slug: 'clothing' },
              subSubCategory: { name: 'Jeans', slug: 'jeans' }
            }
          ],
          'men-clothing-shirts': [
            { 
              _id: '5', 
              name: 'Formal Shirt', 
              price: 40,
              images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop'],
              description: 'Professional formal shirt for business wear',
              category: { name: 'Men', slug: 'men' },
              subCategory: { name: 'Clothing', slug: 'clothing' },
              subSubCategory: { name: 'Shirts', slug: 'shirts' }
            },
            { 
              _id: '6', 
              name: 'Casual Shirt', 
              price: 30,
              images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=400&fit=crop'],
              description: 'Relaxed casual shirt for weekend wear',
              category: { name: 'Men', slug: 'men' },
              subCategory: { name: 'Clothing', slug: 'clothing' },
              subSubCategory: { name: 'Shirts', slug: 'shirts' }
            }
          ],
          'men-footwear': [
            { 
              _id: '7', 
              name: 'Running Shoes', 
              price: 80,
              images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop'],
              description: 'High-performance running shoes for athletes',
              category: { name: 'Men', slug: 'men' },
              subCategory: { name: 'Footwear', slug: 'footwear' }
            },
            { 
              _id: '8', 
              name: 'Casual Sneakers', 
              price: 70,
              images: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop'],
              description: 'Comfortable sneakers for daily wear',
              category: { name: 'Men', slug: 'men' },
              subCategory: { name: 'Footwear', slug: 'footwear' }
            }
          ]
        };
        
        const filteredProducts = (mockProducts as any)[String(category)] || [];
        console.log(`✅ Returning ${filteredProducts.length} mock products for category: ${category}`);
        
        return res.json({
          success: true,
          data: {
            products: filteredProducts,
            pagination: {
              totalItems: filteredProducts.length,
              currentPage: 1,
              totalPages: 1,
              hasNext: false,
              hasPrev: false
            }
          },
          message: `Mock products for ${category}`
        });
      }
      
      return res.status(200).json({
        success: true,
        data: {
          products: [],
          pagination: {
            totalItems: 0,
            currentPage: 1,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          }
        },
        message: 'Database not connected - showing empty results'
      });
    }
    
    console.log('✅ Database connected, processing request with production logic');
    
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
  const query: any = { 
    isActive: true,
    status: 'active',
    isApproved: true // Only show approved products to customers
  };

  // Build filter query
  if (category) {
    console.log('\n=== CATEGORY DEBUG ===');
    console.log('Category parameter:', category);
    console.log('Request URL:', req.url);
    console.log('Request query:', req.query);
    
    // Simplified category handling - frontend now sends actual database slugs
    // No need for complex parsing since frontend sends the correct slug directly
     
     try {
       // Direct category lookup by slug - frontend sends actual database slugs
       console.log('Looking for category with slug:', category);
       
       const categoryDoc = await Category.findOne({
         slug: category,
         isActive: true
       });
       
       if (categoryDoc) {
         console.log(`Found category: ${categoryDoc.name} (Level ${categoryDoc.level})`);
         
         if (categoryDoc.level === 3) {
           // Level 3 category - filter by subSubCategory
           query.subSubCategory = new mongoose.Types.ObjectId(categoryDoc._id);
           console.log('Applied Level 3 filter:', categoryDoc._id);
         } else if (categoryDoc.level === 2) {
           // Level 2 category - get all products in this subcategory and its children
           const subsubcategories = await Category.find({
             parentCategory: categoryDoc._id,
             isActive: true
           }).lean();
           
           const subsubcategoryIds = subsubcategories.map(s => s._id);
           
           query.$or = [
             { subCategory: categoryDoc._id },
             { subSubCategory: { $in: subsubcategories.map(s => s._id) } }
           ];
           console.log('Applied Level 2 filter:', categoryDoc._id);
         } else if (categoryDoc.level === 1) {
           // Level 1 category - get all descendant categories
           const getAllDescendants = async (parentId: any): Promise<any[]> => {
             const children = await Category.find({
               parentCategory: parentId,
               isActive: true
             }).lean();
             
             let allDescendants = [...children];
             for (const child of children) {
               const grandchildren = await getAllDescendants(child._id);
               allDescendants = [...allDescendants, ...grandchildren];
             }
             return allDescendants;
           };
           
           const descendants = await getAllDescendants(categoryDoc._id);
           const level2Ids = descendants.filter(d => d.level === 2).map(d => d._id);
           const level3Ids = descendants.filter(d => d.level === 3).map(d => d._id);
           
           query.$or = [
             { category: categoryDoc._id },
             { subCategory: { $in: level2Ids } },
             { subSubCategory: { $in: level3Ids } }
           ];
           console.log('Applied Level 1 filter:', categoryDoc._id);
         }
       } else {
         console.log('⚠️  Category not found:', category);
         query._id = { $in: [] }; // Return no products
       }
    } catch (error) {
      console.error('Category filtering error:', error);
      // Continue without category filter if there's an error
    }
    
    console.log('Final query after category filtering:', JSON.stringify(query, null, 2));
  console.log('=== END CATEGORY DEBUG ===\n');
}

// Check if we have an empty results query from category filtering
const hasEmptyResultsQuery = query._id && Array.isArray(query._id.$in) && query._id.$in.length === 0;

if (!hasEmptyResultsQuery) {
  // Only apply additional filters if we're not returning empty results
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
} else {
  console.log('🚫 Skipping additional filters due to empty results query from category filtering');
}

  // Handle dynamic filters from hierarchical filter assignments
  if (!hasEmptyResultsQuery) {
    try {
      // Import required models - commented out as these models don't exist yet
      // const FilterAssignment = require('../models/FilterAssignment').default;
      // const ProductFilterValue = require('../models/ProductFilterValue').default;
      
      // Skip dynamic filtering until models are implemented
      console.log('FilterAssignment model not found, using fallback');
      throw new Error('Models not implemented');
      
      // Process dynamic filters from query parameters
      // TODO: Implement when FilterAssignment and ProductFilterValue models are created
      console.log('Dynamic filtering skipped - models not implemented yet');
    } catch (error) {
      console.error('Error processing dynamic filters:', error);
      // Continue without dynamic filters if there's an error
    }
  }

  if (inStock) {
    query.totalStock = { $gt: 0 };
  }

  if (search && !hasEmptyResultsQuery) {
    // Only apply search if we're not returning empty results
    // If category filtering already set $or, combine with search
    if (query.$or) {
      // Combine category filtering with search using $and
      const categoryFilter = { $or: query.$or };
      const searchFilter = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ]
      };
      delete query.$or;
      query.$and = [categoryFilter, searchFilter];
    } else {
      // No category filtering, just apply search
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
  } else if (search && hasEmptyResultsQuery) {
    console.log('🚫 Skipping search filters due to empty results query from category filtering');
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


  
  // isApproved and isActive filters are already in the base query
  
  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug level parentCategory')
      .populate('subCategory', 'name slug level parentCategory')
      .populate('subSubCategory', 'name slug level parentCategory')
      .sort(sortQuery)
      .skip(skip)
      .limit(Number(limit)),
    Product.countDocuments(query)
  ]);
  
  console.log('\n=== PRODUCT RESULTS DEBUG ===');
  console.log(`Total products found: ${total}`);
  console.log('Query used:', JSON.stringify(query, null, 2));
  
  if (products.length > 0) {
    console.log('All products returned:');
    products.forEach((product: any, index: number) => {
      const p = product as any;
      console.log(`${index + 1}. ${p.name} (ID: ${p._id})`);
      console.log(`   Category: ${p.category?.name || 'None'} (ID: ${p.category?._id || 'None'})`);
      console.log(`   SubCategory: ${p.subCategory?.name || 'None'} (ID: ${p.subCategory?._id || 'None'})`);
      console.log(`   SubSubCategory: ${p.subSubCategory?.name || 'None'} (ID: ${p.subSubCategory?._id || 'None'})`);
      console.log(`   Price: ${p.price}`);
      console.log('   ---');
    });
  } else {
    console.log('❌ No products found with current query');
    console.log('This might indicate:');
    console.log('1. Category filter is too restrictive');
    console.log('2. No products exist in this category');
    console.log('3. Products have incorrect category assignments');
  }
  console.log('=== END PRODUCT RESULTS DEBUG ===\n');

  if (products.length > 0) {
    // Products found, continue processing
  }

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  // Transform products to ensure proper image and pricing display
  const transformedProducts = products.map((product: any) => {
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
    approvalStatus: 'approved', // Only show approved products in search
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
    let categoryDoc: any = null;
    
    if (category) {
      try {
        categoryDoc = await Category.findOne({ 
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
      {
        $group: {
          _id: null,
          minPrice: { $min: '$variants.price' },
          maxPrice: { $max: '$variants.price' }
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
      { $group: { _id: '$variants.size', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // Get available colors
    const colors = await Product.aggregate([
      { $match: matchQuery },
      { $unwind: '$variants' },
      { $group: { _id: { color: '$variants.color', colorCode: '$variants.colorCode' }, count: { $sum: 1 } } },
      { $sort: { '_id.color': 1 } }
    ]);
    
    // Get dynamic filters from hierarchical filter assignments
    let dynamicFilters: any[] = [];
    if (categoryDoc) {
      try {
        // Import FilterAssignment model
        const FilterAssignment = require('../models/FilterAssignment').default;
        
        // Get all filter assignments for this category and its ancestors
        const getAllAncestors = async (categoryId: any): Promise<any[]> => {
          const category = await Category.findById(categoryId);
          if (!category || !category.parentCategory) {
            return [categoryId];
          }
          const ancestors = await getAllAncestors(category.parentCategory);
          return [...ancestors, categoryId];
        };
        
        const ancestorIds = await getAllAncestors(categoryDoc._id);
        
        const filterAssignments = await FilterAssignment.find({
          category: { $in: ancestorIds },
          isActive: true
        })
        .populate({
          path: 'filter',
          select: 'name displayName type dataType description',
          populate: {
            path: 'options',
            match: { isActive: true },
            select: 'value displayValue colorCode sortOrder',
            options: { sort: { sortOrder: 1 } }
          }
        })
        .sort({ sortOrder: 1 });
        
        // Get product filter values to calculate counts
        const ProductFilterValue = require('../models/ProductFilterValue').default;
        
        for (const assignment of filterAssignments) {
          const filter = assignment.filter;
          if (!filter || !filter.options || filter.options.length === 0) continue;
          
          // Get count of products that have values for this filter
          const filterValueCounts = await ProductFilterValue.aggregate([
            {
              $lookup: {
                from: 'products',
                localField: 'product',
                foreignField: '_id',
                as: 'productData'
              }
            },
            {
              $match: {
                filter: filter._id,
                isActive: true,
                'productData.isActive': true,
                ...(categoryDoc ? {
                  $or: [
                    { 'productData.category': { $in: [categoryDoc._id] } },
                    { 'productData.subCategory': { $in: [categoryDoc._id] } },
                    { 'productData.subSubCategory': { $in: [categoryDoc._id] } }
                  ]
                } : {})
              }
            },
            {
              $lookup: {
                from: 'filteroptions',
                localField: 'filterOption',
                foreignField: '_id',
                as: 'optionData'
              }
            },
            {
              $group: {
                _id: '$filterOption',
                count: { $sum: 1 },
                optionData: { $first: '$optionData' }
              }
            }
          ]);
          
          const optionsWithCounts = filter.options.map((option: any) => {
            const countData = filterValueCounts.find((fvc: any) => 
              fvc._id && fvc._id.toString() === option._id.toString()
            );
            return {
              name: option.displayValue || option.value,
              value: option.value,
              count: countData ? countData.count : 0,
              colorCode: option.colorCode
            };
          }).filter((option: any) => option.count > 0);
          
          if (optionsWithCounts.length > 0) {
            dynamicFilters.push({
              name: filter.name,
              displayName: filter.displayName || filter.name,
              type: filter.type,
              dataType: filter.dataType,
              options: optionsWithCounts
            });
          }
        }
      } catch (error) {
        console.error('Error fetching dynamic filters:', error);
      }
    }
    
    // Get subcategories for the current category
    let subcategories: any[] = [];
    if (category && categoryDoc) {
      try {
        subcategories = await Category.find({
          parentCategory: categoryDoc._id,
          isActive: true
        }).select('name slug').lean();
      } catch (error) {
        
      }
    }
    
    res.json({
      success: true,
      data: {
        priceRange: priceRange[0] || { minPrice: 0, maxPrice: 10000 },
        brands: brands.map((b: any) => ({ name: b._id, count: b.count })),
        sizes: sizes.map((s: any) => ({ name: s._id, count: s.count })),
        colors: colors.map((c: any) => ({ 
          name: c._id.color, 
          colorCode: c._id.colorCode, 
          count: c.count 
        })),
        materials: [], // Legacy field, now handled by dynamic filters
        fabrics: [], // Legacy field, now handled by dynamic filters
        subcategories: subcategories,
        filters: dynamicFilters // New dynamic filters from hierarchical system
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
    isFeatured: true,
    approvalStatus: 'approved' // Only show approved products
  })
    .populate('category', 'name slug')
    .sort({ popularity: -1, createdAt: -1 })
    .limit(20);

  // Transform products to ensure proper image and pricing display
  const transformedProducts = products.map((product: any) => {
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
    isTrending: true,
    approvalStatus: 'approved' // Only show approved products
  })
    .populate('category', 'name slug')
    .sort({ popularity: -1, salesCount: -1, createdAt: -1 })
    .limit(20);

  // Transform products to ensure proper image and pricing display
  const transformedProducts = products.map((product: any) => {
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
    isActive: true,
    approvalStatus: 'approved' // Only show approved products
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
  
  // Generate availableColors and availableSizes from variants if they don't exist
  if (productObj.variants && productObj.variants.length > 0) {
    // Extract unique colors from variants
    if (!productObj.availableColors || productObj.availableColors.length === 0) {
      const uniqueColors = new Map();
      
      // First pass: create color entries
      productObj.variants.forEach((variant: any) => {
        if (variant.color && !uniqueColors.has(variant.color)) {
          uniqueColors.set(variant.color, {
            name: variant.color,
            code: variant.colorCode || '#000000',
            images: []
          });
        }
      });
      
      // Second pass: collect ALL images for each color
      productObj.variants.forEach((variant: any) => {
        if (variant.color && uniqueColors.has(variant.color)) {
          const colorEntry = uniqueColors.get(variant.color);
          if (variant.images && variant.images.length > 0) {
            variant.images.forEach((img: string) => {
              if (!colorEntry.images.includes(img)) {
                colorEntry.images.push(img);
              }
            });
          }
        }
      });
      
      productObj.availableColors = Array.from(uniqueColors.values());
    }
    
    // Extract unique sizes from variants
    if (!productObj.availableSizes || productObj.availableSizes.length === 0) {
      const uniqueSizes = new Set();
      productObj.variants.forEach((variant: any) => {
        if (variant.size) {
          uniqueSizes.add(variant.size);
        }
      });
      productObj.availableSizes = Array.from(uniqueSizes).map(size => ({ name: size }));
    }
  }
  
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