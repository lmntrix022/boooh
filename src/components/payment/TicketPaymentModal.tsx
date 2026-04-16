import React, { useState } from 'react';
import { Smartphone, CheckCircle, AlertCircle, Loader2, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MobileMoneyService } from '@/services/mobileMoneyService';
import { usePaymentStatus } from '@/services/paymentCallbackService';
import { useToast } from '@/hooks/use-toast';

interface TicketPaymentModalProps {
  totalAmount: number; // Prix en FCFA
  baseAmount: number;
  transferFee: number;
  quantity: number;
  ticketName: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  onPaymentSuccess: (paymentData: any) => void;
  onPaymentError: (error: string) => void;
  onCancel: () => void;
}

const TicketPaymentModal: React.FC<TicketPaymentModalProps> = ({
  totalAmount,
  baseAmount,
  transferFee,
  quantity,
  ticketName,
  customerInfo,
  onPaymentSuccess,
  onPaymentError,
  onCancel,
}) => {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState(customerInfo.phone || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentStartTime, setPaymentStartTime] = useState<number | null>(null);
  const [timeoutReached, setTimeoutReached] = useState(false);

  // Hook pour surveiller le statut du paiement
  const { status, callback, loading } = usePaymentStatus(paymentData?.bill_id || null);

  // Validation du numéro de téléphone
  const phoneInfo = MobileMoneyService.getPhoneInfo(phoneNumber);
  const isValidPhone = phoneInfo.isValid;

  // Gérer les changements de statut
  React.useEffect(() => {
    if (status === 'SUCCESS' && callback) {
      setIsProcessing(false);
      setPaymentStartTime(null);
      onPaymentSuccess({
        ...paymentData,
        status: 'SUCCESS',
        transaction_id: callback.transaction_id,
        paid_at: callback.paid_at,
        reference: paymentData.reference,
      });
    } else if (status === 'FAILED') {
      setIsProcessing(false);
      setPaymentStartTime(null);
      setError('Le paiement a été refusé. Veuillez vérifier votre solde ou réessayer.');
      onPaymentError('Le paiement a été refusé.');
    }
  }, [status, callback, paymentData, onPaymentSuccess, onPaymentError]);

  // Timeout de 90 secondes
  React.useEffect(() => {
    if (!paymentData || !paymentStartTime || timeoutReached || status === 'SUCCESS' || status === 'FAILED') {
      return;
    }

    if (status === 'PENDING') {
      const timeout = setTimeout(() => {
        setTimeoutReached(true);
        setIsProcessing(false);
        toast({
          title: 'Paiement expiré',
          description: 'Le délai de paiement a expiré. Veuillez réessayer.',
          variant: 'destructive',
        });
        setTimeout(() => {
          setPaymentData(null);
          setPaymentStartTime(null);
          setTimeoutReached(false);
          onCancel();
        }, 2000);
      }, 90000);

      return () => clearTimeout(timeout);
    }
  }, [paymentData, paymentStartTime, timeoutReached, status, toast, onCancel]);

  const handlePayment = async () => {
    if (!isValidPhone) {
      setError('Veuillez saisir un numéro de téléphone valide (Airtel 07 ou Moov 06)');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      if (!customerInfo.name || !customerInfo.email || !phoneNumber) {
        setError('Veuillez remplir tous les champs obligatoires.');
        setIsProcessing(false);
        return;
      }

      const result = await MobileMoneyService.initiateUssdPayment({
        amount: totalAmount,
        payer_name: customerInfo.name,
        payer_email: customerInfo.email,
        payer_msisdn: phoneNumber,
        short_description: `Billet ${ticketName} x${quantity}`,
        external_reference: `TICKET-${Date.now()}`,
      });

      setPaymentData(result);
      setPaymentStartTime(Date.now());
      setTimeoutReached(false);
    } catch (error: any) {
      setError(error.message || 'Erreur lors de l\'initiation du paiement');
      setIsProcessing(false);
      onPaymentError(error.message || 'Erreur de paiement');
    }
  };

  const handleRetry = () => {
    setError(null);
    setPaymentData(null);
    setIsProcessing(false);
    setPaymentStartTime(null);
    setTimeoutReached(false);
  };

  return (
    <div className="space-y-6">
      {/* Informations de la commande - Premium Design */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50/50 border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-100/30 to-transparent rounded-full -mr-16 -mt-16"></div>
        <div className="relative">
          <h4 
            className="font-light text-gray-900 mb-4 text-lg flex items-center gap-2"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
              letterSpacing: '-0.02em',
            }}
          >
            <Ticket className="h-5 w-5 text-gray-600" />
            Résumé de l'achat
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm py-2 border-b border-gray-100">
              <span className="text-gray-500 font-light">Billet</span>
              <span className="font-medium text-gray-900">{ticketName}</span>
            </div>
            <div className="flex justify-between items-center text-sm py-2 border-b border-gray-100">
              <span className="text-gray-500 font-light">Quantité</span>
              <span className="font-medium text-gray-900">x{quantity}</span>
            </div>
            <div className="flex justify-between items-center text-sm py-2 border-b border-gray-100">
              <span className="text-gray-500 font-light">Email</span>
              <span className="font-light text-gray-900 text-xs">{customerInfo.email}</span>
            </div>
            <div className="flex justify-between items-center text-sm py-2 border-b border-gray-100">
              <span className="text-gray-500 font-light">Billets</span>
              <span className="font-medium text-gray-900">{baseAmount.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="flex justify-between items-center text-sm py-2 border-b border-gray-100">
              <span className="text-gray-500 font-light">Frais de transfert (5%)</span>
              <span className="font-medium text-gray-900">{transferFee.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="pt-3 flex justify-between items-center">
              <span 
                className="text-base font-medium text-gray-700"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 500,
                }}
              >
                Total à payer
              </span>
              <span 
                className="text-3xl font-light text-gray-900 tracking-tight"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                  letterSpacing: '-0.03em',
                }}
              >
                {totalAmount.toLocaleString('fr-FR')} <span className="text-lg text-gray-500">FCFA</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire de paiement - Premium Design */}
      {!paymentData && (
        <div className="space-y-5">
          <div className="relative">
            <Label 
              htmlFor="phone" 
              className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 500,
              }}
            >
              <Smartphone className="h-4 w-4 text-gray-600" />
              Numéro de téléphone Mobile Money
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="07 12 34 56 78"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className={`mt-2 rounded-xl h-14 text-base border-2 transition-all duration-200 ${
                !isValidPhone && phoneNumber 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                  : isValidPhone && phoneNumber
                  ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
                  : 'border-gray-200 focus:border-gray-900 focus:ring-gray-900/10'
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
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50/50 border border-green-200 rounded-xl">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <span
                        className="text-sm font-semibold text-green-900 block"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 600,
                        }}
                      >
                        {phoneInfo.formatted}
                      </span>
                      <span
                        className="text-xs text-green-700 block mt-1"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {phoneInfo.operatorName} • Prêt pour le paiement
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-50 to-rose-50/50 border border-red-200 rounded-xl">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <span
                      className="text-sm text-red-800 font-medium"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 500,
                      }}
                    >
                      Numéro invalide. Utilisez Airtel (07) ou Moov (06)
                    </span>
                  </div>
                )}
              </div>
            )}
            {!phoneNumber && (
              <p className="text-xs text-gray-500 mt-3 flex items-center gap-2"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                Paiement sécurisé via USSD Push
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="border-2 border-red-200 bg-gradient-to-r from-red-50 to-rose-50/50 rounded-xl">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertDescription 
                className="font-medium text-red-800"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 500,
                }}
              >
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handlePayment}
              disabled={!isValidPhone || isProcessing}
              className="flex-1 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white shadow-lg shadow-gray-900/20 font-medium h-14 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 disabled:shadow-none"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 500,
              }}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Initialisation...
                </>
              ) : (
                <>
                  <Smartphone className="h-5 w-5 mr-2" />
                  Payer {totalAmount.toLocaleString('fr-FR')} FCFA
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={onCancel} 
              disabled={isProcessing}
              className="rounded-xl border-2 border-gray-200 bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-300 font-medium h-14 px-6 transition-all duration-200"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 500,
              }}
            >
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Statut du paiement - Premium Design */}
      {paymentData && (
        <div className="space-y-4">
          {status === 'PENDING' && !timeoutReached && (
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50/50 to-blue-50/30 border-2 border-blue-200 rounded-2xl p-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full -mr-16 -mt-16 animate-pulse"></div>
              <div className="relative flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Smartphone className="h-6 w-6 text-white animate-pulse" />
                </div>
                <div className="flex-1 space-y-3">
                  <h4 
                    className="font-semibold text-blue-900 text-lg"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 600,
                    }}
                  >
                    📱 Notification envoyée !
                  </h4>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p className="leading-relaxed">
                      Une demande de paiement a été envoyée sur{' '}
                      <span className="font-mono font-semibold bg-blue-100 px-2 py-1 rounded">{phoneInfo.formatted}</span>
                    </p>
                    <div className="p-3 bg-white/50 backdrop-blur-sm rounded-lg border border-blue-200/50">
                      <p className="font-medium text-blue-900 mb-1">Instructions :</p>
                      <p className="text-blue-700">
                        Composez le code USSD affiché sur votre écran et confirmez le paiement de{' '}
                        <span className="font-bold">{totalAmount.toLocaleString('fr-FR')} FCFA</span>
                      </p>
                    </div>
                  </div>
                  {paymentStartTime && (
                    <div className="flex items-center gap-2 text-xs text-blue-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span>En attente de confirmation... (délai: 90 secondes)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {timeoutReached && (
            <div className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50/50 to-orange-50/30 border-2 border-orange-200 rounded-2xl p-6">
              <div className="relative flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 space-y-2">
                  <h4 
                    className="font-semibold text-orange-900 text-lg"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 600,
                    }}
                  >
                    ⏱️ Délai de paiement expiré
                  </h4>
                  <p className="text-sm text-orange-700">
                    Le paiement n'a pas été confirmé dans les 90 secondes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {status === 'SUCCESS' && (
            <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50/50 to-green-50/30 border-2 border-green-200 rounded-2xl p-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 space-y-3">
                  <h4 
                    className="font-semibold text-green-900 text-xl"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 600,
                    }}
                  >
                    ✓ Paiement réussi !
                  </h4>
                  <p className="text-base text-green-800 leading-relaxed">
                    Votre paiement de{' '}
                    <span className="font-bold">{totalAmount.toLocaleString('fr-FR')} FCFA</span>{' '}
                    a été confirmé avec succès.
                  </p>
                  {callback?.transaction_id && (
                    <div className="p-3 bg-white/50 backdrop-blur-sm rounded-lg border border-green-200/50">
                      <p className="text-xs text-green-700 font-medium mb-1">Référence transaction</p>
                      <p className="text-xs text-green-900 font-mono font-semibold">{callback.transaction_id}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {status === 'FAILED' && (
            <div className="relative overflow-hidden bg-gradient-to-br from-red-50 via-rose-50/50 to-red-50/30 border-2 border-red-200 rounded-2xl p-6">
              <div className="relative flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 space-y-3">
                  <h4 
                    className="font-semibold text-red-900 text-lg"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 600,
                    }}
                  >
                    ✗ Paiement échoué
                  </h4>
                  <p className="text-sm text-red-800 leading-relaxed">
                    Le paiement a été refusé. Veuillez vérifier votre solde ou réessayer.
                  </p>
                  <Button 
                    onClick={handleRetry} 
                    size="sm" 
                    className="mt-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-medium shadow-lg shadow-red-500/20"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 500,
                    }}
                  >
                    Réessayer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TicketPaymentModal;
