import { useState, useCallback } from 'react';
import { ImageConverter, ConversionResult } from '@/utils/imageConverter';

interface UseImageConversionOptions {
  type: 'avatar' | 'logo' | 'cover' | 'product' | 'media';
  maxSizeMB?: number;
  showProgress?: boolean;
}

interface UseImageConversionReturn {
  convertImage: (file: File) => Promise<ConversionResult | null>;
  isConverting: boolean;
  conversionProgress: number;
  lastConversion: ConversionResult | null;
  error: string | null;
  clearError: () => void;
}

export const useImageConversion = (
  options: UseImageConversionOptions
): UseImageConversionReturn => {
  const { type, maxSizeMB = 5, showProgress = true } = options;
  
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [lastConversion, setLastConversion] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const convertImage = useCallback(async (file: File): Promise<ConversionResult | null> => {
    // Validation de la taille
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Fichier trop volumineux. Maximum: ${maxSizeMB}MB`);
      return null;
    }

    // Validation du type
    if (!file.type.startsWith('image/')) {
      setError('Le fichier doit être une image');
      return null;
    }

    setIsConverting(true);
    setConversionProgress(0);
    setError(null);

    try {
      // Simuler le progrès de conversion
      if (showProgress) {
        const progressInterval = setInterval(() => {
          setConversionProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + Math.random() * 20;
          });
        }, 100);
      }

      // Conversion de l'image
      const result = await ImageConverter.optimizeByType(file, type);
      
      setConversionProgress(100);
      setLastConversion(result);
      
      // Nettoyer l'intervalle de progrès
      if (showProgress) {
        setTimeout(() => setConversionProgress(0), 1000);
      }

      return result;
    } catch (conversionError: any) {
      setError(conversionError.message || 'Erreur lors de la conversion');
      return null;
    } finally {
      setIsConverting(false);
    }
  }, [type, maxSizeMB, showProgress]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    convertImage,
    isConverting,
    conversionProgress,
    lastConversion,
    error,
    clearError
  };
};

// Hook pour la conversion en lot
export const useBatchImageConversion = () => {
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [results, setResults] = useState<ConversionResult[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const convertBatch = useCallback(async (
    files: File[],
    type: 'avatar' | 'logo' | 'cover' | 'product' | 'media'
  ): Promise<ConversionResult[]> => {
    setIsConverting(true);
    setConversionProgress(0);
    setResults([]);
    setErrors([]);

    const convertedResults: ConversionResult[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const result = await ImageConverter.optimizeByType(files[i], type);
        convertedResults.push(result);
        
        // Mettre à jour le progrès
        setConversionProgress(((i + 1) / files.length) * 100);
      } catch (error: any) {
        setErrors(prev => [...prev, `${files[i].name}: ${error.message}`]);
      }
    }

    setResults(convertedResults);
    setIsConverting(false);
    
    return convertedResults;
  }, []);

  return {
    convertBatch,
    isConverting,
    conversionProgress,
    results,
    errors
  };
};

// Hook pour vérifier le support des formats
export const useFormatSupport = () => {
  const [support, setSupport] = useState<{
    webp: boolean;
    avif: boolean;
    bestFormat: 'avif' | 'webp' | 'jpeg';
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkSupport = useCallback(async () => {
    setIsChecking(true);
    try {
      const formatSupport = await ImageConverter.checkFormatSupport();
      const bestFormat = await ImageConverter.getBestFormat();
      
      setSupport({
        ...formatSupport,
        bestFormat
      });
    } catch (error) {
      // Error log removed
    } finally {
      setIsChecking(false);
    }
  }, []);

  return {
    support,
    isChecking,
    checkSupport
  };
};
