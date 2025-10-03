import { Request, Response } from 'express';
import Category from '../models/Category';
import Product from '../models/Product';
import { getUserModel } from '../models/User';
import { AuthRequest } from '../types';
import { autoAssignFiltersToCategory } from '../utils/categoryFilterAssignment';
import { DualWriteService } from '../services/dualWriteService';
import { categorySchema } from '../models/Category';

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const sortBy = req.query.sortBy as string || 'sortOrder';
    const sortOrder = req.query.sortOrder as string || 'asc';

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.isActive = status === 'active';
    }

    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const categories = await Category.find(query)
      .populate('parentCategory', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // Get product count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.countDocuments({ category: category._id });
        return {
          ...category.toJSON(),
          productCount
        };
      })
    );

    const total = await Category.countDocuments(query);

    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: {
        categories: categoriesWithCount,
        pagination: {
          currentPage: page,
          totalPages,
          totalCategories: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parentCategory', 'name');

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found'
      });
      return;
    }

    // Get product count
    const productCount = await Product.countDocuments({ category: category._id });

    res.json({
      success: true,
      data: {
        ...category.toJSON(),
        productCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {

    // Handle parentCategory - extract ID if it's an object
    let parentCategoryId = null;
    if (req.body.parentCategory) {
      if (typeof req.body.parentCategory === 'object' && req.body.parentCategory.id) {
        parentCategoryId = req.body.parentCategory.id;
      } else if (typeof req.body.parentCategory === 'string' && req.body.parentCategory !== '') {
        parentCategoryId = req.body.parentCategory;
      }
    }
    
    // Determine level based on parent
    let level = 1; // Default to level 1 (top-level category)
    if (parentCategoryId) {
      const parentCategory = await Category.findById(parentCategoryId);
      if (!parentCategory) {
        res.status(400).json({
          success: false,
          message: 'Parent category not found'
        });
        return;
      }
      level = parentCategory.level + 1; // Child level is parent level + 1
      
      // Validate maximum depth (3 levels)
      if (level > 3) {
        res.status(400).json({
          success: false,
          message: 'Maximum category depth (3 levels) exceeded'
        });
        return;
      }
    }
    
    const categoryData = {
      ...req.body,
      createdBy: req.admin?.id,
      parentCategory: parentCategoryId,
      level: level,
      // Add image URL if file was uploaded
      image: req.file ? `/uploads/categories/${req.file.filename}` : req.body.image || ''
    };
    
    // Remove slug from categoryData to let the pre-save hook generate it
    delete categoryData.slug;

    const category = await Category.create(categoryData);
    await category.populate('parentCategory', 'name level');
    
    // Use dual-write service to sync with main website database
    try {
      await DualWriteService.create('Category', category.toObject(), categorySchema);
      console.log('✅ Category synced to main website database');
    } catch (syncError) {
      console.error('⚠️ Failed to sync category to main website database:', syncError);
      // Don't fail the operation if sync fails
    }

    // Auto-assign appropriate filters to the new category
    try {
      await autoAssignFiltersToCategory(category._id.toString(), req.admin?.id);
      
    } catch (filterError) {
      // Don't fail the category creation if filter assignment fails
    }

    res.status(201).json({
      success: true,
      message: 'Category created successfully with auto-assigned filters',
      data: category
    });
  } catch (error) {

    if (error instanceof Error && error.message.includes('duplicate key')) {
      res.status(400).json({
        success: false,
        message: 'Category name already exists at this level'
      });
      return;
    }
    
    res.status(400).json({
      success: false,
      message: 'Error creating category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {

    // Handle parentCategory - extract ID if it's an object
    let parentCategoryId = null;
    if (req.body.parentCategory) {
      if (typeof req.body.parentCategory === 'object' && req.body.parentCategory.id) {
        parentCategoryId = req.body.parentCategory.id;
      } else if (typeof req.body.parentCategory === 'string' && req.body.parentCategory !== '') {
        parentCategoryId = req.body.parentCategory;
      }
    }
    
    // Determine level based on parent
    let level = 1; // Default to level 1 (top-level category)
    if (parentCategoryId) {
      const parentCategory = await Category.findById(parentCategoryId);
      if (!parentCategory) {
        res.status(400).json({
          success: false,
          message: 'Parent category not found'
        });
        return;
      }
      level = parentCategory.level + 1; // Child level is parent level + 1
      
      // Validate maximum depth (3 levels)
      if (level > 3) {
        res.status(400).json({
          success: false,
          message: 'Maximum category depth (3 levels) exceeded'
        });
        return;
      }
      
      // Check for circular reference (category can't be its own parent or descendant)
      const categoryId = req.params.id;
      if (parentCategoryId === categoryId) {
        res.status(400).json({
          success: false,
          message: 'Category cannot be its own parent'
        });
        return;
      }
    }
    
    const updateData = {
      ...req.body,
      updatedBy: req.admin?.id,
      parentCategory: parentCategoryId,
      level: level,
      // Add image URL if file was uploaded, otherwise keep existing or use provided URL
      ...(req.file && { image: `/uploads/categories/${req.file.filename}` })
    };

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('parentCategory', 'name');

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found'
      });
      return;
    }
    
    // Use dual-write service to sync with main website database
    try {
      await DualWriteService.update('Category', { _id: req.params.id }, updateData, categorySchema);
      console.log('✅ Category update synced to main website database');
    } catch (syncError) {
      console.error('⚠️ Failed to sync category update to main website database:', syncError);
      // Don't fail the operation if sync fails
    }

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('duplicate key')) {
      res.status(400).json({
        success: false,
        message: 'Category name already exists'
      });
      return;
    }
    
    res.status(400).json({
      success: false,
      message: 'Error updating category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if category has products
    const productCount = await Product.countDocuments({ category: req.params.id });
    
    if (productCount > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${productCount} products associated with it.`
      });
      return;
    }

    // Check if category has subcategories
    const subcategoryCount = await Category.countDocuments({ parentCategory: req.params.id });
    
    if (subcategoryCount > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${subcategoryCount} subcategories.`
      });
      return;
    }

    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found'
      });
      return;
    }
    
    // Use dual-write service to sync with main website database
    try {
      await DualWriteService.delete('Category', { _id: req.params.id }, categorySchema);
      console.log('✅ Category deletion synced to main website database');
    } catch (syncError) {
      console.error('⚠️ Failed to sync category deletion to main website database:', syncError);
      // Don't fail the operation if sync fails
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const toggleCategoryStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found'
      });
      return;
    }

    category.isActive = !category.isActive;
    await category.save();

    res.json({
      success: true,
      message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating category status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getCategoryAnalytics = async (req: Request, res: Response) => {
  try {
    const totalCategories = await Category.countDocuments();
    const activeCategories = await Category.countDocuments({ isActive: true });
    const inactiveCategories = await Category.countDocuments({ isActive: false });
    const parentCategories = await Category.countDocuments({ parentCategory: null });
    const subcategories = await Category.countDocuments({ parentCategory: { $ne: null } });

    // Categories with product counts
    const categoryStats = await Category.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'category',
          as: 'products'
        }
      },
      {
        $project: {
          name: 1,
          isActive: 1,
          productCount: { $size: '$products' },
          totalValue: {
            $sum: {
              $map: {
                input: '$products',
                as: 'product',
                in: { $multiply: ['$$product.price', '$$product.stock'] }
              }
            }
          }
        }
      },
      { $sort: { productCount: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalCategories,
          activeCategories,
          inactiveCategories,
          parentCategories,
          subcategories
        },
        categoryStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const bulkUpdateCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { categoryIds, updateData } = req.body;

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Category IDs are required'
      });
      return;
    }

    const result = await Category.updateMany(
      { _id: { $in: categoryIds } },
      { 
        ...updateData,
        updatedBy: req.admin?.id
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} categories updated successfully`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating categories',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get categories by level
export const getCategoriesByLevel = async (req: Request, res: Response): Promise<void> => {
  try {
    const level = parseInt(req.params.level as string);
    const parentId = req.query.parentId as string;
    
    if (![1, 2, 3].includes(level)) {
      res.status(400).json({
        success: false,
        message: 'Invalid level. Must be 1, 2, or 3'
      });
      return;
    }

    const query: any = { level, isActive: true };
    
    if (level > 1 && parentId) {
      query.parentCategory = parentId;
    } else if (level === 1) {
      query.parentCategory = null;
    }

    const categories = await Category.find(query)
      .populate('parentCategory', 'name level')
      .sort({ sortOrder: 1, name: 1 });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories by level',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get category tree (hierarchical structure)
export const getCategoryTree = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get user role from authenticated request
    const userRole = req.admin?.primaryRole;
    
    // Build category filter based on user role
    let categoryFilter: any = { isActive: true };
    
    // For admin and sub_admin roles, only show categories created by super_admin
    if (userRole === 'admin' || userRole === 'sub_admin') {
      // Find super_admin users to filter categories by their createdBy field
      const User = getUserModel();
      const superAdmins = await User.find({ primaryRole: 'super_admin' }).select('_id');
      const superAdminIds = superAdmins.map(admin => admin._id);
      
      categoryFilter.createdBy = { $in: superAdminIds };
    }
    // super_admin can see all categories (no additional filter needed)
    
    // Fetch categories with role-based filtering
    const categories = await Category.find(categoryFilter)
      .populate('parentCategory', 'name level')
      .populate('createdBy', 'firstName lastName primaryRole')
      .sort({ level: 1, sortOrder: 1, name: 1 });

    // Build hierarchical tree
    const categoryMap = new Map();
    const tree: any[] = [];

    // First pass: create all category objects
    categories.forEach(category => {
      categoryMap.set(category._id.toString(), {
        ...category.toJSON(),
        children: []
      });
    });

    // Second pass: build the tree structure
    categories.forEach(category => {
      const categoryObj = categoryMap.get(category._id.toString());
      
      if (category.parentCategory) {
        const parentId = typeof category.parentCategory === 'string' 
          ? category.parentCategory 
          : (category.parentCategory as any)._id;
        const parent = categoryMap.get(parentId.toString());
        if (parent) {
          parent.children.push(categoryObj);
        }
      } else {
        tree.push(categoryObj);
      }
    });

    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category tree',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get category path (breadcrumb)
export const getCategoryPath = async (req: Request, res: Response): Promise<void> => {
  try {
    const categoryId = req.params.id;
    const path: any[] = [];
    
    let currentCategory = await Category.findById(categoryId).populate('parentCategory');
    
    while (currentCategory) {
      path.unshift({
        id: currentCategory._id,
        name: currentCategory.name,
        level: currentCategory.level,
        slug: currentCategory.slug
      });
      
      if (currentCategory.parentCategory) {
        const parentId = typeof currentCategory.parentCategory === 'string' 
          ? currentCategory.parentCategory 
          : (currentCategory.parentCategory as any)._id;
        currentCategory = await Category.findById(parentId).populate('parentCategory');
      } else {
        currentCategory = null;
      }
    }

    res.json({
      success: true,
      data: path
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category path',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};