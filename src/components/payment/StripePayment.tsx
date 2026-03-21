import React, { useState, useEffect } from 'react';
import { CreditCard, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentService } from '@/services/paymentService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface StripePaymentProps {
  amount: number;
  currency?: string;
  orderId: string;
  orderType: 'physical' | 'digital';
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  onPaymentSuccess: (paymentData: any) => void;
  onCancel: () => void;
}

const StripePayment: React.FC<StripePaymentProps> = ({
  amount,
  currency = 'EUR',
  orderId,
  orderType,
  customerInfo,
  onPaymentSuccess,
  onCancel,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateCheckout = async () => {
    if (!user) {
      setError('Vous devez être connecté pour effectuer un paiement');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Créer le paiement via BoohPay
      const result = await PaymentService.createStripePayment(
        user.id,
        orderId,
        amount,
        currency,
        {
          email: customerInfo.email,
          name: customerInfo.name,
          phone: customerInfo.phone,
        },
        `${window.location.origin}/payment-callback?payment_id={payment_id}`
      );

      // Si c'est une redirection, rediriger vers l'URL
      if (result.checkout?.type === 'REDIRECT' && result.checkout.url) {
        const returnUrl = result.checkout.url.replace('{payment_id}', result.paymentId);
        window.location.href = returnUrl;
      } else if (result.checkout?.type === 'CLIENT_SECRET') {
        // Pour CLIENT_SECRET, on devrait utiliser StripePaymentForm avec Stripe Elements
        // Pour l'instant, on redirige vers PaymentCallback qui gérera le statut
        window.location.href = `${window.location.origin}/payment-callback?payment_id=${result.paymentId}`;
      } else {
        throw new Error('Format de checkout non supporté');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de la session de paiement');
      setIsProcessing(false);
      toast({
        title: 'Erreur',
        description: err.message || 'Impossible de créer la session de paiement',
        variant: 'destructive',
      });
    }
  };

  // Note: La vérification du statut se fait maintenant dans PaymentCallback


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5 text-blue-600" />
          <span>Paiement par Carte Bancaire</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Montant à payer</span>
            <span className="text-lg font-semibold text-gray-900">
              {amount.toLocaleString('fr-FR')} {currency}
            </span>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>Paiement sécurisé via Stripe</strong>
          </p>
          <p className="text-xs text-blue-700 mt-2">
            Vous serez redirigé vers une page sécurisée Stripe pour finaliser votre paiement.
            Nous acceptons Visa, Mastercard et autres cartes internationales.
          </p>
        </div>

        <div className="flex space-x-3">
          <Button
            onClick={handleCreateCheckout}
            disabled={isProcessing}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Redirection...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Payer avec Stripe
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            Annuler
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StripePayment;

