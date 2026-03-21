/**
 * BusinessCardContent Component
 * 
 * Composant modulaire pour le contenu principal de la carte (description, sites web)
 * Extrait de BusinessCardModern.tsx pour améliorer la maintenabilité
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CardImageOptimizer from '@/components/utils/CardImageOptimizer';
import { useLanguage } from '@/hooks/useLanguage';

interface Website {
  id: string;
  platform: string;
  url: string;
  label: string;
  image?: string;
}

interface BusinessCardContentProps {
  description?: string;
  websites?: Website[];
  loadingImages?: Set<string>;
  onImageLoad?: (id: string) => void;
  onWebsiteClick?: (website: Website) => void;
}

export const BusinessCardContent: React.FC<BusinessCardContentProps> = ({
  description,
  websites = [],
  loadingImages = new Set(),
  onImageLoad,
  onWebsiteClick
}) => {
  const { t } = useLanguage();
  const [showDescription, setShowDescription] = useState(false);

  return (
    <>
      {/* Description avec bouton plier/déplier */}
      {description && (
        <motion.div 
          className="bg-white/15 backdrop-blur-sm border border-gray-200/80 rounded-2xl p-4 shadow-md"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.4,
            ease: [0.16, 1, 0.3, 1],
            type: "spring",
            stiffness: 300,
            damping: 25
          }}
          style={{ willChange: 'transform, opacity' }}
        >
          <motion.button
            onClick={() => setShowDescription(!showDescription)}
            className="w-full flex items-center justify-between text-left"
            style={{ willChange: 'transform' }}
            whileHover={{ 
              scale: 1.02,
              transition: { 
                type: "spring", 
                stiffness: 400, 
                damping: 17,
                duration: 0.2
              } 
            }}
            whileTap={{ 
              scale: 0.98,
              transition: { 
                type: "spring", 
                stiffness: 500, 
                damping: 20,
                duration: 0.15
              }
            }}
          >
            <span className="font-semibold text-gray-900 text-sm">
              {t('businessCard.learnMore')}
            </span>
            <motion.div
              animate={{ rotate: showDescription ? 45 : 0 }}
              transition={{ 
                duration: 0.3,
                ease: [0.16, 1, 0.3, 1],
                type: "spring",
                stiffness: 300,
                damping: 25
              }}
              style={{ willChange: 'transform' }}
              className="w-6 h-6 flex items-center justify-center bg-white/30 backdrop-blur-sm rounded-full"
            >
              {showDescription ? (
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              )}
            </motion.div>
          </motion.button>
          
          <AnimatePresence mode="wait">
            {showDescription && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ 
                  duration: 0.4,
                  ease: [0.16, 1, 0.3, 1],
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                }}
                style={{ willChange: 'transform, opacity' }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-white/30 mt-4">
                  <p className="text-gray-800 text-sm leading-relaxed text-justify">{description}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Sites Web */}
      {websites && websites.length > 0 && (
        <div className="space-y-2">
          {websites.map((website) => (
            <motion.a
              key={website.id}
              href={website.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white/25 backdrop-blur-sm rounded-2xl p-4 shadow-md group"
              style={{ willChange: 'transform' }}
              whileHover={{ 
                scale: 1.02,
                y: -2,
                transition: { 
                  type: "spring", 
                  stiffness: 400, 
                  damping: 17,
                  duration: 0.2
                } 
              }}
              whileTap={{ 
                scale: 0.98,
                transition: { 
                  type: "spring", 
                  stiffness: 500, 
                  damping: 20,
                  duration: 0.15
                }
              }}
              onClick={() => onWebsiteClick?.(website)}
            >
              <div className="flex items-center space-x-3">
                {website.image ? (
                  <div className="relative w-10 h-10">
                    {/* Skeleton loader pendant le chargement */}
                    {loadingImages.has(website.id) && (
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded-lg" 
                           style={{ 
                             animationDuration: '0.3s',
                             animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                             willChange: 'opacity'
                           }} />
                    )}
                    <CardImageOptimizer
                      src={website.image}
                      alt={website.label}
                      className={`w-10 h-10 rounded-lg object-cover shadow-sm transition-opacity duration-100 ${
                        loadingImages.has(website.id) ? 'opacity-0' : 'opacity-100'
                      }`}
                      type="media"
                      priority={true}
                      onLoad={() => onImageLoad?.(website.id)}
                      onError={() => onImageLoad?.(website.id)}
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{website.label}</p>
                  <p className="text-xs text-gray-600 truncate">{website.url}</p>
                </div>
                <div className="w-6 h-6 bg-white/50 rounded-full flex items-center justify-center group-hover:bg-white/70 transition-colors">
                  <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      )}
    </>
  );
};

export default BusinessCardContent;
