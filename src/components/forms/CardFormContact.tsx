/**
 * CardFormContact Component - Version Premium
 * 
 * Composant modulaire pour l'étape "Contact" du formulaire de carte
 * Version améliorée avec statistiques, progression et design premium
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, Mail, Phone, Globe, MapPin, Check, TrendingUp, AlertCircle, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { ModernInput } from './ModernInput';

interface StepProps {
  data: Record<string, any>;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export const CardFormContact: React.FC<StepProps> = ({ 
  data, 
  onChange, 
  errors 
}) => {
  const { t } = useLanguage();
  const safeData = data || {};
  const safeErrors = errors || {};

  // Calcul des statistiques
  const stats = useMemo(() => {
    const hasEmail = !!safeData.email?.trim();
    const hasPhone = !!safeData.phone?.trim();
    const hasWebsite = !!safeData.website?.trim();
    const hasAddress = !!safeData.address?.trim();
    
    const contactMethods = [hasEmail, hasPhone, hasWebsite, hasAddress];
    const filledCount = contactMethods.filter(Boolean).length;
    const completionPercentage = Math.round((filledCount / 4) * 100);
    
    // Validation basique des formats
    const isValidEmail = hasEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeData.email);
    const isValidPhone = hasPhone && safeData.phone.length >= 8;
    const isValidWebsite = hasWebsite && (safeData.website.startsWith('http://') || safeData.website.startsWith('https://'));
    
    return {
      hasEmail,
      hasPhone,
      hasWebsite,
      hasAddress,
      filledCount,
      completionPercentage,
      isValidEmail,
      isValidPhone,
      isValidWebsite
    };
  }, [safeData]);

  return (
    <div className="space-y-6">
      {/* En-tête Apple Minimal */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
          <Target className="h-6 w-6 text-gray-600" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-light tracking-tight text-gray-900"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
              letterSpacing: '-0.02em',
            }}
          >
            {t('editCardForm.contact.title') || 'Informations de contact'}
          </h2>
          <p className="text-sm font-light text-gray-500"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            {t('editCardForm.contact.description') || 'Comment les gens peuvent-ils vous contacter ?'}
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
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
              stats.hasEmail && stats.isValidEmail ? 'bg-gray-100 border-gray-200' : stats.hasEmail ? 'bg-gray-50 border-gray-200' : 'bg-gray-100 border-gray-200'
            }`}>
              <Mail className={`w-5 h-5 ${stats.hasEmail && stats.isValidEmail ? 'text-gray-600' : stats.hasEmail ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <div>
              <div className="text-2xl font-light text-gray-900"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                {stats.hasEmail ? (stats.isValidEmail ? '✓' : '⚠') : '—'}
              </div>
              <div className="text-xs font-light text-gray-500"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >Email</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
              stats.hasPhone && stats.isValidPhone ? 'bg-gray-100 border-gray-200' : stats.hasPhone ? 'bg-gray-50 border-gray-200' : 'bg-gray-100 border-gray-200'
            }`}>
              <Phone className={`w-5 h-5 ${stats.hasPhone && stats.isValidPhone ? 'text-gray-600' : stats.hasPhone ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <div>
              <div className="text-2xl font-light text-gray-900"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                {stats.hasPhone ? (stats.isValidPhone ? '✓' : '⚠') : '—'}
              </div>
              <div className="text-xs font-light text-gray-500"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >Téléphone</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
              stats.hasWebsite && stats.isValidWebsite ? 'bg-gray-100 border-gray-200' : stats.hasWebsite ? 'bg-gray-50 border-gray-200' : 'bg-gray-100 border-gray-200'
            }`}>
              <Globe className={`w-5 h-5 ${stats.hasWebsite && stats.isValidWebsite ? 'text-gray-600' : stats.hasWebsite ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <div>
              <div className="text-2xl font-light text-gray-900"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                {stats.hasWebsite ? (stats.isValidWebsite ? '✓' : '⚠') : '—'}
              </div>
              <div className="text-xs font-light text-gray-500"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >Site web</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
              stats.hasAddress ? 'bg-gray-100 border-gray-200' : 'bg-gray-100 border-gray-200'
            }`}>
              <MapPin className={`w-5 h-5 ${stats.hasAddress ? 'text-gray-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <div className="text-2xl font-light text-gray-900"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                {stats.hasAddress ? '✓' : '—'}
              </div>
              <div className="text-xs font-light text-gray-500"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >Adresse</div>
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
          >{stats.completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.completionPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-gray-900 rounded-full"
          />
        </div>
        <div className="flex items-center justify-between text-xs font-light text-gray-500"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            fontWeight: 300,
          }}
        >
          <span>Moyens de contact: {stats.filledCount}/4</span>
          <span className={stats.filledCount === 4 ? 'text-gray-600' : ''}>
            {stats.filledCount === 4 ? 'Complet ✓' : 'En cours...'}
          </span>
        </div>
      </div>

      {/* Champs de contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
            className={`relative ${stats.hasEmail ? 'ring-1 ring-gray-200 rounded-lg p-1' : ''}`}
        >
          <ModernInput
            label={t('editCardForm.contact.email.label')}
            type="email"
            value={safeData.email || ''}
            onChange={(value) => onChange('email', value)}
            error={safeErrors.email}
            placeholder={t('editCardForm.contact.email.placeholder')}
          />
          {stats.hasEmail && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
                className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-sm z-10 ${
                stats.isValidEmail ? 'bg-gray-900' : 'bg-gray-600'
              }`}
            >
              {stats.isValidEmail ? (
                <Check className="w-4 h-4 text-white" />
              ) : (
                <AlertCircle className="w-4 h-4 text-white" />
              )}
            </motion.div>
          )}
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
            className={`relative ${stats.hasPhone ? 'ring-1 ring-gray-200 rounded-lg p-1' : ''}`}
        >
          <ModernInput
            label={t('editCardForm.contact.phone.label')}
            type="tel"
            value={safeData.phone || ''}
            onChange={(value) => onChange('phone', value)}
            error={safeErrors.phone}
            placeholder={t('editCardForm.contact.phone.placeholder')}
          />
          {stats.hasPhone && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
                className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-sm z-10 ${
                stats.isValidPhone ? 'bg-gray-900' : 'bg-gray-600'
              }`}
            >
              {stats.isValidPhone ? (
                <Check className="w-4 h-4 text-white" />
              ) : (
                <AlertCircle className="w-4 h-4 text-white" />
              )}
            </motion.div>
          )}
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
            className={`relative ${stats.hasWebsite ? 'ring-1 ring-gray-200 rounded-lg p-1' : ''}`}
        >
          <div className="space-y-2">
            <label className="text-sm font-light text-gray-700 flex items-center gap-2"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              <Globe className="w-4 h-4" />
              {t('editCardForm.contact.website.label') || 'Site web'}
            </label>
            <div className="relative">
              <ModernInput
                label=""
                type="url"
                value={safeData.website || ''}
                onChange={(value) => onChange('website', value)}
                error={safeErrors.website}
                placeholder={t('editCardForm.contact.website.placeholder')}
              />
              {stats.hasWebsite && stats.isValidWebsite && (
                <a
                  href={safeData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            {stats.hasWebsite && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-sm z-10 ${
                  stats.isValidWebsite ? 'bg-gray-900' : 'bg-gray-600'
                }`}
              >
                {stats.isValidWebsite ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-white" />
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
            className={`relative ${stats.hasAddress ? 'ring-1 ring-gray-200 rounded-lg p-1' : ''}`}
        >
          <div className="space-y-2">
            <label className="text-sm font-light text-gray-700 flex items-center gap-2"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              <MapPin className="w-4 h-4" />
              {t('editCardForm.contact.address.label') || 'Adresse'}
            </label>
            <textarea
              value={safeData.address || ''}
              onChange={(e) => onChange('address', e.target.value)}
              placeholder={t('editCardForm.contact.address.placeholder')}
              rows={3}
              className="w-full px-4 py-3 bg-white border border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 rounded-lg shadow-sm transition-all font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            />
            {stats.hasAddress && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center shadow-sm z-10"
              >
                <Check className="w-4 h-4 text-white" />
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Conseils */}
      {stats.filledCount === 0 && (
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
              >Aucun moyen de contact</h4>
              <p className="text-sm text-gray-700">
                Ajoutez au moins un moyen de contact (email, téléphone ou site web) pour que les visiteurs puissent vous joindre.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {stats.filledCount > 0 && stats.filledCount < 4 && (
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
              >Enrichissez vos moyens de contact</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                {!stats.hasEmail && <li>• Un email permet un contact professionnel direct</li>}
                {!stats.hasPhone && <li>• Un numéro de téléphone facilite les appels urgents</li>}
                {!stats.hasWebsite && <li>• Un site web présente votre activité en détail</li>}
                {!stats.hasAddress && <li>• Une adresse physique est utile pour les rencontres</li>}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Avertissements de format */}
      {(stats.hasEmail && !stats.isValidEmail) || (stats.hasPhone && !stats.isValidPhone) || (stats.hasWebsite && !stats.isValidWebsite) ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-50 rounded-lg p-4 border border-gray-200"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-light text-gray-900 mb-1"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >Format invalide détecté</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                {stats.hasEmail && !stats.isValidEmail && <li>• L'email doit être au format valide (ex: nom@domaine.com)</li>}
                {stats.hasPhone && !stats.isValidPhone && <li>• Le téléphone doit contenir au moins 8 caractères</li>}
                {stats.hasWebsite && !stats.isValidWebsite && <li>• L'URL doit commencer par http:// ou https://</li>}
              </ul>
            </div>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
};

export default CardFormContact;
