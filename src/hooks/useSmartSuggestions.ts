import { useState, useCallback } from 'react';

export const useSmartSuggestions = () => {
  // Log removed
  const [suggestions, setSuggestions] = useState<Record<string, any[]>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSuggestions = useCallback(async (field: string, value: string, error?: string, allData?: any) => {
    // Suggestions basiques pour l'instant
    const basicSuggestions: Record<string, string[]> = {
      name: ['John Doe', 'Jane Smith', 'Pierre Martin'],
      title: ['Développeur Full-Stack', 'Designer UX/UI', 'Chef de Projet'],
      company: ['TechCorp', 'Design Studio', 'Startup Inc'],
      email: ['john.doe@company.com', 'contact@business.com'],
      phone: ['+33 1 23 45 67 89', '+33 6 12 34 56 78']
    };

    const fieldSuggestions = basicSuggestions[field] || [];
    
    setSuggestions(prev => ({
      ...prev,
      [field]: fieldSuggestions.map(suggestion => ({
        text: suggestion,
        type: 'suggestion',
        confidence: 0.8
      }))
    }));
  }, []);

  const clearFieldSuggestions = useCallback((field: string) => {
    setSuggestions(prev => {
      const newSuggestions = { ...prev };
      delete newSuggestions[field];
      return newSuggestions;
    });
  }, []);

  const clearAllSuggestions = useCallback(() => {
    setSuggestions({});
  }, []);

  return {
    suggestions,
    isGenerating,
    generateSuggestions,
    clearFieldSuggestions,
    clearAllSuggestions
  };
};
