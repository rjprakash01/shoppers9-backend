import { Request, Response } from 'express';
import Product from '../models/Product';
import Category from '../models/Category';
import ProductFilterValue from '../models/ProductFilterValue';
import CategoryFilter from '../models/CategoryFilter';
import FilterOption from '../models/FilterOption';
import { AuthRequest } from '../types';
import { convertMultipleImagesToSVG } from '../utils/imageConverter';
import { applyPaginationWithFilter } from '../middleware/dataFilter';
import path from 'path';
import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog';

export const getAllProducts = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    console.log('=== ADMIN PRODUCT API CALLED ===');
    console.log('User role:', req.admin?.primaryRole);
    console.log('Query params:', req.query);
    console.log('Request headers:', req.headers.authorization ? 'Token present' : 'No token');
    console.log('Admin object:', req.admin ? 'Admin present' : 'No admin');
    
    const search = req.query.search as string;
    const category = req.query.category as string;
    const status = req.query.status as string;
    const featured = req.query.featured as string;
    const trending = req.query.trending as string;
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    // Build base query
    let baseQuery: any = {};
    const andConditions: any[] = [];

    if (search) {
      andConditions.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ]
      });
    }

    if (category) {
      andConditions.push({ category: category });
    }

    if (andConditions.length > 0) {
      baseQuery.$and = andConditions;
    }

    if (status) {
      baseQuery.isActive = status === 'active';
    }

    if (featured) {
      baseQuery.isFeatured = featured === 'true';
    }

    if (trending) {
      baseQuery.isTrending = trending === 'true';
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      baseQuery.minPrice = {};
      if (minPrice !== undefined) baseQuery.minPrice.$gte = minPrice;
      if (maxPrice !== undefined) baseQuery.minPrice.$lte = maxPrice;
    }

    // Apply role-based filtering and pagination
    const { query: filteredQuery, pagination } = applyPaginationWithFilter(req, baseQuery, 'Product');

    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(filteredQuery)
      .populate('category', 'name slug level parentCategory')
      .populate('subCategory', 'name slug level parentCategory')
      .populate('subSubCategory', 'name slug level parentCategory')
      .populate('createdBy', 'firstName lastName email')
      .sort(sortOptions)
      .skip(pagination.skip)
      .limit(pagination.limit);

    const total = await Product.countDocuments(filteredQuery);
    
    console.log('Filtered query:', JSON.stringify(filteredQuery, null, 2));
    console.log('Products found:', products.length);
    console.log('Total products in DB:', total);
    console.log('=== END ADMIN PRODUCT API ===');

    // Transform products to match admin frontend expectations
    const transformedProducts = products.map(product => {
      const firstVariant = product.variants?.[0];
      
      // Use first image from first available color, fallback to product images
      const firstColorImages = product.availableColors?.[0]?.images || [];
      const defaultImage = firstColorImages.length > 0 ? firstColorImages[0] : 
                          (firstVariant?.images?.[0] || product.images?.[0] || '');
      
      // Use virtual fields for pricing calculations
      const minPrice = (product as any).minPrice || 0;
      const maxPrice = (product as any).maxPrice || minPrice;
      const minOriginalPrice = (product as any).minOriginalPrice || minPrice;
      const maxOriginalPrice = (product as any).maxOriginalPrice || minOriginalPrice;
      const maxDiscount = (product as any).maxDiscount || 0;
      
      // Determine display price and original price
      const displayPrice = minPrice === maxPrice ? minPrice : minPrice;
      const displayOriginalPrice = minOriginalPrice === maxOriginalPrice ? minOriginalPrice : minOriginalPrice;
      
      return {
        id: product._id,
        name: product.name,
        description: product.description,
        price: displayPrice,
        originalPrice: displayOriginalPrice,
        discountedPrice: maxDiscount > 0 ? displayPrice : undefined,
        minPrice: minPrice,
        maxPrice: maxPrice,
        minOriginalPrice: minOriginalPrice,
        maxOriginalPrice: maxOriginalPrice,
        maxDiscount: maxDiscount,
        category: product.category,
        subCategory: product.subCategory,
        filterValues: Array.isArray(product.filterValues) ? product.filterValues : [],
        images: defaultImage ? [defaultImage] : (product.images || []),
        stock: product.totalStock || 0,
        isActive: product.isActive,
        rating: 0, // Default rating
        reviewCount: 0, // Default review count
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      };
    });

    // Log access for audit trail
    if (req.admin) {
      await AuditLog.logAction({
        userId: req.admin._id,
        action: 'read',
        module: 'product_management',
        resource: 'product',
        details: {
          method: req.method,
          endpoint: req.originalUrl,
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          filters: filteredQuery,
          resultCount: products.length
        },
        status: 'success'
      });
    }

    res.json({
      success: true,
      data: {
        products: transformedProducts,
        pagination: {
          currentPage: pagination.page,
          totalPages: Math.ceil(total / pagination.limit),
          totalItems: total,
          limit: pagination.limit,
          hasPrev: pagination.page > 1,
          hasNext: pagination.page < Math.ceil(total / pagination.limit)
        },
        userRole: req.admin?.primaryRole,
        dataScope: req.dataFilter?.role === 'super_admin' ? 'global' : 'own'
      }
    });
  } catch (error) {
    console.error('Get all products error:', error);
    
    // Log failed access attempt
    if (req.admin) {
      await AuditLog.logAction({
        userId: req.admin._id,
        action: 'read',
        module: 'product_management',
        resource: 'product',
        details: {
          method: req.method,
          endpoint: req.originalUrl,
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip
        },
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getProduct = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug level parentCategory')
      .populate('subCategory', 'name slug level parentCategory')
      .populate('subSubCategory', 'name slug level parentCategory')
      .populate({
        path: 'filterValues',
        populate: [
          { path: 'filter', select: 'name displayName type dataType' },
          { path: 'filterOption', select: 'value displayValue colorCode' }
        ]
      });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Transform product to match admin frontend expectations
    const firstVariant = product.variants?.[0];
    
    // Use first image from first available color, fallback to product images
    const firstColorImages = product.availableColors?.[0]?.images || [];
    const defaultImage = firstColorImages.length > 0 ? firstColorImages[0] : 
                        (firstVariant?.images?.[0] || product.images?.[0] || '');
    
    const transformedProduct = {
      id: product._id,
      name: product.name,
      description: product.description,
      price: firstVariant?.price || 0,
      originalPrice: firstVariant?.originalPrice || 0,
      category: product.category,
      subCategory: product.subCategory,
      subSubCategory: product.subSubCategory,
      images: defaultImage ? [defaultImage] : (product.images || []),
      stock: product.totalStock || 0,
      isActive: product.isActive,
      isFeatured: product.isFeatured || false,
      isTrending: product.isTrending || false,
      rating: 0,
      reviewCount: 0,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      brand: product.brand,
      specifications: product.specifications,
      features: product.tags?.join(', ') || '',
      tags: product.tags?.join(', ') || ''
    };

    return res.json({
      success: true,
      data: transformedProduct
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {

    // Check database connection
    if (Product.db.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection unavailable'
      });
    }
    
    // Validate and convert category to ObjectId if needed
    let categoryId = req.body.category;
    if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
      const category = await Category.findOne({ name: categoryId });
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category provided'
        });
      }
      categoryId = category._id;
    }

    // Validate and convert subCategory to ObjectId if needed
    let subCategoryId = req.body.subCategory;
    if (subCategoryId && !mongoose.Types.ObjectId.isValid(subCategoryId)) {
      const subCategory = await Category.findOne({ name: subCategoryId });
      if (!subCategory) {
        return res.status(400).json({
          success: false,
          message: 'Invalid subCategory provided'
        });
      }
      subCategoryId = subCategory._id;
    }

    // Validate and convert subSubCategory to ObjectId if needed
    let subSubCategoryId = req.body.subSubCategory;
    if (subSubCategoryId && !mongoose.Types.ObjectId.isValid(subSubCategoryId)) {
      const subSubCategory = await Category.findOne({ name: subSubCategoryId });
      if (!subSubCategory) {
        return res.status(400).json({
          success: false,
          message: 'Invalid subSubCategory provided'
        });
      }
      subSubCategoryId = subSubCategory._id;
    }
    
    // Process filter values if provided
    let processedFilterValues: any[] = [];
    if (req.body.filterValues) {
      try {
        // Parse JSON string if it's a string, otherwise use as-is if it's already an array
        const filterValues = typeof req.body.filterValues === 'string' 
          ? JSON.parse(req.body.filterValues) 
          : req.body.filterValues;
        
        if (Array.isArray(filterValues)) {
          for (const filterValue of filterValues) {
            if (filterValue.filterId && (filterValue.filterOptionId || filterValue.customValue)) {
              processedFilterValues.push({
                filter: filterValue.filterId,
                filterOption: filterValue.filterOptionId,
                customValue: filterValue.customValue
              });
            }
          }
        }
      } catch (error) {
        
      }
    }
    
    // Handle uploaded images and convert to SVG
    let images: string[] = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      
      const outputDir = path.join(process.cwd(), 'uploads', 'products');
      const conversionResult = await convertMultipleImagesToSVG(req.files, outputDir);
      
      if (conversionResult.errors.length > 0) {
        
      }
      
      images = conversionResult.svgPaths;
      
    } else if (req.body.images) {
      // Fallback to URL-based images if provided
      images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }

    // SKU generation removed to fix duplicate key error
    
    // Handle variants data from the new form structure
    let variants: any[] = [];
    if (req.body.variants) {
      try {
        // Parse variants if it's a JSON string
        const variantsData = typeof req.body.variants === 'string' 
          ? JSON.parse(req.body.variants) 
          : req.body.variants;
        
        if (Array.isArray(variantsData) && variantsData.length > 0) {
          variants = variantsData.map((variant: any, index: number) => ({
            color: variant.color,
            colorCode: variant.colorCode,
            size: variant.size || 'One Size',
            price: parseFloat(variant.price || 0),
            originalPrice: parseFloat(variant.originalPrice || variant.price || 0),
            stock: parseInt(variant.stock || 0),
            sku: variant.sku || `${req.body.name?.replace(/\s+/g, '-').toUpperCase()}-${variant.color}-${variant.size}-${index + 1}`,
            images: variant.images || images
          }));
        }
      } catch (error) {
        
      }
    }
    
    // Fallback to simple variant structure if no variants provided
    if (variants.length === 0) {
      variants = [{
        color: req.body.color || 'Default',
        colorCode: req.body.colorCode || '#000000',
        size: req.body.size || 'One Size',
        price: parseFloat(req.body.price),
        originalPrice: parseFloat(req.body.originalPrice || req.body.price),
        stock: parseInt(req.body.stock),
        sku: req.body.sku || `${req.body.name?.replace(/\s+/g, '-').toUpperCase()}-DEFAULT-1`,
        images: images // Ensure main product images are assigned to the default variant
      }];
    }
    
    // Ensure all variants have images - if a variant has no images, use main product images
    variants = variants.map(variant => ({
      ...variant,
      images: variant.images && variant.images.length > 0 ? variant.images : images
    }));
    
    // Handle displayFilters
    let displayFilters: string[] = [];
    if (req.body.displayFilters) {
      try {
        displayFilters = typeof req.body.displayFilters === 'string' 
          ? JSON.parse(req.body.displayFilters) 
          : req.body.displayFilters;
      } catch (error) {
        
      }
    }
    
    // Convert string values to appropriate types
    const productData: any = {
      name: req.body.name,
      description: req.body.description,
      category: categoryId,
      subCategory: subCategoryId,
      brand: req.body.brand,
      images: images,
      variants: variants,
      displayFilters: displayFilters,
      filterValues: processedFilterValues,
      specifications: req.body.specifications ? 
        (typeof req.body.specifications === 'string' ? JSON.parse(req.body.specifications) : req.body.specifications) : {},
      tags: req.body.tags ? 
        (Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(',').map((tag: string) => tag.trim())) : [],
      isActive: req.body.isActive === 'true' || req.body.isActive === true,
      isFeatured: req.body.isFeatured === 'true' || req.body.isFeatured === true,
      isTrending: req.body.isTrending === 'true' || req.body.isTrending === true,
      createdBy: req.admin?._id,
      updatedBy: req.admin?._id
    };

    // Add subSubCategory if provided
    if (subSubCategoryId) {
      productData.subSubCategory = subSubCategoryId;
    }
    
    // Explicitly ensure no top-level sku field is added
    delete productData.sku;

    const product = await Product.create(productData);

    // Create filter values if provided
    if (processedFilterValues.length > 0) {
      const filterValuePromises = processedFilterValues.map(fv => 
        ProductFilterValue.create({
          product: product._id,
          filter: fv.filter,
          filterOption: fv.filterOption,
          isActive: true,
          createdBy: req.admin?._id,
          updatedBy: req.admin?._id
        })
      );
      
      await Promise.all(filterValuePromises);
    }
    
    // Populate the created product with filter values
    const populatedProduct = await Product.findById(product._id)
      .populate('category', 'name slug level parentCategory')
      .populate('subCategory', 'name slug level parentCategory')
      .populate({
        path: 'filterValues',
        populate: [
          { path: 'filter', select: 'name displayName type dataType' },
          { path: 'filterOption', select: 'value displayValue colorCode' }
        ]
      });
    
    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: populatedProduct
    });
  } catch (error: any) {

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(400).json({
        success: false,
        message: `${field} already exists. Please use a different ${field}.`,
        error: `Duplicate ${field}`
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'Error creating product',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {

    // Get existing product to preserve variant structure
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Handle uploaded images and convert to SVG
    let images: string[] = existingProduct.images || [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      
      const outputDir = path.join(process.cwd(), 'uploads', 'products');
      const conversionResult = await convertMultipleImagesToSVG(req.files, outputDir);
      
      if (conversionResult.errors.length > 0) {
        
      }
      
      images = conversionResult.svgPaths;
      
    } else if (req.body.images) {
      images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }
    
    // Validate and convert category to ObjectId if needed
    let categoryId = req.body.category || existingProduct.category;
    if (req.body.category && !mongoose.Types.ObjectId.isValid(req.body.category)) {
      const category = await Category.findOne({ name: req.body.category });
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category provided'
        });
      }
      categoryId = category._id;
    }
    
    // Prepare update data
    let updateData: any = {
      name: req.body.name || existingProduct.name,
      description: req.body.description || existingProduct.description,
      category: categoryId,
      subCategory: req.body.subcategory || req.body.subCategory || existingProduct.subCategory,
      brand: req.body.brand || existingProduct.brand,
      images: images
    };
    
    // Update specifications if provided
    if (req.body.specifications) {
      updateData.specifications = typeof req.body.specifications === 'string' ? 
        JSON.parse(req.body.specifications) : req.body.specifications;
    }
    
    // Update tags if provided
    if (req.body.tags) {
      updateData.tags = Array.isArray(req.body.tags) ? 
        req.body.tags : req.body.tags.split(',').map((tag: string) => tag.trim());
    }
    
    // Update isActive if provided
    if (req.body.isActive !== undefined) {
      updateData.isActive = req.body.isActive === 'true' || req.body.isActive === true;
    }
    
    // Update isFeatured if provided
    if (req.body.isFeatured !== undefined) {
      updateData.isFeatured = req.body.isFeatured === 'true' || req.body.isFeatured === true;
    }
    
    // Update isTrending if provided
    if (req.body.isTrending !== undefined) {
      updateData.isTrending = req.body.isTrending === 'true' || req.body.isTrending === true;
    }
    
    // Update variant data if price/stock information is provided
    if (req.body.price || req.body.stock || req.body.originalPrice) {
      const variants = existingProduct.variants || [];
      if (variants.length > 0 && variants[0] && variants[0].size) {
        // Update the first variant's first size (default behavior for simple admin form)
        if (req.body.price) variants[0].price = parseFloat(req.body.price);
        if (req.body.originalPrice) variants[0].originalPrice = parseFloat(req.body.originalPrice);
        if (req.body.stock) variants[0].stock = parseInt(req.body.stock);
        
        // Recalculate discount
        if (req.body.price && req.body.originalPrice) {
          const price = parseFloat(req.body.price);
          const originalPrice = parseFloat(req.body.originalPrice);
          // Note: discount calculation can be added to variant if needed
        }
        
        // Update variant images
        variants[0].images = images;
        
        updateData.variants = variants;
      }
    }
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    // Handle filter values update if provided
    if (req.body.filterValues && Array.isArray(req.body.filterValues)) {
      // Remove existing filter values for this product
      await ProductFilterValue.deleteMany({ product: req.params.id });
      
      // Create new filter values
      const filterValuePromises = req.body.filterValues.map((fv: any) => 
        ProductFilterValue.create({
          product: req.params.id,
          filter: fv.filter,
          filterOption: fv.filterOption,
          customValue: fv.customValue,
          isActive: true,
          createdBy: req.admin?._id,
          updatedBy: req.admin?._id
        })
      );
      
      await Promise.all(filterValuePromises);
    }

    // Get updated product with populated data
    const populatedProduct = await Product.findById(req.params.id)
      .populate('category', 'name slug level parentCategory')
      .populate('subCategory', 'name slug level parentCategory')
      .populate({
        path: 'filterValues',
        populate: [
          { path: 'filter', select: 'name displayName type dataType' },
          { path: 'filterOption', select: 'value displayValue colorCode' }
        ]
      });

    return res.json({
      success: true,
      message: 'Product updated successfully',
      data: populatedProduct
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Error updating product',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete associated filter values first
    await ProductFilterValue.deleteMany({ product: req.params.id });
    
    // Delete the product
    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product and associated filter values deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const toggleProductStatus = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.isActive = !product.isActive;
    await product.save();

    return res.json({
      success: true,
      message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`,
      data: product
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error toggling product status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const bulkUpdateProducts = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { productIds, updateData } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs are required'
      });
    }

    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      updateData
    );

    return res.json({
      success: true,
      message: `${result.modifiedCount} products updated successfully`,
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error bulk updating products',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getProductAnalytics = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const inactiveProducts = await Product.countDocuments({ isActive: false });
    const outOfStock = await Product.countDocuments({ stock: 0 });
    const lowStock = await Product.countDocuments({ stock: { $lte: 10, $gt: 0 } });

    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$price', '$stock'] } }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $project: {
          categoryName: { $arrayElemAt: ['$categoryInfo.name', 0] },
          count: 1,
          totalValue: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalProducts,
          activeProducts,
          inactiveProducts,
          outOfStock,
          lowStock
        },
        categoryStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get available filters for a product based on its category
 */
export const getProductFilters = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get filters assigned to the product's category
    const categoryFilters = await CategoryFilter.find({
      category: product.category,
      isActive: true
    })
    .populate({
      path: 'filter',
      populate: {
        path: 'options',
        match: { isActive: true },
        options: { sort: { sortOrder: 1 } }
      }
    })
    .sort({ sortOrder: 1 });

    res.json({
      success: true,
      data: categoryFilters
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product filters',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get filter values for a specific product
 */
export const getProductFilterValues = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const filterValues = await ProductFilterValue.find({
      product: req.params.id,
      isActive: true
    })
    .populate('filter', 'name displayName type dataType')
    .populate('filterOption', 'value displayValue colorCode')
    .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: filterValues
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product filter values',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Set filter values for a product
 */
export const setProductFilterValues = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const { filterValues } = req.body;
    
    if (!Array.isArray(filterValues)) {
      return res.status(400).json({
        success: false,
        message: 'Filter values must be an array'
      });
    }

    // Verify product exists
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Remove existing filter values
    await ProductFilterValue.deleteMany({ product: req.params.id });

    // Create new filter values
    const newFilterValues = [];
    for (const fv of filterValues) {
      if (fv.filter) {
        const filterValue = await ProductFilterValue.create({
          product: req.params.id,
          filter: fv.filter,
          filterOption: fv.filterOption || null,
          customValue: fv.customValue || null,
          isActive: true,
          createdBy: req.admin?._id,
          updatedBy: req.admin?._id
        });
        newFilterValues.push(filterValue);
      }
    }

    // Get populated filter values
    const populatedFilterValues = await ProductFilterValue.find({
      product: req.params.id,
      isActive: true
    })
    .populate('filter', 'name displayName type dataType')
    .populate('filterOption', 'value displayValue colorCode');

    res.json({
      success: true,
      data: populatedFilterValues
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error setting product filter values',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get all available filter options for a category
 * Returns all filter options assigned to the category, not just those used by existing products
 */
export const getAvailableFilterOptionsForCategory = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { categoryId } = req.params;
    
    // Verify category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get all products in this category that are active
    const products = await Product.find({
      $or: [
        { category: categoryId },
        { subCategory: categoryId },
        { subSubCategory: categoryId }
      ],
      isActive: true
    }).populate({
      path: 'filterValues',
      populate: [
        { path: 'filter', select: 'name displayName type' },
        { path: 'filterOption', select: 'value displayValue colorCode' }
      ]
    });

    // Get category filters to know which filters are available
    const categoryFilters = await CategoryFilter.find({
      category: categoryId,
      isActive: true
    })
    .populate('filter')
    .sort({ sortOrder: 1 });

    // Build available options based on existing products
    const availableOptions = await Promise.all(categoryFilters.map(async categoryFilter => {
      const filter = categoryFilter.filter as any;
      const usedOptions = new Set();
      const usedCustomValues = new Set();

      // Collect all used filter values from products
      products.forEach(product => {
        if (product.filterValues && Array.isArray(product.filterValues)) {
          product.filterValues.forEach((fv: any) => {
            if (fv.filter && fv.filter._id.toString() === filter._id.toString()) {
              if (fv.filterOption) {
                usedOptions.add(fv.filterOption._id.toString());
              }
              if (fv.customValue) {
                usedCustomValues.add(fv.customValue);
              }
            }
          });
        }
      });

      // Get all filter options for this filter
      const allFilterOptions = await FilterOption.find({
        filter: filter._id,
        isActive: true
      }).sort({ sortOrder: 1, displayValue: 1 });

      // Return all filter options for this filter (not just used ones)
      // This is needed for the "Add New Product" page to show all available options
      const availableFilterOptions = allFilterOptions;

      return {
        _id: categoryFilter._id,
        category: categoryFilter.category,
        filter: {
          ...filter.toObject(),
          options: availableFilterOptions
        },
        isRequired: categoryFilter.isRequired,
        isActive: categoryFilter.isActive,
        sortOrder: categoryFilter.sortOrder,
        usedCustomValues: Array.from(usedCustomValues)
      };
    }));

    res.json({
     success: true,
     data: availableOptions
   });
 } catch (error) {
   res.status(500).json({
     success: false,
     message: 'Error fetching available filter options',
     error: error instanceof Error ? error.message : 'Unknown error'
   });
 }
};