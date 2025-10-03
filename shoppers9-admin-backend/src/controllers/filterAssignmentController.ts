import { Request, Response } from 'express';
import mongoose from 'mongoose';
import FilterAssignment from '../models/FilterAssignment';
import Filter from '../models/Filter';
import FilterOption from '../models/FilterOption';
import Category from '../models/Category';
import { AuthRequest } from '../types';

// @desc    Get filter assignments for a category
// @route   GET /api/admin/categories/:categoryId/filter-assignments
// @access  Private
export const getFilterAssignments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as string;

    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found'
      });
      return;
    }

    const query: any = { category: categoryId };

    if (status) {
      query.isActive = status === 'active';
    }

    const skip = (page - 1) * limit;

    const assignments = await FilterAssignment.find(query)
      .sort({ sortOrder: 1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'filter',
        select: 'name displayName type dataType description isActive'
      })
      .populate({
        path: 'parentAssignment',
        select: 'filter category categoryLevel',
        populate: {
          path: 'filter',
          select: 'name displayName'
        }
      })
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    // Manually populate filter options for each assignment
    const assignmentsWithOptions = await Promise.all(
      assignments.map(async (assignment: any) => {
        const options = await FilterOption.find({ 
          filter: assignment.filter._id, 
          isActive: true 
        }).sort({ sortOrder: 1, displayValue: 1 });
        
        const assignmentObj = assignment.toObject();
        assignmentObj.filter.options = options;
        
        return assignmentObj;
      })
    );

    const total = await FilterAssignment.countDocuments(query);

    res.json({
      success: true,
      data: {
        category,
        assignments: assignmentsWithOptions,
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
      message: 'Error fetching filter assignments',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// @desc    Get available filters for assignment to a category
// @route   GET /api/admin/categories/:categoryId/available-filters
// @access  Private
export const getAvailableFilters = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const search = req.query.search as string;
    
    console.log('🎯 getAvailableFilters called with categoryId:', categoryId);
    console.log('🎯 Search parameter:', search);

    // Check if category exists
    const category = await Category.findById(categoryId);
    console.log('🎯 Category found:', category ? `${category.name} (level ${category.level})` : 'null');
    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found'
      });
      return;
    }

    let availableFilters: any[] = [];

    if (category.level === 1) {
      // Level 1 (Category): Can assign any global filter
      console.log('🔍 Debug - Category ID:', categoryId, 'Type:', typeof categoryId);
      console.log('🔍 Debug - Category._id:', category._id, 'Type:', typeof category._id);
      
      const assignedFilterIds = await FilterAssignment.find({ category: categoryId })
        .distinct('filter');
      
      console.log('🔍 Debug - Assigned filter IDs:', assignedFilterIds);

      const query: any = {
        _id: { $nin: assignedFilterIds },
        isActive: true
      };
      
      console.log('🔍 Debug - Query for available filters:', JSON.stringify(query, null, 2));

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { displayName: { $regex: search, $options: 'i' } }
        ];
      }

      availableFilters = await Filter.find(query)
        .sort({ name: 1 })
        .select('name displayName type dataType description');
    } else {
      // Level 2 & 3: Can only assign filters from parent category
      const parentCategory = await Category.findById(category.parentCategory);
      if (!parentCategory) {
        res.status(400).json({
          success: false,
          message: 'Parent category not found'
        });
        return;
      }

      // Get filters assigned to parent category
      const parentAssignments = await FilterAssignment.find({
        category: parentCategory._id,
        isActive: true
      }).populate('filter', 'name displayName type dataType description isActive');

      // Get already assigned filters for current category
      const assignedFilterIds = await FilterAssignment.find({ category: categoryId })
        .distinct('filter');

      // Filter out already assigned filters
      availableFilters = parentAssignments
        .filter(assignment => 
          !assignedFilterIds.some(id => id.toString() === assignment.filter._id.toString()) &&
          (assignment.filter as any).isActive
        )
        .map(assignment => assignment.filter);

      // Apply search filter if provided
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        availableFilters = availableFilters.filter(filter => 
          searchRegex.test(filter.name) || searchRegex.test(filter.displayName)
        );
      }
    }

    res.json({
      success: true,
      data: {
        category,
        availableFilters
      }
    });
  } catch (error) {
    console.error('❌ Error in getAvailableFilters:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available filters',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// @desc    Assign filter to category
// @route   POST /api/admin/categories/:categoryId/filter-assignments
// @access  Private
export const assignFilter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const { filterId, isRequired, sortOrder } = req.body;

    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found'
      });
      return;
    }

    // Check if filter exists
    const filter = await Filter.findById(filterId);
    if (!filter) {
      res.status(404).json({
        success: false,
        message: 'Filter not found'
      });
      return;
    }

    // Check if filter is already assigned to this category
    const existingAssignment = await FilterAssignment.findOne({
      category: categoryId,
      filter: filterId
    });
    if (existingAssignment) {
      res.status(400).json({
        success: false,
        message: 'Filter is already assigned to this category'
      });
      return;
    }

    let parentAssignment = null;

    // For level 2 and 3 categories, find parent assignment
    if (category.level > 1) {
      const parentCategory = await Category.findById(category.parentCategory);
      if (!parentCategory) {
        res.status(400).json({
          success: false,
          message: 'Parent category not found'
        });
        return;
      }

      parentAssignment = await FilterAssignment.findOne({
        category: parentCategory._id,
        filter: filterId,
        isActive: true
      });

      if (!parentAssignment) {
        res.status(400).json({
          success: false,
          message: 'Filter must be assigned to parent category first'
        });
        return;
      }
    }

    const assignment = new FilterAssignment({
      filter: filterId,
      category: categoryId,
      categoryLevel: category.level,
      parentAssignment: parentAssignment?._id,
      isRequired: isRequired || false,
      sortOrder: sortOrder || 0,
      assignedAt: new Date(),
      ...(req.admin?._id && { createdBy: req.admin._id })
    });

    await assignment.save();
    await assignment.populate([
      { path: 'filter', select: 'name displayName type dataType description' },
      { path: 'category', select: 'name displayName level' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Filter assigned successfully',
      data: assignment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning filter',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// @desc    Update filter assignment
// @route   PUT /api/admin/filter-assignments/:id
// @access  Private
export const updateFilterAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { isRequired, sortOrder, isActive } = req.body;

    const assignment = await FilterAssignment.findById(req.params.id);
    if (!assignment) {
      res.status(404).json({
        success: false,
        message: 'Filter assignment not found'
      });
      return;
    }

    // Update fields
    if (isRequired !== undefined) assignment.isRequired = isRequired;
    if (sortOrder !== undefined) assignment.sortOrder = sortOrder;
    if (isActive !== undefined) assignment.isActive = isActive;
    if (req.admin?._id) assignment.updatedBy = req.admin._id;

    await assignment.save();
    await assignment.populate([
      { path: 'filter', select: 'name displayName type dataType description' },
      { path: 'category', select: 'name displayName level' }
    ]);

    res.json({
      success: true,
      message: 'Filter assignment updated successfully',
      data: assignment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating filter assignment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// @desc    Remove filter assignment
// @route   DELETE /api/admin/filter-assignments/:id
// @access  Private
export const removeFilterAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const assignment = await FilterAssignment.findById(req.params.id);
    if (!assignment) {
      res.status(404).json({
        success: false,
        message: 'Filter assignment not found'
      });
      return;
    }

    // Check if this assignment has child assignments
    const childAssignments = await FilterAssignment.find({ parentAssignment: assignment._id });
    if (childAssignments.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot remove filter assignment as it has child assignments. Remove child assignments first.'
      });
      return;
    }

    await FilterAssignment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Filter assignment removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing filter assignment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// @desc    Bulk assign filters to category
// @route   POST /api/admin/categories/:categoryId/filter-assignments/bulk
// @access  Private
export const bulkAssignFilters = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const { filters } = req.body;

    if (!Array.isArray(filters) || filters.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Filters array is required and must not be empty'
      });
      return;
    }

    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found'
      });
      return;
    }

    // Validate all filter IDs exist
    const filterIds = filters.map((f: any) => f.filterId);
    const existingFilters = await Filter.find({ _id: { $in: filterIds } });
    if (existingFilters.length !== filterIds.length) {
      res.status(400).json({
        success: false,
        message: 'One or more filters not found'
      });
      return;
    }

    // Check for existing assignments
    const existingAssignments = await FilterAssignment.find({
      category: categoryId,
      filter: { $in: filterIds }
    });
    if (existingAssignments.length > 0) {
      const existingFilterIds = existingAssignments.map(a => a.filter.toString());
      res.status(400).json({
        success: false,
        message: `Some filters are already assigned: ${existingFilterIds.join(', ')}`
      });
      return;
    }

    // For level 2 and 3 categories, validate parent assignments
    if (category.level > 1) {
      const parentCategory = await Category.findById(category.parentCategory);
      if (!parentCategory) {
        res.status(400).json({
          success: false,
          message: 'Parent category not found'
        });
        return;
      }

      const parentAssignments = await FilterAssignment.find({
        category: parentCategory._id,
        filter: { $in: filterIds },
        isActive: true
      });

      if (parentAssignments.length !== filterIds.length) {
        res.status(400).json({
          success: false,
          message: 'All filters must be assigned to parent category first'
        });
        return;
      }
    }

    // Create assignments
    const assignmentsToCreate = await Promise.all(
      filters.map(async (filterData: any) => {
        let parentAssignment = null;
        
        if (category.level > 1) {
          const parentCategory = await Category.findById(category.parentCategory);
          parentAssignment = await FilterAssignment.findOne({
            category: parentCategory._id,
            filter: filterData.filterId,
            isActive: true
          });
        }

        return {
          filter: filterData.filterId,
          category: categoryId,
          categoryLevel: category.level,
          parentAssignment: parentAssignment?._id,
          isRequired: filterData.isRequired || false,
          sortOrder: filterData.sortOrder || 0,
          assignedAt: new Date(),
          ...(req.admin?._id && { createdBy: req.admin._id })
        };
      })
    );

    const createdAssignments = await FilterAssignment.insertMany(assignmentsToCreate);

    res.status(201).json({
      success: true,
      message: `${createdAssignments.length} filters assigned successfully`,
      data: createdAssignments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error bulk assigning filters',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// @desc    Get hierarchical filter tree for a category
// @route   GET /api/admin/categories/:categoryId/filter-tree
// @access  Private
export const getFilterTree = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;

    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found'
      });
      return;
    }

    const filterTree = await FilterAssignment.getHierarchicalFilters(new mongoose.Types.ObjectId(categoryId));

    res.json({
      success: true,
      data: {
        category,
        filterTree
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching filter tree',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};