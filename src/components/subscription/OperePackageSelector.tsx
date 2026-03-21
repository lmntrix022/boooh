/**
 * Composant de sélection de package BÖÖH Opéré
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, TrendingUp, Zap, Crown, ArrowRight, Calculator } from 'lucide-react';
import { OpereSetupPackage } from '@/types/subscription';
import { useOpereSetup } from '@/hooks/useOpereSetup';
import { formatROIForDisplay } from '@/services/opereROICalculator';
import { useAuth } from '@/hooks/useAuth';

interface OperePackageSelectorProps {
  expectedMonthlyRevenue?: number;
  needsMarketing?: boolean;
  needsContentCreation?: boolean;
  needsCustomIntegration?: boolean;
  onPackageSelected?: (packageId: string) => void;
  onCalculateROI?: (packageId: string) => void;
}

export function OperePackageSelector({
  expectedMonthlyRevenue = 3000000, // 3M FCFA par défaut
  needsMarketing = false,
  needsContentCreation = false,
  needsCustomIntegration = false,
  onPackageSelected,
  onCalculateROI,
}: OperePackageSelectorProps) {
  const { user } = useAuth();
  const { packages, loading, getRecommendation, calculateROI } = useOpereSetup(user?.id);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  
  // Obtenir la recommandation
  const recommendation = useMemo(() => {
    if (packages.length === 0) return null;
    
    return getRecommendation({
      expectedMonthlyRevenue,
      needsMarketing,
      needsContentCreation,
      needsCustomIntegration,
    });
  }, [packages, expectedMonthlyRevenue, needsMarketing, needsContentCreation, needsCustomIntegration, getRecommendation]);
  
  // Icônes pour chaque package
  const packageIcons: Record<string, React.ReactNode> = {
    standard: <Zap className="w-6 h-6" />,
    business: <TrendingUp className="w-6 h-6" />,
    premium: <Sparkles className="w-6 h-6" />,
    enterprise: <Crown className="w-6 h-6" />,
  };
  
  const handleSelectPackage = (packageId: string) => {
    setSelectedPackage(packageId);
    onPackageSelected?.(packageId);
  };
  
  const handleViewROI = (packageId: string) => {
    onCalculateROI?.(packageId);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
          Choisissez votre package Setup Opéré
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Configuration complète, formation et accompagnement selon vos besoins.
          Tous les packages incluent la commission de 10% sur vos transactions.
        </p>
        
        {recommendation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
          >
            <Sparkles className="w-4 h-4" />
            Recommandé pour vous: {recommendation.recommendedPackage.name}
          </motion.div>
        )}
      </div>
      
      {/* Grid des packages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {packages.map((pkg, index) => {
          const isRecommended = recommendation?.recommendedPackage.id === pkg.id;
          const isSelected = selectedPackage === pkg.id;
          const roi = calculateROI(pkg.id, expectedMonthlyRevenue);
          const formattedROI = roi ? formatROIForDisplay(roi) : null;
          
          return (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                relative rounded-2xl border-2 p-6 transition-all duration-300
                ${isSelected 
                  ? 'border-blue-600 bg-blue-50 shadow-xl scale-105' 
                  : isRecommended
                  ? 'border-blue-400 bg-white shadow-lg'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }
                ${pkg.popular ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
              `}
            >
              {/* Badge populaire */}
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                  PLUS POPULAIRE
                </div>
              )}
              
              {/* Badge recommandé */}
              {isRecommended && !pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  RECOMMANDÉ
                </div>
              )}
              
              <div className="space-y-6">
                {/* Icône et nom */}
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                    {packageIcons[pkg.id] || <Sparkles className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
                    <p className="text-sm text-gray-500">{pkg.duration}</p>
                  </div>
                </div>
                
                {/* Prix */}
                <div>
                  <div className="text-3xl font-bold text-gray-900">
                    {pkg.price.toLocaleString()} <span className="text-lg font-normal text-gray-500">FCFA</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    ≈ {pkg.priceEUR} EUR • Setup unique
                  </div>
                </div>
                
                {/* ROI rapide */}
                {formattedROI && (
                  <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                    <div className="text-xs text-gray-600 font-medium">ROI Projeté (1 an)</div>
                    <div className={`text-lg font-bold ${
                      formattedROI.profitability === 'excellent' ? 'text-green-600' :
                      formattedROI.profitability === 'good' ? 'text-blue-600' :
                      formattedROI.profitability === 'fair' ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>
                      {formattedROI.roiPercent}
                    </div>
                    <div className="text-xs text-gray-500">
                      Rentabilité: {formattedROI.breakEven}
                    </div>
                  </div>
                )}
                
                {/* Recommandation */}
                {pkg.recommended && (
                  <div className="text-sm text-gray-600 italic">
                    {pkg.recommended}
                  </div>
                )}
                
                {/* Features incluses */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-700">Inclus:</div>
                  <ul className="space-y-2">
                    {pkg.includes.slice(0, 5).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-green-600'}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                    {pkg.includes.length > 5 && (
                      <li className="text-sm text-gray-500 italic">
                        + {pkg.includes.length - 5} autres services
                      </li>
                    )}
                  </ul>
                </div>
                
                {/* Actions */}
                <div className="space-y-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleSelectPackage(pkg.id)}
                    className={`
                      w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200
                      flex items-center justify-center gap-2
                      ${isSelected 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                      }
                    `}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-5 h-5" />
                        Sélectionné
                      </>
                    ) : (
                      <>
                        Choisir ce package
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleViewROI(pkg.id)}
                    className="w-full py-2 px-4 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Calculator className="w-4 h-4" />
                    Calculer le ROI
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Informations supplémentaires */}
      <div className="bg-gray-50 rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          📊 Commission mensuelle: 10% de votre chiffre d'affaires
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-gray-600">Si vous faites</div>
            <div className="text-2xl font-bold text-gray-900">1M FCFA</div>
            <div className="text-sm text-gray-600">→ Commission: <span className="font-semibold">100K FCFA</span></div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-gray-600">Si vous faites</div>
            <div className="text-2xl font-bold text-gray-900">3M FCFA</div>
            <div className="text-sm text-gray-600">→ Commission: <span className="font-semibold">300K FCFA</span></div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-gray-600">Si vous faites</div>
            <div className="text-2xl font-bold text-gray-900">10M FCFA</div>
            <div className="text-sm text-gray-600">→ Commission: <span className="font-semibold">1M FCFA</span></div>
          </div>
        </div>
        <p className="text-sm text-gray-600 text-center">
          💡 Plus vous vendez, plus nous gagnons ensemble. Commission minimum de 100K FCFA/mois.
        </p>
      </div>
    </div>
  );
}
