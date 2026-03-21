import React, { useState, useEffect } from 'react';
import { Smartphone, CheckCircle, AlertCircle, Loader2, Globe, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PaymentService } from '@/services/paymentService';
import { PaymentMethod } from '@/services/boohPayService';
import { useAuth } from '@/contexts/AuthContext';

// Taux de change EUR vers FCFA (XOF) - environ 1 EUR = 655 FCFA
const EUR_TO_FCFA_RATE = 655;

// Pays supportés pour Mobile Money
const SUPPORTED_COUNTRIES = [
  { code: 'GA', name: 'Gabon', flag: '🇬🇦', codePrefix: '+241', gateway: 'EBILLING', operators: ['Airtel Money (07)', 'Moov Money (06)'] },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳', codePrefix: '+221', gateway: 'MONEROO', operators: ['Orange Money', 'Free Money', 'Tigo Cash'] },
  { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮', codePrefix: '+225', gateway: 'MONEROO', operators: ['Orange Money', 'MTN Mobile Money', 'Moov Money'] },
  { code: 'CM', name: 'Cameroun', flag: '🇨🇲', codePrefix: '+237', gateway: 'MONEROO', operators: ['Orange Money', 'MTN Mobile Money'] },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', codePrefix: '+254', gateway: 'MONEROO', operators: ['M-Pesa', 'Airtel Money', 'Equitel'] },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', codePrefix: '+234', gateway: 'MONEROO', operators: ['MTN Mobile Money', 'Airtel Money'] },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', codePrefix: '+233', gateway: 'MONEROO', operators: ['MTN Mobile Money', 'Vodafone Cash', 'AirtelTigo Money'] },
  { code: 'UG', name: 'Ouganda', flag: '🇺🇬', codePrefix: '+256', gateway: 'MONEROO', operators: ['MTN Mobile Money', 'Airtel Money'] },
  { code: 'TZ', name: 'Tanzanie', flag: '🇹🇿', codePrefix: '+255', gateway: 'MONEROO', operators: ['M-Pesa', 'Airtel Money', 'Tigo Pesa'] },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼', codePrefix: '+250', gateway: 'MONEROO', operators: ['MTN Mobile Money', 'Airtel Money'] },
  { code: 'ZA', name: 'Afrique du Sud', flag: '🇿🇦', codePrefix: '+27', gateway: 'MONEROO', operators: ['MTN Mobile Money', 'Vodacom M-Pesa'] },
];

interface MobileMoneyPaymentProps {
  totalAmount: number; // Montant en EUR
  orderId: string; // ID de la commande
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  onPaymentSuccess: (paymentData: any) => void;
  onPaymentError: (error: string) => void;
  onCancel: () => void;
}

const MobileMoneyPayment: React.FC<MobileMoneyPaymentProps> = ({
  totalAmount,
  orderId,
  customerInfo,
  onPaymentSuccess,
  onPaymentError,
  onCancel,
}) => {
  const { user } = useAuth();
  // Convertir EUR en FCFA pour l'affichage et le paiement Mobile Money
  const amountInFCFA = Math.round(totalAmount * EUR_TO_FCFA_RATE);
  
  // Initialiser le pays depuis le numéro de téléphone ou utiliser Gabon par défaut
  const detectCountryFromPhone = (phone: string): string => {
    const cleanPhone = phone.replace(/\s|-/g, '');
    for (const country of SUPPORTED_COUNTRIES) {
      if (cleanPhone.startsWith(country.codePrefix) || cleanPhone.startsWith(country.codePrefix.replace('+', ''))) {
        return country.code;
      }
    }
    return 'GA'; // Gabon par défaut
  };

  const [selectedCountry, setSelectedCountry] = useState<string>(() => 
    detectCountryFromPhone(customerInfo.phone || '')
  );
  const [phoneNumber, setPhoneNumber] = useState(() => {
    // Extraire le numéro local si le numéro contient déjà l'indicatif
    const phone = customerInfo.phone || '';
    const country = SUPPORTED_COUNTRIES.find(c => phone.includes(c.codePrefix));
    if (country && phone.includes(country.codePrefix)) {
      return phone.replace(country.codePrefix, '').replace(/\s/g, '');
    }
    return phone.replace(/^\+?\d{1,4}/, '').replace(/\s/g, '');
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const selectedCountryData = SUPPORTED_COUNTRIES.find(c => c.code === selectedCountry) || SUPPORTED_COUNTRIES[0];

  // Formater le numéro complet avec l'indicatif
  const formattedPhone = `${selectedCountryData.codePrefix}${phoneNumber.replace(/\s/g, '')}`;
  
  // Validation du numéro selon le pays
  const validatePhone = (): { isValid: boolean; error?: string } => {
    const cleanPhone = phoneNumber.replace(/\s/g, '');
    
    if (!cleanPhone) {
      return { isValid: false, error: 'Veuillez saisir un numéro de téléphone' };
    }

    // Validation spécifique pour le Gabon (9 chiffres: 074398524 ou 8 chiffres: 07439985)
    if (selectedCountry === 'GA') {
      // Format 9 chiffres: 074398524 (commence par 07 ou 06)
      // Format 8 chiffres: 07439985 (commence par 07 ou 06)
      const isAirtel = /^07\d{6,7}$/.test(cleanPhone);
      const isMoov = /^06\d{6,7}$/.test(cleanPhone);
      if (!isAirtel && !isMoov) {
        return { 
          isValid: false, 
          error: 'Numéro invalide. Utilisez 07XXXXXXX ou 06XXXXXXX (8 ou 9 chiffres pour Airtel/Moov)' 
        };
      }
    } else {
      // Pour les autres pays, validation générique (au moins 6 chiffres)
      if (cleanPhone.length < 6 || !/^\d+$/.test(cleanPhone)) {
        return { 
          isValid: false, 
          error: `Numéro invalide. Saisissez un numéro ${selectedCountryData.name} valide` 
        };
      }
    }

    return { isValid: true };
  };

  const phoneValidation = validatePhone();

  // Polling du statut du paiement via BoohPay
  useEffect(() => {
    if (!paymentId || !user) return;

    const checkPaymentStatus = async () => {
      try {
        setCheckingStatus(true);
        const payment = await PaymentService.checkPaymentStatus(user.id, paymentId);
        
        if (payment.status === 'SUCCEEDED') {
          setCheckingStatus(false);
          onPaymentSuccess({
            paymentId: payment.paymentId,
            status: 'SUCCESS',
            transaction_id: payment.providerReference,
            paid_at: payment.updatedAt,
            gatewayUsed: payment.gatewayUsed,
          });
        } else if (payment.status === 'FAILED') {
          setCheckingStatus(false);
          onPaymentError('Le paiement a été refusé. Veuillez réessayer.');
        } else {
          // PENDING - continuer le polling après 2 secondes
          setTimeout(checkPaymentStatus, 2000);
        }
      } catch (error: any) {
        console.error('Erreur lors de la vérification du statut:', error);
        // Continuer le polling même en cas d'erreur
        setTimeout(checkPaymentStatus, 3000);
      } finally {
        setCheckingStatus(false);
      }
    };

    // Démarrer le polling après 3 secondes
    const timeoutId = setTimeout(checkPaymentStatus, 3);
    
    return () => clearTimeout(timeoutId);
  }, [paymentId, user, onPaymentSuccess, onPaymentError]);

  const handlePayment = async () => {
    const validation = validatePhone();
    if (!validation.isValid) {
      setError(validation.error || 'Numéro de téléphone invalide');
      return;
    }

    if (!user) {
      setError('Vous devez être connecté pour effectuer un paiement');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Créer le paiement via BoohPay
      const result = await PaymentService.createMobileMoneyPayment(
        user.id,
        orderId,
        amountInFCFA,
        'XOF',
        {
          email: customerInfo.email,
          phone: formattedPhone,
          name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        },
        `${window.location.origin}/payment-callback`
      );

      // Stocker le paymentId pour le polling
      setPaymentId(result.paymentId);
      setPaymentData({
        paymentId: result.paymentId,
        gatewayUsed: result.gatewayUsed,
      });

      // Si c'est une redirection, rediriger vers l'URL
      if (result.checkout?.type === 'REDIRECT' && result.checkout.url) {
        const returnUrl = result.checkout.url.replace('{payment_id}', result.paymentId);
        window.location.href = returnUrl;
      } else {
        setIsProcessing(false);
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'initiation du paiement:', error);
      setError(error.message || 'Erreur lors de l\'initiation du paiement');
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setPaymentData(null);
    setIsProcessing(false);
    setPaymentId(null);
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">Paiement Mobile Money</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Paiement sécurisé via USSD Push</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informations de la commande */}
          <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 p-5 rounded-2xl border border-gray-100">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/10 to-emerald-500/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2"></div>
                Résumé de la commande
              </h4>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Client</span>
                  <span className="text-sm font-medium text-gray-900">{customerInfo.firstName} {customerInfo.lastName}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Email</span>
                  <span className="text-sm font-medium text-gray-900">{customerInfo.email}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-base font-semibold text-gray-700">Total à payer</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {amountInFCFA.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Formulaire de paiement */}
          {!paymentData && (
            <div className="space-y-5">
              {/* Sélecteur de pays */}
              <div>
                <Label htmlFor="country" className="text-base font-medium text-gray-700 mb-2.5 block">
                  <Globe className="h-4 w-4 inline mr-2" />
                  Pays
                </Label>
                <select
                  id="country"
                  value={selectedCountry}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value);
                    setPhoneNumber('');
                    setError(null);
                  }}
                  className="w-full h-12 px-4 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                >
                  {SUPPORTED_COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.name} ({country.codePrefix})
                    </option>
                  ))}
                </select>
                
                {/* Informations sur les opérateurs */}
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-blue-900 mb-1">Opérateurs supportés :</p>
                      <p className="text-xs text-blue-700">
                        {selectedCountryData.operators.join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Champ numéro de téléphone */}
              <div>
                <Label htmlFor="phone" className="text-base font-medium text-gray-700 mb-2.5 block">
                  Numéro de téléphone Mobile Money
                </Label>
                <div className="relative">
                  <div className="flex items-center space-x-2">
                    <div className="flex-shrink-0 px-3 py-3 bg-gray-100 border border-gray-300 rounded-l-lg text-sm font-medium text-gray-700">
                      {selectedCountryData.codePrefix}
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder={selectedCountry === 'GA' ? '07 12 34 56 78' : 'Numéro local'}
                      value={phoneNumber}
                      onChange={(e) => {
                        // N'autoriser que les chiffres
                        const value = e.target.value.replace(/\D/g, '');
                        setPhoneNumber(value);
                        setError(null);
                      }}
                      className={`flex-1 h-12 text-base rounded-l-none ${
                        phoneNumber && !phoneValidation.isValid
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                          : phoneNumber && phoneValidation.isValid
                          ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                          : ''
                      }`}
                    />
                  </div>
                  
                  {phoneNumber && (
                    <div className="mt-3">
                      {phoneValidation.isValid ? (
                        <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="p-1.5 bg-green-100 rounded-full">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-900">{formattedPhone}</p>
                            <p className="text-xs text-green-700">
                              {selectedCountryData.name} • {selectedCountryData.operators[0]}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                          <p className="text-sm text-red-800">
                            {phoneValidation.error}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="border-red-300 bg-red-50">
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex space-x-3 pt-2">
                <Button
                  onClick={handlePayment}
                  disabled={!phoneValidation.isValid || isProcessing}
                  className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Initialisation en cours...
                    </>
                  ) : (
                    <>
                      <Smartphone className="h-5 w-5 mr-2" />
                      Payer {amountInFCFA.toLocaleString('fr-FR')} FCFA
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onCancel}
                  className="h-12 px-6 border-gray-300 hover:bg-gray-50"
                  disabled={isProcessing}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {/* Statut du paiement */}
          {paymentData && (
            <div className="space-y-4">
              {(checkingStatus || !paymentData.status || paymentData.status === 'PENDING') && (
                <div className="relative overflow-hidden p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border-2 border-blue-200">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-400/20 rounded-full -mr-12 -mt-12"></div>
                  <div className="relative">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Smartphone className="h-6 w-6 text-blue-600 animate-pulse" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 text-lg mb-2">Notification envoyée !</h4>
                        <div className="space-y-2 text-sm text-blue-800">
                          <p>
                            Une demande de paiement a été envoyée sur votre téléphone{' '}
                            <span className="font-mono font-semibold bg-blue-100 px-2 py-0.5 rounded">{formattedPhone}</span>
                          </p>
                          <p className="pt-2 border-t border-blue-200">
                            <span className="font-semibold">Instructions :</span> Composer le code USSD affiché sur votre écran et confirmer le paiement de{' '}
                            <span className="font-bold text-blue-900">{amountInFCFA.toLocaleString('fr-FR')} FCFA</span>.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {paymentData.status === 'SUCCESS' && (
                <div className="relative overflow-hidden p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-2xl border-2 border-green-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/20 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-green-100 rounded-xl">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-green-900 text-xl mb-2">✓ Paiement réussi !</h4>
                        <p className="text-base text-green-800 mb-3">
                          Votre paiement de <span className="font-bold">{amountInFCFA.toLocaleString('fr-FR')} FCFA</span> a été confirmé avec succès.
                        </p>
                        {paymentData.transaction_id && (
                          <div className="mt-3 p-2 bg-green-100 rounded-lg">
                            <p className="text-xs text-green-700 font-medium">Référence transaction</p>
                            <p className="text-xs text-green-900 font-mono mt-1">{paymentData.transaction_id}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {paymentData.status === 'FAILED' && (
                <div className="relative overflow-hidden p-6 bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 rounded-2xl border-2 border-red-300">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-red-400/20 rounded-full -mr-12 -mt-12"></div>
                  <div className="relative">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-red-100 rounded-xl">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-red-900 text-lg mb-2">Paiement échoué</h4>
                        <p className="text-sm text-red-800 mb-4">
                          Le paiement a été refusé. Veuillez vérifier votre solde ou réessayer.
                        </p>
                        <Button 
                          onClick={handleRetry} 
                          className="bg-red-600 hover:bg-red-700 text-white"
                          size="sm"
                        >
                          Réessayer
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileMoneyPayment;
