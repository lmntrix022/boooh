/**
 * PricingNewPlans - Composant pour les 4 nouveaux plans
 * Design moderne et minimaliste Apple-level
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Users, ShoppingCart, Crown, TrendingUp, Calendar, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export interface NewPlan {
  id: 'essentiel' | 'connexions' | 'commerce' | 'opere';
  name: string;
  tagline: string;
  description: string;
  price: number;
  priceLabel: string;
  commission?: number;
  setupFee?: string;
  icon: React.ReactNode;
  color: string;
  popular?: boolean;
  features: string[];
  cta: string;
  ctaColor: string;
}

const NEW_PLANS: NewPlan[] = [
  {
    id: 'essentiel',
    name: 'BÖÖH Essentiel',
    tagline: 'Votre départ gratuit',
    description: 'Identité économique minimale pour tester et adopter',
    price: 0,
    priceLabel: 'Gratuit',
    icon: <Sparkles className="h-6 w-6" />,
    color: 'from-gray-600 to-gray-900',
    features: [
      'Carte de visite digitale',
      'Portfolio basique (10 items)',
      'Partage illimité',
      'Support communautaire',
      'Analytics de base',
    ],
    cta: 'Commencer gratuitement',
    ctaColor: 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50',
  },
  {
    id: 'connexions',
    name: 'BÖÖH Connexions',
    tagline: 'Capital relationnel',
    description: 'CRM + Agenda pour structurer vos opportunités',
    price: 15000,
    priceLabel: '15,000 FCFA/mois',
    icon: <Users className="h-6 w-6" />,
    color: 'from-gray-700 to-gray-900',
    popular: true,
    features: [
      '✨ Tout Essentiel',
      'CRM complet & contacts illimités',
      'Gestion des rendez-vous',
      'Calendrier intelligent',
      'Rappels automatiques',
      'Analytics avancées',
      'Support prioritaire',
    ],
    cta: 'Choisir Connexions',
    ctaColor: 'bg-gray-900 text-white hover:bg-gray-800',
  },
  {
    id: 'commerce',
    name: 'BÖÖH Commerce',
    tagline: 'Vendre en ligne',
    description: 'E-commerce complet avec commission 5% uniquement',
    price: 0,
    priceLabel: 'Commission 5%',
    commission: 5,
    icon: <ShoppingCart className="h-6 w-6" />,
    color: 'from-gray-600 to-gray-800',
    features: [
      '✨ Tout Essentiel',
      'Boutique en ligne complète',
      'Gestion stock & produits',
      'Paiements sécurisés',
      'Commissions 5% sur ventes',
      'Pas de frais fixes',
      'Scalable à l\'infini',
    ],
    cta: 'Lancer ma boutique',
    ctaColor: 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50',
  },
  {
    id: 'opere',
    name: 'BÖÖH Opéré',
    tagline: 'Partenariat premium',
    description: 'Nous gérons votre croissance pour vous',
    price: 0,
    priceLabel: 'Commission 10%',
    commission: 10,
    setupFee: '50K - 500K FCFA',
    icon: <Crown className="h-6 w-6" />,
    color: 'from-gray-700 to-gray-900',
    features: [
      '✨ Tout Commerce + Connexions',
      'Setup & configuration complets',
      'Marketing digital inclus',
      'Account manager dédié',
      'Consulting stratégique',
      'Formation équipe',
      'Commission 10% alignée',
    ],
    cta: 'Demander un devis',
    ctaColor: 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50',
  },
];

export interface PricingNewPlansProps {
  currentPlan?: string;
  onSelectPlan?: (planId: string) => void;
  showComparison?: boolean;
}

const PricingNewPlans: React.FC<PricingNewPlansProps> = ({ 
  currentPlan, 
  onSelectPlan,
  showComparison = false 
}) => {
  const navigate = useNavigate();
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  const handleSelectPlan = (planId: string) => {
    if (onSelectPlan) {
      onSelectPlan(planId);
    } else {
      if (planId === 'essentiel') {
        navigate('/auth');
      } else if (planId === 'opere') {
        navigate('/contact?subject=opere');
      } else {
        navigate('/auth');
      }
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-16 md:mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-gray-900 mb-6 tracking-tight leading-tight">
            Tarifs
          </h1>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto font-light leading-relaxed">
            Choisissez l'offre adaptée à votre croissance. De la découverte gratuite au partenariat stratégique premium.
          </p>
        </motion.div>
      </div>

      {/* Plans Grid - 4 colonnes sur desktop, responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {NEW_PLANS.map((plan, index) => {
          const isCurrentPlan = currentPlan === plan.id;
          const isHovered = hoveredPlan === plan.id;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onHoverStart={() => setHoveredPlan(plan.id)}
              onHoverEnd={() => setHoveredPlan(null)}
              className={cn(
                "relative rounded-2xl p-8 md:p-10 transition-all",
                plan.popular 
                  ? "border-gray-900 border-2 bg-gray-50" 
                  : "border border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gray-900 text-white border-0 rounded-full px-4 py-1 text-xs font-medium">
                    Plus populaire
                  </Badge>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <div className="absolute top-6 right-6">
                  <Badge variant="outline" className="border-gray-300 text-gray-600 rounded-full px-3 py-1 text-xs font-medium">
                    <Check className="h-3 w-3 mr-1" />
                    Plan actuel
                  </Badge>
                </div>
              )}

              {/* Icon */}
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center mb-4 border",
                plan.popular ? "bg-gray-900 border-gray-900" : "bg-gray-100 border-gray-200"
              )}>
                {React.cloneElement(plan.icon as React.ReactElement, {
                  className: cn("h-6 w-6", plan.popular ? "text-white" : "text-gray-600")
                })}
              </div>

              {/* Content */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl md:text-3xl font-medium mb-2 tracking-tight text-gray-900">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-500 font-light leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div>
                  <div className="flex items-baseline">
                    <span className="text-4xl md:text-5xl font-light text-gray-900 tracking-tight">
                      {plan.price === 0 ? plan.priceLabel : plan.price.toLocaleString('fr-FR')}
                    </span>
                    {plan.price > 0 && (
                      <span className="ml-2 text-sm text-gray-500 font-light">
                        FCFA/mois
                      </span>
                    )}
                  </div>
                  {plan.commission && (
                    <p className="text-sm text-gray-600 mt-1">
                      {plan.commission}% commission sur ventes
                    </p>
                  )}
                  {plan.setupFee && (
                    <p className="text-sm text-gray-600 mt-1">
                      Setup: {plan.setupFee}
                    </p>
                  )}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-4 h-4 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 text-gray-600" />
                      </div>
                    </div>
                    <span className="text-sm text-gray-600 font-light leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="pt-4">
                {isCurrentPlan ? (
                  <Button
                    className="w-full rounded-lg border-gray-200 bg-gray-50 text-gray-400 font-normal cursor-not-allowed"
                    disabled
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Plan actuel
                  </Button>
                ) : (
                  <Button
                    className={cn(
                      "w-full rounded-lg font-normal",
                      plan.ctaColor
                    )}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {plan.cta}
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Comparison Note */}
      {showComparison && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <p className="text-sm text-gray-600 font-light leading-relaxed text-center">
              <span className="font-medium text-gray-900">Pourquoi 4 offres ?</span> De la découverte gratuite (Essentiel) au MRR stable (Connexions), jusqu'au e-commerce scalable (Commerce 5%) et au partenariat premium (Opéré 10%). Chaque offre correspond à une étape de croissance.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PricingNewPlans;
