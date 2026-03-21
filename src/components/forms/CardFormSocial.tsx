/**
 * CardFormSocial Component - Version Premium
 * 
 * Composant modulaire pour l'étape "Réseaux sociaux" du formulaire de carte
 * Version premium avec recherche, catégories, drag & drop et aperçu
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Plus, Search, X, Edit, Trash2, Globe, 
  Linkedin, Instagram, Twitter, Facebook, Youtube, 
  MessageCircle, Play, GripVertical, ExternalLink,
  TrendingUp, Users, Link2, Check
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { SocialManager } from './SocialManager';

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  label: string;
  image?: string | null;
}

interface StepProps {
  data: Record<string, any>;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
  suggestions?: Record<string, string[]>;
}

// Catégories de réseaux sociaux
const SOCIAL_CATEGORIES = {
  professional: {
    name: 'Professionnel',
    platforms: ['linkedin', 'github', 'website'],
    icon: TrendingUp
  },
  social: {
    name: 'Social',
    platforms: ['facebook', 'twitter', 'instagram'],
    icon: Users
  },
  media: {
    name: 'Média',
    platforms: ['youtube', 'tiktok'],
    icon: Play
  },
  communication: {
    name: 'Communication',
    platforms: ['whatsapp', 'discord'],
    icon: MessageCircle
  }
};

export const CardFormSocial: React.FC<StepProps> = ({ 
  data, 
  onChange 
}) => {
  const { t } = useLanguage();
  const safeData = data || {};
  const [showSocialManager, setShowSocialManager] = useState(false);
  const [editingSocial, setEditingSocial] = useState<SocialLink | null>(null);
  const [initialPlatform, setInitialPlatform] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Types de réseaux sociaux supportés avec couleurs et icônes améliorées
  const SOCIAL_TYPES = {
    linkedin: { 
      label: t('editCardForm.social.types.linkedin'), 
      icon: Linkedin, 
      color: 'bg-blue-600',
      placeholder: t('editCardForm.social.placeholders.linkedin'),
      category: 'professional'
    },
    instagram: { 
      label: t('editCardForm.social.types.instagram'), 
      icon: Instagram, 
      color: 'bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500',
      placeholder: t('editCardForm.social.placeholders.instagram'),
      category: 'social'
    },
    twitter: { 
      label: t('editCardForm.social.types.twitter'), 
      icon: Twitter, 
      color: 'bg-blue-400',
      placeholder: t('editCardForm.social.placeholders.twitter'),
      category: 'social'
    },
    facebook: { 
      label: t('editCardForm.social.types.facebook'), 
      icon: Facebook, 
      color: 'bg-blue-700',
      placeholder: t('editCardForm.social.placeholders.facebook'),
      category: 'social'
    },
    youtube: { 
      label: t('editCardForm.social.types.youtube'), 
      icon: Youtube, 
      color: 'bg-red-600',
      placeholder: t('editCardForm.social.placeholders.youtube'),
      category: 'media'
    },
    tiktok: { 
      label: t('editCardForm.social.types.tiktok'), 
      icon: Play, 
      color: 'bg-black',
      placeholder: t('editCardForm.social.placeholders.tiktok'),
      category: 'media'
    },
    discord: { 
      label: t('editCardForm.social.types.discord'), 
      icon: MessageCircle, 
      color: 'bg-indigo-600',
      placeholder: t('editCardForm.social.placeholders.discord'),
      category: 'communication'
    },
    github: { 
      label: t('editCardForm.social.types.github'), 
      icon: Globe, 
      color: 'bg-gray-800',
      placeholder: t('editCardForm.social.placeholders.github'),
      category: 'professional'
    },
    whatsapp: { 
      label: t('editCardForm.social.types.whatsapp'), 
      icon: MessageCircle, 
      color: 'bg-green-600',
      placeholder: t('editCardForm.social.placeholders.whatsapp'),
      category: 'communication'
    },
    website: { 
      label: t('editCardForm.social.types.website'), 
      icon: Globe, 
      color: 'bg-gray-600',
      placeholder: t('editCardForm.social.placeholders.website'), 
      supportsImage: true,
      category: 'professional'
    }
  };

  // Récupérer tous les liens sociaux existants
  const socialLinks: SocialLink[] = useMemo(() => {
    const links: SocialLink[] = [];
    
    Object.keys(SOCIAL_TYPES).forEach(platform => {
      if (safeData[platform]) {
        links.push({
          id: platform,
          platform,
          url: safeData[platform],
          label: SOCIAL_TYPES[platform as keyof typeof SOCIAL_TYPES].label
        });
      }
    });

    // Ajouter les sites web
    if (safeData.websites && Array.isArray(safeData.websites)) {
      safeData.websites.forEach((website: { url?: string; label?: string; image?: string }, index: number) => {
        if (website.url && website.label) {
          links.push({
            id: `website-${index}`,
            platform: 'website',
            url: website.url,
            label: website.label,
            image: website.image || null
          });
        }
      });
    }
    
    return links;
  }, [safeData, SOCIAL_TYPES]);

  // Filtrer les types de réseaux selon la recherche et la catégorie
  const filteredSocialTypes = useMemo(() => {
    return Object.entries(SOCIAL_TYPES).filter(([key, type]) => {
      const matchesSearch = !searchQuery || 
        type.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        key.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !selectedCategory || 
        type.category === selectedCategory ||
        (selectedCategory === 'all');
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Fonction pour supprimer une image du storage Supabase
  const deleteImageFromStorage = async (imageUrl: string) => {
    if (imageUrl && imageUrl.includes('supabase')) {
      try {
        const fileName = imageUrl.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('social-images')
            .remove([fileName]);
        }
      } catch (error) {
        // Error handled silently
      }
    }
  };

  const handleDelete = async (link: SocialLink) => {
    if (link.platform === 'website') {
      const currentLinks = safeData.websites || [];
      if (link.image) {
        await deleteImageFromStorage(link.image);
      }
      const linkIndex = parseInt(link.id.replace('website-', ''));
      const updatedLinks = currentLinks.filter((_: any, index: number) => index !== linkIndex);
      onChange('websites', updatedLinks);
    } else {
      onChange(link.platform, '');
    }
  };

  // Préparer les types pour SocialManager (format attendu)
  const socialTypesForManager = useMemo(() => {
    const types: Record<string, any> = {};
    Object.entries(SOCIAL_TYPES).forEach(([key, type]) => {
      const Icon = type.icon;
      types[key] = {
        label: type.label,
        icon: <Icon className="w-4 h-4 text-gray-900" />,
        placeholder: type.placeholder,
        supportsImage: type.supportsImage
      };
    });
    return types;
  }, []);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-light tracking-tight text-gray-900"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
                letterSpacing: '-0.02em',
              }}
            >
              {t('editCardForm.social.title') || 'Réseaux sociaux'}
            </h2>
            <p className="text-sm font-light text-gray-500"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('editCardForm.social.description') || 'Connectez vos profils sociaux et sites web'}
            </p>
          </div>
        </div>
        <Button
            onClick={() => {
              setEditingSocial(null);
              setInitialPlatform(undefined);
              setShowSocialManager(true);
            }}
            className="rounded-lg px-4 sm:px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white shadow-sm transition-all duration-200 font-light flex items-center space-x-2 w-full sm:w-auto"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            <Plus className="w-5 h-5" />
            <span>
              {socialLinks.length === 0 
                ? (t('editCardForm.social.addLink') || 'Ajouter un lien')
                : (t('editCardForm.social.addAnotherLink') || 'Ajouter un autre lien')
              }
            </span>
          </Button>
      </div>

      {/* Statistiques */}
      {socialLinks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <div className="text-2xl font-light text-gray-900"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                  }}
                >{socialLinks.length}</div>
                <div className="text-xs font-light text-gray-500"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >Liens actifs</div>
              </div>
            </div>
          </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <div className="text-2xl font-light text-gray-900"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {socialLinks.filter(l => l.platform !== 'website').length}
                </div>
                <div className="text-xs font-light text-gray-500"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >Réseaux sociaux</div>
              </div>
            </div>
          </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                <Globe className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <div className="text-2xl font-light text-gray-900"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {socialLinks.filter(l => l.platform === 'website').length}
                </div>
                <div className="text-xs font-light text-gray-500"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >Sites web</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Liste des liens sociaux */}
      {socialLinks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-300"
        >
          <div className="w-20 h-20 rounded-full bg-gray-200 mx-auto mb-4 flex items-center justify-center">
            <Globe className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-light text-gray-900 mb-2"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
            }}
          >
            {t('editCardForm.social.noLinks') || 'Aucun lien ajouté'}
          </h3>
          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
            {t('editCardForm.social.noLinksDescription') || 'Ajoutez vos profils sociaux et sites web pour que vos contacts puissent vous retrouver facilement.'}
          </p>
          <Button
            onClick={() => setShowSocialManager(true)}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter votre premier lien
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {socialLinks.map((link, index) => {
              const typeConfig = SOCIAL_TYPES[link.platform as keyof typeof SOCIAL_TYPES];
              const Icon = typeConfig?.icon || Globe;
              
              return (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  {/* Icône du réseau */}
                  <div className="flex-shrink-0">
                    {link.image ? (
                      <div className="relative">
                        <img 
                          src={link.image} 
                          alt={link.label}
                          className="w-12 h-12 rounded-lg object-cover border border-gray-200 shadow-sm"
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                          <Icon className="w-3 h-3 text-gray-600" />
                        </div>
                      </div>
                    ) : (
                      <div className={`w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Informations */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-light text-gray-900"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{link.label}</span>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{link.url}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingSocial(link);
                        setShowSocialManager(true);
                      }}
                      className="border-gray-200 hover:bg-gray-50 text-gray-700"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      {t('editCardForm.social.edit') || 'Modifier'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(link)}
                      className="border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      {t('editCardForm.social.delete') || 'Supprimer'}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Section des types de réseaux sociaux supportés */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="mb-4">
          <h4 className="font-light text-gray-900 flex items-center gap-2"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            <div className="w-2 h-2 bg-gray-900 rounded-full"></div>
            {t('editCardForm.social.supportedTypes') || 'Types de réseaux sociaux supportés'}
          </h4>
        </div>

        {/* Barre de recherche */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un réseau social..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-200 focus:border-gray-900 bg-white font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtres par catégorie */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
              !selectedCategory
                ? 'bg-gray-900 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tous
          </button>
          {Object.entries(SOCIAL_CATEGORIES).map(([key, category]) => {
            const Icon = category.icon;
            const count = filteredSocialTypes.filter(([typeKey]) => 
              category.platforms.includes(typeKey)
            ).length;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1.5 ${
                  selectedCategory === key
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                {category.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Grille des réseaux sociaux - Logos uniquement */}
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
          <AnimatePresence mode="wait">
            {filteredSocialTypes.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-span-full text-center py-8 text-gray-500"
              >
                Aucun réseau trouvé
              </motion.div>
            ) : (
              filteredSocialTypes.map(([key, type]) => {
                const Icon = type.icon;
                const isAdded = socialLinks.some(link => link.platform === key);
                
                return (
                  <motion.button
                    key={key}
                    type="button"
                    onClick={() => {
                      setEditingSocial(null);
                      setInitialPlatform(key);
                      setShowSocialManager(true);
                    }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ scale: 1.1, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative p-4 rounded-lg border transition-all flex items-center justify-center ${
                      isAdded
                        ? 'border-gray-200 bg-gray-50 ring-1 ring-gray-200'
                        : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                    title={type.label}
                  >
                    <div className={`w-14 h-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm`}>
                      <Icon className="w-7 h-7 text-gray-600" />
                    </div>
                    {isAdded && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center shadow-sm"
                      >
                        <Check className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal pour ajouter/éditer un lien social */}
      {showSocialManager && (
        <SocialManager
          isOpen={showSocialManager}
          onClose={() => {
            setShowSocialManager(false);
            setEditingSocial(null);
            setInitialPlatform(undefined);
          }}
          onSave={(socialData: { platform: string; url: string; label: string; image: string | null }) => {
            if (editingSocial) {
              // Modifier un lien existant
              if (socialData.platform === 'website') {
                const currentLinks = safeData.websites || [];
                const updatedLinks = currentLinks.map((link: SocialLink, index: number) => 
                  `website-${index}` === editingSocial.id 
                    ? { url: socialData.url, label: socialData.label, image: socialData.image }
                    : link
                );
                onChange('websites', updatedLinks);
              } else {
                onChange(socialData.platform, socialData.url);
              }
            } else {
              // Ajouter un nouveau lien
              if (socialData.platform === 'website') {
                const currentLinks = safeData.websites || [];
                const newLinks = [
                  ...currentLinks,
                  { url: socialData.url, label: socialData.label, image: socialData.image }
                ];
                onChange('websites', newLinks);
              } else {
                onChange(socialData.platform, socialData.url);
              }
            }
            setShowSocialManager(false);
            setEditingSocial(null);
            setInitialPlatform(undefined);
          }}
          editingSocial={editingSocial}
          socialTypes={socialTypesForManager}
          initialPlatform={initialPlatform}
        />
      )}
    </div>
  );
};

export default CardFormSocial;
