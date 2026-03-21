/**
 * MultiImageUpload Component
 * Upload multiple images with drag & drop, preview, and deletion
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ImageUploadService } from '@/services/imageUploadService';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadedImage {
  url: string;
  path: string;
}

interface MultiImageUploadProps {
  images: string[]; // Array of image URLs
  onChange: (imageUrls: string[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  className?: string;
}

export const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  images = [],
  onChange,
  maxImages = 10,
  maxSizeMB = 5,
  className,
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>('');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = Array.from(e.dataTransfer.files);
      await handleFiles(files);
    },
    [images, maxImages]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = Array.from(e.target.files);
        await handleFiles(files);
      }
    },
    [images, maxImages]
  );

  const handleFiles = async (files: File[]) => {
    setError('');

    // Check max images limit
    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter((file) => {
      if (!ImageUploadService.validateFileType(file)) {
        setError(`${file.name} is not a valid image format`);
        return false;
      }
      if (!ImageUploadService.validateFileSize(file, maxSizeMB)) {
        setError(`${file.name} exceeds ${maxSizeMB}MB limit`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);

    try {
      // Upload all files in parallel
      const uploadPromises = validFiles.map((file) =>
        ImageUploadService.uploadImage(file, 'media', undefined, true)
      );

      const results = await Promise.all(uploadPromises);

      // Check for errors
      const failedUploads = results.filter((result) => result.error);
      if (failedUploads.length > 0) {
        setError(`Failed to upload ${failedUploads.length} image(s)`);
      }

      // Extract successful URLs
      const successfulUrls = results
        .filter((result) => !result.error && result.url)
        .map((result) => result.url);

      // Update parent component
      onChange([...images, ...successfulUrls]);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (imageUrl: string, index: number) => {
    // Remove from UI immediately
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);

    // Try to delete from storage (non-blocking)
    try {
      await ImageUploadService.deleteImageByUrl(imageUrl);
    } catch (err) {
      console.error('Failed to delete image from storage:', err);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 transition-colors',
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-gray-400',
          uploading && 'opacity-50 pointer-events-none'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="image-upload"
          className="hidden"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileInput}
          disabled={uploading || images.length >= maxImages}
        />

        <label
          htmlFor="image-upload"
          className="flex flex-col items-center justify-center cursor-pointer"
        >
          {uploading ? (
            <>
              <Loader2 className="h-12 w-12 text-gray-400 animate-spin mb-3" />
              <p className="text-sm text-gray-600">Uploading images...</p>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-gray-400 mb-3" />
              <p className="text-sm font-medium text-gray-700 mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, WEBP up to {maxSizeMB}MB ({images.length}/{maxImages} images)
              </p>
            </>
          )}
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((imageUrl, index) => (
            <Card
              key={index}
              className="relative group overflow-hidden aspect-square"
            >
              <img
                src={imageUrl}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Overlay with delete button */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => handleRemoveImage(imageUrl, index)}
                  className="rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Image number badge */}
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </Card>
          ))}

          {/* Add more placeholder */}
          {images.length < maxImages && (
            <label
              htmlFor="image-upload"
              className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
            >
              <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-xs text-gray-500">Add image</span>
            </label>
          )}
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs text-gray-500">
        {images.length === 0
          ? 'No images uploaded yet. Add images to create a gallery for your event.'
          : `${images.length} image${images.length > 1 ? 's' : ''} uploaded. You can add up to ${maxImages - images.length} more.`}
      </p>
    </div>
  );
};
