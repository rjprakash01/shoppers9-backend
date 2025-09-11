import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export interface ConversionResult {
  success: boolean;
  svgPath?: string;
  error?: string;
}

/**
 * Convert uploaded image to SVG format
 * This creates a simple SVG wrapper around the image data
 */
export async function convertImageToSVG(
  inputPath: string,
  outputDir: string,
  filename: string
): Promise<ConversionResult> {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Check if the file is already an SVG
    if (path.extname(inputPath).toLowerCase() === '.svg') {
      // If it's already an SVG, just return the path
      return {
        success: true,
        svgPath: inputPath
      };
    }

    // Read the original image to get dimensions and convert to base64
    const imageBuffer = fs.readFileSync(inputPath);
    const metadata = await sharp(imageBuffer).metadata();
    
    // Convert image to base64
    const base64Data = imageBuffer.toString('base64');
    const mimeType = getMimeType(inputPath);
    
    // Create SVG content with embedded image
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${metadata.width || 400}" height="${metadata.height || 400}" 
     viewBox="0 0 ${metadata.width || 400} ${metadata.height || 400}" 
     xmlns="http://www.w3.org/2000/svg" 
     xmlns:xlink="http://www.w3.org/1999/xlink">
  <image width="100%" height="100%" 
         xlink:href="data:${mimeType};base64,${base64Data}" 
         preserveAspectRatio="xMidYMid meet"/>
</svg>`;

    // Generate output path
    const svgFilename = filename.replace(/\.[^/.]+$/, '.svg');
    const outputPath = path.join(outputDir, svgFilename);
    
    // Write SVG file
    fs.writeFileSync(outputPath, svgContent);
    
    // Clean up original file (only if it's not the same as output)
    if (fs.existsSync(inputPath) && inputPath !== outputPath) {
      fs.unlinkSync(inputPath);
    }
    
    return {
      success: true,
      svgPath: outputPath
    };
  } catch (error) {
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get MIME type based on file extension
 */
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    case '.gif':
      return 'image/gif';
    case '.bmp':
      return 'image/bmp';
    case '.tiff':
    case '.tif':
      return 'image/tiff';
    default:
      return 'image/jpeg'; // fallback
  }
}

/**
 * Convert multiple images to SVG
 */
export async function convertMultipleImagesToSVG(
  files: Express.Multer.File[],
  outputDir: string
): Promise<{ svgPaths: string[]; errors: string[] }> {
  const svgPaths: string[] = [];
  const errors: string[] = [];
  
  for (const file of files) {
    const result = await convertImageToSVG(
      file.path,
      outputDir,
      file.filename
    );
    
    if (result.success && result.svgPath) {
      // Convert absolute path to relative URL path
      const relativePath = result.svgPath.replace(process.cwd(), '').replace(/\\/g, '/');
      // Ensure the path starts with /uploads/
      const urlPath = relativePath.startsWith('/uploads/') ? relativePath : `/uploads/products/${path.basename(result.svgPath)}`;
      svgPaths.push(urlPath);
    } else {
      errors.push(result.error || `Failed to convert ${file.filename}`);
    }
  }
  
  return { svgPaths, errors };
}