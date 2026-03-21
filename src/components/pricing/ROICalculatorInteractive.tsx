/**
 * ROI Calculator Interactive - Calculateur de retour sur investissement
 * Pour les plans Commerce et Opéré
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  DollarSign,
  Calendar,
  Target,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ROIResult {
  monthlyRevenue: number;
  connexionsRevenue: number;
  commerceCommission: number;
  opereCommission: number;
  opereSetupFee: number;
  commerceTotal: number;
  opereTotal: number;
  bestOption: 'connexions' | 'commerce' | 'opere';
  breakEvenMonths: number;
}

const ROICalculatorInteractive: React.FC = () => {
  const [monthlyRevenue, setMonthlyRevenue] = useState(2000000); // 2M FCFA
  const [setupPackage, setSetupPackage] = useState<'standard' | 'business' | 'premium' | 'enterprise'>('business');

  const setupFees = {
    standard: 50000,
    business: 150000,
    premium: 300000,
    enterprise: 500000,
  };

  const setupPackageLabels = {
    standard: 'Standard (50K)',
    business: 'Business (150K)',
    premium: 'Premium (300K)',
    enterprise: 'Enterprise (500K)',
  };

  // Calculs
  const results = useMemo((): ROIResult => {
    const connexionsRevenue = 15000; // Abonnement fixe
    const commerceCommission = monthlyRevenue * 0.05; // 5%
    const opereCommission = monthlyRevenue * 0.10; // 10%
    const opereSetupFee = setupFees[setupPackage];

    const commerceTotal = commerceCommission;
    const opereTotal = opereCommission;

    // Déterminer la meilleure option
    let bestOption: 'connexions' | 'commerce' | 'opere';
    
    if (monthlyRevenue < 300000) {
      bestOption = 'connexions'; // < 300K FCFA/mois: Connexions est plus rentable
    } else if (monthlyRevenue < 1500000) {
      bestOption = 'commerce'; // 300K-1.5M FCFA/mois: Commerce est optimal
    } else {
      bestOption = 'opere'; // > 1.5M FCFA/mois: Opéré justifie l'investissement
    }

    // Break-even pour Opéré (mois pour récupérer le setup)
    const monthlyOpereGain = opereCommission - commerceCommission;
    const breakEvenMonths = monthlyOpereGain > 0 
      ? Math.ceil(opereSetupFee / monthlyOpereGain)
      : 99;

    return {
      monthlyRevenue,
      connexionsRevenue,
      commerceCommission,
      opereCommission,
      opereSetupFee,
      commerceTotal,
      opereTotal,
      bestOption,
      breakEvenMonths,
    };
  }, [monthlyRevenue, setupPackage]);

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <Badge className="mb-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 rounded-full px-4 py-1.5">
          <Calculator className="h-3 w-3 mr-2" />
          Simulateur
        </Badge>
        <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
          Calculez votre retour sur investissement
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Découvrez quelle offre maximise votre rentabilité selon votre chiffre d'affaires
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Inputs Section */}
        <Card className="p-8 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Vos paramètres
          </h3>

          <div className="space-y-8">
            {/* Monthly Revenue Slider */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <Label className="text-sm font-medium text-gray-700">
                  Chiffre d'affaires mensuel
                </Label>
                <Badge variant="secondary" className="text-lg font-bold">
                  {formatCurrency(monthlyRevenue)}
                </Badge>
              </div>
              <Slider
                value={[monthlyRevenue]}
                onValueChange={(value) => setMonthlyRevenue(value[0])}
                min={100000}
                max={10000000}
                step={100000}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>100K FCFA</span>
                <span>10M FCFA</span>
              </div>
            </div>

            {/* Setup Package Selection */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-4 block">
                Package Setup Opéré
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(setupPackageLabels).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSetupPackage(key as typeof setupPackage)}
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all text-sm font-medium",
                      setupPackage === key
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Scénarios rapides
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Débutant', value: 500000 },
                  { label: 'PME', value: 2000000 },
                  { label: 'Établi', value: 5000000 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setMonthlyRevenue(preset.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Results Section */}
        <Card className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Votre analyse
          </h3>

          <div className="space-y-4 mb-6">
            {/* Connexions */}
            <div className={cn(
              "p-4 rounded-xl border-2 transition-all",
              results.bestOption === 'connexions' 
                ? "border-blue-500 bg-blue-50/50" 
                : "border-gray-200 bg-white/50"
            )}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-900">BÖÖH Connexions</span>
                {results.bestOption === 'connexions' && (
                  <Badge className="bg-blue-500 text-white">Recommandé</Badge>
                )}
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(results.connexionsRevenue)}
                <span className="text-sm font-normal text-gray-600 ml-2">/mois</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">Abonnement fixe</p>
            </div>

            {/* Commerce */}
            <div className={cn(
              "p-4 rounded-xl border-2 transition-all",
              results.bestOption === 'commerce' 
                ? "border-orange-500 bg-orange-50/50" 
                : "border-gray-200 bg-white/50"
            )}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-900">BÖÖH Commerce</span>
                {results.bestOption === 'commerce' && (
                  <Badge className="bg-orange-500 text-white">Recommandé</Badge>
                )}
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(results.commerceCommission)}
                <span className="text-sm font-normal text-gray-600 ml-2">/mois</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">5% commission sur les transactions</p>
            </div>

            {/* Opéré */}
            <div className={cn(
              "p-4 rounded-xl border-2 transition-all",
              results.bestOption === 'opere' 
                ? "border-purple-500 bg-purple-50/50" 
                : "border-gray-200 bg-white/50"
            )}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-900">BÖÖH Opéré</span>
                {results.bestOption === 'opere' && (
                  <Badge className="bg-purple-500 text-white">Recommandé</Badge>
                )}
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(results.opereCommission)}
                <span className="text-sm font-normal text-gray-600 ml-2">/mois</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-xs text-gray-600">
                  10% commission + {formatCurrency(results.opereSetupFee)} setup
                </p>
              </div>
              {results.bestOption === 'opere' && (
                <p className="text-xs text-purple-600 mt-2 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  ROI en {results.breakEvenMonths} mois
                </p>
              )}
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-white rounded-xl p-5 border-2 border-gray-200">
            <div className="flex items-start gap-3">
              <div className={cn(
                "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                results.bestOption === 'connexions' && "bg-blue-100",
                results.bestOption === 'commerce' && "bg-orange-100",
                results.bestOption === 'opere' && "bg-purple-100"
              )}>
                {results.bestOption === 'connexions' && <DollarSign className="h-5 w-5 text-blue-600" />}
                {results.bestOption === 'commerce' && <TrendingUp className="h-5 w-5 text-orange-600" />}
                {results.bestOption === 'opere' && <Target className="h-5 w-5 text-purple-600" />}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  Notre recommandation
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {results.bestOption === 'connexions' && (
                    <>
                      Avec {formatCurrency(monthlyRevenue)} de CA mensuel, <strong>BÖÖH Connexions</strong> est optimal. 
                      L'abonnement fixe de 15K FCFA vous offre un CRM complet sans commission.
                    </>
                  )}
                  {results.bestOption === 'commerce' && (
                    <>
                      <strong>BÖÖH Commerce</strong> est idéal pour votre CA de {formatCurrency(monthlyRevenue)}. 
                      Avec 5% de commission et zéro frais fixes, vous scalez sans limite.
                    </>
                  )}
                  {results.bestOption === 'opere' && (
                    <>
                      <strong>BÖÖH Opéré</strong> maximise votre croissance. Avec {formatCurrency(monthlyRevenue)} de CA, 
                      notre accompagnement premium rentabilise le setup en {results.breakEvenMonths} mois.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 text-center"
      >
        <p className="text-sm text-gray-600">
          💡 Les calculs sont estimatifs et basés sur un CA mensuel constant. 
          Contactez-nous pour une analyse personnalisée.
        </p>
      </motion.div>
    </div>
  );
};

export default ROICalculatorInteractive;
