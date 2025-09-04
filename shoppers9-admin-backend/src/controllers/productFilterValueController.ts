import { Request, Response } from 'express';
import ProductFilterValue from '../models/ProductFilterValue';
import Product from '../models/Product';
import Filter from '../models/Filter';
import FilterOption from '../models/FilterOption';
import CategoryFilter from '../models/CategoryFilter';
import { AuthRequest } from '../types';

// @desc    Get filter values for a product
// @route   GET /api/admin/products/:productId/filter-values
// @access  Private
export const getProductFilterValues = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;

    // Check if product exists
    const product = await Product.findById(productId).populate('subCategory');
    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found'
      });
      return;
    }

    const filterValues = await ProductFilterValue.find({ product: productId })
      .populate({
        path: 'filter',
        select: 'name displayName type dataType description'
      })
      .populate({
        path: 'filterOption',
        select: 'value displayValue colorCode'
      })
      .sort({ 'filter.name': 1 });

    res.json({
      success: true,
      data: {
        product: {
          _id: product._id,
          name: product.name,
          subCategory: product.subCategory
        },
        filterValues
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product filter values',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// @desc    Set filter values for a product
// @route   POST /api/admin/products/:productId/filter-values
// @access  Private
export const setProductFilterValues = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { filterValues } = req.body;

    if (!Array.isArray(filterValues)) {
      res.status(400).json({
        success: false,
        message: 'Filter values must be an array'
      });
      return;
    }

    // Check if product exists
    const product = await Product.findById(productId).populate('subCategory');
    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found'
      });
      return;
    }

    // Get category filters to validate
    const categoryFilters = await CategoryFilter.find({ 
      category: product.subCategory,
      isActive: true 
    }).populate('filter');

    const validFilterIds = categoryFilters.map(cf => (cf.filter as any)._id.toString());
    const requiredFilterIds = categoryFilters
      .filter(cf => cf.isRequired)
      .map(cf => (cf.filter as any)._id.toString());

    // Validate filter values
    for (const fv of filterValues) {
      // Check if filter is valid for this category
      if (!validFilterIds.includes(fv.filterId)) {
        res.status(400).json({
          success: false,
          message: `Filter ${fv.filterId} is not assigned to this product's category`
        });
        return;
      }

      // Check if filter exists
      const filter = await Filter.findById(fv.filterId);
      if (!filter) {
        res.status(400).json({
          success: false,
          message: `Filter ${fv.filterId} not found`
        });
        return;
      }

      // Validate filter option if provided
      if (fv.filterOptionId) {
        const filterOption = await FilterOption.findOne({
          _id: fv.filterOptionId,
          filter: fv.filterId
        });
        if (!filterOption) {
          res.status(400).json({
            success: false,
            message: `Filter option ${fv.filterOptionId} not found for filter ${fv.filterId}`
          });
          return;
        }
      }

      // Validate that either filterOption or customValue is provided
      if (!fv.filterOptionId && !fv.customValue) {
        res.status(400).json({
          success: false,
          message: `Either filterOptionId or customValue must be provided for filter ${fv.filterId}`
        });
        return;
      }
    }

    // Check if all required filters are provided
    const providedFilterIds = filterValues.map(fv => fv.filterId);
    const missingRequiredFilters = requiredFilterIds.filter(id => !providedFilterIds.includes(id));
    if (missingRequiredFilters.length > 0) {
      res.status(400).json({
        success: false,
        message: `Missing required filters: ${missingRequiredFilters.join(', ')}`
      });
      return;
    }

    // Remove existing filter values for this product
    await ProductFilterValue.deleteMany({ product: productId });

    // Create new filter values
    const filterValuesToCreate = filterValues.map(fv => ({
      product: productId,
      filter: fv.filterId,
      filterOption: fv.filterOptionId || null,
      customValue: fv.customValue || null,
      ...(req.admin?._id && { createdBy: req.admin._id })
    }));

    const createdFilterValues = await ProductFilterValue.insertMany(filterValuesToCreate);

    // Populate the created filter values
    const populatedFilterValues = await ProductFilterValue.find({ 
      _id: { $in: createdFilterValues.map(fv => fv._id) } 
    })
      .populate('filter', 'name displayName type dataType')
      .populate('filterOption', 'value displayValue colorCode');

    res.status(201).json({
      success: true,
      message: 'Product filter values set successfully',
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

// @desc    Update a specific product filter value
// @route   PUT /api/admin/product-filter-values/:id
// @access  Private
export const updateProductFilterValue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { filterOptionId, customValue, isActive } = req.body;

    const productFilterValue = await ProductFilterValue.findById(req.params.id);
    if (!productFilterValue) {
      res.status(404).json({
        success: false,
        message: 'Product filter value not found'
      });
      return;
    }

    // Validate filter option if provided
    if (filterOptionId) {
      const filterOption = await FilterOption.findOne({
        _id: filterOptionId,
        filter: productFilterValue.filter
      });
      if (!filterOption) {
        res.status(400).json({
          success: false,
          message: 'Invalid filter option for this filter'
        });
        return;
      }
    }

    // Validate that either filterOption or customValue is provided
    if (!filterOptionId && !customValue) {
      res.status(400).json({
        success: false,
        message: 'Either filterOptionId or customValue must be provided'
      });
      return;
    }

    // Update fields
    if (filterOptionId !== undefined) {
      productFilterValue.filterOption = filterOptionId;
      (productFilterValue as any).customValue = null; // Clear custom value if option is set
    }
    if (customValue !== undefined) {
      productFilterValue.customValue = customValue;
      (productFilterValue as any).filterOption = null; // Clear option if custom value is set
    }
    if (isActive !== undefined) productFilterValue.isActive = isActive;
    if (req.admin?._id) productFilterValue.updatedBy = req.admin._id;

    await productFilterValue.save();
    await productFilterValue.populate('filter', 'name displayName type dataType');
    await productFilterValue.populate('filterOption', 'value displayValue colorCode');

    res.json({
      success: true,
      message: 'Product filter value updated successfully',
      data: productFilterValue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating product filter value',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// @desc    Delete a product filter value
// @route   DELETE /api/admin/product-filter-values/:id
// @access  Private
export const deleteProductFilterValue = async (req: Request, res: Response): Promise<void> => {
  try {
    const productFilterValue = await ProductFilterValue.findById(req.params.id)
      .populate({
        path: 'product',
        populate: {
          path: 'subCategory'
        }
      })
      .populate('filter');

    if (!productFilterValue) {
      res.status(404).json({
        success: false,
        message: 'Product filter value not found'
      });
      return;
    }

    // Check if this is a required filter
    const categoryFilter = await CategoryFilter.findOne({
      category: (productFilterValue.product as any).subCategory,
      filter: productFilterValue.filter,
      isRequired: true
    });

    if (categoryFilter) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete value for required filter'
      });
      return;
    }

    await ProductFilterValue.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product filter value deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting product filter value',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// @desc    Get available filters for a product based on its category
// @route   GET /api/admin/products/:productId/available-filters
// @access  Private
export const getAvailableFiltersForProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;

    // Check if product exists
    const product = await Product.findById(productId).populate('subCategory');
    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found'
      });
      return;
    }

    // Get category filters
    const categoryFilters = await CategoryFilter.find({ 
      category: product.subCategory,
      isActive: true 
    })
      .populate({
        path: 'filter',
        select: 'name displayName type dataType description',
        populate: {
          path: 'options',
          model: 'FilterOption',
          match: { isActive: true },
          select: 'value displayValue colorCode sortOrder',
          options: { sort: { sortOrder: 1 } }
        }
      })
      .sort({ sortOrder: 1 });

    // Get existing filter values for this product
    const existingFilterValues = await ProductFilterValue.find({ product: productId })
      .populate('filter', 'name')
      .populate('filterOption', 'value displayValue colorCode');

    const filtersWithValues = categoryFilters.map(cf => {
      const existingValue = existingFilterValues.find(
        fv => (fv.filter as any)._id.toString() === (cf.filter as any)._id.toString()
      );

      return {
        categoryFilter: cf,
        filter: cf.filter,
        isRequired: cf.isRequired,
        currentValue: existingValue || null
      };
    });

    res.json({
      success: true,
      data: {
        product: {
          _id: product._id,
          name: product.name,
          subCategory: product.subCategory
        },
        filters: filtersWithValues
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching available filters for product',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};