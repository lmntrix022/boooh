/**
 * CardFormBasicInfo Component - Version Premium
 * 
 * Composant modulaire pour l'étape "Informations de base" du formulaire de carte
 * Version améliorée avec statistiques, progression et design premium
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, User, Briefcase, MapPin, FileText, Sparkles, Check, TrendingUp, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { ModernInput } from './ModernInput';
import { LocationPicker } from './LocationPicker';

interface StepProps {
  data: Record<string, any>;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
  suggestions?: Record<string, string>;
}

export const CardFormBasicInfo: React.FC<StepProps> = ({ 
  data, 
  onChange, 
  errors, 
  suggestions 
}) => {
  const { t } = useLanguage();
  const safeData = data || {};
  const safeErrors = errors || {};
  const safeSuggestions = suggestions || {};

  // Calcul des statistiques
  const stats = useMemo(() => {
    const hasName = !!safeData.name?.trim();
    const hasTitle = !!safeData.title?.trim();
    const hasCompany = !!safeData.company?.trim();
    const hasLocation = !!safeData.selectedLocation || !!safeData.location;
    const hasDescription = !!safeData.description?.trim();
    const hasSkills = !!safeData.skills?.trim();
    
    const requiredFields = [hasName, hasTitle];
    const optionalFields = [hasCompany, hasLocation, hasDescription, hasSkills];
    
    const requiredCount = requiredFields.filter(Boolean).length;
    const optionalCount = optionalFields.filter(Boolean).length;
    const totalCount = requiredCount + optionalCount;
    const completionPercentage = Math.round((totalCount / 6) * 100);
    
    return {
      hasName,
      hasTitle,
      hasCompany,
      hasLocation,
      hasDescription,
      hasSkills,
      requiredCount,
      optionalCount,
      totalCount,
      completionPercentage
    };
  }, [safeData]);

  return (
    <div className="space-y-6">
      {/* En-tête Apple Minimal */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
          <Users className="h-6 w-6 text-gray-600" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-light tracking-tight text-gray-900"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
              letterSpacing: '-0.02em',
            }}
          >
            {t('editCardForm.basics.title') || 'Informations de base'}
          </h2>
          <p className="text-sm font-light text-gray-500"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            {t('editCardForm.basics.description') || 'Commencez par vos informations essentielles'}
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <div className="text-2xl font-light text-gray-900"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                {stats.hasName ? '✓' : '—'}
              </div>
              <div className="text-xs font-light text-gray-500"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >Nom complet</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <div className="text-2xl font-light text-gray-900"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                {stats.hasTitle ? '✓' : '—'}
              </div>
              <div className="text-xs font-light text-gray-500"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >Titre professionnel</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <div className="text-2xl font-light text-gray-900"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                {stats.hasLocation ? '✓' : '—'}
              </div>
              <div className="text-xs font-light text-gray-500"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >Localisation</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <div className="text-2xl font-light text-gray-900"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                {stats.totalCount}/6
              </div>
              <div className="text-xs font-light text-gray-500"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >Champs remplis</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Barre de progression */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Progression</span>
          <span className="text-sm font-light text-gray-900"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
            }}
          >{stats.completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.completionPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-gray-900 rounded-full"
          />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Champs requis: {stats.requiredCount}/2</span>
          <span>Champs optionnels: {stats.optionalCount}/4</span>
        </div>
      </div>

      {/* Champs requis */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-gray-900 rounded-full"></div>
          <h3 className="text-sm font-light text-gray-900 uppercase tracking-wide"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            Informations essentielles
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`relative ${stats.hasName ? 'ring-1 ring-gray-200 rounded-lg p-1' : ''}`}
          >
            <ModernInput
              label={t('editCardForm.basics.fullName.label')}
              value={safeData.name || ''}
              onChange={(value) => onChange('name', value)}
              error={safeErrors.name}
              suggestion={safeSuggestions.name}
              required
              placeholder={t('editCardForm.basics.fullName.placeholder')}
            />
            {stats.hasName && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center shadow-sm z-10"
              >
                <Check className="w-4 h-4 text-white" />
              </motion.div>
            )}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`relative ${stats.hasTitle ? 'ring-2 ring-green-200 rounded-xl p-1' : ''}`}
          >
            <ModernInput
              label={t('editCardForm.basics.professionalTitle.label')}
              value={safeData.title || ''}
              onChange={(value) => onChange('title', value)}
              error={safeErrors.title}
              suggestion={safeSuggestions.title}
              required
              placeholder={t('editCardForm.basics.professionalTitle.placeholder')}
            />
            {stats.hasTitle && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center shadow-sm z-10"
              >
                <Check className="w-4 h-4 text-white" />
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Champs optionnels */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-gray-300 rounded-full"></div>
          <h3 className="text-sm font-light text-gray-700 uppercase tracking-wide"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            Informations complémentaires
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`relative ${stats.hasCompany ? 'ring-1 ring-gray-200 rounded-lg p-1' : ''}`}
          >
            <ModernInput
              label={t('editCardForm.basics.company.label')}
              value={safeData.company || ''}
              onChange={(value) => onChange('company', value)}
              error={safeErrors.company}
              placeholder={t('editCardForm.basics.company.placeholder')}
            />
            {stats.hasCompany && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center shadow-sm z-10"
              >
                <Check className="w-4 h-4 text-white" />
              </motion.div>
            )}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`relative ${stats.hasLocation ? 'ring-1 ring-gray-200 rounded-lg p-1' : ''}`}
          >
            <LocationPicker
              value={safeData.selectedLocation}
              onChange={(location) => onChange('selectedLocation', location)}
              onAddressChange={(address) => onChange('location', address)}
            />
            {stats.hasLocation && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center shadow-sm z-10"
              >
                <Check className="w-4 h-4 text-white" />
              </motion.div>
            )}
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
            className={`relative ${stats.hasDescription ? 'ring-1 ring-gray-200 rounded-lg p-1' : ''}`}
        >
          <div className="space-y-2">
            <label className="text-sm font-light text-gray-700 mb-2 flex items-center gap-2"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              <FileText className="w-4 h-4" />
              {t('editCardForm.basics.descriptionField.label') || 'Description'}
            </label>
            <textarea
              value={safeData.description || ''}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder={t('editCardForm.basics.descriptionField.placeholder')}
              rows={4}
              className="w-full px-4 py-3 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm transition-all font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            />
            {stats.hasDescription && (
              <div className="absolute top-8 right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg z-10">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
            className={`relative ${stats.hasSkills ? 'ring-1 ring-gray-200 rounded-lg p-1' : ''}`}
        >
          <div className="space-y-2">
            <label className="text-sm font-light text-gray-700 mb-2 flex items-center gap-2"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              <Sparkles className="w-4 h-4" />
              {t('editCardForm.basics.skills.label') || 'Compétences'}
            </label>
            <input
              type="text"
              value={safeData.skills || ''}
              onChange={(e) => onChange('skills', e.target.value)}
              placeholder={t('editCardForm.basics.skills.placeholder')}
              className="w-full h-12 px-4 py-3 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm transition-all font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            />
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {t('editCardForm.basics.skills.example') || 'Ex: JavaScript, React, Design, Marketing'}
            </p>
            {stats.hasSkills && (
              <div className="absolute top-8 right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg z-10">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Conseils */}
      {stats.requiredCount < 2 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-50 rounded-lg p-4 border border-gray-200"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-light text-gray-900 mb-1"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >Informations requises manquantes</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                {!stats.hasName && <li>• Le nom complet est obligatoire pour créer votre carte</li>}
                {!stats.hasTitle && <li>• Le titre professionnel est obligatoire</li>}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Conseils pour améliorer */}
      {stats.requiredCount === 2 && stats.optionalCount < 4 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200"
        >
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-light text-gray-900 mb-1"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >Conseils pour enrichir votre profil</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                {!stats.hasCompany && <li>• Ajoutez votre entreprise pour renforcer votre crédibilité professionnelle</li>}
                {!stats.hasLocation && <li>• Indiquez votre localisation pour faciliter les rencontres</li>}
                {!stats.hasDescription && <li>• Une description détaillée aide les visiteurs à mieux vous connaître</li>}
                {!stats.hasSkills && <li>• Listez vos compétences pour améliorer votre visibilité</li>}
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CardFormBasicInfo;
