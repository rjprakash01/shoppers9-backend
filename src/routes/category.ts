import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { Category } from '../models/Category';

const router = express.Router();

/**
 * @route GET /categories/tree
 * @desc Get category tree structure
 * @access Public
 */
router.get('/tree', asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 });

  // Build hierarchical tree structure
  const categoryMap = new Map();
  const tree: any[] = [];

  // First pass: create all category objects
  categories.forEach(category => {
    const categoryJson = category.toJSON();
    categoryMap.set(category._id.toString(), {
      ...categoryJson,
      children: []
    });
  });

  // Second pass: build the tree structure
  categories.forEach(category => {
    const categoryObj = categoryMap.get(category._id.toString());
    
    if (category.parentCategory) {
      const parentId = category.parentCategory.toString();
      const parent = categoryMap.get(parentId);
      if (parent) {
        parent.children.push(categoryObj);
      }
    } else {
      tree.push(categoryObj);
    }
  });

  res.json({
    success: true,
    data: {
      categories: tree
    }
  });
}));

/**
 * @route GET /categories
 * @desc Get all categories (flat list)
 * @access Public
 */
router.get('/', asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 });

  res.json({
    success: true,
    data: {
      categories
    }
  });
}));

export default router;