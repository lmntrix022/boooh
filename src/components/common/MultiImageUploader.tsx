/**
 * Composant MultiImageUploader
 *
 * Fonctionnalités:
 * - Upload multiple images
 * - Drag & drop support
 * - Image preview with thumbnails
 * - Remove individual images
 * - File validation
 * - Apple Design styling
 */

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MultiImageUploaderProps {
  label: string;
  value?: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  className?: string;
  disabled?: boolean;
}

export const MultiImageUploader: React.FC<MultiImageUploaderProps> = ({
  label,
  value = [],
  onChange,
  maxImages = 10,
  maxSizeMB = 5,
  className = "",
  disabled = false,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    if (disabled || value.length >= maxImages) return;

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    const remainingSlots = maxImages - value.length;
    const filesToProcess = files.slice(0, remainingSlots);
    
    processFiles(filesToProcess);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && value.length < maxImages) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = maxImages - value.length;
    const filesToProcess = files.slice(0, remainingSlots);
    processFiles(filesToProcess);
  };

  const processFiles = (files: File[]) => {
    setUploadError('');
    
    for (const file of files) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        setUploadError(`Fichier trop volumineux. Maximum: ${maxSizeMB}MB`);
        return;
      }
    }

    const newUrls: string[] = [];
    let processedCount = 0;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newUrls.push(e.target.result as string);
          processedCount++;

          if (processedCount === files.length) {
            onChange([...value, ...newUrls]);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleClickUpload = () => {
    if (!disabled && value.length < maxImages) {
      fileInputRef.current?.click();
    }
  };

  const canAddMore = value.length < maxImages;

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Images Preview Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
          {value.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                <img 
                  src={imageUrl} 
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
              <span className="absolute bottom-1 left-1 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {index + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Upload Zone */}
      {canAddMore && (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200",
            dragActive && !disabled && "border-blue-500 bg-blue-50",
            uploadError && "border-red-300 bg-red-50",
            disabled && "opacity-60 cursor-not-allowed",
            !dragActive && !uploadError && "border-gray-200 bg-gray-50 hover:bg-gray-100"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClickUpload}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            {isUploading ? (
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            ) : (
              <Upload className="w-10 h-10 text-gray-400" />
            )}

            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">
                {isUploading ? "Téléchargement..." : "Cliquez ou glissez des images"}
              </p>
              <p className="text-xs text-gray-500">
                {value.length}/{maxImages} images • Max {maxSizeMB}MB par image
              </p>
            </div>

            {!disabled && !isUploading && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClickUpload();
                }}
              >
                <Upload className="w-4 h-4 mr-2" />
                Parcourir
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={disabled}
          />
        </div>
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex-shrink-0 mt-0.5">
            <X className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-sm text-red-700">{uploadError}</p>
        </div>
      )}

      {/* Info Message */}
      {value.length >= maxImages && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <ImageIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            Limite maximum ({maxImages} images) atteinte. Supprimez une image pour en ajouter une autre.
          </p>
        </div>
      )}
    </div>
  );
};

export default MultiImageUploader;
