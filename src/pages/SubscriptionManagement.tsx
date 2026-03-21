import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { PLANS_INFO, ADDONS_INFO, ADDON_PRICES, PlanType, AddonType, PLAN_PRICES } from '@/types/subscription';
import { supabase } from '@/integrations/supabase/client';
import { formatAmount } from '@/utils/format';
import { CURRENCY_CHANGE_EVENT } from '@/components/settings/CurrencySelector';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Crown, Zap, Sparkles, Users, ShoppingCart, Check, Plus, X, ArrowRight, Loader2, AlertCircle, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';
import SubscriptionPaymentModal from '@/components/payment/SubscriptionPaymentModal';
import { MobileMoneyService } from '@/services/mobileMoneyService';
import TermsConsent from '@/components/payment/TermsConsent';

const SubscriptionManagement: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t } = useLanguage();
  const {
    subscription,
    planType,
    features,
    addons,
    isLoading,
    getTotalPrice,
    refetch,
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  // Convert addons array (UserAddon[]) to AddonType[] for selectedAddons
  const [selectedAddons, setSelectedAddons] = useState<AddonType[]>(
    addons.map(a => a.addon_type as AddonType)
  );
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCommerceConsentDialog, setShowCommerceConsentDialog] = useState(false);
  const [selectedCommercePlan, setSelectedCommercePlan] = useState<PlanType | null>(null);
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [currencyKey, setCurrencyKey] = useState(0); // Force re-render on currency change

  // Synchronize selectedAddons with actual addons when they change
  useEffect(() => {
    setSelectedAddons(addons.map(a => a.addon_type as AddonType));
  }, [addons]);

  // Pré-remplir les informations client si l'utilisateur est connecté
  useEffect(() => {
    if (user && showPaymentModal) {
      const loadUserInfo = async () => {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('id', user.id)
            .maybeSingle();

          if (profile && profile.full_name) {
            const nameParts = profile.full_name.split(' ');
            setCustomerInfo({
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
              email: user.email || '',
              phone: profile.phone || '',
            });
          } else if (user.email) {
            const nameParts = user.user_metadata?.full_name?.split(' ') || 
                             user.user_metadata?.name?.split(' ') || 
                             [];
            setCustomerInfo({
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
              email: user.email || '',
              phone: '',
            });
          }
        } catch (error) {
          if (user.email) {
            const nameParts = user.user_metadata?.full_name?.split(' ') || 
                             user.user_metadata?.name?.split(' ') || 
                             [];
            setCustomerInfo({
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
              email: user.email || '',
              phone: '',
            });
          }
        }
      };

      loadUserInfo();
    }
  }, [user, showPaymentModal]);

  // Listen to currency changes
  useEffect(() => {
    const handleCurrencyChange = () => {
      setCurrencyKey(prev => prev + 1);
    };
    window.addEventListener(CURRENCY_CHANGE_EVENT, handleCurrencyChange);
    return () => {
      window.removeEventListener(CURRENCY_CHANGE_EVENT, handleCurrencyChange);
    };
  }, []);

  const currentPlanInfo = PLANS_INFO.find(p => p.type === planType);

  // Helper functions pour obtenir les traductions des plans et add-ons
  const getTranslatedPlanName = (planType: PlanType) => {
    return t(`subscription.plans.${planType}.name`);
  };

  const getTranslatedPlanDescription = (planType: PlanType) => {
    return t(`subscription.plans.${planType}.description`);
  };

  const getTranslatedAddonName = (addonType: AddonType) => {
    return t(`subscription.addons.${addonType}.name`);
  };

  const getTranslatedAddonDescription = (addonType: AddonType) => {
    return t(`subscription.addons.${addonType}.description`);
  };

  // Helper function to convert EUR to FCFA with fixed prices for plans
  const convertToFCFA = (priceInEUR: number, planType?: PlanType): number => {
    // Prix fixes en FCFA pour les nouveaux plans stratégiques
    if (planType === PlanType.CONNEXIONS) {
      return 15000; // 15,000 FCFA - Capital relationnel
    }
    if (planType === PlanType.COMMERCE) {
      return 0; // 0 FCFA - Commission 5%
    }
    if (planType === PlanType.OPERE) {
      return 0; // 0 FCFA - Commission 10% + setup séparé
    }
    // Prix fixes pour les plans legacy maintenus
    if (planType === PlanType.BUSINESS) {
      return 15000; // 15,000 FCFA
    }
    if (planType === PlanType.MAGIC) {
      return 50000; // 50,000 FCFA
    }
    // Pour les autres cas (FREE, addons), convertir normalement
    return Math.round(priceInEUR * 655);
  };

  // Helper function to format price in FCFA
  const formatPriceFCFA = (priceInEUR: number, planType?: PlanType, interval: 'month' | 'year' = 'month'): string => {
    const monthlyPrice = convertToFCFA(priceInEUR, planType);
    if (interval === 'year') {
      // 2 mois offerts : 10 mois au lieu de 12
      const yearlyPrice = monthlyPrice * 10;
      return yearlyPrice.toLocaleString('fr-FR');
    }
    return monthlyPrice.toLocaleString('fr-FR');
  };

  // Helper function to get price with interval
  const getPriceWithInterval = (priceInEUR: number, planType?: PlanType, interval: 'month' | 'year' = 'month'): number => {
    // Plans basés sur commission - prix fixe de 0 FCFA
    if (planType === PlanType.COMMERCE || planType === PlanType.OPERE) {
      return 0;
    }

    const monthlyPrice = convertToFCFA(priceInEUR, planType);
    if (interval === 'year') {
      // 2 mois offerts : 10 mois au lieu de 12
      return monthlyPrice * 10;
    }
    return monthlyPrice;
  };

  // Gérer la sélection d'un plan
  const handleSelectPlan = (plan: PlanType) => {
    if (plan === planType) {
      toast({
        title: t('subscription.toasts.currentPlan.title'),
        description: t('subscription.toasts.currentPlan.description'),
      });
      return;
    }

    // Pour le plan COMMERCE, afficher la boîte de dialogue de consentement
    if (plan === PlanType.COMMERCE) {
      setSelectedCommercePlan(plan);
      setShowCommerceConsentDialog(true);
      return;
    }

    // Pour le plan OPERE, rediriger vers la page de contact pour devis
    if (plan === PlanType.OPERE) {
      navigate('/contact');
      toast({
        title: 'Contact requis',
        description: 'Pour le plan Opéré, veuillez nous contacter pour un devis personnalisé.',
      });
      return;
    }

    setSelectedPlan(plan);
    setBillingInterval('month'); // Réinitialiser à mensuel par défaut
    setShowUpgradeDialog(true);
  };

  // Gérer l'ajout/retrait d'add-ons
  const handleToggleAddon = (addon: AddonType) => {
    setSelectedAddons(prev => {
      if (prev.includes(addon)) {
        return prev.filter(a => a !== addon);
      } else {
        return [...prev, addon];
      }
    });
  };

  // Valider le formulaire client
  const validateCustomerForm = () => {
    if (!customerInfo.firstName.trim() || !customerInfo.lastName.trim()) {
      toast({
        title: t('pricing.payment.missingFields'),
        description: t('pricing.payment.missingFieldsDesc'),
        variant: 'destructive',
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.email)) {
      toast({
        title: t('pricing.payment.invalidEmail'),
        description: t('pricing.payment.invalidEmailDesc'),
        variant: 'destructive',
      });
      return false;
    }

    if (!customerInfo.phone.trim()) {
      toast({
        title: t('pricing.payment.missingPhone'),
        description: t('pricing.payment.missingPhoneDesc'),
        variant: 'destructive',
      });
      return false;
    }

    // Valider le numéro de téléphone pour Mobile Money
    const phoneInfo = MobileMoneyService.getPhoneInfo(customerInfo.phone);
    if (!phoneInfo.isValid) {
      toast({
        title: t('pricing.payment.invalidPhone'),
        description: t('pricing.payment.invalidPhoneDesc'),
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  // État pour le consentement aux conditions COMMERCE
  const [commerceTermsAccepted, setCommerceTermsAccepted] = useState(false);

  // État pour le consentement aux conditions (upgrade dialog)
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Gérer la confirmation du consentement pour COMMERCE
  const handleCommerceConsentConfirm = async () => {
    if (!selectedCommercePlan || !user) return;

    if (!commerceTermsAccepted) {
      toast({
        title: 'Consentement requis',
        description: 'Veuillez accepter les conditions d\'utilisation pour activer ce plan.',
        variant: 'destructive',
      });
      return;
    }

    setShowCommerceConsentDialog(false);
    setIsProcessing(true);

    try {
      console.log('🔄 Activation du plan COMMERCE:', selectedCommercePlan);

      // Utiliser le nouveau service BoohPay pour mettre à jour le plan
      const { SubscriptionBoohPayService } = await import('@/services/subscriptionBoohPayService');

      await SubscriptionBoohPayService.upgradePlan(
        user.id,
        selectedCommercePlan,
        'month' // Pour COMMERCE, toujours mensuel (commission)
      );

      const planName = selectedCommercePlan ? getTranslatedPlanName(selectedCommercePlan) : '';
      toast({
        title: t('subscription.toasts.upgradeSuccess.title'),
        description: t('subscription.toasts.upgradeSuccess.description', { plan: planName }),
      });

      // ✅ Invalider tous les caches liés à la subscription
      await queryClient.invalidateQueries({ queryKey: ['user-addons'] });
      await queryClient.invalidateQueries({ queryKey: ['subscription'] });
      await refetch();

      // Réinitialiser l'état
      setCommerceTermsAccepted(false);
      setSelectedCommercePlan(null);
    } catch (error: any) {
      console.error('❌ Erreur activation plan COMMERCE:', error);
      toast({
        title: t('subscription.toasts.upgradeError.title'),
        description: error.message || t('subscription.toasts.upgradeError.description'),
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirmer le changement de plan - Ouvrir le modal de paiement
  const handleConfirmUpgrade = async () => {
    if (!selectedPlan || !user) return;

    // Validation du consentement
    if (!termsAccepted) {
      toast({
        title: 'Consentement requis',
        description: 'Veuillez accepter les conditions d\'utilisation pour continuer.',
        variant: 'destructive',
      });
      return;
    }

    // Valider le formulaire client
    if (!validateCustomerForm()) {
      return;
    }

    // Ouvrir le modal de paiement Mobile Money
    setShowUpgradeDialog(false);
    setShowPaymentModal(true);
  };

  // Gérer le succès du paiement pour le changement de plan
  const handlePaymentSuccess = async (paymentData: any) => {
    if (!selectedPlan || !user) return;

    setIsProcessing(true);

    try {
      console.log('🔄 Changement de plan après paiement:', selectedPlan);
      
      // Utiliser le nouveau service BoohPay pour mettre à jour le plan
      const { SubscriptionBoohPayService } = await import('@/services/subscriptionBoohPayService');
      
      await SubscriptionBoohPayService.upgradePlan(
        user.id,
        selectedPlan,
        billingInterval // Utiliser l'intervalle choisi (month ou year)
      );

      const planName = selectedPlan ? getTranslatedPlanName(selectedPlan) : '';
      toast({
        title: t('subscription.toasts.upgradeSuccess.title'),
        description: t('subscription.toasts.upgradeSuccess.description', { plan: planName }),
      });

      // ✅ Invalider tous les caches liés à la subscription
      await queryClient.invalidateQueries({ queryKey: ['user-addons'] });
      await queryClient.invalidateQueries({ queryKey: ['subscription'] });
      await refetch();
      setShowPaymentModal(false);
      setSelectedPlan(null);
    } catch (error: any) {
      console.error('❌ Erreur changement de plan:', error);
      toast({
        title: t('subscription.toasts.upgradeError.title'),
        description: error.message || t('subscription.toasts.upgradeError.description'),
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Sauvegarder les add-ons
  const handleSaveAddons = async () => {
    setIsProcessing(true);

    try {
      console.log('🔄 Mise à jour des addons:', selectedAddons);
      
      // Vérifier que l'utilisateur est authentifié
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error(t('subscription.errors.mustBeLoggedIn'));
      }
      
      // Appeler l'Edge Function déployée avec le token
      const { data, error } = await supabase.functions.invoke('update-addons', {
        body: { addons: selectedAddons },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('📊 Response:', { data, error });

      if (error) throw error;

      toast({
        title: t('subscription.toasts.addonsUpdated.title'),
        description: t('subscription.toasts.addonsUpdated.description'),
      });

      // ✅ CRITICAL: Invalider le cache des addons pour recharger les données
      await queryClient.invalidateQueries({ queryKey: ['user-addons'] });
      await refetch();
    } catch (error: any) {
      console.error('❌ Erreur mise à jour addons:', error);
      toast({
        title: t('subscription.toasts.addonsError.title'),
        description: error.message || t('subscription.toasts.addonsError.description'),
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateNewPrice = () => {
    if (!selectedPlan) return getTotalPrice();

    const planInfo = PLANS_INFO.find(p => p.type === selectedPlan);
    if (!planInfo) return getTotalPrice();

    // Pour les plans COMMERCE et OPERE, pas de prix fixe mensuel
    if (selectedPlan === PlanType.COMMERCE || selectedPlan === PlanType.OPERE) {
      return 0;
    }

    // Calculer le prix des addons sélectionnés en utilisant ADDON_PRICES (en EUR)
    // pour garantir la cohérence avec getTotalPrice()
    // Pour les addons sélectionnés dans l'UI, on récupère la quantité depuis activeAddons
    // si l'addon est déjà actif, sinon on assume quantity = 1
    const addonsPrice = selectedAddons.reduce((total, addon) => {
      const priceInEUR = ADDON_PRICES[addon];
      if (priceInEUR !== undefined) {
        // Récupérer la quantité depuis activeAddons si l'addon est déjà actif
        const activeAddon = addons.find(a => a.addon_type === addon);
        const quantity = activeAddon?.quantity || 1;
        return total + priceInEUR * quantity;
      }
      return total;
    }, 0);

    return planInfo.price + addonsPrice;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-black/60" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="relative min-h-screen bg-white overflow-x-hidden">
        <div className="relative z-10 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          {/* Header Apple Minimal */}
          <div className="mb-6 md:mb-8">
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8 lg:p-10 overflow-visible">
              <div className="relative z-10">
                <div className="flex items-center gap-4 md:gap-6">
                  {/* Icon Container Apple Minimal */}
                  <div className="relative w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
                    <CreditCard className="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-gray-600 relative z-10" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h1
                      className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-tight text-gray-900 mb-2 break-words"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {t('subscription.title')}
                    </h1>
                    <p
                      className="text-sm md:text-base font-light text-gray-500"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('subscription.description')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Plan actuel Apple Minimal */}
          <div className="mb-6 md:mb-8">
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                      {planType === PlanType.ESSENTIEL && <Sparkles className="h-6 w-6 md:h-7 md:w-7 text-gray-600" />}
                      {planType === PlanType.CONNEXIONS && <Users className="h-6 w-6 md:h-7 md:w-7 text-gray-600" />}
                      {planType === PlanType.COMMERCE && <ShoppingCart className="h-6 w-6 md:h-7 md:w-7 text-gray-600" />}
                      {planType === PlanType.OPERE && <Crown className="h-6 w-6 md:h-7 md:w-7 text-gray-600" />}
                      {/* Legacy icons for backward compatibility */}
                      {planType === PlanType.FREE && <Sparkles className="h-6 w-6 md:h-7 md:w-7 text-gray-600" />}
                      {planType === PlanType.BUSINESS && <Zap className="h-6 w-6 md:h-7 md:w-7 text-gray-600" />}
                      {planType === PlanType.MAGIC && <Crown className="h-6 w-6 md:h-7 md:w-7 text-gray-600" />}
                    </div>
                    <div>
                      <h2 
                        className="text-2xl md:text-3xl font-light text-gray-900"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {currentPlanInfo ? getTranslatedPlanName(currentPlanInfo.type) : ''}
                      </h2>
                      <p 
                        className="text-sm md:text-base font-light text-gray-500"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {currentPlanInfo ? getTranslatedPlanDescription(currentPlanInfo.type) : ''}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    className="bg-gray-900 text-white text-base px-4 py-2 font-light border-0 rounded-lg shadow-sm"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {formatPriceFCFA(getTotalPrice(), planType)} FCFA/{t('subscription.month')}
                  </Badge>
                </div>
                <div className="h-px bg-gray-200 mb-6" />
                <div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 
                        className="font-light text-gray-900 mb-4 text-lg"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('subscription.currentPlan.featuresIncluded')}
                      </h3>
                      <ul className="space-y-3">
                        <li className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-gray-100 border border-gray-200">
                            <Check className="h-4 w-4 text-gray-600" />
                          </div>
                          <span 
                            className="text-sm font-light text-gray-700"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >
                            {features.maxCards === -1 ? t('subscription.currentPlan.unlimitedCards') : t('subscription.currentPlan.cardsCount', { count: features.maxCards })}
                          </span>
                        </li>
                        {features.hasEcommerce && (
                          <li className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-gray-100 border border-gray-200">
                              <Check className="h-4 w-4 text-gray-600" />
                            </div>
                            <span
                              className="text-sm font-light text-gray-700"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              {t('subscription.currentPlan.ecommerce', { count: features.maxProducts === -1 ? 999 : features.maxProducts })}
                            </span>
                          </li>
                        )}
                        {features.hasPortfolio && (
                          <li className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-gray-100 border border-gray-200">
                              <Check className="h-4 w-4 text-gray-600" />
                            </div>
                            <span
                              className="text-sm font-light text-gray-700"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              {t('subscription.currentPlan.portfolio', { count: features.maxProjects === -1 ? 999 : features.maxProjects })}
                            </span>
                          </li>
                        )}
                        {features.hasCRM && (
                          <li className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-gray-100 border border-gray-200">
                              <Check className="h-4 w-4 text-gray-600" />
                            </div>
                            <span 
                              className="text-sm font-light text-gray-700"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              {t('subscription.currentPlan.crm')}
                            </span>
                          </li>
                        )}
                      </ul>
                    </div>

                    {addons.length > 0 && (
                      <div>
                        <h3 
                          className="font-light text-gray-900 mb-4 text-lg"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          {t('subscription.currentPlan.activeAddons')}
                        </h3>
                        <ul className="space-y-3">
                          {addons.map(addon => {
                            return (
                              <li key={addon.id || addon.addon_type} className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-gray-100 border border-gray-200">
                                  <Plus className="h-4 w-4 text-gray-600" />
                                </div>
                                <span 
                                  className="text-sm font-light text-gray-700"
                                  style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                    fontWeight: 300,
                                  }}
                                >
                                  {getTranslatedAddonName(addon.addon_type as AddonType)}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs pour Plans et Add-ons Apple Minimal */}
          <div className="mb-6 md:mb-8">
            <Tabs defaultValue="plans" className="w-full">
              {/* Tabs Apple Minimal */}
              <div className="mb-6 md:mb-8">
                <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-2 overflow-hidden">
                  <TabsList className="bg-transparent border-0 p-0 gap-2 grid grid-cols-2 w-full">
                    <TabsTrigger 
                      value="plans"
                      className="rounded-lg px-6 py-3 text-sm font-light text-gray-700 data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('subscription.tabs.changePlan')}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="addons"
                      className="rounded-lg px-6 py-3 text-sm font-light text-gray-700 data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('subscription.tabs.manageAddons')}
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              {/* Tab Plans Apple Minimal */}
              <TabsContent value="plans" className="mt-6">
                <div className="grid md:grid-cols-4 gap-6">
                  {/* Afficher seulement les nouveaux plans stratégiques dans l'ordre stratégique */}
                  {[
                    PlanType.ESSENTIEL,
                    PlanType.CONNEXIONS,
                    PlanType.COMMERCE,
                    PlanType.OPERE
                  ].map(displayedPlanType => {
                    const plan = PLANS_INFO.find(p => p.type === displayedPlanType);
                    if (!plan) return null;

                    const isCurrentPlan = plan.type === planType;
                    const isUpgrade = plan.price > (currentPlanInfo?.price || 0);

                    return (
                      <div key={plan.type}>
                        <div
                          className={cn(
                            'relative bg-white rounded-lg border shadow-sm overflow-hidden transition-all',
                            isCurrentPlan ? 'border-gray-300' : 'border-gray-200'
                          )}
                        >
                          {isCurrentPlan && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                              <Badge
                                className="bg-gray-900 text-white border-0 font-light rounded-lg shadow-sm px-4 py-1"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                  fontWeight: 300,
                                }}
                              >
                                {t('subscription.plans.currentPlan')}
                              </Badge>
                            </div>
                          )}

                          {plan.popular && !isCurrentPlan && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                              <Badge
                                className="bg-gray-700 text-white border-0 font-light rounded-lg shadow-sm px-4 py-1"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                  fontWeight: 300,
                                }}
                              >
                                {t('subscription.plans.popular')}
                              </Badge>
                            </div>
                          )}

                          <div className="p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                                {plan.type === PlanType.ESSENTIEL && <Sparkles className="h-6 w-6 text-gray-600" />}
                                {plan.type === PlanType.CONNEXIONS && <Users className="h-6 w-6 text-gray-600" />}
                                {plan.type === PlanType.COMMERCE && <ShoppingCart className="h-6 w-6 text-gray-600" />}
                                {plan.type === PlanType.OPERE && <Crown className="h-6 w-6 text-gray-600" />}
                              </div>
                              <h3
                                className="text-xl font-light text-gray-900"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                  fontWeight: 300,
                                }}
                              >
                                {getTranslatedPlanName(plan.type)}
                              </h3>
                            </div>
                            <p
                              className="text-sm font-light text-gray-500 mb-6"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              {getTranslatedPlanDescription(plan.type)}
                            </p>
                            <div
                              className="text-3xl md:text-4xl font-light mb-6 text-gray-900"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              {plan.type === PlanType.COMMERCE ? '5%' :
                               plan.type === PlanType.OPERE ? '10%' :
                               formatPriceFCFA(plan.price, plan.type)}
                              {plan.type !== PlanType.COMMERCE && plan.type !== PlanType.OPERE && (
                                <span
                                  className="text-sm md:text-base font-light text-gray-500"
                                  style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                    fontWeight: 300,
                                  }}
                                >
                                  {' '}FCFA/{t('subscription.month')}
                                </span>
                              )}
                              {(plan.type === PlanType.COMMERCE || plan.type === PlanType.OPERE) && (
                                <span
                                  className="text-sm md:text-base font-light text-gray-500"
                                  style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                    fontWeight: 300,
                                  }}
                                >
                                  {' '}commission sur les transactions
                                </span>
                              )}
                            </div>

                            <Button
                              className={cn(
                                "w-full rounded-lg py-3 font-light transition-all duration-200",
                                isCurrentPlan
                                  ? "bg-gray-50 border border-gray-200 text-gray-500 cursor-not-allowed"
                                  : "bg-gray-900 hover:bg-gray-800 text-white shadow-sm"
                              )}
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                              disabled={isCurrentPlan}
                              onClick={() => handleSelectPlan(plan.type)}
                            >
                              {isCurrentPlan
                                ? t('subscription.plans.currentPlan')
                                : plan.type === PlanType.COMMERCE
                                  ? 'Commencer avec 5% commission'
                                  : plan.type === PlanType.OPERE
                                    ? 'Demander un devis Opéré'
                                    : isUpgrade
                                      ? t('subscription.plans.upgradeToThis')
                                      : t('subscription.plans.downgrade')
                              }
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  }).filter(Boolean)}
                </div>
              </TabsContent>

              {/* Tab Add-ons Apple Minimal */}
              <TabsContent value="addons" className="mt-6">
                {planType === PlanType.ESSENTIEL ? (
                  <Alert className="border border-gray-200 bg-white rounded-lg shadow-sm">
                    <AlertCircle className="h-5 w-5 text-gray-600" />
                    <AlertTitle
                      className="text-gray-900 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('subscription.addons.unavailable')}
                    </AlertTitle>
                    <AlertDescription
                      className="text-gray-600 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      Les add-ons sont disponibles à partir du plan Connexions.
                      <Button
                        variant="link"
                        className="p-0 h-auto text-gray-900 underline font-light ml-2"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                        onClick={() => handleSelectPlan(PlanType.CONNEXIONS)}
                      >
                        Passer à Connexions
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      {ADDONS_INFO.filter(addon =>
                        addon.targetPlans.includes(planType)
                      ).map((addon) => {
                        const isActive = addons.some(a => a.addon_type === addon.type);

                        return (
                          <div key={addon.type}>
                            <div
                              className={cn(
                                'relative bg-white rounded-lg border shadow-sm overflow-hidden cursor-pointer transition-all',
                                isActive ? 'border-gray-300 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                              )}
                              onClick={() => handleToggleAddon(addon.type)}
                            >
                              <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                  <h3 
                                    className="text-lg font-light text-gray-900"
                                    style={{
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                      fontWeight: 300,
                                    }}
                                  >
                                    {getTranslatedAddonName(addon.type)}
                                  </h3>
                                  <div
                                    className={cn(
                                      "flex items-center justify-center w-8 h-8 rounded-lg transition-all",
                                      isActive ? "bg-gray-900" : "bg-gray-100 border border-gray-200"
                                    )}
                                  >
                                    {isActive ? (
                                      <Check className="h-5 w-5 text-white" />
                                    ) : (
                                      <Plus className="h-5 w-5 text-gray-600" />
                                    )}
                                  </div>
                                </div>
                                <p 
                                  className="text-sm font-light text-gray-500 mb-4"
                                  style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                    fontWeight: 300,
                                  }}
                                >
                                  {getTranslatedAddonDescription(addon.type)}
                                </p>
                                <div 
                                  className="text-2xl font-light text-gray-900"
                                  style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                    fontWeight: 300,
                                  }}
                                >
                                  +{formatPriceFCFA(addon.price)}
                                  <span 
                                    className="text-sm font-light text-gray-500"
                                    style={{
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                      fontWeight: 300,
                                    }}
                                  >
                                    {' '}FCFA/{t('subscription.month')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div>
                        <p 
                          className="font-light text-gray-900 text-lg"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          {t('subscription.addons.monthlyTotal')}
                        </p>
                        <p 
                          className="text-sm font-light text-gray-500 mt-1"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          {t('subscription.addons.totalDescription', { count: selectedAddons.length })}
                        </p>
                      </div>
                      <div className="flex flex-col sm:items-end gap-3">
                        <p 
                          className="text-3xl md:text-4xl font-light text-gray-900"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          {formatPriceFCFA(calculateNewPrice(), selectedPlan || planType)} FCFA
                        </p>
                        <Button
                          onClick={handleSaveAddons}
                          disabled={isProcessing || JSON.stringify(selectedAddons) === JSON.stringify(addons.map(a => a.addon_type))}
                          className="rounded-lg px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white shadow-sm font-light w-full sm:w-auto"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {t('subscription.addons.saving')}
                            </>
                          ) : (
                            t('subscription.addons.saveChanges')
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Dialog de confirmation d'upgrade Apple Minimal */}
          <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
            <DialogContent className="border border-gray-200 bg-white rounded-lg shadow-sm max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle 
                  className="text-2xl md:text-3xl font-light text-gray-900"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {t('subscription.upgradeDialog.title')}
                </DialogTitle>
                <DialogDescription 
                  className="text-gray-500 text-base font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('subscription.upgradeDialog.description', { plan: selectedPlan ? getTranslatedPlanName(selectedPlan) : '' })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg border border-gray-200">
                  <span 
                    className="text-gray-700 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('subscription.upgradeDialog.currentPlan')}
                  </span>
                  <span 
                    className="font-light text-gray-900"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {currentPlanInfo ? getTranslatedPlanName(currentPlanInfo.type) : ''}
                  </span>
                </div>
                <div className="h-px bg-gray-200" />
                <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg border border-gray-200">
                  <span 
                    className="text-gray-700 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('subscription.upgradeDialog.newPlan')}
                  </span>
                  <span 
                    className="font-light text-gray-900"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {selectedPlan ? getTranslatedPlanName(selectedPlan) : ''}
                  </span>
                </div>
                <div className="h-px bg-gray-200" />

                {/* Sélecteur d'intervalle de facturation */}
                {selectedPlan && selectedPlan !== PlanType.FREE && (
                  <>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <Label 
                        className="text-gray-700 font-light mb-3 block"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        Période de facturation
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setBillingInterval('month')}
                          className={`p-4 rounded-lg border transition-all ${
                            billingInterval === 'month'
                              ? 'border-gray-900 bg-white shadow-sm'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="text-left">
                            <div 
                              className="font-light text-gray-900 mb-1"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              Mensuel
                            </div>
                            <div 
                              className="text-sm font-light text-gray-600"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              {formatPriceFCFA(PLANS_INFO.find(p => p.type === selectedPlan)?.price || 0, selectedPlan, 'month')} FCFA/mois
                            </div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillingInterval('year')}
                          className={`p-4 rounded-lg border transition-all relative ${
                            billingInterval === 'year'
                              ? 'border-gray-900 bg-white shadow-sm'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="text-left">
                            <div className="flex items-center gap-2 mb-1">
                              <div 
                                className="font-light text-gray-900"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                  fontWeight: 300,
                                }}
                              >
                                Annuel
                              </div>
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-light">
                                -2 mois
                              </span>
                            </div>
                            <div 
                              className="text-sm font-light text-gray-600"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              {formatPriceFCFA(PLANS_INFO.find(p => p.type === selectedPlan)?.price || 0, selectedPlan, 'year')} FCFA/an
                            </div>
                            <div 
                              className="text-xs font-light text-gray-500 mt-1"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              Économisez {formatPriceFCFA(PLANS_INFO.find(p => p.type === selectedPlan)?.price || 0, selectedPlan, 'month')} FCFA
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                    <div className="h-px bg-gray-200" />
                  </>
                )}

                <div className="flex justify-between items-center text-lg py-3 px-4 bg-gray-50 rounded-lg border border-gray-200">
                  <span
                    className="font-light text-gray-900"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {selectedPlan === PlanType.COMMERCE ? 'Commission appliquée' : selectedPlan === PlanType.OPERE ? 'Setup Opéré requis' : t('subscription.upgradeDialog.newAmount')}
                  </span>
                  <span
                    className="font-light text-gray-900 text-xl"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {selectedPlan === PlanType.COMMERCE
                      ? '5% sur les transactions'
                      : selectedPlan === PlanType.OPERE
                        ? '10% sur les transactions + setup'
                        : `${formatPriceFCFA(PLANS_INFO.find(p => p.type === selectedPlan)?.price || 0, selectedPlan || undefined, billingInterval)} FCFA`}/{billingInterval === 'year' ? 'an' : t('subscription.month')}
                  </span>
                </div>

                {/* Formulaire d'informations client */}
                <div className="space-y-4 mt-6">
                  <h3 className="text-lg font-light text-gray-900">Informations de paiement</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-gray-700">Prénom</Label>
                      <Input
                        id="firstName"
                        value={customerInfo.firstName}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, firstName: e.target.value })}
                        className="mt-1 bg-white border-gray-300"
                        placeholder="Votre prénom"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-gray-700">Nom</Label>
                      <Input
                        id="lastName"
                        value={customerInfo.lastName}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, lastName: e.target.value })}
                        className="mt-1 bg-white border-gray-300"
                        placeholder="Votre nom"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-gray-700">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      className="mt-1 bg-white border-gray-300"
                      placeholder="votre@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-gray-700">Téléphone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      className="mt-1 bg-white border-gray-300"
                      placeholder="07123456 ou 06123456"
                    />
                  </div>
                </div>

                {/* Consentement aux conditions d'utilisation */}
                <div className="mt-6">
                  <TermsConsent
                    accepted={termsAccepted}
                    onAcceptChange={setTermsAccepted}
                  />
                </div>

                <Alert className="border border-gray-200 bg-white rounded-lg shadow-sm mt-4">
                  <AlertCircle className="h-5 w-5 text-gray-600" />
                  <AlertTitle 
                    className="text-gray-900 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('subscription.upgradeDialog.immediateChange')}
                  </AlertTitle>
                  <AlertDescription 
                    className="text-gray-600 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('subscription.upgradeDialog.immediateChangeDescription')}
                  </AlertDescription>
                </Alert>
              </div>

              <DialogFooter className="gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowUpgradeDialog(false)}
                  disabled={isProcessing}
                  className="rounded-lg px-6 py-3 border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 font-light shadow-sm"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('subscription.upgradeDialog.cancel')}
                </Button>
                <Button
                  onClick={handleConfirmUpgrade}
                  disabled={isProcessing || !termsAccepted}
                  className="rounded-lg px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white shadow-sm font-light disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('subscription.upgradeDialog.processing')}
                    </>
                  ) : (
                    <>
                      {t('subscription.upgradeDialog.confirm')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal de paiement Mobile Money */}
          {showPaymentModal && selectedPlan && (
            <SubscriptionPaymentModal
              isOpen={showPaymentModal}
              onClose={() => {
                setShowPaymentModal(false);
                setShowUpgradeDialog(true);
              }}
              item={{
                name: getTranslatedPlanName(selectedPlan),
                price: getPriceWithInterval(
                  PLANS_INFO.find(p => p.type === selectedPlan)?.price || 0,
                  selectedPlan,
                  billingInterval
                ) / 655, // Convertir FCFA en EUR pour le modal
                type: 'plan',
              }}
              customerInfo={customerInfo}
              billingInterval={billingInterval}
              onPaymentSuccess={handlePaymentSuccess}
            />
          )}

          {/* Boîte de dialogue de consentement pour COMMERCE */}
          <Dialog open={showCommerceConsentDialog} onOpenChange={setShowCommerceConsentDialog}>
            <DialogContent className="border border-gray-200 bg-white rounded-lg shadow-sm max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle
                  className="text-2xl md:text-3xl font-light text-gray-900"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                    letterSpacing: '-0.02em',
                  }}
                >
                  Activation du plan BÖÖH Commerce
                </DialogTitle>
                <DialogDescription
                  className="text-gray-500 text-base font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  Avant d'activer votre plan Commerce, veuillez accepter nos conditions d'utilisation.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Informations du plan COMMERCE */}
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <h4
                    className="font-light text-gray-900 mb-3 text-lg"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    Plan BÖÖH Commerce - 5% commission sur les transactions
                  </h4>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-sm font-light text-gray-600"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      Abonnement mensuel
                    </span>
                    <span
                      className="font-light text-xl text-gray-900"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      0 FCFA
                    </span>
                  </div>
                  <p
                    className="text-xs font-light text-gray-500"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    Activation immédiate - Paiement différé sur vos ventes
                  </p>
                </div>

                {/* Consentement aux conditions d'utilisation */}
                <TermsConsent
                  accepted={commerceTermsAccepted}
                  onAcceptChange={setCommerceTermsAccepted}
                />

                <Alert className="border border-blue-200 bg-blue-50 rounded-lg shadow-sm">
                  <AlertDescription
                    className="text-sm font-light text-blue-900"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <strong>À propos du plan Commerce :</strong> Ce plan est basé sur une commission de 5% sur vos transactions.
                    Vous ne payez que lorsque vous vendez. Idéal pour les boutiques en ligne et e-commerce.
                  </AlertDescription>
                </Alert>
              </div>

              <DialogFooter className="gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCommerceConsentDialog(false);
                    setCommerceTermsAccepted(false);
                    setSelectedCommercePlan(null);
                  }}
                  disabled={isProcessing}
                  className="rounded-lg px-6 py-3 border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 font-light shadow-sm"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleCommerceConsentConfirm}
                  disabled={isProcessing || !commerceTermsAccepted}
                  className="rounded-lg px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white shadow-sm font-light disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Activation en cours...
                    </>
                  ) : (
                    <>
                      Activer le plan Commerce
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SubscriptionManagement;
