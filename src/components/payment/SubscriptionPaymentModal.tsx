import React, { useState } from 'react';
import { Smartphone, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MobileMoneyService } from '@/services/mobileMoneyService';
import { usePaymentStatus } from '@/services/paymentCallbackService';
import { useToast } from '@/hooks/use-toast';
import TermsConsent from './TermsConsent';

interface SubscriptionPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    name: string;
    price: number; // Prix en EUR
    type: 'plan' | 'addon';
  };
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  billingInterval?: 'month' | 'year'; // Intervalle de facturation (optionnel, par défaut 'month')
  onPaymentSuccess: (paymentData: any) => void;
}

const SubscriptionPaymentModal: React.FC<SubscriptionPaymentModalProps> = ({
  isOpen,
  onClose,
  item,
  customerInfo,
  billingInterval = 'month',
  onPaymentSuccess,
}) => {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState(customerInfo.phone || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentStartTime, setPaymentStartTime] = useState<number | null>(null);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);

  // Hook pour surveiller le statut du paiement
  const { status, callback, loading } = usePaymentStatus(paymentData?.bill_id || null);

  // Validation du numéro de téléphone
  const phoneInfo = MobileMoneyService.getPhoneInfo(phoneNumber);
  const isValidPhone = phoneInfo.isValid;

  // Convertir le prix EUR en FCFA (1 EUR = 655 FCFA)
  const priceInFCFA = Math.round(item.price * 655);

  // Gérer les changements de statut
  React.useEffect(() => {
    if (status === 'SUCCESS' && callback) {
      setIsProcessing(false);
      setPaymentStartTime(null); // Réinitialiser le timer
      onPaymentSuccess({
        ...paymentData,
        status: 'SUCCESS',
        transaction_id: callback.transaction_id,
        paid_at: callback.paid_at,
        reference: paymentData.reference,
      });
      onClose();
    } else if (status === 'FAILED') {
      setIsProcessing(false);
      setPaymentStartTime(null); // Réinitialiser le timer
      setError('Le paiement a été refusé. Veuillez vérifier votre solde ou réessayer.');
    }
  }, [status, callback, paymentData, onPaymentSuccess, onClose]);

  // Timeout de 90 secondes si le paiement n'est pas confirmé
  React.useEffect(() => {
    // Ne pas créer de timeout si le paiement a réussi, échoué, ou si le timeout a déjà été atteint
    if (!paymentData || !paymentStartTime || timeoutReached || status === 'SUCCESS' || status === 'FAILED') {
      return;
    }

    // Seulement créer le timeout si le statut est PENDING
    if (status === 'PENDING') {
      const timeout = setTimeout(() => {
        setTimeoutReached(true);
        setIsProcessing(false);
        toast({
          title: 'Paiement expiré',
          description: 'Le délai de paiement a expiré. Veuillez réessayer.',
          variant: 'destructive',
        });
        // Fermer la modale après 2 secondes pour laisser le temps de lire le message
        setTimeout(() => {
          setPaymentData(null);
          setPaymentStartTime(null);
          setTimeoutReached(false);
          onClose();
        }, 2000);
      }, 90000); // 90 secondes

      return () => clearTimeout(timeout);
    }
  }, [paymentData, paymentStartTime, timeoutReached, status, toast, onClose]);

  const handlePayment = async () => {
    // Validation du consentement aux conditions
    if (!termsAccepted) {
      setConsentError('Veuillez accepter les conditions d\'utilisation pour continuer.');
      return;
    }

    if (!isValidPhone) {
      setError('Veuillez saisir un numéro de téléphone valide (Airtel 07 ou Moov 06)');
      setConsentError(null);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setConsentError(null);

    try {
      // Vérifier que tous les champs sont remplis
      if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email || !phoneNumber) {
        setError('Veuillez remplir tous les champs obligatoires.');
        setIsProcessing(false);
        return;
      }

      const result = await MobileMoneyService.initiateUssdPayment({
        amount: priceInFCFA, // Montant en FCFA
        payer_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        payer_email: customerInfo.email,
        payer_msisdn: phoneNumber,
        short_description: `${item.type === 'plan' ? (billingInterval === 'year' ? 'Abonnement annuel' : 'Abonnement mensuel') : 'Add-on'} - ${item.name}`,
        external_reference: `${item.type.toUpperCase()}-${Date.now()}`,
      });

      setPaymentData(result);
      setPaymentStartTime(Date.now()); // Enregistrer le moment où le paiement a été initié
      setTimeoutReached(false); // Réinitialiser le flag de timeout
    } catch (error: any) {
      setError(error.message || 'Erreur lors de l\'initiation du paiement');
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setPaymentData(null);
    setIsProcessing(false);
    setPaymentStartTime(null);
    setTimeoutReached(false);
  };

  const handleClose = () => {
    if (!isProcessing) {
      setError(null);
      setPaymentData(null);
      setPaymentStartTime(null);
      setTimeoutReached(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md border border-gray-200 bg-white rounded-lg shadow-sm">
        <DialogHeader>
          <DialogTitle 
            className="text-2xl md:text-3xl font-light text-gray-900"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
              letterSpacing: '-0.02em',
            }}
          >
            Paiement Mobile Money
          </DialogTitle>
          <DialogDescription 
            className="text-gray-500 text-base font-light"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            Payez votre {item.type === 'plan' ? 'abonnement' : 'add-on'} en toute sécurité via Mobile Money (Airtel ou Moov)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informations de l'abonnement/addon - Apple Minimal */}
          <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
            <h4 
              className="font-light text-gray-900 mb-3 text-lg"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
              }}
            >
              {item.name}
            </h4>
            <div className="flex items-center justify-between mb-2">
              <span 
                className="text-sm font-light text-gray-600"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                {item.type === 'plan' 
                  ? (billingInterval === 'year' ? 'Abonnement annuel' : 'Abonnement mensuel')
                  : 'Add-on mensuel'}
              </span>
              <span 
                className="font-light text-xl text-gray-900"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}
              >
                {priceInFCFA.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
            <p 
              className="text-xs font-light text-gray-500"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              ({item.price.toLocaleString('fr-FR')} €)
            </p>
          </div>

          {/* Formulaire de paiement - Apple Minimal */}
          {!paymentData && (
            <div className="space-y-5">
              <div>
                <Label 
                  htmlFor="phone" 
                  className="text-gray-700 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  Numéro de téléphone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="07123456 ou 06123456"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={`mt-2 rounded-lg h-12 text-base border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900 ${
                    !isValidPhone && phoneNumber ? 'border-red-500' : ''
                  }`}
                  style={{
                    fontSize: '16px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                />
                {phoneNumber && (
                  <div className="mt-3">
                    {isValidPhone ? (
                      <div className="flex items-center space-x-2 text-green-600 text-sm font-light">
                        <CheckCircle className="h-4 w-4" />
                        <span
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          {phoneInfo.formatted} - {phoneInfo.operatorName}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-red-600 text-sm font-light">
                        <AlertCircle className="h-4 w-4" />
                        <span
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          Numéro invalide. Utilisez Airtel (07) ou Moov (06)
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Consentement aux conditions d'utilisation */}
              <TermsConsent
                accepted={termsAccepted}
                onAcceptChange={setTermsAccepted}
                error={consentError}
              />

              {error && (
                <Alert variant="destructive" className="border border-red-200 bg-red-50 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription
                    className="font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex space-x-3 pt-2">
                <Button
                  onClick={handlePayment}
                  disabled={!isValidPhone || !termsAccepted || isProcessing}
                  className="flex-1 rounded-lg bg-gray-900 hover:bg-gray-800 text-white shadow-sm font-light h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Initialisation...
                    </>
                  ) : (
                    <>
                      <Smartphone className="h-4 w-4 mr-2" />
                      Payer {priceInFCFA.toLocaleString('fr-FR')} FCFA
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleClose} 
                  disabled={isProcessing}
                  className="rounded-lg border-gray-200 bg-white text-gray-900 hover:bg-gray-50 font-light shadow-sm h-12"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {/* Statut du paiement - Apple Minimal */}
          {paymentData && (
            <div className="space-y-4">
              {status === 'PENDING' && !timeoutReached && (
                <Alert className="border border-gray-200 bg-white rounded-lg shadow-sm">
                  <Smartphone className="h-5 w-5 text-gray-600" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <p 
                        className="font-light text-gray-900"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        Notification envoyée !
                      </p>
                      <p 
                        className="text-sm font-light text-gray-600"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        Une demande de paiement a été envoyée sur votre téléphone{' '}
                        <span className="font-mono">{phoneInfo.formatted}</span>.
                      </p>
                      <p 
                        className="text-sm font-light text-gray-600"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        Veuillez composer le code USSD affiché et confirmer le paiement de{' '}
                        <span className="font-light">{priceInFCFA.toLocaleString('fr-FR')} FCFA</span>.
                      </p>
                      {paymentStartTime && (
                        <p 
                          className="text-xs font-light text-gray-500"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          En attente de confirmation... (délai: 90 secondes)
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {timeoutReached && (
                <Alert variant="destructive" className="border border-orange-200 bg-orange-50 rounded-lg shadow-sm">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <p 
                        className="font-light text-orange-900"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        Délai de paiement expiré
                      </p>
                      <p 
                        className="text-sm font-light text-orange-700"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        Le paiement n'a pas été confirmé dans les 90 secondes. La modale va se fermer automatiquement.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {status === 'SUCCESS' && (
                <Alert className="border border-green-200 bg-green-50 rounded-lg shadow-sm">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <p 
                        className="font-light text-green-900"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        Paiement réussi !
                      </p>
                      <p 
                        className="text-sm font-light text-green-700"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        Votre paiement de {priceInFCFA.toLocaleString('fr-FR')} FCFA a été confirmé.
                      </p>
                      {callback?.transaction_id && (
                        <p 
                          className="text-xs font-light text-green-600 font-mono"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Mono", monospace',
                            fontWeight: 300,
                          }}
                        >
                          Transaction: {callback.transaction_id}
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {status === 'FAILED' && (
                <Alert variant="destructive" className="border border-red-200 bg-red-50 rounded-lg shadow-sm">
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <p 
                        className="font-light text-red-900"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        Paiement échoué
                      </p>
                      <p 
                        className="text-sm font-light text-red-700"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        Le paiement a été refusé. Veuillez vérifier votre solde ou réessayer.
                      </p>
                      <Button 
                        onClick={handleRetry} 
                        size="sm" 
                        className="mt-2 rounded-lg border-gray-200 bg-white text-gray-900 hover:bg-gray-50 font-light shadow-sm"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
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

export default SubscriptionPaymentModal;

