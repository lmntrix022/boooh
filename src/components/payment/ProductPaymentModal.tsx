import React, { useState } from 'react';
import { X, Smartphone, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MobileMoneyService } from '@/services/mobileMoneyService';
import { usePaymentStatus } from '@/services/paymentCallbackService';
import { useToast } from '@/hooks/use-toast';

interface ProductPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    price: number;
    type: 'physical' | 'digital';
    image?: string;
  };
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  onPaymentSuccess: (paymentData: any) => void;
}

const ProductPaymentModal: React.FC<ProductPaymentModalProps> = ({
  isOpen,
  onClose,
  product,
  customerInfo,
  onPaymentSuccess,
}) => {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState(customerInfo.phone || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Hook pour surveiller le statut du paiement
  const { status, callback, loading } = usePaymentStatus(paymentData?.bill_id || null);

  // Validation du numéro de téléphone
  const phoneInfo = MobileMoneyService.getPhoneInfo(phoneNumber);
  const isValidPhone = phoneInfo.isValid;

  // Gérer les changements de statut
  React.useEffect(() => {
    if (status === 'SUCCESS' && callback) {
      setIsProcessing(false);
      onPaymentSuccess({
        ...paymentData,
        status: 'SUCCESS',
        transaction_id: callback.transaction_id,
        paid_at: callback.paid_at,
      });
      onClose();
    } else if (status === 'FAILED') {
      setIsProcessing(false);
      setError('Le paiement a été refusé. Veuillez vérifier votre solde ou réessayer.');
    }
  }, [status, callback, paymentData, onPaymentSuccess, onClose]);

  const handlePayment = async () => {
    if (!isValidPhone) {
      setError('Veuillez saisir un numéro de téléphone valide (Airtel 07 ou Moov 06)');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await MobileMoneyService.initiateUssdPayment({
        amount: product.price,
        payer_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        payer_email: customerInfo.email,
        payer_msisdn: phoneNumber,
        short_description: `Achat direct - ${product.name}`,
        external_reference: `PRODUCT-${product.id}-${Date.now()}`,
      });

      setPaymentData(result);
      // Log removed
    } catch (error: any) {
      // Error log removed
      setError(error.message || 'Erreur lors de l\'initiation du paiement');
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setPaymentData(null);
    setIsProcessing(false);
  };

  const handleClose = () => {
    if (!isProcessing) {
      setError(null);
      setPaymentData(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5 text-green-600" />
            <span>Paiement Mobile Money</span>
          </DialogTitle>
          <DialogDescription>
            Payez votre commande en toute sécurité via Mobile Money (Airtel ou Moov)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informations du produit */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">{product.name}</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {product.type === 'digital' ? 'Produit numérique' : 'Produit physique'}
              </span>
              <span className="font-semibold text-lg text-gray-900">
                {product.price.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>

          {/* Formulaire de paiement */}
          {!paymentData && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="07123456 ou 06123456"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={!isValidPhone && phoneNumber ? 'border-red-500' : ''}
                />
                {phoneNumber && (
                  <div className="mt-2">
                    {isValidPhone ? (
                      <div className="flex items-center space-x-2 text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        <span>
                          {phoneInfo.formatted} - {phoneInfo.operatorName}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>Numéro invalide. Utilisez Airtel (07) ou Moov (06)</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex space-x-3">
                <Button
                  onClick={handlePayment}
                  disabled={!isValidPhone || isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Initialisation...
                    </>
                  ) : (
                    <>
                      <Smartphone className="h-4 w-4 mr-2" />
                      Payer {product.price.toLocaleString('fr-FR')} FCFA
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {/* Statut du paiement */}
          {paymentData && (
            <div className="space-y-4">
              {status === 'PENDING' && (
                <Alert>
                  <Smartphone className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Notification envoyée !</p>
                      <p className="text-sm">
                        Une demande de paiement a été envoyée sur votre téléphone{' '}
                        <span className="font-mono">{phoneInfo.formatted}</span>.
                      </p>
                      <p className="text-sm">
                        Veuillez composer le code USSD affiché et confirmer le paiement de{' '}
                        <span className="font-semibold">{product.price.toLocaleString('fr-FR')} FCFA</span>.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {status === 'SUCCESS' && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium text-green-900">Paiement réussi !</p>
                      <p className="text-sm text-green-700">
                        Votre paiement de {product.price.toLocaleString('fr-FR')} FCFA a été confirmé.
                      </p>
                      {callback?.transaction_id && (
                        <p className="text-xs text-green-600 font-mono">
                          Transaction: {callback.transaction_id}
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {status === 'FAILED' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Paiement échoué</p>
                      <p className="text-sm">
                        Le paiement a été refusé. Veuillez vérifier votre solde ou réessayer.
                      </p>
                      <Button onClick={handleRetry} size="sm" className="mt-2">
                        Réessayer
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductPaymentModal;





















