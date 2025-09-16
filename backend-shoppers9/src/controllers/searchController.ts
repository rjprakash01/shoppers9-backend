import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { AppError } from '../middleware/errorHandler';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'product' | 'brand' | 'category' | 'keyword';
  category?: string;
  image?: string;
  price?: number;
  popularity?: number;
}

interface SearchFilters {
  query?: string;
  category?: string;
  subcategory?: string;
  subsubcategory?: string;
  brand?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  rating?: number;
  sortBy?: string;
  page?: number;
  limit?: number;
  includeAggregations?: boolean;
}

// Enhanced search with aggregations and suggestions
export const enhancedSearch = async (req: Request, res: Response) => {
  try {
    const {
      q: search,
      category,
      subcategory,
      subsubcategory,
      brand,
      minPrice,
      maxPrice,
      inStock,
      rating,
      sortBy = 'relevance',
      page = 1,
      limit = 20,
      includeAggregations = false
    } = req.query;

    const startTime = Date.now();
    
    // Build base query
    const query: any = { isActive: true };
    
    // Build search and category conditions separately
    const searchConditions: any[] = [];
    const categoryConditions: any[] = [];
    
    // Text search with fallback to regex
    if (search) {
      // Use regex-based search instead of $text to avoid index dependency
      const searchRegex = new RegExp(search as string, 'i');
      searchConditions.push(
        { name: searchRegex },
        { description: searchRegex },
        { brand: searchRegex },
        { tags: { $in: [searchRegex] } }
      );
    }
    
    // Category filtering
    if (category) {
      const categoryDoc = await Category.findOne({
        $or: [
          { slug: category },
          { name: { $regex: new RegExp(`^${category}$`, 'i') } }
        ],
        isActive: true
      });
      
      if (categoryDoc) {
        if (categoryDoc.level === 1) {
          // Main category - find all subcategories
          const subcategories = await Category.find({
            parentCategory: categoryDoc._id,
            isActive: true
          });
          
          const subsubcategories = await Category.find({
            parentCategory: { $in: subcategories.map(s => s._id) },
            isActive: true
          });
          
          const allCategoryIds = [
            categoryDoc._id,
            ...subcategories.map(s => s._id),
            ...subsubcategories.map(s => s._id)
          ];
          
          categoryConditions.push(
            { category: { $in: allCategoryIds } },
            { subCategory: { $in: allCategoryIds } },
            { subSubCategory: { $in: allCategoryIds } }
          );
        } else {
          const categoryField = categoryDoc.level === 1 ? 'category' : 
                               categoryDoc.level === 2 ? 'subCategory' : 'subSubCategory';
          query[categoryField] = categoryDoc._id;
        }
      }
    }
    
    // Combine search and category conditions
    if (searchConditions.length > 0 && categoryConditions.length > 0) {
      // Both search and category: products must match search AND be in category
      query.$and = [
        { $or: searchConditions },
        { $or: categoryConditions }
      ];
    } else if (searchConditions.length > 0) {
      // Only search: products must match search terms
      query.$or = searchConditions;
    } else if (categoryConditions.length > 0) {
      // Only category: products must be in category
      query.$or = categoryConditions;
    }
    
    // Additional filters
    if (brand) {
      const brands = Array.isArray(brand) ? brand : [brand];
      query.brand = { $in: brands.map(b => new RegExp(b as string, 'i')) };
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    
    if (inStock === 'true') {
      query.totalStock = { $gt: 0 };
    }
    
    if (rating) {
      query.averageRating = { $gte: Number(rating) };
    }
    
    // Dynamic filters from query params
    Object.keys(req.query).forEach(key => {
      if (key.startsWith('filter_')) {
        const filterName = key.replace('filter_', '');
        const filterValues = Array.isArray(req.query[key]) ? req.query[key] : [req.query[key]];
        query[`filters.${filterName}`] = { $in: filterValues };
      }
    });
    
    // Sorting
    let sort: any = {};
    switch (sortBy) {
      case 'price_low':
        sort = { price: 1 };
        break;
      case 'price_high':
        sort = { price: -1 };
        break;
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'rating':
        sort = { averageRating: -1, reviewCount: -1 };
        break;
      case 'popularity':
        sort = { salesCount: -1, viewCount: -1 };
        break;
      case 'relevance':
      default:
        // Use popularity-based sorting for relevance since we're not using text search
        sort = { featured: -1, salesCount: -1, viewCount: -1, createdAt: -1 };
        break;
    }
    
    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Execute search
    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .populate('subSubCategory', 'name slug')
      .lean();
    
    const total = await Product.countDocuments(query);
    
    // Get aggregations if requested
    let aggregations: any = {};
    const shouldIncludeAggregations = String(includeAggregations) === 'true';
    if (shouldIncludeAggregations) {
      aggregations = await getSearchAggregations(query);
    }
    
    // Generate suggestions
    const suggestions = search ? await generateSearchSuggestions(search as string) : [];
    
    // Calculate search time
    const searchTime = Date.now() - startTime;
    
    // Generate "did you mean" suggestion
    const didYouMean = search ? await generateDidYouMean(search as string) : undefined;
    
    // Get related searches
    const relatedSearches = search ? await getRelatedSearches(search as string) : [];
    
    res.json({
      success: true,
      data: {
        products,
        suggestions,
        filters: aggregations,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        },
        searchMeta: {
          query: search || '',
          resultCount: total,
          searchTime,
          didYouMean,
          relatedSearches
        }
      }
    });
    
  } catch (error) {
    console.error('Enhanced search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Autocomplete endpoint
export const autocomplete = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q: query, limit = 10 } = req.query;
    
    if (!query || (query as string).length < 2) {
      res.json({
        success: true,
        data: {
          suggestions: [],
          popularSearches: await getPopularSearches()
        }
      });
      return;
    }
    
    const searchRegex = new RegExp(query as string, 'i');
    
    // Get product suggestions
    const productSuggestions = await Product.find({
      $or: [
        { name: searchRegex },
        { brand: searchRegex },
        { tags: searchRegex }
      ],
      isActive: true
    })
    .select('name brand price images')
    .limit(Number(limit) / 2)
    .lean() as any[];
    
    // Get category suggestions
    const categorySuggestions = await Category.find({
      $or: [
        { name: searchRegex },
        { slug: searchRegex }
      ],
      isActive: true
    })
    .select('name slug level')
    .limit(Number(limit) / 4)
    .lean();
    
    // Get brand suggestions
    const brandSuggestions = await Product.distinct('brand', {
      brand: searchRegex,
      isActive: true
    }).limit(Number(limit) / 4);
    
    // Format suggestions
    const suggestions: SearchSuggestion[] = [
      ...productSuggestions.map(product => ({
        id: product._id.toString(),
        text: product.name,
        type: 'product' as const,
        image: product.images?.[0],
        price: product.price
      })),
      ...categorySuggestions.map(category => ({
        id: category._id.toString(),
        text: category.name,
        type: 'category' as const,
        category: category.slug
      })),
      ...brandSuggestions.map(brand => ({
        id: brand,
        text: brand,
        type: 'brand' as const
      }))
    ];
    
    res.json({
      success: true,
      data: {
        suggestions: suggestions.slice(0, Number(limit)),
        popularSearches: await getPopularSearches()
      }
    });
    
  } catch (error) {
    console.error('Autocomplete error:', error);
    res.status(500).json({
      success: false,
      message: 'Autocomplete failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get search suggestions
export const getSearchSuggestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q: query } = req.query;
    
    if (!query) {
      res.json({
        success: true,
        data: { suggestions: [] }
      });
      return;
    }
    
    const suggestions = await generateSearchSuggestions(query as string);
    
    res.json({
      success: true,
      data: { suggestions }
    });
    
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get suggestions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get trending searches
export const getTrendingSearches = async (req: Request, res: Response) => {
  try {
    // This would typically come from analytics data
    const trendingSearches = [
      'T-shirts',
      'Jeans',
      'Sneakers',
      'Dresses',
      'Jackets',
      'Accessories',
      'Shoes',
      'Bags'
    ];
    
    res.json({
      success: true,
      data: { searches: trendingSearches }
    });
    
  } catch (error) {
    console.error('Trending searches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trending searches',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get popular searches
export const getPopularSearches = async (): Promise<string[]> => {
  try {
    // This would typically come from search analytics
    return [
      'T-shirts',
      'Jeans',
      'Sneakers',
      'Dresses',
      'Jackets',
      'Accessories'
    ];
  } catch (error) {
    console.error('Popular searches error:', error);
    return [];
  }
};

// Helper function to get search aggregations
const getSearchAggregations = async (baseQuery: any) => {
  try {
    const pipeline: any[] = [
      { $match: baseQuery },
      {
        $facet: {
          brands: [
            { $group: { _id: '$brand', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 },
            { $project: { name: '$_id', count: 1, _id: 0 } }
          ],
          categories: [
            { $lookup: { from: 'categories', localField: 'subSubCategory', foreignField: '_id', as: 'categoryInfo' } },
            { $unwind: '$categoryInfo' },
            { $group: { _id: '$categoryInfo._id', name: { $first: '$categoryInfo.name' }, slug: { $first: '$categoryInfo.slug' }, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          priceRanges: [
            {
              $bucket: {
                groupBy: '$price',
                boundaries: [0, 500, 1000, 2000, 5000, 10000],
                default: 'Other',
                output: { count: { $sum: 1 } }
              }
            }
          ]
        }
      }
    ];
    
    const [result] = await Product.aggregate(pipeline);
    return result || { brands: [], categories: [], priceRanges: [] };
    
  } catch (error) {
    console.error('Aggregation error:', error);
    return { brands: [], categories: [], priceRanges: [] };
  }
};

// Helper function to generate search suggestions
const generateSearchSuggestions = async (query: string): Promise<SearchSuggestion[]> => {
  try {
    const searchRegex = new RegExp(query, 'i');
    
    // Get related products
    const relatedProducts = await Product.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { tags: searchRegex }
      ],
      isActive: true
    })
    .select('name brand')
    .limit(5)
    .lean();
    
    const suggestions: SearchSuggestion[] = [];
    
    // Add product name suggestions
    relatedProducts.forEach(product => {
      suggestions.push({
        id: product._id.toString(),
        text: product.name,
        type: 'product'
      });
      
      // Add brand suggestions
      if (product.brand && !suggestions.find(s => s.text === product.brand)) {
        suggestions.push({
          id: product.brand,
          text: product.brand,
          type: 'brand'
        });
      }
    });
    
    return suggestions.slice(0, 10);
    
  } catch (error) {
    console.error('Generate suggestions error:', error);
    return [];
  }
};

// Helper function to generate "did you mean" suggestions
const generateDidYouMean = async (query: string): Promise<string | undefined> => {
  try {
    // Simple implementation - in production, you'd use a more sophisticated algorithm
    const commonTerms = ['shirt', 'jeans', 'dress', 'shoes', 'jacket', 'bag', 'watch'];
    const lowerQuery = query.toLowerCase();
    
    for (const term of commonTerms) {
      if (levenshteinDistance(lowerQuery, term) <= 2 && lowerQuery !== term) {
        return term;
      }
    }
    
    return undefined;
  } catch (error) {
    console.error('Did you mean error:', error);
    return undefined;
  }
};

// Helper function to get related searches
const getRelatedSearches = async (query: string): Promise<string[]> => {
  try {
    // This would typically come from search analytics and user behavior
    const relatedSearches = [
      `${query} for men`,
      `${query} for women`,
      `${query} sale`,
      `${query} online`,
      `best ${query}`
    ];
    
    return relatedSearches.slice(0, 5);
  } catch (error) {
    console.error('Related searches error:', error);
    return [];
  }
};

// Helper function to calculate Levenshtein distance
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

export const searchController = {
  enhancedSearch,
  autocomplete,
  getSearchSuggestions,
  getTrendingSearches
};