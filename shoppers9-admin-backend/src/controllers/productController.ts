import { Request, Response } from 'express';
import Product from '../models/Product';
import { AuthRequest } from '../types';

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const category = req.query.category as string;
    const status = req.query.status as string;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (status) {
      query.isActive = status === 'active';
    }

    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(query)
      .populate('category', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
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

export const getProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    return res.json({
      success: true,
      data: product
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
    
    // Handle uploaded images
    let images: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      // Check if files are in products subdirectory or main uploads directory
      images = req.files.map(file => {
        if (file.path.includes('/products/')) {
          return `/uploads/products/${file.filename}`;
        } else {
          return `/uploads/${file.filename}`;
        }
      });
    } else if (req.body.images) {
      // Fallback to URL-based images if provided
      images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }
    
    console.log('Processed images:', images);
    
    // Convert string values to appropriate types
    const productData = {
      ...req.body,
      price: parseFloat(req.body.price),
      originalPrice: parseFloat(req.body.originalPrice),
      stock: parseInt(req.body.stock),
      isActive: req.body.isActive === 'true',
      isFeatured: req.body.isFeatured === 'true',
      specifications: req.body.specifications ? JSON.parse(req.body.specifications) : {},
      createdBy: req.admin?.id,
      images
    };

    console.log('Final product data:', productData);
    
    const product = await Product.create(productData);
    console.log('Product created successfully:', product._id);
    
    await product.populate('category', 'name');
    
    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
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

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    console.log('Updating product with data:', req.body);
    console.log('Uploaded files:', req.files);
    
    // Handle uploaded images
    let updateData: any = {
      ...req.body,
      updatedBy: req.admin?.id
    };
    
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      // If new files are uploaded, replace the images array
      updateData.images = req.files.map(file => `/uploads/products/${file.filename}`);
    }
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    return res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Error updating product',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    return res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const toggleProductStatus = async (req: Request, res: Response) => {
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

export const bulkUpdateProducts = async (req: Request, res: Response) => {
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

export const getProductAnalytics = async (req: Request, res: Response) => {
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