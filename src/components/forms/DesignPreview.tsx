/**
 * DesignPreview Component - Version Premium
 * 
 * Aperçu réaliste de la carte de visite avec animations
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FONT_MAP } from './FontSelector';
import { Mail, Phone, MapPin, Globe, User, Instagram, Linkedin, QrCode, Download, Calendar, Plus, Minus } from 'lucide-react';

interface DesignPreviewProps {
  themeToken?: string;
  fontClass?: string;
  partyThemeId?: string | null;
  partyThemeData?: {
    image_url?: string;
    preview_image_url?: string;
    name?: string;
    party_name?: string;
    background_color?: string;
    text_color?: string;
    accent_color?: string;
  };
  cardData?: {
    name?: string;
    title?: string;
    company?: string;
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
    avatarUrl?: string;
    companyLogoUrl?: string;
    coverImageUrl?: string;
    description?: string;
  };
}

export const DesignPreview: React.FC<DesignPreviewProps> = ({ 
  themeToken, 
  fontClass,
  partyThemeId,
  partyThemeData,
  cardData 
}) => {
  const token = typeof themeToken === 'string' ? themeToken : 'gray-500/10';
  
  // Mapping des classes de couleur
  const bgClass = {
    'slate-500/10':'bg-slate-500/10','slate-600/10':'bg-slate-600/10','slate-700/10':'bg-slate-700/10',
    'gray-500/10':'bg-gray-500/10','gray-600/10':'bg-gray-600/10','gray-700/10':'bg-gray-700/10',
    'zinc-500/10':'bg-zinc-500/10','zinc-600/10':'bg-zinc-600/10','zinc-700/10':'bg-zinc-700/10',
    'neutral-500/10':'bg-neutral-500/10','neutral-600/10':'bg-neutral-600/10','neutral-700/10':'bg-neutral-700/10',
    'stone-500/10':'bg-stone-500/10','stone-600/10':'bg-stone-600/10','stone-700/10':'bg-stone-700/10',
    'red-500/10':'bg-red-600/10','red-600/10':'bg-red-600/10','red-700/10':'bg-red-600/10',
    'orange-500/10':'bg-orange-500/10','orange-600/10':'bg-orange-600/10','orange-700/10':'bg-orange-700/10',
    'amber-500/10':'bg-amber-500/10','amber-600/10':'bg-amber-600/10','amber-700/10':'bg-amber-700/10',
    'yellow-500/10':'bg-yellow-500/10','yellow-600/10':'bg-yellow-600/10','yellow-700/10':'bg-yellow-700/10',
    'lime-500/10':'bg-lime-500/10','lime-600/10':'bg-lime-600/10','lime-700/10':'bg-lime-700/10',
    'green-500/10':'bg-green-500/10','green-600/10':'bg-green-600/10','green-700/10':'bg-green-700/10',
    'emerald-500/10':'bg-emerald-500/10','emerald-600/10':'bg-emerald-600/10','emerald-700/10':'bg-emerald-700/10',
    'teal-500/10':'bg-teal-500/10','teal-600/10':'bg-teal-600/10','teal-700/10':'bg-teal-700/10',
    'cyan-500/10':'bg-cyan-500/10','cyan-600/10':'bg-cyan-600/10','cyan-700/10':'bg-cyan-700/10',
    'sky-500/10':'bg-sky-500/10','sky-600/10':'bg-sky-600/10','sky-700/10':'bg-sky-700/10',
    'blue-500/10':'bg-blue-500/10','blue-600/10':'bg-blue-600/10','blue-700/10':'bg-blue-700/10',
    'indigo-500/10':'bg-indigo-500/10','indigo-600/10':'bg-indigo-600/10','indigo-700/10':'bg-indigo-700/10',
    'violet-500/10':'bg-violet-500/10','violet-600/10':'bg-violet-600/10','violet-700/10':'bg-violet-700/10',
    'purple-500/10':'bg-purple-500/10','purple-600/10':'bg-purple-600/10','purple-700/10':'bg-purple-700/10',
    'fuchsia-500/10':'bg-fuchsia-500/10','fuchsia-600/10':'bg-fuchsia-600/10','fuchsia-700/10':'bg-fuchsia-700/10',
    'pink-500/10':'bg-pink-500/10','pink-600/10':'bg-pink-600/10','pink-700/10':'bg-pink-700/10',
    'rose-500/10':'bg-rose-500/10','rose-600/10':'bg-rose-600/10','rose-700/10':'bg-rose-700/10'
  }[token] || 'bg-gray-500/10';

  // Applique la police
  const cssFamily = fontClass && FONT_MAP[fontClass] ? FONT_MAP[fontClass].label : undefined;
  const style: React.CSSProperties = cssFamily ? { fontFamily: `'${cssFamily}', sans-serif` } : {};
  const textStyle: React.CSSProperties = cssFamily 
    ? { fontFamily: `'${cssFamily}', sans-serif`, fontWeight: 300 } 
    : { fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 };
  const headingStyle: React.CSSProperties = cssFamily 
    ? { fontFamily: `'${cssFamily}', sans-serif`, fontWeight: 300 } 
    : { fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', fontWeight: 300 };

  // Palette dérivée du thème
  const family =
    token.includes('slate') ? 'slate' :
    token.includes('gray') ? 'gray' :
    token.includes('zinc') ? 'zinc' :
    token.includes('neutral') ? 'neutral' :
    token.includes('stone') ? 'stone' :
    token.includes('red') ? 'red' :
    token.includes('orange') ? 'orange' :
    token.includes('amber') ? 'amber' :
    token.includes('yellow') ? 'yellow' :
    token.includes('lime') ? 'lime' :
    token.includes('green') ? 'green' :
    token.includes('emerald') ? 'emerald' :
    token.includes('teal') ? 'teal' :
    token.includes('cyan') ? 'cyan' :
    token.includes('sky') ? 'sky' :
    token.includes('blue') ? 'blue' :
    token.includes('indigo') ? 'indigo' :
    token.includes('violet') ? 'violet' :
    token.includes('purple') ? 'purple' :
    token.includes('fuchsia') ? 'fuchsia' :
    token.includes('pink') ? 'pink' :
    token.includes('rose') ? 'rose' : 'gray';

  const headingClassMap: Record<string, string> = {
    slate: 'text-slate-800', gray: 'text-gray-800', zinc: 'text-zinc-800', neutral: 'text-neutral-800', stone: 'text-stone-800',
    red: 'text-red-800', orange: 'text-orange-800', amber: 'text-amber-800', yellow: 'text-yellow-800',
    lime: 'text-lime-800', green: 'text-green-800', emerald: 'text-emerald-800', teal: 'text-teal-800',
    cyan: 'text-cyan-800', sky: 'text-sky-800', blue: 'text-blue-800', indigo: 'text-indigo-800',
    violet: 'text-violet-800', purple: 'text-purple-800', fuchsia: 'text-fuchsia-800', pink: 'text-pink-800', rose: 'text-rose-800'
  };

  const textClassMap: Record<string, string> = {
    slate: 'text-slate-700', gray: 'text-gray-700', zinc: 'text-zinc-700', neutral: 'text-neutral-700', stone: 'text-stone-700',
    red: 'text-red-700', orange: 'text-orange-700', amber: 'text-amber-700', yellow: 'text-yellow-700',
    lime: 'text-lime-700', green: 'text-green-700', emerald: 'text-emerald-700', teal: 'text-teal-700',
    cyan: 'text-cyan-700', sky: 'text-sky-700', blue: 'text-blue-700', indigo: 'text-indigo-700',
    violet: 'text-violet-700', purple: 'text-purple-700', fuchsia: 'text-fuchsia-700', pink: 'text-pink-700', rose: 'text-rose-700'
  };

  const headingClass = headingClassMap[family] || 'text-gray-800';
  const textClass = textClassMap[family] || 'text-gray-700';

  // Données d'exemple ou réelles
  const displayName = cardData?.name || 'Jean Dupont';
  const displayTitle = cardData?.title || 'Directeur Marketing';
  const displayCompany = cardData?.company || 'Entreprise Inc.';
  const displayEmail = cardData?.email || 'jean.dupont@example.com';
  const displayPhone = cardData?.phone || '+33 6 12 34 56 78';
  const displayAddress = cardData?.address || '123 Rue de la République, Paris';
  const displayWebsite = cardData?.website || 'www.example.com';
  const displayAvatar = cardData?.avatarUrl;
  const displayLogo = cardData?.companyLogoUrl;
  const displayCover = cardData?.coverImageUrl;
  const displayDescription = cardData?.description;
  
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-light text-gray-900" style={textStyle}>
          Aperçu de la carte
        </h3>
        <div className="text-xs text-gray-500" style={textStyle}>Temps réel</div>
      </div>
      
      <motion.div
        key={`${token}-${fontClass}-${partyThemeId}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`relative max-w-sm mx-auto rounded-lg border border-gray-200 shadow-sm overflow-hidden ${fontClass || ''}`}
        style={{
          ...style,
          minHeight: '600px',
        }}
      >
        {/* Background: Photo de couverture ou thème - prend toute la carte */}
        <div className="absolute inset-0 w-full h-full">
          {/* Si un thème est choisi, on affiche le thème (pas la photo de couverture) */}
          {partyThemeData && (partyThemeData.image_url || partyThemeData.preview_image_url) ? (
            <div className="w-full h-full relative overflow-hidden">
              <img
                src={partyThemeData.image_url || partyThemeData.preview_image_url}
                alt={partyThemeData.name || 'Thème de fête'}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
            </div>
          ) : displayCover && !partyThemeData ? (
            <div className="w-full h-full relative overflow-hidden">
              <img
                src={displayCover}
                alt="Photo de couverture"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
            </div>
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${bgClass} relative overflow-hidden`}>
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30" />
            </div>
          )}
        </div>

        {/* Contenu principal par-dessus avec glassmorphism */}
        <div className="relative z-10 px-6 pt-8 pb-6 min-h-[600px] flex flex-col">
          {/* Avatar avec photo de profil réelle */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
            className="w-24 h-24 rounded-full bg-white border-2 border-white shadow-sm mx-auto mb-4 flex items-center justify-center overflow-hidden"
          >
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-gray-500" />
            )}
          </motion.div>

          {/* Nom */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-light mb-2 text-white text-center"
            style={headingStyle}
          >
            {displayName}
          </motion.h2>

          {/* Logo et nom de l'entreprise */}
          {displayCompany && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-2 mb-4"
            >
              {displayLogo && (
                <img
                  src={displayLogo}
                  alt={displayCompany}
                  className="w-8 h-8 rounded-full object-cover bg-white border border-gray-200"
                />
              )}
              <span className="text-xs text-white bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full" style={textStyle}>
                {displayCompany}
              </span>
            </motion.div>
          )}

          {/* Icônes de contact (glassmorphism amélioré) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-3 mb-4 "
          >
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-lg flex items-center justify-center hover:bg-white/30 transition-colors">
              <Phone className="w-5 h-5 text-gray-100" />
            </div>
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-lg flex items-center justify-center hover:bg-white/30 transition-colors">
              <Mail className="w-5 h-5 text-gray-100" />
            </div>
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-lg flex items-center justify-center hover:bg-white/30 transition-colors">
              <Instagram className="w-5 h-5 text-gray-100" />
            </div>
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-lg flex items-center justify-center hover:bg-white/30 transition-colors">
              <Linkedin className="w-5 h-5 text-gray-100" />
            </div>
          </motion.div>

          {/* Grande Card Glassmorphism regroupant "En savoir plus" et les boutons d'action */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-auto"
          >
            <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-lg overflow-hidden shadow-lg">
              {/* "En savoir plus" Toggle */}
              <button
                onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/10 transition-colors border-b border-white/20"
              >
                <span className="text-sm text-gray-800 font-light" style={textStyle}>
                  En savoir plus
                </span>
                <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-md border border-white/30 shadow-sm flex items-center justify-center">
                  {isDescriptionOpen ? (
                    <Minus className="w-4 h-4 text-gray-800" />
                  ) : (
                    <Plus className="w-4 h-4 text-gray-800" />
                  )}
                </div>
              </button>
              
              {/* Description dépliée */}
              <AnimatePresence>
                {isDescriptionOpen && displayDescription && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-3 border-b border-white/20">
                      <p className="text-sm text-gray-800 font-light leading-relaxed" style={textStyle}>
                        {displayDescription}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons dans des cards glassmorphism */}
              <div className="p-4 flex items-center justify-center gap-3">
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <button className="w-14 h-14 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 shadow-lg flex items-center justify-center hover:bg-white/30 transition-all hover:scale-105">
                    <QrCode className="w-6 h-6 text-blue-600" />
                  </button>
                  <span className="text-xs text-white font-light text-center" style={textStyle}>
                    Scannez QR Code
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <button className="w-14 h-14 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 shadow-lg flex items-center justify-center hover:bg-white/30 transition-all hover:scale-105">
                    <Download className="w-6 h-6 text-purple-600" />
                  </button>
                  <span className="text-xs text-white font-light text-center" style={textStyle}>
                    Enregistrer Contact
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <button className="w-14 h-14 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 shadow-lg flex items-center justify-center hover:bg-white/30 transition-all hover:scale-105">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </button>
                  <span className="text-xs text-white font-light text-center" style={textStyle}>
                    Prendre RDV
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Info sur le design */}
      <div className="text-center space-y-1">
        {partyThemeData ? (
          <div className="text-xs text-gray-600">
            Thème de fête: <span className="font-medium text-gray-900">{partyThemeData.name || 'Thème sélectionné'}</span>
            {partyThemeData.party_name && (
              <span className="text-gray-500"> • {partyThemeData.party_name}</span>
            )}
          </div>
        ) : (
          <div className="text-xs text-gray-600">
            Thème: <span className="font-medium text-gray-900">{token}</span>
          </div>
        )}
        {fontClass && FONT_MAP[fontClass] && (
          <div className="text-xs text-gray-600">
            Police: <span className="font-medium text-gray-900">{FONT_MAP[fontClass].label}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignPreview;
