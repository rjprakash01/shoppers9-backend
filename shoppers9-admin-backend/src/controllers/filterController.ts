import { Request, Response } from 'express';
import Filter from '../models/Filter';
import FilterOption from '../models/FilterOption';
import CategoryFilter from '../models/CategoryFilter';
import { AuthRequest } from '../types';

// @desc    Get all filters
// @route   GET /api/admin/filters
// @access  Private
export const getAllFilters = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.isActive = status === 'active';
    }

    const skip = (page - 1) * limit;

    const filters = await Filter.find(query)
      .sort({ sortOrder: 1, name: 1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .populate('categories', 'name displayName level');

    // Populate options for each filter
    const filtersWithOptions = await Promise.all(
      filters.map(async (filter) => {
        const options = await FilterOption.find({ 
          filter: filter._id, 
          isActive: true 
        }).sort({ sortOrder: 1, displayValue: 1 });
        
        return {
          ...filter.toObject(),
          options
        };
      })
    );

    const total = await Filter.countDocuments(query);

    res.json({
      success: true,
      data: {
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
      message: 'Error fetching filters',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// @desc    Get filter by ID
// @route   GET /api/admin/filters/:id
// @access  Private
export const getFilterById = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter = await Filter.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .populate('categories', 'name displayName level');

    if (!filter) {
      res.status(404).json({
        success: false,
        message: 'Filter not found'
      });
      return;
    }

    // Get filter options
    const options = await FilterOption.find({ filter: filter._id, isActive: true })
      .sort({ sortOrder: 1, displayValue: 1 });

    res.json({
      success: true,
      data: {
        filter,
        options
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching filter',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// @desc    Create new filter
// @route   POST /api/admin/filters
// @access  Private
export const createFilter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, displayName, type, dataType, description, categoryLevels, categories, sortOrder } = req.body;

    // Check if filter with same name already exists
    const existingFilter = await Filter.findOne({ name });
    if (existingFilter) {
      res.status(400).json({
        success: false,
        message: 'Filter with this name already exists'
      });
      return;
    }

    const filter = new Filter({
      name,
      displayName,
      type,
      dataType,
      description,
      categoryLevels: categoryLevels || [2, 3],
      categories: categories || [],
      sortOrder,
      ...(req.admin?._id && { createdBy: req.admin._id })
    });

    await filter.save();

    res.status(201).json({
      success: true,
      message: 'Filter created successfully',
      data: filter
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating filter',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// @desc    Update filter
// @route   PUT /api/admin/filters/:id
// @access  Private
export const updateFilter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, displayName, type, dataType, description, categoryLevels, categories, sortOrder, isActive } = req.body;

    const filter = await Filter.findById(req.params.id);
    if (!filter) {
      res.status(404).json({
        success: false,
        message: 'Filter not found'
      });
      return;
    }

    // Check if another filter with same name exists
    if (name && name !== filter.name) {
      const existingFilter = await Filter.findOne({ name, _id: { $ne: req.params.id } });
      if (existingFilter) {
        res.status(400).json({
          success: false,
          message: 'Filter with this name already exists'
        });
        return;
      }
    }

    // Update fields
    if (name) filter.name = name;
    if (displayName) filter.displayName = displayName;
    if (type) filter.type = type;
    if (dataType) filter.dataType = dataType;
    if (description !== undefined) filter.description = description;
    if (categoryLevels !== undefined) filter.categoryLevels = categoryLevels;
    if (categories !== undefined) filter.categories = categories;
    if (sortOrder !== undefined) filter.sortOrder = sortOrder;
    if (isActive !== undefined) filter.isActive = isActive;
    if (req.admin?._id) filter.updatedBy = req.admin._id;

    await filter.save();

    res.json({
      success: true,
      message: 'Filter updated successfully',
      data: filter
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating filter',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// @desc    Delete filter
// @route   DELETE /api/admin/filters/:id
// @access  Private
export const deleteFilter = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter = await Filter.findById(req.params.id);
    if (!filter) {
      res.status(404).json({
        success: false,
        message: 'Filter not found'
      });
      return;
    }

    // Check if filter is being used in any category
    const categoryFilters = await CategoryFilter.find({ filter: req.params.id });
    if (categoryFilters.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete filter as it is being used in categories'
      });
      return;
    }

    // Delete associated filter options
    await FilterOption.deleteMany({ filter: req.params.id });
    
    // Delete the filter
    await Filter.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Filter deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting filter',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// @desc    Toggle filter status
// @route   PUT /api/admin/filters/:id/toggle-status
// @access  Private
export const toggleFilterStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter = await Filter.findById(req.params.id);
    if (!filter) {
      res.status(404).json({
        success: false,
        message: 'Filter not found'
      });
      return;
    }

    filter.isActive = !filter.isActive;
    if (req.admin?._id) filter.updatedBy = req.admin._id;
    await filter.save();

    res.json({
      success: true,
      message: `Filter ${filter.isActive ? 'activated' : 'deactivated'} successfully`,
      data: filter
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling filter status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};