import { useState, useCallback, useMemo } from 'react';

export const useFormProgress = () => {
  // Log removed
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const updateProgress = useCallback((formData: any) => {
    // Calcul simple du progrès basé sur les champs remplis
    const fields = ['name', 'title', 'email', 'phone', 'company'];
    const filledFields = fields.filter(field => formData[field] && formData[field].trim());
    const progressPercent = Math.round((filledFields.length / fields.length) * 100);
    setProgress(progressPercent);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, 4));
  }, []);

  const previousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((stepIndex: number) => {
    setCurrentStep(Math.max(0, Math.min(stepIndex, 4)));
  }, []);

  return {
    currentStep,
    progress,
    updateProgress,
    nextStep,
    previousStep,
    goToStep
  };
};
