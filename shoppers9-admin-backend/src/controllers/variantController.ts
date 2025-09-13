import { Request, Response } from 'express';
import Product from '../models/Product';
import { AuthRequest } from '../types';
import mongoose from 'mongoose';

/**
 * Add variants to an existing product
 * POST /api/admin/products/:productId/variants
 */
export const addVariants = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { productId } = req.params;
    const { variants } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (!Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Variants array is required'
      });
    }

    // Validate and process variants
    const processedVariants = variants.map((variant: any, index: number) => {
      if (!variant.color || !variant.size) {
        throw new Error(`Variant ${index + 1}: Color and size are required`);
      }
      if (!variant.price || variant.price <= 0) {
        throw new Error(`Variant ${index + 1}: Valid price is required`);
      }
      if (!variant.sku) {
        throw new Error(`Variant ${index + 1}: SKU is required`);
      }

      return {
        color: variant.color,
        colorCode: variant.colorCode || '#000000',
        size: variant.size,
        price: parseFloat(variant.price),
        originalPrice: parseFloat(variant.originalPrice || variant.price),
        stock: parseInt(variant.stock || 0),
        sku: variant.sku,
        images: variant.images || product.images
      };
    });

    // Check for duplicate SKUs within the new variants
    const newSkus = processedVariants.map(v => v.sku);
    const duplicateSkus = newSkus.filter((sku, index) => newSkus.indexOf(sku) !== index);
    if (duplicateSkus.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Duplicate SKUs found: ${duplicateSkus.join(', ')}`
      });
    }

    // Check for SKU conflicts with existing variants
    const existingSkus = product.variants.map((v: any) => v.sku).filter(Boolean);
    const conflictingSkus = newSkus.filter(sku => existingSkus.includes(sku));
    if (conflictingSkus.length > 0) {
      return res.status(400).json({
        success: false,
        message: `SKUs already exist: ${conflictingSkus.join(', ')}`
      });
    }

    // Add variants to product
    product.variants.push(...processedVariants as any);
    await product.save();

    const updatedProduct = await Product.findById(productId)
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug');

    return res.status(201).json({
      success: true,
      message: 'Variants added successfully',
      data: {
        product: updatedProduct,
        addedVariants: processedVariants
      }
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error adding variants',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update a specific variant
 * PUT /api/admin/products/:productId/variants/:variantId
 */
export const updateVariant = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { productId, variantId } = req.params;
    const variantData = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const variantIndex = product.variants.findIndex((v: any) => v._id?.toString() === variantId);
    if (variantIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Variant not found'
      });
    }

    // Validate SKU uniqueness if it's being updated
    if (variantData.sku) {
      const existingSkus = product.variants
        .filter((v: any, index: number) => index !== variantIndex)
        .map((v: any) => v.sku)
        .filter(Boolean);
      
      if (existingSkus.includes(variantData.sku)) {
        return res.status(400).json({
          success: false,
          message: 'SKU already exists'
        });
      }
    }

    // Update variant
    const currentVariant = product.variants[variantIndex] as any;
    const updatedVariant = {
      ...currentVariant,
      ...variantData,
      price: variantData.price ? parseFloat(variantData.price) : currentVariant.price,
      originalPrice: variantData.originalPrice ? parseFloat(variantData.originalPrice) : currentVariant.originalPrice,
      stock: variantData.stock !== undefined ? parseInt(variantData.stock) : currentVariant.stock
    };

    product.variants[variantIndex] = updatedVariant;
    await product.save();

    const updatedProduct = await Product.findById(productId)
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug');

    return res.json({
      success: true,
      message: 'Variant updated successfully',
      data: {
        product: updatedProduct,
        updatedVariant
      }
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: 'Error updating variant',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Delete a specific variant
 * DELETE /api/admin/products/:productId/variants/:variantId
 */
export const deleteVariant = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { productId, variantId } = req.params;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const variantIndex = product.variants.findIndex((v: any) => v._id?.toString() === variantId);
    if (variantIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Variant not found'
      });
    }

    // Don't allow deletion if it's the last variant
    if (product.variants.length === 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the last variant. Product must have at least one variant.'
      });
    }

    const deletedVariant = product.variants[variantIndex];
    product.variants.splice(variantIndex, 1);
    await product.save();

    const updatedProduct = await Product.findById(productId)
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug');

    return res.json({
      success: true,
      message: 'Variant deleted successfully',
      data: {
        product: updatedProduct,
        deletedVariant
      }
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: 'Error deleting variant',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get all variants for a product
 * GET /api/admin/products/:productId/variants
 */
export const getProductVariants = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { productId } = req.params;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    const product = await Product.findById(productId)
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug');
      
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    return res.json({
      success: true,
      data: {
        productId: product._id,
        productName: product.name,
        variants: product.variants,
        totalVariants: product.variants.length,
        totalStock: product.totalStock
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching variants',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const variantController = {
  addVariants,
  updateVariant,
  deleteVariant,
  getProductVariants
};