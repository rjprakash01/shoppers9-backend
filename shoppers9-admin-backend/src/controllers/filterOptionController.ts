import { Request, Response } from 'express';
import FilterOption from '../models/FilterOption';
import Filter from '../models/Filter';
import ProductFilterValue from '../models/ProductFilterValue';
import { AuthRequest } from '../types';

// @desc    Get filter options by filter ID
// @route   GET /api/admin/filters/:filterId/options
// @access  Private
export const getFilterOptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { filterId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const status = req.query.status as string;

    // Check if filter exists
    const filter = await Filter.findById(filterId);
    if (!filter) {
      res.status(404).json({
        success: false,
        message: 'Filter not found'
      });
      return;
    }

    const query: any = { filter: filterId };

    if (search) {
      query.$or = [
        { value: { $regex: search, $options: 'i' } },
        { displayValue: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.isActive = status === 'active';
    }

    const skip = (page - 1) * limit;

    const options = await FilterOption.find(query)
      .sort({ sortOrder: 1, displayValue: 1 })
      .skip(skip)
      .limit(limit)
      .populate('filter', 'name displayName')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    const total = await FilterOption.countDocuments(query);
    
    console.log(`Filter options query for filter ${filterId}:`, query);
    console.log(`Found ${options.length} options, total: ${total}`);
    console.log('Options:', options);

    res.json({
      success: true,
      data: {
        filter,
        options,
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
      message: 'Error fetching filter options',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// @desc    Get filter option by ID
// @route   GET /api/admin/filter-options/:id
// @access  Private
export const getFilterOptionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const option = await FilterOption.findById(req.params.id)
      .populate('filter', 'name displayName')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    if (!option) {
      res.status(404).json({
        success: false,
        message: 'Filter option not found'
      });
      return;
    }

    res.json({
      success: true,
      data: option
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching filter option',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// @desc    Create new filter option
// @route   POST /api/admin/filters/:filterId/options
// @access  Private
export const createFilterOption = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get filter ID from params or body (for different route patterns)
    const filterId = req.params.filterId || req.body.filter;
    const { value, displayValue, colorCode, sortOrder } = req.body;

    // Check if filter exists
    const filter = await Filter.findById(filterId);
    if (!filter) {
      res.status(404).json({
        success: false,
        message: 'Filter not found'
      });
      return;
    }

    // Check if option with same value already exists for this filter
    const existingOption = await FilterOption.findOne({ filter: filterId, value });
    if (existingOption) {
      res.status(400).json({
        success: false,
        message: 'Filter option with this value already exists'
      });
      return;
    }

    const option = new FilterOption({
      filter: filterId,
      value,
      displayValue,
      colorCode,
      sortOrder,
      ...(req.admin?._id && { createdBy: req.admin._id })
    });

    await option.save();
    await option.populate('filter', 'name displayName');

    res.status(201).json({
      success: true,
      message: 'Filter option created successfully',
      data: option
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating filter option',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// @desc    Update filter option
// @route   PUT /api/admin/filter-options/:id
// @access  Private
export const updateFilterOption = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { value, displayValue, colorCode, sortOrder, isActive } = req.body;

    const option = await FilterOption.findById(req.params.id);
    if (!option) {
      res.status(404).json({
        success: false,
        message: 'Filter option not found'
      });
      return;
    }

    // Check if another option with same value exists for the same filter
    if (value && value !== option.value) {
      const existingOption = await FilterOption.findOne({ 
        filter: option.filter, 
        value, 
        _id: { $ne: req.params.id } 
      });
      if (existingOption) {
        res.status(400).json({
          success: false,
          message: 'Filter option with this value already exists'
        });
        return;
      }
    }

    // Update fields
    if (value) option.value = value;
    if (displayValue) option.displayValue = displayValue;
    if (colorCode !== undefined) option.colorCode = colorCode;
    if (sortOrder !== undefined) option.sortOrder = sortOrder;
    if (isActive !== undefined) option.isActive = isActive;
    if (req.admin?._id) option.updatedBy = req.admin._id;

    await option.save();
    await option.populate('filter', 'name displayName');

    res.json({
      success: true,
      message: 'Filter option updated successfully',
      data: option
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating filter option',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// @desc    Delete filter option
// @route   DELETE /api/admin/filter-options/:id
// @access  Private
export const deleteFilterOption = async (req: Request, res: Response): Promise<void> => {
  try {
    const option = await FilterOption.findById(req.params.id);
    if (!option) {
      res.status(404).json({
        success: false,
        message: 'Filter option not found'
      });
      return;
    }

    // Check if option is being used in any product
    const productFilterValues = await ProductFilterValue.find({ filterOption: req.params.id });
    if (productFilterValues.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete filter option as it is being used in products'
      });
      return;
    }

    await FilterOption.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Filter option deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting filter option',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// @desc    Toggle filter option status
// @route   PUT /api/admin/filter-options/:id/toggle-status
// @access  Private
export const toggleFilterOptionStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const option = await FilterOption.findById(req.params.id);
    if (!option) {
      res.status(404).json({
        success: false,
        message: 'Filter option not found'
      });
      return;
    }

    option.isActive = !option.isActive;
    if (req.admin?._id) option.updatedBy = req.admin._id;
    await option.save();

    res.json({
      success: true,
      message: `Filter option ${option.isActive ? 'activated' : 'deactivated'} successfully`,
      data: option
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling filter option status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// @desc    Bulk create filter options
// @route   POST /api/admin/filters/:filterId/options/bulk
// @access  Private
export const bulkCreateFilterOptions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { filterId } = req.params;
    const { options } = req.body;

    if (!Array.isArray(options) || options.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Options array is required and must not be empty'
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

    // Prepare options for bulk insert
    const optionsToCreate = options.map((option: any, index: number) => ({
      filter: filterId,
      value: option.value,
      displayValue: option.displayValue || option.value,
      colorCode: option.colorCode || null,
      sortOrder: option.sortOrder || index,
      ...(req.admin?._id && { createdBy: req.admin._id })
    }));

    // Check for duplicate values
    const values = optionsToCreate.map(opt => opt.value);
    const duplicateValues = values.filter((value, index) => values.indexOf(value) !== index);
    if (duplicateValues.length > 0) {
      res.status(400).json({
        success: false,
        message: `Duplicate values found: ${duplicateValues.join(', ')}`
      });
      return;
    }

    // Check for existing values in database
    const existingOptions = await FilterOption.find({ 
      filter: filterId, 
      value: { $in: values } 
    });
    if (existingOptions.length > 0) {
      const existingValues = existingOptions.map(opt => opt.value);
      res.status(400).json({
        success: false,
        message: `Options with these values already exist: ${existingValues.join(', ')}`
      });
      return;
    }

    const createdOptions = await FilterOption.insertMany(optionsToCreate);

    res.status(201).json({
      success: true,
      message: `${createdOptions.length} filter options created successfully`,
      data: createdOptions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating filter options',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};