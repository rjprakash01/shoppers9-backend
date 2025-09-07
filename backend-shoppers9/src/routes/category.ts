import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { Category } from '../models/Category';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * @route GET /categories/tree
 * @desc Get category tree structure
 * @access Public
 */
router.get('/tree', asyncHandler(async (req, res) => {
  // Only get level 1 categories (those without a parent)
  const categories = await Category.find({ 
    isActive: true,
    level: 1  // Filter for level 1 categories only
  })
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
  // Check if database is connected
  if (mongoose.connection.readyState !== 1) {
    // Return mock data when database is not connected
    const mockCategories = [
      {
        _id: '507f1f77bcf86cd799439011',
        name: 'Men',
        slug: 'men',
        description: 'Men\'s fashion and accessories',
        isActive: true,
        sortOrder: 1
      },
      {
        _id: '507f1f77bcf86cd799439012',
        name: 'Women',
        slug: 'women',
        description: 'Women\'s fashion and accessories',
        isActive: true,
        sortOrder: 2
      },
      {
        _id: '507f1f77bcf86cd799439013',
        name: 'Household',
        slug: 'household',
        description: 'Home and household essentials',
        isActive: true,
        sortOrder: 3
      }
    ];
    
    return res.json({
      success: true,
      data: {
        categories: mockCategories
      }
    });
  }

  const categories = await Category.find({ 
    isActive: true,
    level: 1  // Filter for level 1 categories only
  }).sort({ sortOrder: 1, name: 1 });

  return res.json({
    success: true,
    data: {
      categories
    }
  });
}));

export default router;