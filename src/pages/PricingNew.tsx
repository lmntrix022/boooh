/**
 * PricingNew - Nouvelle page pricing avec les 4 offres
 * Design Apple-level moderne et minimaliste
 */

import React from 'react';
import { motion } from 'framer-motion';
import PublicNavbar from '@/components/layout/PublicNavbar';
import PricingNewPlans from '@/components/pricing/PricingNewPlans';
import ROICalculatorInteractive from '@/components/pricing/ROICalculatorInteractive';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Check, Zap, Shield, Users, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const PricingNew: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Badge className="mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white border-0 rounded-full px-6 py-2 text-sm font-medium">
            Nouveau modèle de revenus 2026
          </Badge>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-gray-900 mb-6 tracking-tight leading-tight">
            Tarification simple,
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              revenus alignés
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto font-light leading-relaxed mb-8">
            De la découverte gratuite au partenariat stratégique premium. 
            Choisissez l'offre qui correspond à votre ambition.
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-12">
            {[
              { icon: Sparkles, label: 'Gratuit', value: 'Essentiel' },
              { icon: Users, label: 'CRM complet', value: '15K FCFA' },
              { icon: Zap, label: 'E-commerce', value: '5% comm' },
              { icon: Shield, label: 'Premium', value: '10% comm' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center p-4 rounded-2xl bg-gray-50 border border-gray-100"
              >
                <stat.icon className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Pricing Plans */}
        <section className="mb-32">
          <PricingNewPlans showComparison={true} />
        </section>

        {/* ROI Calculator */}
        <section className="mb-32">
          <ROICalculatorInteractive />
        </section>

        {/* Comparison Table */}
        <section className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-6">
              Comparaison détaillée
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Toutes les fonctionnalités de chaque plan, côte à côte
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left p-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Fonctionnalité
                  </th>
                  <th className="text-center p-4 text-sm font-semibold text-gray-900">
                    Essentiel
                  </th>
                  <th className="text-center p-4 text-sm font-semibold text-gray-900 bg-blue-50">
                    Connexions
                  </th>
                  <th className="text-center p-4 text-sm font-semibold text-gray-900">
                    Commerce
                  </th>
                  <th className="text-center p-4 text-sm font-semibold text-gray-900 bg-purple-50">
                    Opéré
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Carte de visite digitale', essentiel: true, connexions: true, commerce: true, opere: true },
                  { feature: 'Portfolio', essentiel: '10 items', connexions: 'Illimité', commerce: 'Illimité', opere: 'Illimité' },
                  { feature: 'CRM & Contacts', essentiel: false, connexions: true, commerce: false, opere: true },
                  { feature: 'Gestion agenda/RDV', essentiel: false, connexions: true, commerce: false, opere: true },
                  { feature: 'E-commerce / Boutique', essentiel: false, connexions: false, commerce: true, opere: true },
                  { feature: 'Gestion stock', essentiel: false, connexions: false, commerce: true, opere: true },
                  { feature: 'Paiements en ligne', essentiel: false, connexions: false, commerce: true, opere: true },
                  { feature: 'Analytics avancées', essentiel: 'Basique', connexions: true, commerce: true, opere: true },
                  { feature: 'Setup & configuration', essentiel: 'Self-service', connexions: 'Self-service', commerce: 'Self-service', opere: 'Complet' },
                  { feature: 'Marketing digital', essentiel: false, connexions: false, commerce: false, opere: true },
                  { feature: 'Account manager dédié', essentiel: false, connexions: false, commerce: false, opere: true },
                  { feature: 'Formation équipe', essentiel: false, connexions: false, commerce: false, opere: true },
                  { feature: 'Support', essentiel: 'Communautaire', connexions: 'Prioritaire', commerce: 'Standard', opere: '24/7 Dédié' },
                ].map((row, index) => (
                  <tr
                    key={index}
                    className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  >
                    <td className="p-4 text-sm text-gray-900 font-medium">
                      {row.feature}
                    </td>
                    {['essentiel', 'connexions', 'commerce', 'opere'].map((plan) => (
                      <td
                        key={plan}
                        className={`text-center p-4 ${plan === 'connexions' || plan === 'opere' ? 'bg-blue-50/30' : ''}`}
                      >
                        {typeof row[plan as keyof typeof row] === 'boolean' ? (
                          row[plan as keyof typeof row] ? (
                            <Check className="h-5 w-5 text-green-600 mx-auto" />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )
                        ) : (
                          <span className="text-sm text-gray-700">{row[plan as keyof typeof row] as string}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-6">
              Questions fréquentes
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                q: 'Puis-je commencer gratuitement ?',
                a: 'Oui ! BÖÖH Essentiel est 100% gratuit et vous permet de créer votre identité économique digitale sans aucun frais.',
              },
              {
                q: 'Quelle est la différence entre Commerce et Opéré ?',
                a: 'Commerce (5%) est self-service, idéal pour les e-commerçants autonomes. Opéré (10%) inclut notre accompagnement complet : setup, marketing, formation et account manager dédié.',
              },
              {
                q: 'Le setup fee est-il obligatoire pour Opéré ?',
                a: 'Oui, le setup fee couvre la configuration complète de votre compte, la stratégie marketing et la formation de votre équipe. 4 packages disponibles de 50K à 500K FCFA selon vos besoins.',
              },
              {
                q: 'Puis-je changer de plan ?',
                a: 'Absolument ! Vous pouvez upgrader ou downgrader à tout moment. Aucun engagement sur la durée.',
              },
              {
                q: 'Comment sont calculées les commissions ?',
                a: 'Les commissions sont calculées uniquement sur vos ventes réussies. Commerce: 5%, Opéré: 10%. Aucune commission sur Essentiel et Connexions.',
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {faq.q}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {faq.a}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 md:p-16 text-center text-white"
          >
            <h2 className="text-4xl md:text-5xl font-light mb-6">
              Prêt à démarrer ?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Rejoignez des milliers d'entrepreneurs qui font confiance à Bööh pour gérer leur activité.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Button
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-gray-100 rounded-xl px-8 py-6 text-lg font-medium"
                  asChild
                >
                  <Link to="/dashboard">
                    Accéder au Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="bg-white text-purple-600 hover:bg-gray-100 rounded-xl px-8 py-6 text-lg font-medium"
                    asChild
                  >
                    <Link to="/auth">
                      Commencer gratuitement
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white/10 rounded-xl px-8 py-6 text-lg font-medium"
                    asChild
                  >
                    <Link to="/contact">
                      Parler à un expert
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default PricingNew;
