/**
 * OperePackagesSection - Section pour les packages setup Opéré
 * Affiche les 4 packages avec leurs détails et ROI
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Check, Star, Package, TrendingUp, Users, Building, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OperePackage {
  id: string;
  name: string;
  price: number;
  priceEur: number;
  duration: string;
  description: string;
  recommended?: string;
  popular?: boolean;
  icon: React.ReactNode;
  color: string;
  includes: string[];
  targetRevenue: {
    min: number;
    max: number | null;
  };
}

const OPERE_PACKAGES: OperePackage[] = [
  {
    id: 'standard',
    name: 'Standard',
    price: 50000,
    priceEur: 76,
    duration: '2-3 jours',
    description: 'Configuration essentielle pour démarrer rapidement',
    recommended: 'Pour démarrage rapide',
    icon: <Package className="h-6 w-6" />,
    color: 'from-blue-500 to-cyan-600',
    includes: [
      'Configuration compte Bööh complet',
      'Import produits/services (jusqu\'à 50)',
      'Configuration méthodes de paiement',
      'Formation utilisateur (2 heures)',
      'Documentation complète',
      'Support email 7 jours',
    ],
    targetRevenue: {
      min: 0,
      max: 1000000,
    },
  },
  {
    id: 'business',
    name: 'Business',
    price: 150000,
    priceEur: 229,
    duration: '1 semaine',
    description: 'Solution complète pour PME et boutiques',
    recommended: 'Recommandé pour PME',
    popular: true,
    icon: <Users className="h-6 w-6" />,
    color: 'from-purple-500 to-pink-600',
    includes: [
      '✅ Tout Standard',
      'Stratégie digitale personnalisée',
      'Setup Google Analytics + Meta Pixel',
      'Configuration campagnes ads (Facebook/Instagram)',
      'Design carte visite premium personnalisé',
      'Formation équipe complète (5 heures)',
      'Support prioritaire 30 jours',
      'Audit initial présence digitale',
    ],
    targetRevenue: {
      min: 1000000,
      max: 5000000,
    },
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 300000,
    priceEur: 458,
    duration: '2-3 semaines',
    description: 'Pack avancé pour entreprises établies',
    recommended: 'Pour grandes entreprises',
    icon: <Star className="h-6 w-6" />,
    color: 'from-orange-500 to-red-600',
    includes: [
      '✅ Tout Business',
      'Campagne marketing de lancement complète',
      'Création de contenu professionnel (10 posts)',
      'Setup email marketing + automation',
      'Intégrations custom (ERP, CRM externe)',
      'Audit SEO complet + optimisation',
      'Formation avancée équipe (10 heures)',
      'Account manager dédié 90 jours',
      'Reporting mensuel personnalisé',
    ],
    targetRevenue: {
      min: 5000000,
      max: 10000000,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 500000,
    priceEur: 763,
    duration: '1 mois',
    description: 'Solution sur mesure pour grandes organisations',
    recommended: 'Pour corporations',
    icon: <Building className="h-6 w-6" />,
    color: 'from-gray-700 to-gray-900',
    includes: [
      '✅ Tout Premium',
      'Stratégie growth marketing sur 3 mois',
      'Campagne multi-canaux (Social, Email, SEO)',
      'Création contenu avancé (vidéos, photos pro)',
      'Marketing automation complet',
      'Intégrations complexes et API custom',
      'White label complet (votre marque)',
      'Consulting stratégique trimestriel',
      'Account manager dédié 12 mois',
      'Support 24/7 prioritaire',
      'SLA 99.9% garanti',
    ],
    targetRevenue: {
      min: 10000000,
      max: null,
    },
  },
];

interface OperePackagesSectionProps {
  onSelectPackage?: (packageId: string) => void;
}

const OperePackagesSection: React.FC<OperePackagesSectionProps> = ({ onSelectPackage }) => {
  const [hoveredPackage, setHoveredPackage] = useState<string | null>(null);

  const formatRevenue = (amount: number | null) => {
    if (amount === null) return '+';
    return `${(amount / 1000000).toFixed(1)}M`;
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-16">
        <Badge className="mb-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 rounded-full px-4 py-1.5">
          <Package className="h-3 w-3 mr-2" />
          Packages Setup
        </Badge>
        <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-6 tracking-tight">
          BÖÖH Opéré: Choisissez votre package
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Configuration, marketing, formation. Nous gérons tout pour que vous puissiez vous concentrer sur votre croissance.
        </p>
      </div>

      {/* Packages Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {OPERE_PACKAGES.map((pkg, index) => {
          const isHovered = hoveredPackage === pkg.id;

          return (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onHoverStart={() => setHoveredPackage(pkg.id)}
              onHoverEnd={() => setHoveredPackage(null)}
            >
              <Card
                className={cn(
                  "relative h-full p-8 transition-all duration-300",
                  "border-2 bg-white",
                  pkg.popular
                    ? "border-transparent shadow-2xl"
                    : isHovered
                    ? "border-gray-300 shadow-xl"
                    : "border-gray-200 shadow-md hover:shadow-lg"
                )}
              >
                {/* Popular Badge */}
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className={cn(
                      "bg-gradient-to-r text-white border-0 rounded-full px-4 py-1.5 text-xs font-medium shadow-lg",
                      pkg.color
                    )}>
                      ⭐ Plus populaire
                    </Badge>
                  </div>
                )}

                {/* Icon */}
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg",
                  `bg-gradient-to-br ${pkg.color}`
                )}>
                  {pkg.icon}
                </div>

                {/* Content */}
                <div className="space-y-4 mb-6">
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-1">
                      {pkg.name}
                    </h3>
                    <p className="text-sm font-medium text-gray-600">
                      {pkg.recommended}
                    </p>
                  </div>

                  <p className="text-sm text-gray-600 leading-relaxed">
                    {pkg.description}
                  </p>

                  {/* Price */}
                  <div className="py-4 border-t border-b border-gray-100">
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {pkg.price.toLocaleString('fr-FR')}
                      <span className="text-base font-normal text-gray-500 ml-2">FCFA</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Durée: {pkg.duration}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      CA cible: {formatRevenue(pkg.targetRevenue.min)} - {formatRevenue(pkg.targetRevenue.max)} FCFA/mois
                    </p>
                  </div>
                </div>

                {/* Includes */}
                <ul className="space-y-2 mb-8">
                  {pkg.includes.slice(0, 6).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <div className={cn(
                        "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5",
                        `bg-gradient-to-br ${pkg.color}`
                      )}>
                        <Check className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-gray-700 leading-relaxed">{feature}</span>
                    </li>
                  ))}
                  {pkg.includes.length > 6 && (
                    <li className="text-sm text-gray-500 ml-7">
                      + {pkg.includes.length - 6} autres avantages
                    </li>
                  )}
                </ul>

                {/* CTA */}
                <Button
                  className={cn(
                    "w-full rounded-xl text-white font-medium shadow-lg transition-all duration-300",
                    `bg-gradient-to-r ${pkg.color}`,
                    isHovered && "scale-105 shadow-2xl"
                  )}
                  onClick={() => onSelectPackage?.(pkg.id)}
                >
                  Choisir {pkg.name}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ROI Explanation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-16 max-w-4xl mx-auto"
      >
        <Card className="p-8 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-100">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Investissement rentabilisé rapidement
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Avec la commission de 10% sur vos transactions, notre accompagnement s'autofinance rapidement. 
                Par exemple, avec un CA mensuel de 2M FCFA, le package Business (150K) est rentabilisé en moins de 2 mois.
              </p>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="bg-white rounded-lg p-4 border border-purple-100">
                  <p className="font-semibold text-gray-900 mb-1">Exemple: Package Business</p>
                  <p className="text-gray-600">
                    Transactions: 2M FCFA/mois → Commission: 200K FCFA/mois<br />
                    <strong className="text-purple-600">ROI: ~1.5 mois</strong>
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-purple-100">
                  <p className="font-semibold text-gray-900 mb-1">Inclus dans tous les packages</p>
                  <p className="text-gray-600">
                    Account manager, formation, support, marketing digital, analytics, et optimisations continues.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Bottom CTA */}
      <div className="text-center mt-12">
        <p className="text-gray-600 mb-4">
          Besoin d'un package sur mesure ?
        </p>
        <Button
          variant="outline"
          size="lg"
          className="rounded-xl border-2 border-gray-300 hover:bg-gray-50"
        >
          Parler à un expert
        </Button>
      </div>
    </div>
  );
};

export default OperePackagesSection;
