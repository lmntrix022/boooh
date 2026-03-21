import React, { useState, useEffect, useCallback } from 'react';
import { loadStripe, Stripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { CreditCard, Loader2, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { PaymentService } from '@/services/paymentService';
import { useAuth } from '@/contexts/AuthContext';

// ============================================================================
// ARCHITECTURE CENTRALISÉE : Toutes les clés Stripe sont gérées par BoohPay
// Bööh n'a plus de clé Stripe en dur - elle est récupérée dynamiquement
// ============================================================================

// Taux de change EUR vers FCFA (XOF) - environ 1 EUR = 655 FCFA
const EUR_TO_FCFA_RATE = 655;
const FCFA_TO_EUR_RATE = 1 / EUR_TO_FCFA_RATE;

/**
 * Convertit un montant de n'importe quelle devise en EUR
 */
function convertToEUR(amount: number, currency: string): number {
  const upperCurrency = currency.toUpperCase();
  
  if (upperCurrency === 'EUR') {
    return amount;
  }
  
  if (upperCurrency === 'XOF' || upperCurrency === 'FCFA') {
    return amount * FCFA_TO_EUR_RATE;
  }
  
  console.warn(`Conversion non gérée pour ${currency}, utilisation du montant tel quel`);
  return amount;
}

interface StripePaymentFormProps {
  amount: number;
  currency?: string;
  orderId: string;
  orderType: 'physical' | 'digital';
  cardId?: string;
  productId?: string;
  digitalProductId?: string;
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  onPaymentSuccess: (paymentData: any) => void;
  onCancel: () => void;
}

interface PaymentIntentData {
  clientSecret: string;
  paymentId: string;
  publishableKey: string;
  stripeAccount?: string;
}

// ============================================================================
// Composant interne qui utilise Stripe Elements
// ============================================================================
const StripePaymentFormInner: React.FC<StripePaymentFormProps & { 
  paymentIntentData: PaymentIntentData;
}> = ({
  amount,
  currency = 'EUR',
  orderId,
  customerInfo,
  onPaymentSuccess,
  onCancel,
  paymentIntentData,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const amountInEUR = convertToEUR(amount, currency);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Élément de carte non trouvé');
      }

      // Confirmer le paiement avec Stripe
      const { error: confirmError, paymentIntent: confirmedIntent } =
        await stripe.confirmCardPayment(paymentIntentData.clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: customerInfo.name,
              email: customerInfo.email,
              phone: customerInfo.phone,
            },
          },
        });

      if (confirmError) {
        console.error('❌ Erreur Stripe:', confirmError);
        setError(confirmError.message || 'Erreur lors du paiement');
        setIsProcessing(false);
        return;
      }

      if (confirmedIntent?.status === 'succeeded') {
        onPaymentSuccess({
          payment_method: 'stripe',
          payment_status: 'paid',
          payment_intent_id: confirmedIntent.id,
          paymentId: paymentIntentData.paymentId,
          transaction_id: paymentIntentData.paymentId,
          paid_at: new Date().toISOString(),
        });
      } else {
        setError('Le paiement n\'a pas été complété');
        setIsProcessing(false);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du traitement du paiement');
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1f2937',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        '::placeholder': {
          color: '#9ca3af',
        },
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444',
      },
    },
    hidePostalCode: true,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Résumé de la commande */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 p-5 rounded-2xl border border-gray-100">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-500/10 rounded-full -mr-16 -mt-16"></div>
        <div className="relative">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></div>
            Résumé de la commande
          </h4>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Client</span>
              <span className="text-sm font-medium text-gray-900">{customerInfo.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Email</span>
              <span className="text-sm font-medium text-gray-900">{customerInfo.email}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-base font-semibold text-gray-700">Total à payer</span>
              <div className="text-right">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {amountInEUR.toFixed(2).replace('.', ',')} EUR
                </span>
                {currency.toUpperCase() !== 'EUR' && (
                  <div className="text-xs text-gray-500 mt-1">
                    ({amount.toLocaleString('fr-FR')} {currency})
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Informations de sécurité */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 flex items-start space-x-3">
        <Lock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-900 mb-1">Paiement sécurisé via BoohPay</p>
          <p className="text-xs text-blue-700">
            Vos informations bancaires sont chiffrées et sécurisées par Stripe. Nous ne stockons jamais vos données de carte.
          </p>
        </div>
      </div>

      {/* Formulaire de carte */}
      <div className="space-y-4">
        <label className="text-base font-medium text-gray-700 block">
          Informations de carte bancaire
        </label>
        <div className="relative p-4 bg-white border-2 border-gray-200 rounded-xl focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Boutons d'action */}
      <div className="flex space-x-3 pt-4">
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Traitement en cours...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Payer {amountInEUR.toFixed(2).replace('.', ',')} EUR
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="px-6"
        >
          Annuler
        </Button>
      </div>

      {/* Logos de cartes acceptées */}
      <div className="flex items-center justify-center space-x-2 pt-2">
        <span className="text-xs text-gray-500">Cartes acceptées:</span>
        <div className="flex space-x-1">
          <span className="text-xs text-gray-400">Visa</span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-400">Mastercard</span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-400">American Express</span>
        </div>
      </div>
    </form>
  );
};

// ============================================================================
// Composant wrapper principal - Charge Stripe dynamiquement via BoohPay
// ============================================================================
const StripePaymentForm: React.FC<StripePaymentFormProps> = (props) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [paymentIntentData, setPaymentIntentData] = useState<PaymentIntentData | null>(null);

  const amountInEUR = convertToEUR(props.amount, props.currency || 'EUR');

  // Créer le PaymentIntent via BoohPay et récupérer la clé Stripe
  const initializePayment = useCallback(async () => {
    if (!user) {
      setError('Utilisateur non connecté');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Déterminer l'ID du vendeur si on a un cardId
      let sellerUserId: string | null = null;
      
      if (props.cardId) {
        const { data: card } = await supabase
          .from('business_cards')
          .select('user_id')
          .eq('id', props.cardId)
          .maybeSingle();

        if (card?.user_id) {
          sellerUserId = card.user_id;
        }
      }

      const merchantUserId = sellerUserId || user.id;

      // Créer le paiement via BoohPay - BoohPay gère tout (y compris Stripe Connect)
      console.log('🚀 Création du paiement via BoohPay...');
      const result = await PaymentService.createStripePayment(
        merchantUserId,
        props.orderId,
        amountInEUR,
        'EUR',
        {
          email: props.customerInfo.email,
          name: props.customerInfo.name,
          phone: props.customerInfo.phone,
        },
        `${window.location.origin}/payment-callback?payment_id={payment_id}`,
        {
          cardId: props.cardId,
          productId: props.productId,
          digitalProductId: props.digitalProductId,
          orderType: props.orderType,
        }
      );

      // Vérifier que BoohPay a retourné un CLIENT_SECRET
      if (result.checkout?.type !== 'CLIENT_SECRET' || !result.checkout.clientSecret) {
        // Si BoohPay retourne REDIRECT, rediriger
        if (result.checkout?.type === 'REDIRECT' && result.checkout.url) {
          const returnUrl = result.checkout.url.replace('{payment_id}', result.paymentId);
          window.location.href = returnUrl;
          return;
        }
        throw new Error('Format de paiement non supporté');
      }

      // Récupérer la clé publique Stripe depuis BoohPay
      const publishableKey = result.checkout.publishableKey;
      if (!publishableKey) {
        throw new Error('Clé publique Stripe non fournie par BoohPay');
      }

      console.log('✅ PaymentIntent créé, clé Stripe reçue de BoohPay');

      // Charger Stripe avec la clé fournie par BoohPay
      // Si un stripeAccount est fourni (Stripe Connect), l'utiliser
      const stripeOptions = result.checkout.stripeAccount 
        ? { stripeAccount: result.checkout.stripeAccount }
        : undefined;

      const stripe = loadStripe(publishableKey, stripeOptions);
      setStripePromise(stripe);

      // Stocker les données du PaymentIntent
      setPaymentIntentData({
        clientSecret: result.checkout.clientSecret,
        paymentId: result.paymentId,
        publishableKey: publishableKey,
        stripeAccount: result.checkout.stripeAccount,
      });

      setLoading(false);
    } catch (err: any) {
      console.error('❌ Erreur initialisation paiement:', err);
      setError(err.message || 'Erreur lors de l\'initialisation du paiement');
      setLoading(false);
    }
  }, [user, props.cardId, props.orderId, props.customerInfo, amountInEUR, props.orderType, props.productId, props.digitalProductId]);

  useEffect(() => {
    initializePayment();
  }, [initializePayment]);

  const elementsOptions: StripeElementsOptions = {
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#3b82f6',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        spacingUnit: '4px',
        borderRadius: '12px',
      },
    },
  };

  // État de chargement
  if (loading) {
    return (
      <Card className="border-0 shadow-xl">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <div className="text-center">
              <p className="font-medium text-gray-900">Préparation du paiement...</p>
              <p className="text-sm text-gray-500 mt-1">Connexion sécurisée à BoohPay</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <Card className="border-0 shadow-xl">
        <CardContent className="p-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 flex space-x-3">
            <Button onClick={initializePayment} className="flex-1">
              Réessayer
            </Button>
            <Button variant="outline" onClick={props.onCancel}>
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Vérifier que tout est prêt
  if (!stripePromise || !paymentIntentData) {
    return (
      <Card className="border-0 shadow-xl">
        <CardContent className="p-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Le système de paiement n'a pas pu être initialisé. Veuillez réessayer.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="pb-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-3"
        >
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">Paiement par Carte Bancaire</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Paiement sécurisé via BoohPay</p>
          </div>
        </motion.div>
      </CardHeader>
      <CardContent>
        <Elements stripe={stripePromise} options={elementsOptions}>
          <StripePaymentFormInner {...props} paymentIntentData={paymentIntentData} />
        </Elements>
      </CardContent>
    </Card>
  );
};

export default StripePaymentForm;
