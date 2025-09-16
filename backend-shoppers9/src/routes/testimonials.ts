import express from 'express';
import axios from 'axios';

const router = express.Router();

// Admin backend URL
const ADMIN_API_URL = process.env.ADMIN_API_URL || 'http://localhost:5003/api';

// Get featured testimonials (public endpoint)
router.get('/featured', async (req, res, next) => {
  try {
    const limit = req.query.limit || 6;
    const response = await axios.get(`${ADMIN_API_URL}/testimonials/featured?limit=${limit}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching featured testimonials:', error);
    res.json({
      success: true,
      data: []
    });
  }
});

// Get testimonials by category (public endpoint)
router.get('/category/:category', async (req, res, next) => {
  try {
    const { category } = req.params;
    const limit = req.query.limit || 10;
    const response = await axios.get(`${ADMIN_API_URL}/testimonials/category/${category}?limit=${limit}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching testimonials by category:', error);
    res.json({
      success: true,
      data: []
    });
  }
});

// Get testimonials by rating (public endpoint)
router.get('/rating/:minRating?', async (req, res, next) => {
  try {
    const minRating = req.params.minRating || req.query.minRating || 4;
    const limit = req.query.limit || 10;
    const response = await axios.get(`${ADMIN_API_URL}/testimonials/rating?minRating=${minRating}&limit=${limit}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching testimonials by rating:', error);
    res.json({
      success: true,
      data: []
    });
  }
});

// Get testimonials by product (public endpoint)
router.get('/product/:productId', async (req, res, next) => {
  try {
    const { productId } = req.params;
    const response = await axios.get(`${ADMIN_API_URL}/testimonials/product/${productId}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching testimonials by product:', error);
    res.json({
      success: true,
      data: []
    });
  }
});

// Get all active testimonials (public endpoint)
router.get('/', async (req, res, next) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    const response = await axios.get(`${ADMIN_API_URL}/testimonials?page=${page}&limit=${limit}&isActive=true`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.json({
      success: true,
      data: {
        testimonials: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0
        }
      }
    });
  }
});

export default router;