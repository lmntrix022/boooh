/**
 * Composant FileUploader unifié
 *
 * Fonctionnalités:
 * - Upload avec drag & drop
 * - Validation (taille, type)
 * - Support multi-fichiers
 * - Indicateur de fichier sélectionné
 * - Loading state
 * - Messages d'erreur
 * - Support pour tous les types de fichiers
 */

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, AlertCircle, Loader2, FileIcon, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  label: string;
  value?: File | null;
  onChange: (file: File | null) => void;
  maxSizeMB?: number;
  className?: string;
  accept?: string;
  disabled?: boolean;
  existingFileUrl?: string; // Support existing file from database
  existingFileName?: string; // Display name for existing file
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  label,
  value,
  onChange,
  maxSizeMB = 50,
  className = "",
  accept = "*/*",
  disabled = false,
  existingFileUrl,
  existingFileName,
}) => {
  const [fileName, setFileName] = useState(value?.name || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine if showing new file or existing file
  const showingNewFile = !!value;
  const showingExistingFile = !!existingFileUrl && !showingNewFile;

  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) {
      setFileName('');
      onChange(null);
      setUploadError('');
      return;
    }

    // Validation de la taille
    if (file.size > maxSizeMB * 1024 * 1024) {
      setUploadError(`Fichier trop volumineux. Maximum: ${maxSizeMB}MB`);
      return;
    }

    setFileName(file.name);
    onChange(file);
    setUploadError('');
  }, [onChange, maxSizeMB]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleRemoveFile = () => {
    setFileName('');
    onChange(null);
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClickUpload = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("space-y-3", className)}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      {/* Zone de drop / File info */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg transition-all duration-200",
          dragActive && !disabled && "border-blue-500 bg-blue-50",
          uploadError && "border-red-300 bg-red-50",
          !(fileName || showingExistingFile) && "p-6 text-center",
          (fileName || showingExistingFile) && "p-4",
          disabled && "opacity-60 cursor-not-allowed"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* File Selected or Existing - Info Display */}
        {fileName || showingExistingFile ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {fileName || existingFileName || 'Fichier uploadé'}
                </p>
                <p className="text-xs text-gray-500">
                  {value ? formatFileSize(value.size) : 'Fichier existant'}
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleRemoveFile}
              disabled={disabled}
              className="flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          /* Drop Zone - Pas de fichier */
          <div
            onClick={handleClickUpload}
            className={cn(
              "cursor-pointer transition-colors",
              !disabled && "hover:bg-gray-50"
            )}
          >
            <div className="flex flex-col items-center justify-center space-y-2">
              {isUploading ? (
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              ) : (
                <Upload className="w-12 h-12 text-gray-400" />
              )}

              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">
                  {isUploading ? "Téléchargement en cours..." : "Cliquez ou glissez un fichier"}
                </p>
                <p className="text-xs text-gray-500">
                  Max {maxSizeMB}MB
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
          </div>
        )}

        {/* Input file caché */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* Messages d'erreur */}
      {uploadError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{uploadError}</p>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
