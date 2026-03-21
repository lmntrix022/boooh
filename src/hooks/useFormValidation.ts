import { useState, useCallback, useMemo } from 'react';

export const useFormValidation = () => {
  // Log removed
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  const validateField = useCallback(async (field: string, value: string, allData?: any): Promise<string | null> => {
    // Validation basique pour l'instant
    if (field === 'name' && (!value || value.trim().length < 2)) {
      return 'Le nom doit contenir au moins 2 caractères';
    }
    if (field === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Format d\'email invalide';
    }
    return null;
  }, []);

  const validateForm = useCallback(async (data: any): Promise<boolean> => {
    setIsValidating(true);
    try {
      const newErrors: Record<string, string> = {};
      
      // Validation basique
      if (!data.name || data.name.trim().length < 2) {
        newErrors.name = 'Le nom est requis (min 2 caractères)';
      }
      
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        newErrors.email = 'Format d\'email invalide';
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
    setWarnings({});
  }, []);

  const canSubmit = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  return {
    errors,
    warnings,
    isValidating,
    validateField,
    validateForm,
    clearFieldError,
    clearAllErrors,
    canSubmit
  };
};
