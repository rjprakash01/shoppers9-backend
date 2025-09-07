import { Request, Response } from 'express';
import Product from '../models/Product';
import Category from '../models/Category';
import ProductFilterValue from '../models/ProductFilterValue';
import CategoryFilter from '../models/CategoryFilter';
import FilterOption from '../models/FilterOption';
import { AuthRequest } from '../types';
import { convertMultipleImagesToSVG } from '../utils/imageConverter';
import path from 'path';
import mongoose from 'mongoose';

export const getAllProducts = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const category = req.query.category as string;
    const status = req.query.status as string;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    const query: any = {};
    const andConditions: any[] = [];

    if (search) {
      andConditions.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      });
    }

    if (category) {
      // Find products that belong to the selected category or have it as subcategory
      // Also include products from child categories
      const selectedCategory = await Category.findById(category);
      if (selectedCategory) {
        // Get all descendant categories
        const getAllDescendants = async (categoryId: string): Promise<string[]> => {
          const descendants = [categoryId];
          const children = await Category.find({ parentCategory: categoryId });
          for (const child of children) {
            const childDescendants = await getAllDescendants(child._id.toString());
            descendants.push(...childDescendants);
          }
          return descendants;
        };
        
        const categoryIds = await getAllDescendants(category);
        
        // Find products that have the selected category or any of its descendants
        // as either main category, subcategory, or sub-subcategory
        andConditions.push({
          $or: [
            { category: { $in: categoryIds } },
            { subCategory: { $in: categoryIds } },
            { subSubCategory: { $in: categoryIds } }
          ]
        });
      } else {
        // Fallback to original logic if category not found
        andConditions.push({ category: category });
      }
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    if (status) {
      query.isActive = status === 'active';
    }

    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(query)
      .populate('category', 'name slug level parentCategory')
      .populate('subCategory', 'name slug level parentCategory')
      .populate('subSubCategory', 'name slug level parentCategory')
      .populate({
        path: 'filterValues',
        populate: [
          { path: 'filter', select: 'name displayName type' },
          { path: 'filterOption', select: 'value displayValue colorCode' }
        ]
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);

    // Transform products to match admin frontend expectations
    const transformedProducts = products.map(product => {
      const firstVariant = product.variants?.[0];
      const firstSize = firstVariant?.sizes?.[0];
      
      return {
        id: product._id,
        name: product.name,
        description: product.description,
        price: firstSize?.originalPrice || 0,
        discountedPrice: firstSize?.price !== firstSize?.originalPrice ? firstSize?.price : undefined,
        category: product.category,
        subCategory: product.subCategory,
        filterValues: product.filterValues || [],
        images: product.images || [],
        stock: product.totalStock || 0,
        isActive: product.isActive,
        rating: 0, // Default rating
        reviewCount: 0, // Default review count
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      };
    });

    res.json({
      success: true,
      data: {
        products: transformedProducts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          limit,
          hasPrev: page > 1,
          hasNext: page < Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
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
    const firstSize = firstVariant?.sizes?.[0];
    
    const transformedProduct = {
      id: product._id,
      name: product.name,
      description: product.description,
      price: firstSize?.originalPrice || 0,
      discountedPrice: firstSize?.price !== firstSize?.originalPrice ? firstSize?.price : undefined,
      category: {
        id: product.category,
        name: product.category
      },
      images: product.images || [],
      stock: product.totalStock || 0,
      isActive: product.isActive,
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
    console.log('Creating product with data:', req.body);
    console.log('Uploaded files:', req.files);
    
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
        console.warn('Error parsing filterValues:', error);
      }
    }
    
    // Handle uploaded images and convert to SVG
    let images: string[] = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      console.log('Converting uploaded images to SVG format...');
      const outputDir = path.join(process.cwd(), 'uploads', 'products');
      const conversionResult = await convertMultipleImagesToSVG(req.files, outputDir);
      
      if (conversionResult.errors.length > 0) {
        console.warn('Some images failed to convert:', conversionResult.errors);
      }
      
      images = conversionResult.svgPaths;
      console.log('Converted images to SVG:', images);
    } else if (req.body.images) {
      // Fallback to URL-based images if provided
      images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }
    
    console.log('Processed images:', images);
    
    // SKU generation removed to fix duplicate key error
    
    // Transform simple admin form data into variant-based structure
    const variants = [{
      color: req.body.color || 'Default',
      colorCode: req.body.colorCode || '#000000',
      sizes: [{
        size: req.body.size || 'One Size',
        price: parseFloat(req.body.price),
        originalPrice: parseFloat(req.body.originalPrice || req.body.price),
        discount: req.body.originalPrice ? 
          Math.round(((parseFloat(req.body.originalPrice) - parseFloat(req.body.price)) / parseFloat(req.body.originalPrice)) * 100) : 0,
        stock: parseInt(req.body.stock),
        // sku: sku // Removed sku field from schema
      }],
      images: images
    }];
    
    console.log('Variants:', JSON.stringify(variants, null, 2));
    
    // Convert string values to appropriate types
    const productData: any = {
      name: req.body.name,
      description: req.body.description,
      category: categoryId,
      subCategory: subCategoryId,
      brand: req.body.brand,
      images: images,
      variants: variants,
      filterValues: processedFilterValues,
      specifications: req.body.specifications ? 
        (typeof req.body.specifications === 'string' ? JSON.parse(req.body.specifications) : req.body.specifications) : {},
      tags: req.body.tags ? 
        (Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(',').map((tag: string) => tag.trim())) : [],
      isActive: req.body.isActive === 'true' || req.body.isActive === true
    };

    // Add subSubCategory if provided
    if (subSubCategoryId) {
      productData.subSubCategory = subSubCategoryId;
    }
    
    // Explicitly ensure no top-level sku field is added
    delete productData.sku;

    console.log('Final product data:', productData);
    
    const product = await Product.create(productData);
    console.log('Product created successfully:', product._id);
    
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
    console.error('Error creating product:', error);
    
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
    console.log('Updating product with data:', req.body);
    console.log('Uploaded files:', req.files);
    
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
      console.log('Converting uploaded images to SVG format for update...');
      const outputDir = path.join(process.cwd(), 'uploads', 'products');
      const conversionResult = await convertMultipleImagesToSVG(req.files, outputDir);
      
      if (conversionResult.errors.length > 0) {
        console.warn('Some images failed to convert during update:', conversionResult.errors);
      }
      
      images = conversionResult.svgPaths;
      console.log('Updated images converted to SVG:', images);
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
    
    // Update variant data if price/stock information is provided
    if (req.body.price || req.body.stock || req.body.originalPrice) {
      const variants = existingProduct.variants || [];
      if (variants.length > 0 && variants[0] && variants[0].sizes && variants[0].sizes.length > 0 && variants[0].sizes[0]) {
        // Update the first variant's first size (default behavior for simple admin form)
        if (req.body.price) variants[0].sizes[0].price = parseFloat(req.body.price);
        if (req.body.originalPrice) variants[0].sizes[0].originalPrice = parseFloat(req.body.originalPrice);
        if (req.body.stock) variants[0].sizes[0].stock = parseInt(req.body.stock);
        
        // Recalculate discount
        if (req.body.price && req.body.originalPrice) {
          const price = parseFloat(req.body.price);
          const originalPrice = parseFloat(req.body.originalPrice);
          variants[0].sizes[0].discount = Math.round(((originalPrice - price) / originalPrice) * 100);
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
        if (product.filterValues) {
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