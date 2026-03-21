import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  Smartphone,
  CheckCircle2,
  ExternalLink,
  Circle,
  Sparkles,
  Shield,
  ArrowRight,
  RefreshCw,
  Store,
  Copy,
  AlertCircle
} from 'lucide-react';
import { boohPayService } from '@/services/boohPayService';
import { BoohPayMerchantService } from '@/services/boohPayMerchantService';
import { useAuth } from '@/contexts/AuthContext';
import { BoohPayConfig } from '@/lib/payment-config';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';

import { useToast } from "@/hooks/use-toast";

// Provider logos
const PROVIDER_LOGOS: Record<string, string> = {
  stripe: '/provider/logo-stripe.png',
  moneroo: '/provider/logo-moneroo.png',
  ebilling: '/provider/logo-ebilling.png',
  shap: '/provider/logo-shap.png',
};

interface ProviderStatus {
  configured: boolean;
  environment: string | null;
  connected?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
}

interface ProvidersStatusResponse {
  stripe: ProviderStatus & { accountId?: string };
  moneroo: ProviderStatus;
  ebilling: ProviderStatus;
  shap: ProviderStatus;
}

// Animation easings (Apple-style)
const appleEasing = [0.16, 1, 0.3, 1] as const;

export const PaymentProviderSettings: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [providersStatus, setProvidersStatus] = useState<ProvidersStatusResponse | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [boohPayUrl, setBoohPayUrl] = useState('');
  const [activeMerchant, setActiveMerchant] = useState<any>(null);
  const [magicLink, setMagicLink] = useState<string | null>(null);
  const [isCreatingMerchant, setIsCreatingMerchant] = useState(false);

  // Construire l'URL du dashboard BoohPay
  useEffect(() => {
    let dashboardUrl = BoohPayConfig.DASHBOARD_URL || 'http://localhost:3001';
    dashboardUrl = dashboardUrl
      .replace(/^https?\/+/i, '')
      .replace(/^\/+/, '');
    if (!dashboardUrl.startsWith('http://') && !dashboardUrl.startsWith('https://')) {
      dashboardUrl = 'http://' + dashboardUrl;
    }
    dashboardUrl = dashboardUrl.replace(/\/$/, '');
    setBoohPayUrl(`${dashboardUrl}/integrations`);
  }, []);

  // Charger le statut des providers
  const loadProvidersStatus = async (showRefreshLoader = false) => {
    if (!user?.id) return;

    try {
      if (showRefreshLoader) {
        setIsRefreshing(true);
      } else {
        setIsLoadingStatus(true);
      }

      const merchant = await BoohPayMerchantService.getMerchantByUserId(user.id);
      setActiveMerchant(merchant);

      if (merchant?.api_key) {
        // Initialiser avec la clé du merchant
        boohPayService.initialize({
          baseUrl: import.meta.env.VITE_BOOHPAY_API_URL || 'http://localhost:3000',
          apiKey: merchant.api_key,
        });

        const status = await boohPayService.getProvidersStatus(merchant.api_key);
        setProvidersStatus(status);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statuts:', error);
    } finally {
      setIsLoadingStatus(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadProvidersStatus();
  }, [user?.id]);

  const handleCreateMerchant = async () => {
    if (!user?.id) return;

    setIsCreatingMerchant(true);
    try {
      // Utiliser le nom de l'utilisateur ou "User {id}" par défaut
      const merchantName = user.email || `User ${user.id.substring(0, 8)}`;
      const merchant = await BoohPayMerchantService.createMerchant(user.id, merchantName);

      if (merchant.magicLink) {
        setMagicLink(merchant.magicLink);
      }

      toast({
        title: t('settings.merchantCreated'),
        description: t('settings.merchantCreatedDescription'),
      });

      // Recharger le statut
      loadProvidersStatus(true);
    } catch (error: any) {
      console.error('Erreur création merchant:', error);
      toast({
        title: t('settings.error'),
        description: error.message || "Impossible de créer le compte marchand",
        variant: "destructive",
      });
    } finally {
      setIsCreatingMerchant(false);
    }
  };

  const handleDeleteMerchant = async () => {
    if (!user?.id || !confirm(t('settings.confirmDeleteMerchant') || "Êtes-vous sûr de vouloir réinitialiser la configuration marchand ?")) return;

    try {
      await BoohPayMerchantService.deleteMerchant(user.id);
      setActiveMerchant(null);
      setProvidersStatus(null);
      toast({
        title: t('settings.merchantDeleted'),
        description: "Configuration réinitialisée.",
      });
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast({
        title: t('settings.error'),
        description: "Erreur lors de la réinitialisation",
        variant: "destructive",
      });
    }
  };

  const providers = [
    {
      id: 'stripe' as const,
      name: 'Stripe',
      description: 'Cartes bancaires internationales',
      logo: PROVIDER_LOGOS.stripe,
      icon: CreditCard,
      status: providersStatus?.stripe,
    },
    {
      id: 'ebilling' as const,
      name: 'eBilling',
      description: 'Mobile Money Afrique Centrale',
      logo: PROVIDER_LOGOS.ebilling,
      icon: Smartphone,
      status: providersStatus?.ebilling,
    },
    {
      id: 'moneroo' as const,
      name: 'Moneroo',
      description: 'Paiements multi-pays',
      logo: PROVIDER_LOGOS.moneroo,
      icon: Smartphone,
      status: providersStatus?.moneroo,
    },
    {
      id: 'shap' as const,
      name: 'SHAP',
      description: 'Paiements sortants Mobile Money',
      logo: PROVIDER_LOGOS.shap,
      icon: Smartphone,
      status: providersStatus?.shap,
    },
  ];

  const connectedCount = providers.filter(p => p.status?.configured || p.status?.connected).length;

  return (
    <div className="space-y-8">
      {/* ═══════════════════════════════════════════════════════════════
          PREMIUM HERO SECTION
      ═══════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: appleEasing }}
        className="relative overflow-hidden rounded-3xl"
      >
        {/* Mesh Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900" />

        {/* Animated Gradient Orbs */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-500/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />

        {/* Content */}
        <div className="relative px-8 py-10">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            {/* Left Side */}
            <div className="flex items-start gap-5 flex-1">
              {/* BoohPay Logo */}
              <motion.div
                className="relative flex-shrink-0"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl blur-xl opacity-60" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 backdrop-blur-sm border border-white/10 shadow-2xl shadow-violet-500/30 overflow-hidden">
                  <img
                    src="/logo/BoohPay.png"
                    alt="BoohPay"
                    className="h-12 w-12 object-contain"
                  />
                </div>
              </motion.div>

              <div className="flex-1">
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 mb-3 border border-white/10"
                >
                  <Sparkles className="h-3.5 w-3.5 text-violet-300" />
                  <span className="text-xs font-medium text-violet-200">Passerelles de paiement</span>
                </motion.div>

                {/* Title with Gradient */}
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2">
                  <span className="bg-gradient-to-r from-white via-violet-200 to-white bg-clip-text text-transparent">
                    {t('settings.paymentProviders')}
                  </span>
                </h1>

                {activeMerchant ? (
                  <div className="mt-4 space-y-6">
                    <div className="flex items-start gap-3 text-violet-100">
                      {connectedCount > 0 ? (
                        <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-6 w-6 text-amber-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-semibold text-lg">
                          {connectedCount > 0 ? "Compte Vendeur Actif" : "Configuration requise"}
                        </div>
                        <p className="text-violet-200/70 text-sm">
                          {connectedCount > 0
                            ? "Votre compte merchant BoohPay est configuré et prêt."
                            : "Votre compte est actif, mais aucun moyen de paiement n'est connecté."}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-violet-300 font-mono bg-white/5 border border-white/10 px-2 py-1 rounded w-fit">
                          <span>ID: {activeMerchant.boohpay_merchant_id}</span>
                        </div>
                      </div>
                    </div>

                    {/* Magic Link Section */}
                    {(magicLink || activeMerchant.magic_link) && (
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                        <div className="flex items-start gap-3">
                          <ExternalLink className="w-5 h-5 text-violet-300 mt-1" />
                          <div className="flex-1">
                            <h4 className="font-medium text-white mb-1">
                              Accès au Dashboard BoohPay
                            </h4>
                            <p className="text-sm text-violet-200/70 mb-3">
                              Lien d'accès direct sécurisé
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                onClick={() => window.open(magicLink || activeMerchant.magic_link, '_blank')}
                                size="sm"
                                className="bg-violet-500 hover:bg-violet-600 text-white border-0"
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Ouvrir
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (magicLink || activeMerchant.magic_link) {
                                    navigator.clipboard.writeText(magicLink || activeMerchant.magic_link);
                                    toast({ title: 'Lien copié !' });
                                  }
                                }}
                                className="bg-transparent border-white/20 text-violet-200 hover:bg-white/10 hover:text-white"
                              >
                                <Copy className="w-4 h-4 mr-2" />
                                Copier
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 space-y-6">
                    <div className="flex items-start gap-3 text-violet-100">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-violet-200">
                        <Store className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="font-semibold text-lg">Activer mon compte vendeur</div>
                        <p className="text-violet-200/70 text-sm max-w-xl">
                          Pour vendre des billets ou des produits, vous devez activer votre compte marchand BoohPay. Cela créera automatiquement vos clés API sécurisées.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stats Cards */}
                <div className="flex gap-4 mt-8">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="px-5 py-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
                  >
                    <div className="text-2xl font-bold text-white">{connectedCount}</div>
                    <div className="text-xs text-violet-300/80">Connectées</div>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="px-5 py-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
                  >
                    <div className="text-2xl font-bold text-white">{providers.length}</div>
                    <div className="text-xs text-violet-300/80">Disponibles</div>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Right Side - Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex flex-col items-end gap-3"
            >
              {activeMerchant ? (
                <div className="flex gap-2">

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white/50 hover:text-red-400 hover:bg-white/10"
                    onClick={handleDeleteMerchant}
                    title="Réinitialiser la configuration"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleCreateMerchant}
                  disabled={isCreatingMerchant}
                  className="group relative overflow-hidden bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-xl px-6 py-6 h-auto transition-all duration-300 shadow-xl shadow-violet-500/25"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    {isCreatingMerchant ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Store className="w-5 h-5" />
                    )}
                    <span className="font-semibold">
                      {isCreatingMerchant ? "Activation en cours..." : "Activer maintenant"}
                    </span>
                    {!isCreatingMerchant && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                  </span>
                  {/* Shine effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </Button>
              )}

              <Button
                onClick={() => loadProvidersStatus(true)}
                disabled={isRefreshing}
                variant="ghost"
                className="text-violet-300 hover:text-white hover:bg-white/10"
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
                {t('settings.refreshStatus')}
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>




      {/* ═══════════════════════════════════════════════════════════════
          PROVIDER STATUS CARDS - Lecture seule
      ═══════════════════════════════════════════════════════════════ */}
      < AnimatePresence mode="wait" >
        {
          isLoadingStatus ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-6 py-16"
            >
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500/30 to-purple-500/30 animate-ping" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 border-r-violet-400 animate-spin" />
                <div className="absolute inset-3 rounded-full bg-white flex items-center justify-center shadow-xl">
                  <Sparkles className="w-5 h-5 text-violet-500" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500">{t('settings.loadingStatus')}</p>
            </motion.div >
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
            >
              {providers.map((provider, index) => {
                const isConnected = provider.status?.configured || provider.status?.connected;
                const Icon = provider.icon;

                return (
                  <motion.div
                    key={provider.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.5, ease: appleEasing }}
                    className="group relative"
                  >
                    {/* Card */}
                    <div className={cn(
                      "relative overflow-hidden rounded-2xl border bg-white p-5 transition-all duration-300",
                      isConnected
                        ? "border-emerald-200 shadow-lg shadow-emerald-500/5"
                        : "border-gray-200 shadow-sm",
                      "hover:shadow-xl hover:border-violet-200"
                    )}>
                      {/* Connected indicator bar */}
                      {isConnected && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-green-500" />
                      )}

                      {/* Header */}
                      <div className="flex items-center gap-3 mb-4">
                        {/* Logo */}
                        <div className="relative p-2.5 rounded-xl bg-gray-50 border border-gray-100 group-hover:border-violet-100 transition-colors">
                          {provider.logo ? (
                            <img
                              src={provider.logo}
                              alt={provider.name}
                              className="w-7 h-7 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <Icon className={cn("w-7 h-7 text-gray-600", provider.logo && "hidden")} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{provider.name}</h3>
                          <p className="text-xs text-gray-500 truncate">{provider.description}</p>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold',
                          isConnected
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-100 text-gray-500'
                        )}>
                          {isConnected ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {t('settings.connected')}
                            </>
                          ) : (
                            <>
                              <Circle className="w-3.5 h-3.5" />
                              {t('settings.notConnected')}
                            </>
                          )}
                        </span>

                        {provider.status?.environment && (
                          <span className={cn(
                            'text-xs font-medium px-2 py-1 rounded-md',
                            provider.status.environment === 'production'
                              ? 'bg-violet-50 text-violet-600'
                              : 'bg-amber-50 text-amber-600'
                          )}>
                            {provider.status.environment === 'production' ? 'Prod' : 'Test'}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
      </AnimatePresence >

      {/* ═══════════════════════════════════════════════════════════════
          INFO FOOTER
      ═══════════════════════════════════════════════════════════════ */}
      < motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="rounded-xl bg-gradient-to-r from-violet-50 via-purple-50 to-violet-50 border border-violet-100 p-5"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100">
            <Shield className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h4 className="font-semibold text-violet-900 mb-1">{t('settings.centralizedConfiguration')}</h4>
            <p className="text-sm text-violet-700/80">
              {t('settings.centralizedConfigurationDescription')}
            </p>

          </div>
        </div>
      </motion.div >
    </div >
  );
};
