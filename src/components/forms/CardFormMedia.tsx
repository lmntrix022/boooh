/**
 * CardFormMedia Component - Version Premium
 * 
 * Composant modulaire pour l'étape "Médias" du formulaire de carte
 * Gestion des images statiques : avatar, logo, couverture
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, User, Building2, Image as ImageIcon, Upload, Check, X, TrendingUp, ImagePlus } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { ImageUploader } from '@/components/common/ImageUploader';

interface StepProps {
  data: Record<string, any>;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
  suggestions?: Record<string, string[]>;
}

export const CardFormMedia: React.FC<StepProps> = ({ 
  data, 
  onChange 
}) => {
  const { t } = useLanguage();
  const safeData = data || {};

  // Statistiques des médias
  const hasAvatar = !!safeData.avatarUrl;
  const hasLogo = !!safeData.companyLogoUrl;
  const hasCover = !!safeData.coverImageUrl;
  const mediaCount = [hasAvatar, hasLogo, hasCover].filter(Boolean).length;
  const completionPercentage = Math.round((mediaCount / 3) * 100);

  return (
    <div className="space-y-6">
      {/* En-tête Apple Minimal */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
          <Eye className="h-6 w-6 text-gray-600" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-light tracking-tight text-gray-900"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
              letterSpacing: '-0.02em',
            }}
          >
            {t('editCardForm.media.title') || 'Médias'}
          </h2>
          <p className="text-sm font-light text-gray-500"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            {t('editCardForm.media.description') || 'Ajoutez votre photo, logo et image de couverture'}
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
              <ImagePlus className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <div className="text-2xl font-light text-gray-900"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >{mediaCount}/3</div>
              <div className="text-xs font-light text-gray-500"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >Médias ajoutés</div>
            </div>
          </div>
        </div>
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
              >{hasAvatar ? '✓' : '—'}</div>
              <div className="text-xs font-light text-gray-500"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >Photo de profil</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <div className="text-2xl font-light text-gray-900"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >{hasLogo ? '✓' : '—'}</div>
              <div className="text-xs font-light text-gray-500"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >Logo entreprise</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <div className="text-2xl font-light text-gray-900"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >{hasCover ? '✓' : '—'}</div>
              <div className="text-xs font-light text-gray-500"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >Image couverture</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Barre de progression Apple Minimal */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-light text-gray-700"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >Progression</span>
          <span className="text-sm font-light text-gray-900"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
            }}
          >{completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-gray-900 rounded-full"
          />
        </div>
      </div>

      {/* Grille des uploaders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Avatar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <div className={`p-1 rounded-lg border transition-all ${
            hasAvatar 
              ? 'border-gray-200 bg-gray-50' 
              : 'border-gray-200 bg-white'
          }`}>
            <div className="bg-white rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                    hasAvatar ? 'bg-gray-100 border-gray-200' : 'bg-gray-100 border-gray-200'
                  }`}>
                    <User className={`w-5 h-5 ${hasAvatar ? 'text-gray-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-light text-gray-900"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('editCardForm.media.avatar.label') || 'Photo de profil'}
                    </h3>
                    <p className="text-xs font-light text-gray-500"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >Max 5MB</p>
                  </div>
                </div>
                {hasAvatar && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center shadow-sm"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </div>
              <ImageUploader
                label=""
                value={safeData.avatarUrl}
                onChange={(value) => onChange('avatarUrl', value)}
                type="avatar"
                maxSizeMB={5}
              />
            </div>
          </div>
        </motion.div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          <div className={`p-1 rounded-lg border transition-all ${
            hasLogo 
              ? 'border-gray-200 bg-gray-50' 
              : 'border-gray-200 bg-white'
          }`}>
            <div className="bg-white rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                    hasLogo ? 'bg-gray-100 border-gray-200' : 'bg-gray-100 border-gray-200'
                  }`}>
                    <Building2 className={`w-5 h-5 ${hasLogo ? 'text-gray-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-light text-gray-900"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('editCardForm.media.logo.label') || 'Logo entreprise'}
                    </h3>
                    <p className="text-xs font-light text-gray-500"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >Max 5MB</p>
                  </div>
                </div>
                {hasLogo && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center shadow-sm"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </div>
              <ImageUploader
                label=""
                value={safeData.companyLogoUrl}
                onChange={(value) => onChange('companyLogoUrl', value)}
                type="logo"
                maxSizeMB={5}
              />
            </div>
          </div>
        </motion.div>

        {/* Couverture */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative md:col-span-2 lg:col-span-1"
        >
          <div className={`p-1 rounded-lg border transition-all ${
            hasCover 
              ? 'border-gray-200 bg-gray-50' 
              : 'border-gray-200 bg-white'
          }`}>
            <div className="bg-white rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                    hasCover ? 'bg-gray-100 border-gray-200' : 'bg-gray-100 border-gray-200'
                  }`}>
                    <ImageIcon className={`w-5 h-5 ${hasCover ? 'text-gray-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-light text-gray-900"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('editCardForm.media.cover.label') || 'Image de couverture'}
                    </h3>
                    <p className="text-xs font-light text-gray-500"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >Max 10MB</p>
                  </div>
                </div>
                {hasCover && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center shadow-sm"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </div>
              <ImageUploader
                label=""
                value={safeData.coverImageUrl}
                onChange={(value) => onChange('coverImageUrl', value)}
                type="cover"
                maxSizeMB={10}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Conseils */}
      {mediaCount < 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-50 rounded-lg p-4 border border-gray-200"
        >
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-light text-gray-900 mb-1"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >Conseils pour vos médias</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                {!hasAvatar && (
                  <li>• Ajoutez une photo de profil professionnelle pour renforcer votre crédibilité</li>
                )}
                {!hasLogo && (
                  <li>• Un logo d'entreprise améliore la reconnaissance de votre marque</li>
                )}
                {!hasCover && (
                  <li>• Une image de couverture personnalise votre carte et attire l'attention</li>
                )}
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CardFormMedia;
