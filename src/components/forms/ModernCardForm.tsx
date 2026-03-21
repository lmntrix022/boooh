import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// TODO: Re-enable these hooks when validation is restored
// import { useDebounce } from '@/hooks/useDebounce';
// import { useAutoSave } from '@/hooks/useAutoSave';
// import { useFormValidation } from '@/hooks/useFormValidation';
// import { useFormProgress } from '@/hooks/useFormProgress';
// import { useSmartSuggestions } from '@/hooks/useSmartSuggestions';
import { supabase } from '@/integrations/supabase/client';
import { ImageUploader } from './ImageUploader';
import { CardFormBasicInfo } from './CardFormBasicInfo';
import { CardFormContact } from './CardFormContact';
import { CardFormAppearance } from './CardFormAppearance';
import { CardFormSocial } from './CardFormSocial';
import { CardFormMedia } from './CardFormMedia';
import { CardFormMediaContent } from './CardFormMediaContent';
import { ModernInput } from './ModernInput';
import { LocationPicker } from './LocationPicker';
import { PartyThemeSelector } from './PartyThemeSelector';
import { ModernThemeSelector } from './ModernThemeSelector';
import { FontSelector, FONT_MAP } from './FontSelector';
import { DesignPreview } from './DesignPreview';
import {
  ChevronLeft, ChevronRight, Check, X, Plus,
  Eye, Sparkles, Zap, Target, Users, Loader2, AlertCircle, Play,
  Linkedin, Instagram, Twitter, Facebook, Youtube, MessageCircle, Globe, Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/PageHeader';
import { AnimatedOrbs } from '@/components/ui/AnimatedOrbs';
import { useLanguage } from '@/hooks/useLanguage';

interface FormStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  isComplete: boolean;
  isRequired: boolean;
}

interface ModernCardFormProps {
  initialData?: any;
  onSave: (data: any) => Promise<void>;
  onPublish?: (data: any) => Promise<void>;
  mode: 'create' | 'edit';
}


export const ModernCardForm: React.FC<ModernCardFormProps> = ({
  initialData,
  onSave,
  onPublish,
  mode
}) => {
  const { t } = useLanguage();
  
  // État du formulaire avec validation en temps réel
  const [formData, setFormData] = useState(initialData || {});
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // TODO: Re-enable preview feature
  // const [showPreview, setShowPreview] = useState(false);
  const [autoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Log removed

  // Temporairement désactiver les hooks pour éviter les boucles infinies
  // Log removed
  const validationErrors = {};
  const suggestions = {};

  // Fonctions temporaires pour éviter les erreurs - TODO: Re-enable hooks
  // const updateProgress = (..._args: any[]) => {};
  const validateField = (..._args: any[]) => {};
  const validateForm = (..._args: any[]) => ({ isValid: true });
  const generateSuggestions = (..._args: any[]) => {};

  // Étapes du formulaire avec progression intelligente
  const steps: FormStep[] = [
    {
      id: 'basics',
      title: t('editCardForm.steps.basics.title'),
      description: t('editCardForm.steps.basics.description'),
      icon: <Users className="w-5 h-5" />,
      isComplete: !!(formData.name && formData.title && formData.company),
      isRequired: true
    },
    {
      id: 'contact',
      title: t('editCardForm.steps.contact.title'),
      description: t('editCardForm.steps.contact.description'),
      icon: <Target className="w-5 h-5" />,
      isComplete: !!(formData.email || formData.phone || formData.website),
      isRequired: false
    },
    {
      id: 'media',
      title: t('editCardForm.steps.media.title'),
      description: t('editCardForm.steps.media.description'),
      icon: <Eye className="w-5 h-5" />,
      isComplete: !!(formData.avatarUrl || formData.coverImageUrl || formData.companyLogoUrl),
      isRequired: false
    },
    {
      id: 'media_content',
      title: t('editCardForm.steps.mediaContent.title'),
      description: t('editCardForm.steps.mediaContent.description'),
      icon: <Play className="w-5 h-5" />,
      isComplete: !!(formData.mediaContent && formData.mediaContent.length > 0),
      isRequired: false
    },
    {
      id: 'social',
      title: t('editCardForm.steps.social.title'),
      description: t('editCardForm.steps.social.description'),
      icon: <Sparkles className="w-5 h-5" />,
      isComplete: !!(formData.linkedin || formData.instagram || formData.twitter || formData.facebook || formData.youtube || formData.tiktok || formData.discord || formData.github || formData.whatsapp || formData.portfolio || (formData.websites && formData.websites.length > 0) || (formData.portfolios && formData.portfolios.length > 0)),
      isRequired: false
    },
    {
      id: 'design',
      title: t('editCardForm.steps.design.title'),
      description: t('editCardForm.steps.design.description'),
      icon: <Zap className="w-5 h-5" />,
      isComplete: !!formData.theme,
      isRequired: false
    }
  ];
  // Log removed

  // Calculer la progression en fonction de l'étape actuelle
  const calculateProgress = () => {
    // Progression basée sur l'étape actuelle (commence à 0)
    const stepProgress = currentStep / steps.length;
    
    // Bonus pour les étapes complétées
    const completedSteps = steps.filter(step => step.isComplete).length;
    const completionBonus = completedSteps / steps.length * 0.2; // 20% de bonus max
    
    return Math.min(stepProgress + completionBonus, 1);
  };

  const progress = calculateProgress();

  // Navigation intelligente entre les étapes
  // Log removed
  const canGoNext = () => {
    const currentStepData = steps[currentStep];
    const canGo = !currentStepData.isRequired || currentStepData.isComplete;
    // Log removed
    return canGo;
  };

  const handleNext = () => {
    // Log removed
    if (canGoNext() && currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      // La progression se met à jour automatiquement grâce au calculateProgress()
    }
  };

  const handlePrevious = () => {
    // Log removed
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      // La progression se met à jour automatiquement grâce au calculateProgress()
    }
  };

  // Gestion intelligente des changements de données
  const handleFieldChange = useCallback((field: string, value: any) => {
    // Log removed
    // Log removed
    // Log removed
    // Log removed
    // Log removed
    // Log removed
    
    setFormData((prev: Record<string, any>) => {
      // Log removed
      const newData = { ...prev, [field]: value };
      // Log removed
      // Log removed
      // Log removed
      // Log removed
      return newData;
    });
    
    // Validation en temps réel (avec gestion d'erreur)
    try {
      if (validateField) {
        validateField(field, value);
      }
      if (generateSuggestions) {
        generateSuggestions(field, value);
      }
    } catch (error) {
      // Error log removed
    }
  }, [validateField, generateSuggestions]);

  // Sauvegarde avec feedback visuel
  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await onSave(formData);
      // Log removed
      // Feedback de succès
    } catch (error) {
      // Error log removed
      // Gestion d'erreur intelligente
    } finally {
      setIsSubmitting(false);
    }
  };

  // Publication avec confirmation
  const handlePublish = async () => {
    // Log removed
    // Log removed
    // Log removed
    
    if (!validateForm(formData)) {
      // Log removed
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onPublish?.(formData);
      // Log removed
    } catch (error) {
      // Error log removed
      // Gestion d'erreur
    } finally {
      setIsSubmitting(false);
    }
  };

  // Log removed
  return (
    <div className="relative min-h-screen bg-white overflow-x-hidden">
      <div className="relative z-10 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Header Apple Minimal */}
        <div className="mb-6 md:mb-8">
          <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8 lg:p-10 overflow-visible">
            <div className="relative z-10">
              <div className="flex items-center gap-4 md:gap-6">
                {/* Icon Container Apple Minimal */}
                <div className="relative w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                  <Edit className="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-gray-600 relative z-10" />
                </div>
                
                <div className="min-w-0 flex-1">
                  <h1
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-tight text-gray-900 mb-2 break-words"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {mode === 'create' ? t('editCardForm.header.createTitle') : t('editCardForm.header.editTitle')}
                  </h1>
                  <p
                    className="text-sm md:text-base font-light text-gray-500"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {mode === 'create' ? t('editCardForm.header.createDescription') : t('editCardForm.header.editDescription')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barre de progression Apple Minimal */}
        <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="relative z-10 p-6 md:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                <span className="text-sm font-light text-gray-700"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                    {t('editCardForm.progress.step', { current: currentStep + 1, total: steps.length })}
                  </span>
                <span className="text-xs font-light text-gray-500"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                    {steps[currentStep]?.title}
                  </span>
                </div>
                <span 
                className="text-sm font-light text-gray-900"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('editCardForm.progress.completed', { percent: Math.round(progress * 100) })}
                </span>
              </div>
              
            <div className="relative w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <motion.div 
                className="absolute inset-y-0 left-0 bg-gray-900 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
        </div>

        {/* Navigation des étapes Apple Minimal */}
        <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="relative z-10 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2 sm:gap-3">
              {steps.map((step, index) => (
                  <button
                  key={step.id}
                  onClick={() => setCurrentStep(index)}
                    className={`relative flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-200 border text-xs sm:text-sm font-light ${
                    index === currentStep
                        ? 'bg-gray-50 text-gray-900 border-gray-200 shadow-sm'
                      : index < currentStep
                        ? 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 shadow-sm'
                  }`}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <div className={index === currentStep ? "text-gray-600" : "text-gray-600"}>
                  {step.icon}
                    </div>
                    <span className="hidden sm:inline">{step.title}</span>
                  {step.isComplete && (
                      <div>
                    <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                  )}
                  </button>
              ))}
            </div>
          </div>
          </div>
        </div>

        {/* Contenu de l'étape actuelle Apple Minimal */}
        <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="relative z-10 p-6 sm:p-8 md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 0 && (
                <CardFormBasicInfo
                  data={formData}
                  onChange={handleFieldChange}
                  errors={validationErrors}
                  suggestions={suggestions}
                />
              )}
              
              {currentStep === 1 && (
                <CardFormContact
                  data={formData}
                  onChange={handleFieldChange}
                  errors={validationErrors}
                />
              )}
              
              {currentStep === 2 && (
                <CardFormMedia
                  data={formData}
                  onChange={handleFieldChange}
                  errors={validationErrors}
                  suggestions={suggestions}
                />
              )}
              
              {currentStep === 3 && (
                <CardFormMediaContent
                  data={formData}
                  onChange={handleFieldChange}
                  errors={validationErrors}
                  suggestions={suggestions}
                  cardId={mode === 'edit' ? formData.id : undefined}
                />
              )}
              
              {currentStep === 4 && (
                <CardFormSocial
                  data={formData}
                  onChange={(field: string, value: any) => {
                    handleFieldChange(field, value);
                  }}
                  errors={validationErrors}
                  suggestions={suggestions}
                />
              )}
              
              {currentStep === 5 && (
                <CardFormAppearance
                  data={formData}
                  onChange={handleFieldChange}
                />
              )}
            </motion.div>
          </AnimatePresence>

            {/* Navigation entre étapes Apple Minimal */}
            <div className="flex flex-row justify-between items-center mt-6 sm:mt-8 pt-6 border-t border-gray-200 space-x-2 sm:space-x-4">
            <Button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              variant="outline"
                className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 disabled:opacity-50 font-light shadow-sm transition-all duration-200"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{t('editCardForm.buttons.previous')}</span>
            </Button>

            <div className="flex flex-row space-x-2 sm:space-x-4">
              {onPublish && (
                <Button
                  onClick={handlePublish}
                  disabled={isSubmitting}
                    className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 rounded-lg bg-gray-900 hover:bg-gray-800 text-white shadow-sm transition-all duration-200 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                  <Eye className="w-4 h-4" />
                      )}
                  <span className="hidden sm:inline">{isSubmitting ? t('editCardForm.buttons.publishing') : t('editCardForm.buttons.publish')}</span>
                </Button>
              )}

            <Button
                  onClick={currentStep === steps.length - 1 ? handleSave : handleNext}
                  disabled={isSubmitting}
                  className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 rounded-lg bg-gray-900 hover:bg-gray-800 text-white shadow-sm transition-all duration-200 disabled:opacity-50 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="hidden sm:inline">{t('editCardForm.buttons.saving')}</span>
                    </>
                  ) : currentStep === steps.length - 1 ? (
                    <>
                      <span className="hidden sm:inline">{t('editCardForm.buttons.save')}</span>
                      <Check className="w-4 h-4" />
                    </>
                  ) : (
                    <>
              <span className="hidden sm:inline">{t('editCardForm.buttons.next')}</span>
              <ChevronRight className="w-4 h-4" />
                    </>
                  )}
            </Button>
          </div>
          </div>
          </div>
        </div>

        {/* Statut de l'auto-sauvegarde Apple Minimal */}
        {autoSaveStatus !== 'idle' && (
          <motion.div
            className="fixed bottom-4 right-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4 z-50"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center space-x-3">
              {autoSaveStatus === 'saving' && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-5 h-5 text-gray-900" />
                </motion.div>
              )}
              {autoSaveStatus === 'saved' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <Check className="w-5 h-5 text-gray-900" />
                </motion.div>
              )}
              {autoSaveStatus === 'error' && (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className="text-sm font-light text-gray-900"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                {autoSaveStatus === 'saving' && t('editCardForm.autoSave.saving')}
                {autoSaveStatus === 'saved' && t('editCardForm.autoSave.saved')}
                {autoSaveStatus === 'error' && t('editCardForm.autoSave.error')}
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Types pour les composants d'étapes
interface StepProps {
  data: Record<string, any>;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
  suggestions?: Record<string, string>;
}

// Composants d'étapes - Maintenant importés depuis des fichiers séparés
// BasicInfoStep -> CardFormBasicInfo
// ContactStep -> CardFormContact
// DesignStep -> CardFormAppearance (partiellement, dépendances complexes restent ici)



const DesignStep = ({ data, onChange }: Pick<StepProps, 'data' | 'onChange'>) => {
  const { t } = useLanguage();
  const safeData = data || {};
  const [mode, setMode] = useState<'theme' | 'fonts' | 'parties'>('theme');
  const [activeParties, setActiveParties] = useState<any[]>([]);
  const [partyThemes, setPartyThemes] = useState<any[]>([]);

  // Charger dynamiquement la police sélectionnée via Google Fonts
  useEffect(() => {
    const cls = safeData.font_family as string | undefined;
    if (!cls) return;
    const family = FONT_MAP[cls]?.google;
    if (!family) return;
    const id = 'dynamic-google-font';
    const href = `https://fonts.googleapis.com/css2?family=${family}:wght@400;500;600;700&display=swap`;
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = href;
  }, [safeData.font_family]);

  // Charger les fêtes actives
  useEffect(() => {
    const fetchActiveParties = async () => {
      try {
        const now = new Date();
        const { data: parties, error } = await supabase
          .from('party')
          .select(`
            *,
            themes:themes_party(*)
          `)
          .eq('is_active', true);

        if (error) {
          // Error log removed
          return;
        }

        const activeParties = parties?.filter(party => {
          const startDate = party.start_date ? new Date(party.start_date) : null;
          const endDate = party.end_date ? new Date(party.end_date) : null;
          return (!startDate || now >= startDate) && (!endDate || now <= endDate);
        }) || [];

        setActiveParties(activeParties);
        
        // Charger tous les thèmes de fêtes actives
        const allThemes = activeParties.flatMap(party => 
          party.themes?.map((theme: any) => ({ ...theme, party_name: party.name })) || []
        );
        setPartyThemes(allThemes);
        
        // Log removed
        // Log removed
      } catch (error) {
        // Error log removed
      }
    };

    fetchActiveParties();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
          <Zap className="h-6 w-6 text-gray-600" />
        </div>
      <div>
          <h2 className="text-xl md:text-2xl font-light tracking-tight text-gray-900"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
              letterSpacing: '-0.02em',
            }}
          >{t('editCardForm.design.title')}</h2>
          <p className="text-sm font-light text-gray-500"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >{t('editCardForm.design.description')}</p>
        </div>
      </div>
      <div className="mt-3 inline-flex items-center bg-white rounded-lg border border-gray-200 shadow-sm px-1">
        <button
            type="button"
            onClick={() => setMode('theme')}
          className={`px-4 py-2 text-sm font-light rounded-md transition-all duration-200 ${
            mode === 'theme' 
              ? 'bg-gray-50 text-gray-900' 
              : 'text-gray-600 hover:bg-gray-50'
          }`}
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            fontWeight: 300,
          }}
          >
            {t('editCardForm.design.themes')}
        </button>
        <button
            type="button"
            onClick={() => setMode('fonts')}
          className={`px-4 py-2 text-sm font-light rounded-md transition-all duration-200 ${
            mode === 'fonts' 
              ? 'bg-gray-50 text-gray-900' 
              : 'text-gray-600 hover:bg-gray-50'
          }`}
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            fontWeight: 300,
          }}
          >
            {t('editCardForm.design.fonts')}
        </button>
          {activeParties.length > 0 && (
            <button
              type="button"
              onClick={() => setMode('parties')}
              className={`px-3 py-1 text-sm rounded-lg ${mode === 'parties' ? 'bg-gray-900 text-white' : 'text-gray-700'}`}
            >
              {t('editCardForm.design.parties', { count: activeParties.length })}
            </button>
          )}
        </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-3">
          {mode === 'theme' ? (
        <ModernThemeSelector
          value={safeData.theme}
          onChange={(value) => onChange('theme', value)}
        />
          ) : mode === 'fonts' ? (
            <FontSelector
              value={safeData.font_family}
              onChange={(value) => {
                // Log removed
                onChange('font_family', value);
              }}
            />
          ) : (
            <PartyThemeSelector
              value={safeData.party_theme_id}
              onChange={(value) => onChange('party_theme_id', value)}
              partyThemes={partyThemes}
              activeParties={activeParties}
            />
          )}
        </div>
        <DesignPreview
          themeToken={safeData.theme}
          fontClass={safeData.font_family}
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          {t('editCardForm.design.publicCard')}
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={safeData.isPublic || false}
            onChange={(e) => onChange('isPublic', e.target.checked)}
            className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
          />
          <span className="text-sm text-gray-700">
            {t('editCardForm.design.publicCardDescription')}
          </span>
        </div>
      </div>
    </div>
  );
};


// ModernInput est maintenant importé depuis './ModernInput'

const ModernImageUploader = ({ label, value, onChange, accept, maxSize }: any) => {
  const { t } = useLanguage();
  const [previewUrl, setPreviewUrl] = useState(value || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    setPreviewUrl(value || '');
  }, [value]);

  const uploadToSupabase = async (file: File): Promise<string> => {
    try {
      // Déterminer le bucket selon le type d'image
      let bucket = 'avatars';
      let fileName = `avatar-${Date.now()}-${file.name}`;
      
      if (label.includes('logo') || label.includes('entreprise')) {
        bucket = 'avatars';
        fileName = `logo-${Date.now()}-${file.name}`;
      } else if (label.includes('couverture') || label.includes('cover')) {
        bucket = 'card-covers';
        fileName = `cover-${Date.now()}-${file.name}`;
      }

      // Upload vers Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        // Error log removed
        throw error;
      }

      // Obtenir l'URL publique
      const { data: publicData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return publicData.publicUrl;
    } catch (error) {
      // Error log removed
      throw error;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation de la taille
    if (maxSize && file.size > maxSize) {
      setUploadError(t('editCardForm.imageUpload.errors.fileTooLarge', { max: Math.round(maxSize / 1024 / 1024) }));
      return;
    }

    // Validation du type
    if (!file.type.startsWith('image/')) {
      setUploadError(t('editCardForm.imageUpload.errors.invalidFile'));
      return;
    }

      setIsUploading(true);
    setUploadError('');
    
    // Créer une prévisualisation temporaire
      const tempUrl = URL.createObjectURL(file);
      setPreviewUrl(tempUrl);

    try {
      // Upload vers Supabase
      const uploadedUrl = await uploadToSupabase(file);
      
      // Mettre à jour avec l'URL Supabase
      setPreviewUrl(uploadedUrl);
      onChange(uploadedUrl);
      
      // Nettoyer l'URL temporaire
      URL.revokeObjectURL(tempUrl);
      
    } catch (error: any) {
      // Error log removed
      setUploadError(error.message || t('editCardForm.imageUpload.errors.uploadError'));
      setPreviewUrl(value || ''); // Revenir à l'ancienne valeur
    } finally {
        setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl('');
    onChange('');
    const fileInput = document.getElementById(`file-${label}`) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      
      {previewUrl ? (
        <div className="relative group">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <img
              src={previewUrl}
              alt={label}
              className="w-full h-32 object-cover"
            />
            
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                <label
                  htmlFor={`file-${label}`}
                  className="cursor-pointer bg-white text-gray-700 px-3 py-1 rounded-md text-sm hover:bg-gray-100 transition-colors"
                >
                  {isUploading ? t('editCardForm.imageUpload.uploading') : t('editCardForm.imageUpload.change')}
                </label>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600 transition-colors"
                >
                  {t('editCardForm.imageUpload.delete')}
                </button>
              </div>
            </div>
          </div>
          
          {isUploading && (
            <div className="absolute top-2 right-2 bg-gray-900 text-white px-2 py-1 rounded-md text-xs">
              <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
              {t('editCardForm.imageUpload.uploading')}
            </div>
          )}
        </div>
      ) : (
        <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700">
                {t('editCardForm.imageUpload.clickToSelect')}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {t('editCardForm.imageUpload.formats', { max: maxSize ? Math.round(maxSize / 1024 / 1024) : 5 })}
              </p>
            </div>
            
            <input
              type="file"
              accept={accept}
              onChange={handleFileChange}
              className="hidden"
              id={`file-${label}`}
            />
            <label
              htmlFor={`file-${label}`}
              className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-900 hover:bg-gray-900 text-white rounded-md text-sm transition-colors"
            >
              {t('editCardForm.imageUpload.selectFile')}
            </label>
          </div>
        </div>
      )}
      
      {/* Affichage des erreurs d'upload */}
      {uploadError && (
        <div className="flex items-center space-x-2 p-3 bg-red-600 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-gray-700 flex-shrink-0" />
          <p className="text-sm text-gray-700">{uploadError}</p>
        </div>
      )}
    </div>
  );
};



const ModernColorPicker = ({ label, value, onChange }: any) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type="color"
        value={value || '#3B82F6'}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 border border-white/30 rounded-lg"
      />
    </div>
  );
};

// LocationPicker est maintenant importé depuis './LocationPicker'
