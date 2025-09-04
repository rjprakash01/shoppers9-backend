import { Request, Response } from 'express';
import CategoryFilter from '../models/CategoryFilter';
import Category from '../models/Category';
import Filter from '../models/Filter';
import FilterOption from '../models/FilterOption';
import { AuthRequest } from '../types';

// @desc    Get filters assigned to a category
// @route   GET /api/admin/categories/:categoryId/filters
// @access  Private
export const getCategoryFilters = async (req: Request, res: Response): Promise<void> => {
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

    // Allow filters for any category level that has been tagged with filters
    // This enables dynamic filter assignment based on business needs

    const query: any = { category: categoryId };

    if (status) {
      query.isActive = status === 'active';
    }

    const skip = (page - 1) * limit;

    const categoryFilters = await CategoryFilter.find(query)
      .sort({ sortOrder: 1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'filter',
        select: 'name displayName type dataType description isActive'
      })
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    // Convert to plain objects and manually populate filter options
    const filtersWithOptions: any[] = [];
    
    for (const categoryFilter of categoryFilters) {
      const filterObj: any = categoryFilter.toObject();
      
      if (filterObj.filter && filterObj.filter._id) {
        const filterId = filterObj.filter._id;
        
        const options = await FilterOption.find({
          filter: filterId,
          isActive: true
        })
        .select('_id value displayValue colorCode sortOrder')
        .sort({ sortOrder: 1 });
        
        // Add options to the filter object
        filterObj.filter.options = options;
      }
      
      filtersWithOptions.push(filterObj);
    }

    const total = await CategoryFilter.countDocuments(query);

    res.json({
      success: true,
      data: {
        category,
        filters: filtersWithOptions,
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
      message: 'Error fetching category filters',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// @desc    Assign filter to category
// @route   POST /api/admin/categories/:categoryId/filters
// @access  Private
export const assignFilterToCategory = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Allow filters to be assigned to any category level
    // This enables dynamic filter assignment based on business needs

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
    const existingAssignment = await CategoryFilter.findOne({ 
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

    const categoryFilter = new CategoryFilter({
      category: categoryId,
      filter: filterId,
      isRequired: isRequired || false,
      sortOrder,
      ...(req.admin?._id && { createdBy: req.admin._id })
    });

    await categoryFilter.save();
    await categoryFilter.populate('filter', 'name displayName type dataType');

    res.status(201).json({
      success: true,
      message: 'Filter assigned to category successfully',
      data: categoryFilter
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning filter to category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// @desc    Update category filter assignment
// @route   PUT /api/admin/category-filters/:id
// @access  Private
export const updateCategoryFilter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { isRequired, sortOrder, isActive } = req.body;

    const categoryFilter = await CategoryFilter.findById(req.params.id);
    if (!categoryFilter) {
      res.status(404).json({
        success: false,
        message: 'Category filter assignment not found'
      });
      return;
    }

    // Update fields
    if (isRequired !== undefined) categoryFilter.isRequired = isRequired;
    if (sortOrder !== undefined) categoryFilter.sortOrder = sortOrder;
    if (isActive !== undefined) categoryFilter.isActive = isActive;
    if (req.admin?._id) categoryFilter.updatedBy = req.admin._id;

    await categoryFilter.save();
    await categoryFilter.populate('filter', 'name displayName type dataType');

    res.json({
      success: true,
      message: 'Category filter assignment updated successfully',
      data: categoryFilter
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating category filter assignment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// @desc    Remove filter from category
// @route   DELETE /api/admin/category-filters/:id
// @access  Private
export const removeCategoryFilter = async (req: Request, res: Response): Promise<void> => {
  try {
    const categoryFilter = await CategoryFilter.findById(req.params.id);
    if (!categoryFilter) {
      res.status(404).json({
        success: false,
        message: 'Category filter assignment not found'
      });
      return;
    }

    await CategoryFilter.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Filter removed from category successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing filter from category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// @desc    Bulk assign filters to category
// @route   POST /api/admin/categories/:categoryId/filters/bulk
// @access  Private
export const bulkAssignFiltersToCategory = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Allow filters to be assigned to any category level
    // This enables dynamic filter assignment based on business needs

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
    const existingAssignments = await CategoryFilter.find({ 
      category: categoryId, 
      filter: { $in: filterIds } 
    });
    if (existingAssignments.length > 0) {
      const existingFilterIds = existingAssignments.map(a => a.filter.toString());
      res.status(400).json({
        success: false,
        message: `Some filters are already assigned to this category: ${existingFilterIds.join(', ')}`
      });
      return;
    }

    // Prepare assignments for bulk insert
    const assignmentsToCreate = filters.map((filter: any, index: number) => ({
      category: categoryId,
      filter: filter.filterId,
      isRequired: filter.isRequired || false,
      sortOrder: filter.sortOrder || index,
      ...(req.admin?._id && { createdBy: req.admin._id })
    }));

    const createdAssignments = await CategoryFilter.insertMany(assignmentsToCreate);

    res.status(201).json({
      success: true,
      message: `${createdAssignments.length} filters assigned to category successfully`,
      data: createdAssignments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error bulk assigning filters to category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// @desc    Get available filters for category (not yet assigned)
// @route   GET /api/admin/categories/:categoryId/available-filters
// @access  Private
export const getAvailableFiltersForCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const search = req.query.search as string;

    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found'
      });
      return;
    }

    // Allow filters to be assigned to any category level
    // This enables dynamic filter assignment based on business needs

    // Get already assigned filter IDs
    const assignedFilters = await CategoryFilter.find({ category: categoryId });
    const assignedFilterIds = assignedFilters.map(af => af.filter);

    // Build query for available filters
    const query: any = {
      _id: { $nin: assignedFilterIds },
      isActive: true,
      categoryLevels: { $in: [category.level] } // Only show filters that apply to this category level
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } }
      ];
    }

    const availableFilters = await Filter.find(query)
      .sort({ name: 1 })
      .select('name displayName type dataType description');

    res.json({
      success: true,
      data: {
        category,
        availableFilters
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching available filters',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};