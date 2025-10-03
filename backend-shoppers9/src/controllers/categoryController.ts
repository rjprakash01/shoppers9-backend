import { Request, Response } from 'express';
import { Category } from '../models/Category';
import { ApiResponse } from '../types';

/**
 * Get all categories with optional filtering
 */
export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      level, 
      isActive, 
      parentCategory 
    } = req.query;

    const filter: any = {};
    
    if (level) filter.level = parseInt(level as string);
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (parentCategory) filter.parentCategory = parentCategory;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const categories = await Category.find(filter)
      .populate('parentCategory', 'name slug level')
      .sort({ level: 1, sortOrder: 1, name: 1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await Category.countDocuments(filter);

    const response: ApiResponse = {
      success: true,
      message: 'Categories retrieved successfully',
      data: {
        categories,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get category tree structure (hierarchical)
 */
export const getCategoryTree = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get all active categories
    const categories = await Category.find({ isActive: true })
      .populate('parentCategory', 'name slug level')
      .sort({ level: 1, sortOrder: 1, name: 1 })
      .lean();

    // Build hierarchical structure
    const categoryMap = new Map();
    const rootCategories: any[] = [];

    // First pass: create map of all categories
    categories.forEach(category => {
      categoryMap.set(category._id.toString(), {
        ...category,
        id: category._id.toString(),
        children: []
      });
    });

    // Second pass: build hierarchy
    categories.forEach(category => {
      const categoryWithChildren = categoryMap.get(category._id.toString());
      
      if (category.parentCategory) {
        const parentId = typeof category.parentCategory === 'object' 
          ? (category.parentCategory as any)._id.toString()
          : (category.parentCategory as string).toString();
        
        const parent = categoryMap.get(parentId);
        if (parent) {
          parent.children.push(categoryWithChildren);
        }
      } else {
        rootCategories.push(categoryWithChildren);
      }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Category tree retrieved successfully',
      data: rootCategories
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching category tree:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category tree',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get single category by ID
 */
export const getCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const category = await Category.findById(id)
      .populate('parentCategory', 'name slug level');

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found'
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Category retrieved successfully',
      data: category
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get categories by level
 */
export const getCategoriesByLevel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { level } = req.params;
    const { parentCategory, isActive = 'true' } = req.query;

    const filter: any = {
      level: parseInt(level),
      isActive: isActive === 'true'
    };

    if (parentCategory) {
      filter.parentCategory = parentCategory;
    }

    const categories = await Category.find(filter)
      .populate('parentCategory', 'name slug level')
      .sort({ sortOrder: 1, name: 1 });

    const response: ApiResponse = {
      success: true,
      message: `Level ${level} categories retrieved successfully`,
      data: categories
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching categories by level:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories by level',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get category path (breadcrumb)
 */
export const getCategoryPath = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const path: any[] = [];
    
    let currentCategory = await Category.findById(id).populate('parentCategory');
    
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
          : (currentCategory.parentCategory as any)._id.toString();
        currentCategory = await Category.findById(parentId).populate('parentCategory');
      } else {
        currentCategory = null;
      }
    }

    const response: ApiResponse = {
      success: true,
      message: 'Category path retrieved successfully',
      data: path
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching category path:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category path',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Create new category
 */
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const categoryData = req.body;
    
    // Check if slug already exists
    if (categoryData.slug) {
      const existingCategory = await Category.findOne({ slug: categoryData.slug });
      if (existingCategory) {
        res.status(400).json({
          success: false,
          message: 'Category with this slug already exists'
        });
        return;
      }
    }

    const category = new Category(categoryData);
    await category.save();

    const response: ApiResponse = {
      success: true,
      message: 'Category created successfully',
      data: category
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update category
 */
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if slug already exists (excluding current category)
    if (updateData.slug) {
      const existingCategory = await Category.findOne({ 
        slug: updateData.slug, 
        _id: { $ne: id } 
      });
      if (existingCategory) {
        res.status(400).json({
          success: false,
          message: 'Category with this slug already exists'
        });
        return;
      }
    }

    const category = await Category.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('parentCategory', 'name slug level');

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found'
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Category updated successfully',
      data: category
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Delete category
 */
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if category has children
    const childCategories = await Category.find({ parentCategory: id });
    if (childCategories.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete category with subcategories. Please delete subcategories first.'
      });
      return;
    }

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found'
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Category deleted successfully',
      data: { id }
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Toggle category status
 */
export const toggleCategoryStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found'
      });
      return;
    }

    category.isActive = !category.isActive;
    await category.save();

    const response: ApiResponse = {
      success: true,
      message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
      data: category
    };

    res.json(response);
  } catch (error) {
    console.error('Error toggling category status:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling category status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};