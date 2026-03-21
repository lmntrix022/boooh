/**
 * Assistant de migration des anciens plans vers les nouveaux
 * Pour aider les utilisateurs FREE, BUSINESS, MAGIC à migrer vers
 * ESSENTIEL, CONNEXIONS, COMMERCE, OPERE
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Check, 
  Gift, 
  TrendingDown, 
  Sparkles,
  Calendar,
  DollarSign,
  ShoppingBag,
  Users,
  Crown,
  Info
} from 'lucide-react';
import { PlanType, MIGRATION_MAPPING, isLegacyPlan } from '@/types/subscription';
import { useNewSubscription } from '@/hooks/useNewSubscription';
import { comparePlans } from '@/services/dynamicCommissionService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface MigrationStep {
  id: number;
  title: string;
  completed: boolean;
}

export function MigrationAssistant() {
  const { user } = useAuth();
  const { planType: currentPlan, subscription } = useNewSubscription();
  const [selectedNewPlan, setSelectedNewPlan] = useState<PlanType | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState(1000000); // 1M FCFA
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Vérifier si l'utilisateur peut migrer
  const canMigrate = useMemo(() => {
    return currentPlan && isLegacyPlan(currentPlan);
  }, [currentPlan]);
  
  // Options de migration disponibles
  const migrationOptions = useMemo(() => {
    if (!currentPlan) return [];
    return MIGRATION_MAPPING[currentPlan] || [];
  }, [currentPlan]);
  
  // Comparaison des coûts
  const costComparison = useMemo(() => {
    if (!currentPlan || !selectedNewPlan) return null;
    return comparePlans(currentPlan, selectedNewPlan, monthlyRevenue);
  }, [currentPlan, selectedNewPlan, monthlyRevenue]);
  
  // Étapes de migration
  const steps: MigrationStep[] = [
    { id: 0, title: 'Analyse de votre usage', completed: currentStep > 0 },
    { id: 1, title: 'Choix du nouveau plan', completed: currentStep > 1 },
    { id: 2, title: 'Révision et confirmation', completed: currentStep > 2 },
    { id: 3, title: 'Migration complète', completed: currentStep > 3 },
  ];
  
  // Icônes des plans
  const planIcons: Record<string, React.ReactNode> = {
    [PlanType.ESSENTIEL]: <Sparkles className="w-5 h-5" />,
    [PlanType.CONNEXIONS]: <Calendar className="w-5 h-5" />,
    [PlanType.COMMERCE]: <ShoppingBag className="w-5 h-5" />,
    [PlanType.OPERE]: <Crown className="w-5 h-5" />,
  };
  
  const planColors: Record<string, string> = {
    [PlanType.ESSENTIEL]: 'from-gray-500 to-gray-600',
    [PlanType.CONNEXIONS]: 'from-blue-500 to-blue-600',
    [PlanType.COMMERCE]: 'from-purple-500 to-purple-600',
    [PlanType.OPERE]: 'from-amber-500 to-amber-600',
  };
  
  // Effectuer la migration
  const handleMigrate = async () => {
    if (!user || !currentPlan || !selectedNewPlan) return;
    
    setLoading(true);
    try {
      // 1. Mettre à jour l'abonnement
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          plan_type: selectedNewPlan,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('plan_type', currentPlan);
      
      if (updateError) throw updateError;
      
      // 2. Enregistrer la migration
      const { error: migrationError } = await supabase
        .from('subscription_migrations')
        .insert({
          user_id: user.id,
          from_plan: currentPlan,
          to_plan: selectedNewPlan,
          migration_type: 'user_choice',
          migration_reason: 'Migration assistée via interface',
          incentive_applied: getIncentive(selectedNewPlan),
        });
      
      if (migrationError) throw migrationError;
      
      // 3. Passer à l'étape finale
      setCurrentStep(3);
      
      // 4. Recharger après 2 secondes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Erreur migration:', error);
      alert('Erreur lors de la migration. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };
  
  // Obtenir l'incentive pour un plan
  const getIncentive = (plan: PlanType): string => {
    const option = migrationOptions.find(o => o.targetPlan === plan);
    return option?.incentive || '';
  };
  
  if (!canMigrate) {
    return (
      <div className="text-center py-12">
        <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">
          Vous utilisez déjà un plan récent. Aucune migration n'est nécessaire.
        </p>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* En-tête */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold"
        >
          <Gift className="w-5 h-5" />
          Migration gratuite avec bonus !
        </motion.div>
        <h1 className="text-4xl font-bold text-gray-900">
          Migrez vers nos nouveaux plans
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Découvrez nos plans optimisés pour mieux correspondre à votre usage.
          Migration gratuite avec des avantages exclusifs !
        </p>
      </div>
      
      {/* Stepper */}
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-2">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300
                ${step.completed 
                  ? 'bg-green-600 text-white' 
                  : currentStep === step.id
                  ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                  : 'bg-gray-200 text-gray-500'
                }
              `}>
                {step.completed ? <Check className="w-6 h-6" /> : step.id + 1}
              </div>
              <div className={`text-xs font-medium ${currentStep === step.id ? 'text-blue-600' : 'text-gray-600'}`}>
                {step.title}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 ${step.completed ? 'bg-green-600' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
      
      {/* Contenu selon l'étape */}
      <AnimatePresence mode="wait">
        {/* Étape 0: Analyse */}
        {currentStep === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Analysons votre usage actuel
              </h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Plan actuel</div>
                    <div className="text-sm text-gray-600">
                      {currentPlan === PlanType.FREE && 'FREE - Gratuit'}
                      {currentPlan === PlanType.BUSINESS && 'BUSINESS - 20€/mois'}
                      {currentPlan === PlanType.MAGIC && 'MAGIC - 40€/mois'}
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <DollarSign className="w-4 h-4 inline mr-2" />
                    Quel est votre chiffre d'affaires mensuel approximatif ?
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10000000"
                    step="100000"
                    value={monthlyRevenue}
                    onChange={(e) => setMonthlyRevenue(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="text-center mt-3">
                    <div className="text-2xl font-bold text-gray-900">
                      {(monthlyRevenue / 1000).toLocaleString()} K FCFA
                    </div>
                    <div className="text-sm text-gray-500">par mois</div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setCurrentStep(1)}
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                Voir les recommandations
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
        
        {/* Étape 1: Choix */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Choisissez votre nouveau plan
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {migrationOptions.map((option) => {
                const comparison = comparePlans(currentPlan!, option.targetPlan, monthlyRevenue);
                const isSelected = selectedNewPlan === option.targetPlan;
                
                return (
                  <motion.div
                    key={option.targetPlan}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedNewPlan(option.targetPlan)}
                    className={`
                      relative cursor-pointer rounded-2xl border-2 p-6 transition-all duration-300
                      ${isSelected 
                        ? 'border-blue-600 bg-blue-50 shadow-xl' 
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg'
                      }
                    `}
                  >
                    {/* Badge incentive */}
                    {option.incentive && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                        <Gift className="w-3 h-3" />
                        {option.incentive}
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      {/* En-tête */}
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${planColors[option.targetPlan]} text-white`}>
                          {planIcons[option.targetPlan]}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900">
                            {option.targetPlan.toUpperCase()}
                          </h3>
                          {comparison.savings > 0 && (
                            <div className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                              <TrendingDown className="w-4 h-4" />
                              Économisez {comparison.savingsPercent.toFixed(0)}%
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                      
                      {/* Raison */}
                      <p className="text-sm text-gray-700">
                        {option.reason}
                      </p>
                      
                      {/* Comparaison */}
                      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
                        <div>
                          <div className="text-xs text-gray-500">Avant</div>
                          <div className="text-lg font-bold text-gray-900">
                            {comparison.currentCost.toLocaleString()} F
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Après</div>
                          <div className="text-lg font-bold text-green-600">
                            {comparison.targetCost.toLocaleString()} F
                          </div>
                        </div>
                      </div>
                      
                      {/* Savings */}
                      {option.savings && (
                        <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700 font-medium">
                          💰 {option.savings}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(0)}
                className="flex-1 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Retour
              </button>
              <button
                onClick={() => setCurrentStep(2)}
                disabled={!selectedNewPlan}
                className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continuer
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
        
        {/* Étape 2: Confirmation */}
        {currentStep === 2 && selectedNewPlan && costComparison && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Confirmez votre migration
              </h2>
              
              <div className="space-y-6">
                {/* Récapitulatif */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm text-gray-600">Vous passez de</div>
                      <div className="text-2xl font-bold text-gray-900">{currentPlan}</div>
                    </div>
                    <ArrowRight className="w-8 h-8 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">à</div>
                      <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {selectedNewPlan}
                      </div>
                    </div>
                  </div>
                  
                  {costComparison.savings > 0 && (
                    <div className="p-4 bg-white rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Économies mensuelles</div>
                      <div className="text-3xl font-bold text-green-600">
                        {costComparison.savings.toLocaleString()} FCFA
                      </div>
                      <div className="text-sm text-green-600 mt-1">
                        Soit {(costComparison.savings * 12).toLocaleString()} FCFA/an
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Incentives */}
                {getIncentive(selectedNewPlan) && (
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200">
                    <Gift className="w-8 h-8 text-amber-600" />
                    <div>
                      <div className="font-bold text-gray-900">Bonus de migration</div>
                      <div className="text-sm text-gray-700">{getIncentive(selectedNewPlan)}</div>
                    </div>
                  </div>
                )}
                
                {/* Conditions */}
                <div className="space-y-3">
                  <h3 className="font-bold text-gray-900">Ce qui change:</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Migration immédiate sans interruption de service</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Toutes vos données sont conservées</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Nouveau pricing appliqué dès aujourd'hui</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex-1 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Retour
              </button>
              <button
                onClick={handleMigrate}
                disabled={loading}
                className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Migration en cours...
                  </>
                ) : (
                  <>
                    Confirmer la migration
                    <Check className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
        
        {/* Étape 3: Succès */}
        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-6 py-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto"
            >
              <Check className="w-12 h-12 text-white" />
            </motion.div>
            
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Migration réussie ! 🎉
              </h2>
              <p className="text-lg text-gray-600">
                Vous êtes maintenant sur le plan <span className="font-bold text-blue-600">{selectedNewPlan}</span>
              </p>
            </div>
            
            <div className="text-sm text-gray-500">
              Rechargement de la page dans quelques instants...
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
