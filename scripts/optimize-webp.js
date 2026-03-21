#!/usr/bin/env node

/**
 * WebP Optimization Script
 * Converts PNG/JPG images to WebP format for better performance
 * 
 * Usage: node scripts/optimize-webp.js
 * 
 * Benefits:
 * - Reduces image size by 25-35%
 * - Improves LCP (Largest Contentful Paint)
 * - Better browser compatibility with fallbacks
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const CONFIG = {
  quality: 80,
  alphaQuality: 100,
  method: 6,
  sourceDir: 'public',
  excludeDirs: ['node_modules', '.git', 'optimized'],
  supportedFormats: ['.png', '.jpg', '.jpeg'],
  maxSizeToConvert: 50 * 1024 * 1024,
};

// Logging helpers
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warn: (msg) => console.warn(`⚠️  ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
};

// Statistics
const stats = {
  processed: 0,
  skipped: 0,
  failed: 0,
  originalSize: 0,
  optimizedSize: 0,
  startTime: Date.now(),
};

/**
 * Find all image files recursively
 */
function findImages(dir, depth = 0) {
  const images = [];
  const maxDepth = 5;

  if (depth > maxDepth) return images;

  try {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      const ext = path.extname(file).toLowerCase();

      // Skip excluded directories
      if (stat.isDirectory()) {
        if (!CONFIG.excludeDirs.includes(file)) {
          images.push(...findImages(filePath, depth + 1));
        }
      }
      // Check if file is supported image format
      else if (CONFIG.supportedFormats.includes(ext)) {
        images.push(filePath);
      }
    }
  } catch (error) {
    log.error(`Failed to read directory ${dir}: ${error.message}`);
  }

  return images;
}

/**
 * Convert image to WebP
 */
async function convertToWebP(imagePath) {
  const outputPath = imagePath.replace(/\.(png|jpg|jpeg)$/i, '.webp');

  // Skip if WebP already exists
  if (fs.existsSync(outputPath)) {
    log.info(`⏭️  Already optimized: ${path.relative('.', imagePath)}`);
    stats.skipped++;
    return;
  }

  // Check file size
  const stats_fs = fs.statSync(imagePath);
  if (stats_fs.size > CONFIG.maxSizeToConvert) {
    log.warn(`File too large (${(stats_fs.size / 1024 / 1024).toFixed(2)}MB): ${path.relative('.', imagePath)}`);
    stats.skipped++;
    return;
  }

  try {
    const originalSize = stats_fs.size;
    
    // Build cwebp command
    const command = `cwebp -q ${CONFIG.quality} -m ${CONFIG.method} "${imagePath}" -o "${outputPath}"`;
    
    // Execute conversion
    execSync(command, { stdio: 'pipe' });

    // Get optimized size
    const optimizedSize = fs.statSync(outputPath).size;
    const savings = ((1 - optimizedSize / originalSize) * 100).toFixed(1);

    stats.originalSize += originalSize;
    stats.optimizedSize += optimizedSize;
    stats.processed++;

    log.success(
      `${path.relative('.', imagePath)} → ${path.relative('.', outputPath)} (${savings}% saved)`
    );
  } catch (error) {
    log.error(`Failed to convert ${imagePath}: ${error.message}`);
    stats.failed++;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  🖼️  WebP Optimization Script         ║');
  console.log('║  Converting images for better perf... ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Verify cwebp is installed
  try {
    execSync('which cwebp', { stdio: 'pipe' });
  } catch {
    log.error('cwebp is not installed!');
    log.info('Install it with: brew install webp');
    process.exit(1);
  }

  // Find all images
  const sourceDir = path.join(path.dirname(__dirname), CONFIG.sourceDir);
  if (!fs.existsSync(sourceDir)) {
    log.error(`Source directory not found: ${sourceDir}`);
    process.exit(1);
  }

  log.info(`Scanning for images in: ${CONFIG.sourceDir}/`);
  const images = findImages(sourceDir);

  if (images.length === 0) {
    log.warn('No images found to optimize');
    process.exit(0);
  }

  log.info(`Found ${images.length} images to process\n`);

  // Process each image
  for (const image of images) {
    await convertToWebP(image);
  }

  // Summary
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  📊 Optimization Summary               ║');
  console.log('╚════════════════════════════════════════╝\n');

  log.info(`Processed: ${stats.processed}`);
  log.info(`Skipped: ${stats.skipped}`);
  stats.failed > 0 && log.error(`Failed: ${stats.failed}`);

  if (stats.processed > 0) {
    const totalSavings = ((1 - stats.optimizedSize / stats.originalSize) * 100).toFixed(1);
    const originalMB = (stats.originalSize / 1024 / 1024).toFixed(2);
    const optimizedMB = (stats.optimizedSize / 1024 / 1024).toFixed(2);
    const timeTaken = ((Date.now() - stats.startTime) / 1000).toFixed(2);

    console.log('');
    log.success(`Original size: ${originalMB}MB`);
    log.success(`Optimized size: ${optimizedMB}MB`);
    log.success(`Total savings: ${totalSavings}% (${((stats.originalSize - stats.optimizedSize) / 1024 / 1024).toFixed(2)}MB)`);
    log.info(`Time taken: ${timeTaken}s`);
  }

  console.log('\n✨ Optimization complete!\n');
}

// Run script
main().catch(error => {
  log.error(error.message);
  process.exit(1);
});
