/**
 * CardFormAppearance Component
 * 
 * Composant modulaire pour l'étape "Apparence/Design" du formulaire de carte
 * Extrait de ModernCardForm.tsx pour améliorer la maintenabilité
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';
import { PartyThemeSelector } from './PartyThemeSelector';
import { ModernThemeSelector } from './ModernThemeSelector';
import { FontSelector, FONT_MAP } from './FontSelector';
import { DesignPreview } from './DesignPreview';

interface StepProps {
  data: Record<string, any>;
  onChange: (field: string, value: any) => void;
}

export const CardFormAppearance: React.FC<StepProps> = ({ 
  data, 
  onChange 
}) => {
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
      } catch (error) {
        // Error handled silently
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
            className={`px-4 py-2 text-sm font-light rounded-md transition-all duration-200 ${
              mode === 'parties' 
                ? 'bg-gray-50 text-gray-900' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            {t('editCardForm.design.parties', { count: activeParties.length }) || `Fêtes (${activeParties.length})`}
          </button>
        )}
      </div>

      {/* Contenu selon le mode */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          key={mode}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
          className="space-y-3"
        >
          {mode === 'theme' ? (
            <ModernThemeSelector
              value={safeData.theme || ''}
              onChange={(value) => onChange('theme', value)}
            />
          ) : mode === 'fonts' ? (
            <FontSelector
              value={safeData.font_family || ''}
              onChange={(value) => {
                onChange('font_family', value);
              }}
            />
          ) : (
            <PartyThemeSelector
              value={safeData.party_theme_id}
              onChange={(themeId) => onChange('party_theme_id', themeId)}
              partyThemes={partyThemes}
              activeParties={activeParties}
            />
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="lg:sticky lg:top-6 h-fit"
        >
          <DesignPreview
            themeToken={safeData.theme}
            fontClass={safeData.font_family}
            partyThemeId={safeData.party_theme_id}
            partyThemeData={
              safeData.party_theme_id
                ? partyThemes.find((theme: any) => theme.id === safeData.party_theme_id)
                : undefined
            }
            cardData={{
              name: safeData.name,
              title: safeData.title,
              company: safeData.company,
              email: safeData.email,
              phone: safeData.phone,
              address: safeData.address,
              website: safeData.website || (safeData.websites && safeData.websites[0]?.url),
              avatarUrl: safeData.avatarUrl,
              companyLogoUrl: safeData.companyLogoUrl,
              coverImageUrl: safeData.coverImageUrl,
              description: safeData.description || safeData.bio || safeData.about,
            }}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default CardFormAppearance;
