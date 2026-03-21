/**
 * PricingSection - Section pricing pour la landing page
 * Version compacte et attractive des 4 nouveaux plans
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Users, ShoppingCart, Crown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const PLANS = [
  {
    id: 'essentiel',
    name: 'Essentiel',
    tagline: 'Gratuit',
    description: 'Identité économique digitale',
    price: 0,
    priceLabel: 'Gratuit',
    icon: <Sparkles className="h-5 w-5" />,
    color: 'from-emerald-500 to-teal-600',
    features: [
      'Carte de visite digitale',
      'Portfolio basique (10 items)',
      'Partage illimité',
    ],
    cta: 'Commencer',
    ctaStyle: 'outline',
  },
  {
    id: 'connexions',
    name: 'Connexions',
    tagline: '15,000 FCFA/mois',
    description: 'CRM + Agenda complet',
    price: 15000,
    priceLabel: '15K FCFA',
    icon: <Users className="h-5 w-5" />,
    color: 'from-blue-500 to-indigo-600',
    popular: true,
    features: [
      '✨ Tout Essentiel',
      'CRM complet',
      'Gestion des RDV',
      'Calendrier intelligent',
    ],
    cta: 'Choisir',
    ctaStyle: 'solid',
  },
  {
    id: 'commerce',
    name: 'Commerce',
    tagline: 'Commission 5%',
    description: 'E-commerce sans frais fixes',
    price: 0,
    priceLabel: '5% comm',
    icon: <ShoppingCart className="h-5 w-5" />,
    color: 'from-orange-500 to-pink-600',
    features: [
      '✨ Tout Essentiel',
      'Boutique en ligne',
      'Gestion stock',
      'Paiements sécurisés',
    ],
    cta: 'Lancer',
    ctaStyle: 'outline',
  },
  {
    id: 'opere',
    name: 'Opéré',
    tagline: 'Commission 10%',
    description: 'Partenariat premium complet',
    price: 0,
    priceLabel: '10% comm',
    icon: <Crown className="h-5 w-5" />,
    color: 'from-purple-500 to-pink-600',
    features: [
      '✨ Tout Commerce + Connexions',
      'Setup complet',
      'Marketing digital',
      'Account manager',
    ],
    cta: 'Devis',
    ctaStyle: 'outline',
  },
];

const PricingSection: React.FC = () => {
  return (
    <section className="py-24 md:py-32 bg-white relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white opacity-50" />
      
      <div className="container mx-auto px-6 md:px-12 lg:px-20 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16 md:mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 rounded-full px-4 py-1.5">
            Nouveau modèle 2026
          </Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 mb-6 tracking-tight">
            4 offres, une mission
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto font-light leading-relaxed">
            De la découverte gratuite au partenariat stratégique premium
          </p>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-12">
          {PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={cn(
                "relative rounded-3xl p-8 transition-all duration-300 hover:shadow-2xl",
                "border-2 bg-white",
                plan.popular 
                  ? "border-transparent shadow-xl lg:scale-105" 
                  : "border-gray-200 hover:border-gray-300 shadow-md"
              )}
              style={{
                background: plan.popular 
                  ? `linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)` 
                  : 'white'
              }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 rounded-full px-3 py-1 text-xs shadow-lg">
                    ⭐ Populaire
                  </Badge>
                </div>
              )}

              {/* Icon */}
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-white shadow-md",
                `bg-gradient-to-br ${plan.color}`
              )}>
                {plan.icon}
              </div>

              {/* Content */}
              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-sm font-medium text-gray-600">
                    {plan.tagline}
                  </p>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed min-h-[40px]">
                  {plan.description}
                </p>

                {/* Features */}
                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <div className={cn(
                        "flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5",
                        `bg-gradient-to-br ${plan.color}`
                      )}>
                        <Check className="h-2.5 w-2.5 text-white" />
                      </div>
                      <span className="text-gray-700 leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <Button
                className={cn(
                  "w-full rounded-xl font-medium transition-all duration-300",
                  plan.ctaStyle === 'solid'
                    ? `bg-gradient-to-r ${plan.color} text-white hover:scale-105 shadow-lg`
                    : "border-2 border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400"
                )}
                asChild
              >
                <Link to={plan.id === 'opere' ? '/contact?subject=opere' : '/pricing-new'}>
                  {plan.cta}
                </Link>
              </Button>
            </motion.div>
          ))}
        </div>

        {/* CTA to full pricing */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Link to="/pricing-new">
            <Button
              size="lg"
              variant="outline"
              className="rounded-xl border-2 border-gray-300 hover:bg-gray-50 px-8"
            >
              Voir le détail complet
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
