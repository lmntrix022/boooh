/**
 * Pricing Page - AWWWARDS APPLE MINIMAL
 * Ultra-minimalist pricing page with clean design
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSubscription } from '@/hooks/useSubscription';
import { PLANS_INFO, PlanType, ADDONS_INFO, AddonType } from '@/types/subscription';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Check, Crown, Sparkles, Zap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import PublicNavbar from '@/components/layout/PublicNavbar';
import PaymentOptions from '@/components/payment/PaymentOptions';
import SubscriptionPaymentModal from '@/components/payment/SubscriptionPaymentModal';
import { MobileMoneyService } from '@/services/mobileMoneyService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';

const PricingPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { planType, isLoading, refetchSubscription } = useSubscription();

  // Helper function to get translated plan name and description
  const getTranslatedPlan = (planType: PlanType) => {
    const planKeys: Record<PlanType, string> = {
      [PlanType.FREE]: 'free',
      [PlanType.BUSINESS]: 'business',
      [PlanType.MAGIC]: 'magic',
    };
    const key = planKeys[planType];
    return {
      name: t(`pricing.plans.${key}.name`),
      description: t(`pricing.plans.${key}.description`),
    };
  };

  // Helper function to get translated addon name and description
  const getTranslatedAddon = (addonType: AddonType) => {
    const addonKeys: Record<AddonType, string> = {
      [AddonType.PACK_CREATEUR]: 'packCreateur',
      [AddonType.PACK_VOLUME]: 'packVolume',
      [AddonType.PACK_EQUIPE]: 'packEquipe',
      [AddonType.PACK_BRAND]: 'packBrand',
      [AddonType.PACK_ANALYTICS_PRO]: 'packAnalyticsPro',
    };
    const key = addonKeys[addonType];
    return {
      name: t(`pricing.addons.${key}.name`),
      description: t(`pricing.addons.${key}.description`),
    };
  };

  // Helper function to convert EUR to FCFA with fixed prices for plans
  const convertToFCFA = (priceInEUR: number, planType?: PlanType): number => {
    // Prix fixes en FCFA pour les plans
    if (planType === PlanType.BUSINESS) {
      return 15000; // 15,000 FCFA au lieu de 13,100
    }
    if (planType === PlanType.MAGIC) {
      return 50000; // 50,000 FCFA au lieu de 26,200
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
    const monthlyPrice = convertToFCFA(priceInEUR, planType);
    if (interval === 'year') {
      // 2 mois offerts : 10 mois au lieu de 12
      return monthlyPrice * 10;
    }
    return monthlyPrice;
  };
  
  // États pour le processus de paiement (plans)
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<PlanType | null>(null);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [paymentStep, setPaymentStep] = useState<'form' | 'payment' | 'processing'>('form');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'mobile_money' | 'stripe' | null>(null);
  const [showMobileMoneyModal, setShowMobileMoneyModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // États pour le processus de paiement (addons)
  const [selectedAddonForPayment, setSelectedAddonForPayment] = useState<AddonType | null>(null);
  const [isAddonPurchase, setIsAddonPurchase] = useState(false);

  // Pré-remplir les informations client si l'utilisateur est connecté
  useEffect(() => {
    if (user && showPaymentDialog) {
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
  }, [user, showPaymentDialog]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-8 w-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  // Gérer le clic sur un plan
  const handleSelectPlan = async (plan: PlanType) => {
    if (plan === PlanType.FREE) {
      navigate('/auth');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: t('pricing.payment.connectionRequired'),
        description: t('pricing.payment.connectionRequiredDesc'),
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    setSelectedPlanForPayment(plan);
    setBillingInterval('month'); // Réinitialiser à mensuel par défaut
    setShowPaymentDialog(true);
    setPaymentStep('form');
    setSelectedPaymentMethod(null);
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

    return true;
  };

  // Passer à l'étape de paiement
  const handleProceedToPayment = () => {
    if (!validateCustomerForm()) return;
    
    // Valider le numéro de téléphone pour Mobile Money
    const phoneInfo = MobileMoneyService.getPhoneInfo(customerInfo.phone);
    if (!phoneInfo.isValid) {
      toast({
        title: t('pricing.payment.invalidPhone'),
        description: t('pricing.payment.invalidPhoneDesc'),
        variant: 'destructive',
      });
      return;
    }
    
    // Par défaut, utiliser Mobile Money (pas encore BoohPay déployé)
    setSelectedPaymentMethod('mobile_money');
    setShowMobileMoneyModal(true);
  };

  // Gérer le succès du paiement
  const handlePaymentSuccess = async (paymentData: any) => {
    setIsProcessing(true);
    setPaymentStep('processing');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error(t('pricing.payment.mustBeConnected'));
      }

      if (isAddonPurchase && selectedAddonForPayment) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Utilisateur non trouvé');

        const { data: currentAddons, error: addonsError } = await supabase
          .from('user_addons')
          .select('addon_type, expires_at')
          .eq('user_id', user.id);
        
        const activeAddons = (currentAddons || []).filter(addon => {
          if (!addon.expires_at) return true;
          return new Date(addon.expires_at) > new Date();
        });

        const currentAddonTypes = activeAddons.map(a => a.addon_type as AddonType);
        
        if (currentAddonTypes.includes(selectedAddonForPayment)) {
        const translatedAddon = selectedAddonForPayment ? getTranslatedAddon(selectedAddonForPayment) : null;
        toast({
          title: t('pricing.payment.addonAlreadyActive'),
          description: t('pricing.payment.addonAlreadyActiveDesc', { name: translatedAddon?.name }),
          variant: 'destructive',
        });
          setPaymentStep('payment');
          setIsProcessing(false);
          return;
        }
        
        const newAddons = [...currentAddonTypes, selectedAddonForPayment];

        const { data, error } = await supabase.functions.invoke('update-addons', {
          body: { addons: newAddons },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) throw error;

        await refetchSubscription();

        const translatedAddon = selectedAddonForPayment ? getTranslatedAddon(selectedAddonForPayment) : null;
        toast({
          title: t('pricing.payment.addonActivated'),
          description: t('pricing.payment.addonActivatedDesc', { name: translatedAddon?.name }),
        });

        setShowPaymentDialog(false);
        setSelectedAddonForPayment(null);
        setIsAddonPurchase(false);
        setPaymentStep('form');
      } else if (selectedPlanForPayment) {
        const { data, error } = await supabase.functions.invoke('upgrade-plan', {
          body: { plan_type: selectedPlanForPayment },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) throw error;

        await refetchSubscription();

        const activatedPlan = selectedPlanForPayment ? getTranslatedPlan(selectedPlanForPayment) : null;
        toast({
          title: t('pricing.payment.subscriptionActivated'),
          description: t('pricing.payment.subscriptionActivatedDesc', { name: activatedPlan?.name }),
        });

        setShowPaymentDialog(false);
        setSelectedPlanForPayment(null);
        setPaymentStep('form');
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'activation:', error);
      toast({
        title: t('pricing.payment.error'),
        description: error.message || t('pricing.payment.errorDesc'),
        variant: 'destructive',
      });
      setPaymentStep('payment');
    } finally {
      setIsProcessing(false);
    }
  };

  // Gérer l'annulation du paiement
  const handleCancelPayment = () => {
    setShowPaymentDialog(false);
    setSelectedPlanForPayment(null);
    setSelectedAddonForPayment(null);
    setIsAddonPurchase(false);
    setPaymentStep('form');
    setSelectedPaymentMethod(null);
    setCustomerInfo({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    });
  };

  const selectedPlanInfo = selectedPlanForPayment 
    ? PLANS_INFO.find(p => p.type === selectedPlanForPayment) 
    : null;
  
  const selectedAddonInfo = selectedAddonForPayment
    ? ADDONS_INFO.find(a => a.type === selectedAddonForPayment)
    : null;

  // Get translated names for display
  const selectedPlanTranslated = selectedPlanForPayment ? getTranslatedPlan(selectedPlanForPayment) : null;
  const selectedAddonTranslated = selectedAddonForPayment ? getTranslatedAddon(selectedAddonForPayment) : null;

  // Gérer le clic sur un addon
  const handleSelectAddon = async (addonType: AddonType) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: t('pricing.payment.connectionRequired'),
        description: t('pricing.payment.connectionRequiredDesc'),
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (planType !== PlanType.BUSINESS && planType !== PlanType.MAGIC) {
      toast({
        title: t('pricing.payment.planRequired'),
        description: t('pricing.payment.planRequiredDesc'),
        variant: 'destructive',
      });
      return;
    }

    setSelectedAddonForPayment(addonType);
    setIsAddonPurchase(true);
    setShowPaymentDialog(true);
    setPaymentStep('form');
    setSelectedPaymentMethod(null);
  };

  // Get main features for each plan (simplified list)
  const getMainFeatures = (plan: typeof PLANS_INFO[0]) => {
    const features = [];
    if (plan.features.maxCards === -1) {
      features.push(t('pricing.unlimitedCards'));
    } else {
      features.push(`${plan.features.maxCards} ${t('pricing.cards')}`);
    }
    if (plan.features.customThemes) features.push(t('pricing.customThemes'));
    if (plan.features.hasEcommerce) features.push(t('pricing.ecommerce'));
    if (plan.features.hasCRM) features.push(t('pricing.crm'));
    if (plan.features.advancedAnalytics) features.push(t('pricing.advancedAnalytics'));
    if (plan.features.multiUser) features.push(`${t('pricing.team')} (${plan.features.maxTeamMembers} ${t('pricing.members')})`);
    return features.slice(0, 6); // Limit to 6 main features
  };

  return (
    <div className="min-h-screen bg-white apple-minimal-font">
      {/* Navigation */}
      <PublicNavbar />

      <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        {/* Header - Minimal */}
        <motion.div
          className="text-center mb-16 md:mb-24"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-gray-900 mb-6 tracking-tight leading-tight">
            {t('pricing.title')}
          </h1>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto font-light leading-relaxed">
            {t('pricing.description')}
          </p>
        </motion.div>

        {/* Plans Grid - Minimal */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-20 md:mb-32"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          {PLANS_INFO.map((plan) => {
            const isCurrentPlan = plan.type === planType;
            const mainFeatures = getMainFeatures(plan);
            const translatedPlan = getTranslatedPlan(plan.type);
            
            return (
              <motion.div
                key={plan.type}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                  className={cn(
                  "relative h-full border rounded-2xl p-8 md:p-10 transition-all",
                    plan.popular
                    ? "border-gray-900 border-2 bg-gray-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                  )}
                >
                {/* Popular Badge - Minimal */}
                  {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gray-900 text-white border-0 rounded-full px-4 py-1 text-xs font-medium">
                      {t('pricing.mostPopular')}
                    </Badge>
                    </div>
                  )}

                {/* Current Plan Badge */}
                      {isCurrentPlan && (
                  <div className="absolute top-6 right-6">
                    <Badge variant="outline" className="border-gray-300 text-gray-600 rounded-full px-3 py-1 text-xs font-medium">
                            <Check className="h-3 w-3 mr-1" />
                            {t('pricing.currentPlan')}
                          </Badge>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Icon & Title */}
                  <div>
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-4 border",
                      plan.popular ? "bg-gray-900 border-gray-900" : "bg-gray-100 border-gray-200"
                    )}>
                      {plan.type === PlanType.FREE && <Sparkles className={cn("h-6 w-6", plan.popular ? "text-white" : "text-gray-600")} />}
                      {plan.type === PlanType.BUSINESS && <Zap className={cn("h-6 w-6", plan.popular ? "text-white" : "text-gray-600")} />}
                      {plan.type === PlanType.MAGIC && <Crown className={cn("h-6 w-6", plan.popular ? "text-white" : "text-gray-600")} />}
                    </div>

                      <h3 className={cn(
                      "text-2xl md:text-3xl font-medium mb-2 tracking-tight",
                      plan.popular ? "text-gray-900" : "text-gray-900"
                      )}>
                      {translatedPlan.name}
                      </h3>
                    <p className="text-sm text-gray-500 font-light leading-relaxed">
                      {translatedPlan.description}
                      </p>
                    </div>

                  {/* Price */}
                  <div>
                      <div className="flex items-baseline">
                      <span className="text-4xl md:text-5xl font-light text-gray-900 tracking-tight">
                          {formatPriceFCFA(plan.price, plan.type, 'month')}
                        </span>
                      <span className="ml-2 text-sm text-gray-500 font-light">
                          FCFA/{t('pricing.perMonth').replace('€/', '')}
                        </span>
                      </div>
                      {plan.type !== PlanType.FREE && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600 font-light">
                            <span>ou</span>
                            <span className="font-light text-gray-900">
                              {formatPriceFCFA(plan.price, plan.type, 'year')} FCFA/an
                            </span>
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-light">
                              -2 mois offerts
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                  {/* Features - Simplified */}
                  <ul className="space-y-3">
                    {mainFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-4 h-4 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                            <Check className="h-2.5 w-2.5 text-gray-600" />
                          </div>
                        </div>
                        <span className="text-sm text-gray-600 font-light leading-relaxed">
                          {feature}
                      </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <div className="pt-4">
                      {isCurrentPlan ? (
                          <Button
                        className="w-full rounded-lg border-gray-200 bg-gray-50 text-gray-400 font-normal cursor-not-allowed"
                          disabled
                        >
                          <Check className="mr-2 h-4 w-4" />
                          {t('pricing.currentPlan')}
                        </Button>
                      ) : (
                          <Button
                            className={cn(
                          "w-full rounded-lg font-normal",
                              plan.popular
                            ? "bg-gray-900 text-white hover:bg-gray-800"
                            : "bg-white border border-gray-300 text-gray-900 hover:bg-gray-50"
                            )}
                            onClick={() => handleSelectPlan(plan.type)}
                          >
                            {plan.type === PlanType.FREE ? t('pricing.startFree') : t('pricing.choosePlan')}
                          </Button>
                      )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Add-ons Section - Minimal */}
        <motion.div
          className="mt-20 md:mt-32"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-4 tracking-tight">
              {t('pricing.addons.title')}
            </h2>
            <p className="text-base md:text-lg text-gray-500 font-light leading-relaxed max-w-2xl mx-auto">
              {t('pricing.addons.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ADDONS_INFO.map((addon) => {
              const translatedAddon = getTranslatedAddon(addon.type);
              
              return (
              <motion.div
                  key={addon.type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="border border-gray-200 rounded-2xl p-6 bg-white hover:border-gray-300 transition-all"
                >
                  <div className="space-y-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-gray-600" />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1 tracking-tight">
                        {translatedAddon.name}
                    </h3>
                      <p className="text-sm text-gray-500 font-light leading-relaxed">
                        {translatedAddon.description}
                    </p>
                    </div>

                      <div className="flex items-baseline">
                      <span className="text-2xl font-light text-gray-900 tracking-tight">
                        {formatPriceFCFA(addon.price)}
                        </span>
                      <span className="ml-2 text-sm text-gray-500 font-light">
                          FCFA/mois
                        </span>
                    </div>

                      <Button
                      variant="outline"
                      className="w-full rounded-lg border-gray-300 text-gray-900 hover:bg-gray-50 font-normal"
                        onClick={() => handleSelectAddon(addon.type)}
                      >
                        {t('pricing.addons.add')}
                      </Button>
                </div>
              </motion.div>
              );
            })}
          </div>

          {/* Addon Footer Note - Minimal */}
          <div className="mt-12 text-center p-6 rounded-xl border border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600 font-light leading-relaxed">
              <span className="font-medium text-gray-900">{t('pricing.addons.note')}:</span> {t('pricing.addons.noteText')}
            </p>
          </div>
        </motion.div>

        {/* CTA Section - Minimal */}
        <motion.div
          className="mt-20 md:mt-32 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
          <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4 tracking-tight">
            {t('pricing.cta.title')}
          </h2>
          <p className="text-base md:text-lg text-gray-500 mb-8 max-w-xl mx-auto font-light leading-relaxed whitespace-pre-line">
            {t('pricing.cta.description')}
          </p>
            <Button
              size="lg"
            className="bg-gray-900 text-white px-8 py-3 rounded-lg font-normal hover:bg-gray-800"
              asChild
            >
              <Link to="/auth">
                {t('pricing.cta.button')}
              </Link>
            </Button>
        </motion.div>
      </div>

      {/* Dialog de paiement - Apple Minimal */}
      <AnimatePresence>
        {showPaymentDialog && (selectedPlanInfo || selectedAddonInfo) && (
          <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-sm">
              <DialogHeader>
                <DialogTitle 
                  className="text-2xl md:text-3xl font-light text-gray-900"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {isAddonPurchase ? `${t('pricing.payment.addon')} ${selectedAddonTranslated?.name}` : `${t('pricing.payment.subscriptionTitle')} ${selectedPlanTranslated?.name}`}
                </DialogTitle>
                <DialogDescription 
                  className="text-gray-500 text-base font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {formatPriceFCFA(
                    (isAddonPurchase ? selectedAddonInfo?.price : selectedPlanInfo?.price) || 0,
                    isAddonPurchase ? undefined : selectedPlanForPayment,
                    billingInterval
                  )} FCFA/{billingInterval === 'year' ? 'an' : t('pricing.perMonth').replace('€/', '')}
                </DialogDescription>
              </DialogHeader>

              {paymentStep === 'form' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-5 py-4"
                >
                  {/* Sélecteur d'intervalle de facturation */}
                  {!isAddonPurchase && selectedPlanForPayment && selectedPlanForPayment !== PlanType.FREE && (
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
                              {formatPriceFCFA(selectedPlanInfo?.price || 0, selectedPlanForPayment, 'month')} FCFA/mois
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
                              {formatPriceFCFA(selectedPlanInfo?.price || 0, selectedPlanForPayment, 'year')} FCFA/an
                            </div>
                            <div 
                              className="text-xs font-light text-gray-500 mt-1"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              Économisez {formatPriceFCFA(selectedPlanInfo?.price || 0, selectedPlanForPayment, 'month')} FCFA
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label 
                          htmlFor="firstName" 
                          className="text-gray-700 font-light"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          {t('pricing.payment.firstName')}
                        </Label>
                        <Input
                          id="firstName"
                          value={customerInfo.firstName}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, firstName: e.target.value })}
                          className="mt-2 rounded-lg h-12 text-base border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 bg-white"
                          placeholder={t('pricing.payment.firstNamePlaceholder')}
                          style={{
                            fontSize: '16px',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        />
                      </div>
                      <div>
                        <Label 
                          htmlFor="lastName" 
                          className="text-gray-700 font-light"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          {t('pricing.payment.lastName')}
                        </Label>
                        <Input
                          id="lastName"
                          value={customerInfo.lastName}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, lastName: e.target.value })}
                          className="mt-2 rounded-lg h-12 text-base border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 bg-white"
                          placeholder={t('pricing.payment.lastNamePlaceholder')}
                          style={{
                            fontSize: '16px',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <Label 
                        htmlFor="email" 
                        className="text-gray-700 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('pricing.payment.email')}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                        className="mt-2 rounded-lg h-12 text-base border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 bg-white"
                        placeholder={t('pricing.payment.emailPlaceholder')}
                        style={{
                          fontSize: '16px',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      />
                    </div>
                    <div>
                      <Label 
                        htmlFor="phone" 
                        className="text-gray-700 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('pricing.payment.phone')}
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                        className="mt-2 rounded-lg h-12 text-base border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 bg-white"
                        placeholder={t('pricing.payment.phonePlaceholder')}
                        style={{
                          fontSize: '16px',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <Button
                      onClick={handleProceedToPayment}
                      className="flex-1 rounded-lg bg-gray-900 text-white hover:bg-gray-800 shadow-sm font-light h-12"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('pricing.payment.proceed')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancelPayment}
                      className="rounded-lg border-gray-200 bg-white text-gray-900 hover:bg-gray-50 shadow-sm font-light h-12"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('common.cancel')}
                    </Button>
                  </div>
                </motion.div>
              )}

              {paymentStep === 'payment' && selectedPaymentMethod === 'mobile_money' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4"
                >
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">
                      Le paiement Mobile Money sera traité dans le modal suivant.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setPaymentStep('form')}
                    >
                      Retour
                    </Button>
                  </div>
                </motion.div>
              )}

              {paymentStep === 'processing' && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
                  <p 
                    className="text-gray-500 text-center font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {isAddonPurchase 
                      ? t('pricing.payment.processingAddon')
                      : t('pricing.payment.processingSubscription')}
                  </p>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Modal de paiement Mobile Money */}
      {showMobileMoneyModal && (selectedPlanInfo || selectedAddonInfo) && (
        <SubscriptionPaymentModal
          isOpen={showMobileMoneyModal}
          onClose={() => {
            setShowMobileMoneyModal(false);
            setPaymentStep('form');
          }}
          item={{
            name: isAddonPurchase 
              ? (selectedAddonTranslated?.name || '') 
              : (selectedPlanTranslated?.name || ''),
            price: isAddonPurchase 
              ? (selectedAddonInfo?.price || 0)
              : (getPriceWithInterval(selectedPlanInfo?.price || 0, selectedPlanForPayment, billingInterval) / 655), // Convertir FCFA en EUR pour le modal
            type: isAddonPurchase ? 'addon' : 'plan',
          }}
          customerInfo={customerInfo}
          billingInterval={isAddonPurchase ? undefined : billingInterval}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default PricingPage;
