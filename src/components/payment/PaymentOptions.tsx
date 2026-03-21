import React, { useState } from 'react';
import { Smartphone, CreditCard, Wallet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PaymentMethodSelector, { PaymentMethod } from './PaymentMethodSelector';
import MobileMoneyPayment from './MobileMoneyPayment';
import StripePayment from './StripePayment';
import StripePaymentForm from './StripePaymentForm';
import { useToast } from '@/hooks/use-toast';
import { PaymentBreakdown } from '@/services/paymentCalculator';

interface PaymentOptionsProps {
  orderId: string;
  orderType: 'physical' | 'digital';
  amount: number; // Montant en EUR (déjà avec frais et TVA)
  currency?: string;
  cardId?: string; // ID de la carte pour Stripe Connect
  productId?: string; // ID du produit physique
  digitalProductId?: string; // ID du produit digital
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  onPaymentSuccess: (paymentData: any) => void;
  onCancel: () => void;
  paymentBreakdown?: PaymentBreakdown | null; // Breakdown des frais et TVA pour affichage
}

const PaymentOptions: React.FC<PaymentOptionsProps> = ({
  orderId,
  orderType,
  amount,
  currency = 'EUR',
  cardId,
  productId,
  digitalProductId,
  customerInfo,
  onPaymentSuccess,
  onCancel,
  paymentBreakdown,
}) => {
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    
    // Si c'est "Payer à la livraison", créer directement la commande sans paiement
    if (method === 'cash_on_delivery') {
      handleCashOnDelivery();
    }
  };

  const handleCashOnDelivery = async () => {
    setIsProcessing(true);
    
    try {
      // Pour cash_on_delivery, on confirme directement la commande
      // Le paiement sera effectué à la livraison
      onPaymentSuccess({
        payment_method: 'cash_on_delivery',
        payment_status: 'pending',
        status: 'pending',
        paid_at: null,
        transaction_id: null,
      });
      
      toast({
        title: 'Commande créée',
        description: 'Votre commande a été enregistrée. Vous paierez à la livraison.',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de finaliser la commande',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMobileMoneySuccess = (paymentData: any) => {
    onPaymentSuccess({
      ...paymentData,
      payment_method: 'mobile_money',
    });
  };

  const handleStripeSuccess = (paymentData: any) => {
    onPaymentSuccess({
      ...paymentData,
      payment_method: 'stripe',
    });
  };

  // Si aucune méthode n'est sélectionnée, afficher le sélecteur
  if (!selectedMethod) {
    return (
      <div className="space-y-4">
        {/* Afficher le breakdown des frais si disponible */}
        {paymentBreakdown && (
          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Détail du montant</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Sous-total produits</span>
                  <span className="font-medium">{Math.round(paymentBreakdown.subtotal).toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Frais ({paymentBreakdown.fees.percentage}% + {paymentBreakdown.fees.fixedFee.toFixed(2)} €)</span>
                  <span className="font-medium">{Math.round(paymentBreakdown.fees.totalFeesFCFA).toLocaleString()} FCFA</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold text-gray-900">
                  <span>Total à payer</span>
                  <span>{Math.round(paymentBreakdown.total).toLocaleString()} FCFA</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <PaymentMethodSelector
          selectedMethod={null}
          onMethodSelect={handleMethodSelect}
          totalAmount={amount}
          disabled={isProcessing}
          allowCashOnDelivery={orderType === 'physical'} // Permettre cash_on_delivery seulement pour produits physiques
        />
        <Button 
          variant="outline" 
          onClick={onCancel} 
          className="w-full h-12 text-base font-medium border-gray-300 hover:bg-gray-50 transition-all"
        >
          Annuler
        </Button>
      </div>
    );
  }

  // Afficher le composant de paiement selon la méthode sélectionnée
  return (
    <div className="space-y-4">
      {selectedMethod === 'mobile_money' && (
        <MobileMoneyPayment
          totalAmount={amount}
          orderId={orderId}
          customerInfo={{
            firstName: customerInfo.name.split(' ')[0] || customerInfo.name,
            lastName: customerInfo.name.split(' ').slice(1).join(' ') || '',
            email: customerInfo.email,
            phone: customerInfo.phone || '',
          }}
          onPaymentSuccess={handleMobileMoneySuccess}
          onPaymentError={(error) => {
            toast({
              title: 'Erreur de paiement',
              description: error,
              variant: 'destructive',
            });
          }}
          onCancel={() => setSelectedMethod(null)}
        />
      )}

      {selectedMethod === 'stripe' && (
        <StripePaymentForm
          amount={amount}
          currency={currency}
          orderId={orderId}
          orderType={orderType}
          cardId={cardId}
          productId={productId}
          digitalProductId={digitalProductId}
          customerInfo={customerInfo}
          onPaymentSuccess={handleStripeSuccess}
          onCancel={() => setSelectedMethod(null)}
        />
      )}

      {selectedMethod === 'cash_on_delivery' && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Wallet className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Paiement à la Livraison</h3>
                  <p className="text-sm text-gray-600">Vous paierez en espèces à la réception</p>
                </div>
              </div>

              {isProcessing ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
                  <span className="ml-2 text-sm text-gray-600">Finalisation de la commande...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <p className="text-sm text-orange-900 font-medium mb-2">
                      ✓ Commande enregistrée avec succès
                    </p>
                    <p className="text-xs text-orange-700">
                      Vous recevrez un email de confirmation. Le livreur vous contactera pour la livraison.
                      Vous pourrez payer directement en espèces à la réception du produit.
                    </p>
                  </div>
                  <Button onClick={onCancel} variant="outline" className="w-full">
                    Retour
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PaymentOptions;

