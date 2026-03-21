import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { CreditCard, CheckCircle, AlertCircle, ExternalLink, Loader2, TrendingUp, DollarSign } from "lucide-react";
import { StripeConnectService } from "@/services/stripeConnectService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const StripeConnectSettings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Récupérer le compte Stripe Connect
  const { data: account, isLoading: isLoadingAccount } = useQuery({
    queryKey: ['stripe-connect-account'],
    queryFn: () => StripeConnectService.getAccount(),
    enabled: !!user,
  });

  // Récupérer les statistiques
  const { data: stats } = useQuery({
    queryKey: ['stripe-connect-stats'],
    queryFn: () => StripeConnectService.getStats(),
    enabled: !!account?.onboarded,
  });

  // Créer ou récupérer le compte Stripe Connect
  const handleConnectStripe = async () => {
    if (!user?.email) {
      toast({
        title: "Erreur",
        description: "Email manquant",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const publicUrl = window.location.origin;
      const result = await StripeConnectService.createAccount({
        email: user.email,
        country: 'FR',
        return_url: `${publicUrl}/settings?stripe=success`,
        refresh_url: `${publicUrl}/settings?stripe=refresh`,
      });

      // Rediriger vers l'onboarding Stripe
      if (result.onboarding_url) {
        window.location.href = result.onboarding_url;
      }

      // Invalider le cache
      queryClient.invalidateQueries({ queryKey: ['stripe-connect-account'] });
    } catch (error: any) {
      // Détecter si c'est une erreur de Stripe Connect non activé
      const errorMessage = error.message || error.error || "Erreur lors de la connexion à Stripe";
      const isConnectNotActivated = errorMessage.includes("Connect") || 
                                    errorMessage.includes("signed up for Connect") ||
                                    error?.connectNotActivated;

      if (isConnectNotActivated) {
        toast({
          title: "Stripe Connect non activé",
          description: (
            <div className="space-y-2">
              <p>Stripe Connect n'est pas activé sur votre compte Stripe.</p>
              <p className="text-sm">Veuillez d'abord activer Stripe Connect dans votre Dashboard Stripe, puis réessayez.</p>
              <a 
                href="https://dashboard.stripe.com/settings/connect" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm underline font-medium"
              >
                Activer Stripe Connect →
              </a>
            </div>
          ),
          variant: "destructive",
          duration: 10000, // Plus long pour que l'utilisateur puisse lire
        });
      } else {
        toast({
          title: "Erreur",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Ouvrir le dashboard Stripe
  const handleOpenDashboard = async () => {
    if (!account?.dashboard_url) {
      // Régénérer l'URL du dashboard
      setIsLoading(true);
      try {
        // L'Edge Function devrait régénérer l'URL si nécessaire
        await queryClient.invalidateQueries({ queryKey: ['stripe-connect-account'] });
        const updatedAccount = await StripeConnectService.getAccount();
        if (updatedAccount?.dashboard_url) {
          window.open(updatedAccount.dashboard_url, '_blank');
        }
      } catch (error: any) {
        toast({
          title: "Erreur",
          description: "Impossible d'ouvrir le dashboard Stripe",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      window.open(account.dashboard_url, '_blank');
    }
  };

  // Vérifier le statut après retour d'onboarding
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('stripe') === 'success' || urlParams.get('stripe') === 'refresh') {
      // Vérifier le statut depuis Stripe et mettre à jour la base de données
      const checkStatus = async () => {
        try {
          await StripeConnectService.checkStatus();
          // Rafraîchir les données du compte
          await queryClient.invalidateQueries({ queryKey: ['stripe-connect-account'] });
          await queryClient.invalidateQueries({ queryKey: ['stripe-connect-stats'] });
          
          toast({
            title: "Succès",
            description: "Votre compte Stripe Connect a été configuré avec succès !",
          });
        } catch (error: any) {
          console.error("Error checking status:", error);
          // Quand même rafraîchir les données locales
          await queryClient.invalidateQueries({ queryKey: ['stripe-connect-account'] });
        }
      };
      
      checkStatus();
      // Nettoyer l'URL
      window.history.replaceState({}, '', '/settings');
    }
  }, [queryClient, toast]);

  if (isLoadingAccount) {
    return (
      <Card className="border border-gray-200/50 shadow-lg">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200/50 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <CreditCard className="h-5 w-5 text-gray-900" />
          </div>
          <div>
            <CardTitle className="text-xl">Stripe Connect</CardTitle>
            <CardDescription>
              Connectez votre compte Stripe pour recevoir les paiements de vos produits
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6 space-y-6">
        {!account ? (
          // Pas encore de compte
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Connectez votre compte Stripe pour recevoir les paiements directement sur votre compte bancaire.
                Les paiements de vos produits seront automatiquement transférés, moins une commission de 5%.
              </AlertDescription>
            </Alert>
            <Button
              onClick={handleConnectStripe}
              disabled={isCreating}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Connecter Stripe
                </>
              )}
            </Button>
          </div>
        ) : !account.onboarded ? (
          // Compte créé mais onboarding incomplet
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Votre compte Stripe Connect a été créé, mais vous devez compléter l'onboarding pour recevoir des paiements.
                {account.details_submitted && (
                  <span className="block mt-2 text-sm text-green-600">
                    ✓ Les informations ont été enregistrées. Vérifiez le statut pour finaliser.
                  </span>
                )}
              </AlertDescription>
            </Alert>
            <div className="flex gap-3">
              <Button
                onClick={handleConnectStripe}
                disabled={isCreating}
                className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ouverture...
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Compléter l'onboarding
                  </>
                )}
              </Button>
              <Button
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    await StripeConnectService.checkStatus();
                    await queryClient.invalidateQueries({ queryKey: ['stripe-connect-account'] });
                    toast({
                      title: "Statut vérifié",
                      description: "Le statut de votre compte a été mis à jour.",
                    });
                  } catch (error: any) {
                    toast({
                      title: "Erreur",
                      description: error.message || "Erreur lors de la vérification du statut",
                      variant: "destructive",
                    });
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
                variant="outline"
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Vérifier le statut
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          // Compte actif
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">Compte actif</h3>
                  <Badge variant="default" className="bg-gray-900 text-white">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Configuré
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  ID: {account.account_id}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenDashboard}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Dashboard
                  </>
                )}
              </Button>
            </div>

            {/* Statistiques */}
            {stats && (
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <TrendingUp className="h-4 w-4 text-gray-900" />
                    Transactions
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total_transactions || 0}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 text-gray-900" />
                    Revenus totaux
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {((stats.total_revenue_cents || 0) / 100).toFixed(2)} €
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CreditCard className="h-4 w-4 text-gray-900" />
                    Reversé
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {((stats.total_payout_cents || 0) / 100).toFixed(2)} €
                  </p>
                </div>
              </div>
            )}

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Vous recevez automatiquement les paiements de vos produits sur votre compte bancaire connecté.
                La commission de la plateforme (5%) est automatiquement déduite.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200 text-xs text-gray-600 space-y-1">
          <p>• Les paiements sont transférés quotidiennement sur votre compte bancaire</p>
          <p>• Commission de la plateforme : 5% + frais Stripe</p>
          <p>• Vous pouvez gérer vos paramètres directement sur votre dashboard Stripe</p>
        </div>
      </CardContent>
    </Card>
  );
};

