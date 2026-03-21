/**
 * Image Preprocessing Utility for OCR Optimization
 * Uses native Canvas API for browser compatibility
 *
 * This module provides advanced image preprocessing techniques to improve
 * OCR accuracy when scanning business cards:
 * - Grayscale conversion
 * - Contrast enhancement (histogram equalization)
 * - Noise reduction
 * - Sharpening
 * - Adaptive binarization
 */

/**
 * Quality metrics for preprocessed image
 */
export interface ImageQualityMetrics {
  brightness: number;      // 0-1, optimal: 0.3-0.7
  sharpness: number;       // Laplacian variance, higher = sharper
  skewAngle: number;       // Rotation angle in degrees
  isQualityGood: boolean;  // Overall quality assessment
}

/**
 * Preprocessing configuration options
 */
export interface PreprocessingOptions {
  enhanceContrast?: boolean;     // Default: true
  reduceNoise?: boolean;         // Default: true
  sharpen?: boolean;             // Default: true
  deskew?: boolean;              // Default: true (placeholder)
  binarize?: boolean;            // Default: false (only if very poor contrast)
}

/**
 * Main preprocessing function for OCR optimization
 *
 * @param imageDataUrl - Base64 data URL of the captured image
 * @param options - Preprocessing configuration
 * @returns Preprocessed image as base64 data URL
 */
export async function preprocessImageForOCR(
  imageDataUrl: string,
  options: PreprocessingOptions = {}
): Promise<string> {
  const {
    enhanceContrast = true,
    reduceNoise = true,
    sharpen = true,
    binarize = false
  } = options;

  try {
    // Create image from data URL
    const img = await loadImage(imageDataUrl);

    // Create canvas for processing
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
      throw new Error('Cannot get canvas context');
    }

    // Draw original image
    ctx.drawImage(img, 0, 0);

    // Get image data
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Step 1: Convert to grayscale
    imageData = toGrayscale(imageData);

    // Step 2: Enhance contrast (histogram equalization)
    if (enhanceContrast) {
      imageData = enhanceContrastHistogram(imageData);
    }

    // Step 3: Reduce noise (median-like filter)
    if (reduceNoise) {
      imageData = reduceNoiseSimple(imageData);
    }

    // Step 4: Sharpen edges
    if (sharpen) {
      imageData = sharpenImage(imageData);
    }

    // Step 5: Adaptive binarization (optional)
    if (binarize) {
      imageData = binarizeAdaptive(imageData);
    }

    // Put processed image back on canvas
    ctx.putImageData(imageData, 0, 0);

    // Convert to data URL with high quality
    return canvas.toDataURL('image/jpeg', 0.95);
  } catch (error) {
    console.error('Image preprocessing failed:', error);
    // Return original image if preprocessing fails
    return imageDataUrl;
  }
}

/**
 * Load image from data URL
 */
function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Convert image to grayscale
 */
function toGrayscale(imageData: ImageData): ImageData {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Use luminance formula for better grayscale conversion
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = gray;     // R
    data[i + 1] = gray; // G
    data[i + 2] = gray; // B
    // Alpha channel (i+3) unchanged
  }

  return imageData;
}

/**
 * Enhance contrast using histogram equalization
 */
function enhanceContrastHistogram(imageData: ImageData): ImageData {
  const data = imageData.data;
  const histogram = new Array(256).fill(0);
  const totalPixels = imageData.width * imageData.height;

  // Build histogram
  for (let i = 0; i < data.length; i += 4) {
    histogram[data[i]]++;
  }

  // Calculate cumulative distribution function (CDF)
  const cdf = new Array(256);
  cdf[0] = histogram[0];
  for (let i = 1; i < 256; i++) {
    cdf[i] = cdf[i - 1] + histogram[i];
  }

  // Normalize CDF to 0-255 range
  const cdfMin = cdf.find(val => val > 0) || 0;
  const equalizedLUT = new Array(256);
  for (let i = 0; i < 256; i++) {
    equalizedLUT[i] = Math.round(((cdf[i] - cdfMin) / (totalPixels - cdfMin)) * 255);
  }

  // Apply equalization
  for (let i = 0; i < data.length; i += 4) {
    const newValue = equalizedLUT[data[i]];
    data[i] = newValue;     // R
    data[i + 1] = newValue; // G
    data[i + 2] = newValue; // B
  }

  return imageData;
}

/**
 * Simple noise reduction using averaging filter
 */
function reduceNoiseSimple(imageData: ImageData): ImageData {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const newData = new Uint8ClampedArray(data);

  // 3x3 averaging filter (skip edges for simplicity)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;

      // Average 3x3 neighborhood
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          sum += data[idx];
        }
      }

      const avg = Math.round(sum / 9);
      const idx = (y * width + x) * 4;
      newData[idx] = avg;
      newData[idx + 1] = avg;
      newData[idx + 2] = avg;
    }
  }

  // Copy new data
  for (let i = 0; i < data.length; i++) {
    data[i] = newData[i];
  }

  return imageData;
}

/**
 * Sharpen image using unsharp mask technique
 */
function sharpenImage(imageData: ImageData): ImageData {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const newData = new Uint8ClampedArray(data);

  // Laplacian kernel for sharpening
  const kernel = [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0]
  ];

  // Apply convolution (skip edges)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          sum += data[idx] * kernel[ky + 1][kx + 1];
        }
      }

      const idx = (y * width + x) * 4;
      const sharpened = Math.max(0, Math.min(255, sum));
      newData[idx] = sharpened;
      newData[idx + 1] = sharpened;
      newData[idx + 2] = sharpened;
    }
  }

  // Copy new data
  for (let i = 0; i < data.length; i++) {
    data[i] = newData[i];
  }

  return imageData;
}

/**
 * Adaptive binarization using Otsu's method
 */
function binarizeAdaptive(imageData: ImageData): ImageData {
  const data = imageData.data;
  const histogram = new Array(256).fill(0);

  // Build histogram
  for (let i = 0; i < data.length; i += 4) {
    histogram[data[i]]++;
  }

  // Calculate optimal threshold using Otsu's method
  const threshold = calculateOtsuThreshold(histogram, imageData.width * imageData.height);

  // Apply threshold
  for (let i = 0; i < data.length; i += 4) {
    const binaryValue = data[i] > threshold ? 255 : 0;
    data[i] = binaryValue;     // R
    data[i + 1] = binaryValue; // G
    data[i + 2] = binaryValue; // B
  }

  return imageData;
}

/**
 * Calculate optimal threshold using Otsu's method
 */
function calculateOtsuThreshold(histogram: number[], totalPixels: number): number {
  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }

  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let maxVariance = 0;
  let threshold = 0;

  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;

    wF = totalPixels - wB;
    if (wF === 0) break;

    sumB += t * histogram[t];

    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;

    const variance = wB * wF * (mB - mF) * (mB - mF);

    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = t;
    }
  }

  return threshold;
}

/**
 * Analyze image quality metrics for real-time feedback
 *
 * @param imageDataUrl - Base64 data URL of the captured image
 * @returns Quality metrics including brightness, sharpness
 */
export async function analyzeImageQuality(imageDataUrl: string): Promise<ImageQualityMetrics> {
  try {
    const img = await loadImage(imageDataUrl);

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
      throw new Error('Cannot get canvas context');
    }

    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Convert to grayscale for analysis
    const grayData = toGrayscale(imageData);

    // Calculate brightness (average pixel intensity 0-1)
    const brightness = calculateBrightness(grayData);

    // Calculate sharpness using Laplacian variance
    const sharpness = calculateSharpness(grayData);

    // Placeholder for skew angle
    const skewAngle = 0;

    // Determine if quality is good
    const isQualityGood =
      brightness >= 0.3 && brightness <= 0.7 &&  // Good lighting
      sharpness > 100;                            // Sharp enough

    return {
      brightness,
      sharpness,
      skewAngle,
      isQualityGood
    };
  } catch (error) {
    console.error('Image quality analysis failed:', error);
    return {
      brightness: 0.5,
      sharpness: 0,
      skewAngle: 0,
      isQualityGood: false
    };
  }
}

/**
 * Calculate average brightness (0-1)
 */
function calculateBrightness(imageData: ImageData): number {
  const data = imageData.data;
  let total = 0;

  for (let i = 0; i < data.length; i += 4) {
    total += data[i];
  }

  return total / (imageData.width * imageData.height * 255);
}

/**
 * Calculate image sharpness using Laplacian variance
 * Higher value = sharper image
 */
function calculateSharpness(imageData: ImageData): number {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  // Laplacian kernel
  const kernel = [
    [0, 1, 0],
    [1, -4, 1],
    [0, 1, 0]
  ];

  let variance = 0;
  let count = 0;

  // Apply Laplacian filter (skip edges)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let laplacian = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          laplacian += data[idx] * kernel[ky + 1][kx + 1];
        }
      }

      variance += laplacian * laplacian;
      count++;
    }
  }

  return count > 0 ? variance / count : 0;
}

/**
 * Quick quality check without full preprocessing
 * Returns true if image quality is sufficient for OCR
 */
export async function quickQualityCheck(imageDataUrl: string): Promise<boolean> {
  const metrics = await analyzeImageQuality(imageDataUrl);
  return metrics.isQualityGood;
}
