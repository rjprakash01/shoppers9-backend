import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create subdirectories for categories, products, and banners
const categoriesDir = path.join(uploadsDir, 'categories');
const productsDir = path.join(uploadsDir, 'products');
const bannersDir = path.join(uploadsDir, 'banners');

if (!fs.existsSync(categoriesDir)) {
  fs.mkdirSync(categoriesDir, { recursive: true });
}

if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true });
}

if (!fs.existsSync(bannersDir)) {
  fs.mkdirSync(bannersDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine destination based on the URL path
    console.log('Upload destination check:', {
      originalUrl: req.originalUrl,
      path: req.path,
      route: req.route?.path
    });
    
    if (req.originalUrl.includes('/categories') || req.path.includes('categories')) {
      console.log('Saving to categories directory');
      cb(null, categoriesDir);
    } else if (req.originalUrl.includes('/products') || req.path.includes('products')) {
      console.log('Saving to products directory');
      cb(null, productsDir);
    } else if (req.originalUrl.includes('/banners') || req.path.includes('banners')) {
      console.log('Saving to banners directory');
      cb(null, bannersDir);
    } else {
      console.log('Saving to main uploads directory');
      cb(null, uploadsDir);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter to allow specific image formats
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  console.log('File filter check:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    fieldname: file.fieldname,
    size: file.size
  });
  
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/svg+xml',
    'image/webp',
    'image/gif',
    'image/bmp',
    'image/tiff'
  ];
  
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.svg', '.webp', '.gif', '.bmp', '.tiff', '.tif'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  console.log('Validation check:', {
    fileExtension,
    mimetypeAllowed: allowedMimeTypes.includes(file.mimetype),
    extensionAllowed: allowedExtensions.includes(fileExtension)
  });
  
  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    console.log('File accepted:', file.originalname);
    cb(null, true);
  } else {
    console.log('File rejected:', file.originalname, 'mimetype:', file.mimetype, 'extension:', fileExtension);
    cb(new Error('Only image files (JPG, JPEG, PNG, SVG, WebP, GIF, BMP, TIFF) are allowed!'));
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Middleware for single category image upload
export const uploadCategoryImage = upload.single('image');

// Middleware for multiple product images upload (max 6)
export const uploadProductImages = upload.array('images', 6);

// Middleware for single banner image upload
export const uploadBannerImage = upload.single('image');

// Error handling middleware for multer
export const handleUploadError = (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 6 images allowed for products.'
      });
    }
  }
  
  if (error.message === 'Only image files (JPG, JPEG, PNG, SVG, WebP, GIF, BMP, TIFF) are allowed!') {
    return res.status(400).json({
      success: false,
      message: 'Only image files (JPG, JPEG, PNG, SVG, WebP, GIF, BMP, TIFF) are allowed!'
    });
  }
  
  next(error);
};

export default upload;