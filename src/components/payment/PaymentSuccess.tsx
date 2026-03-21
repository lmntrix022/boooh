import React, { useState, useEffect } from 'react';
import { CheckCircle, Download, Mail, Phone, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import ConfettiAnimation from './ConfettiAnimation';

interface PaymentSuccessProps {
  paymentData: {
    bill_id?: string;
    reference?: string;
    amount?: number;
    transaction_id?: string;
    payment_intent_id?: string;
    paid_at?: string;
    status?: string;
    payment_status?: string;
    payment_method?: string;
  };
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  orderItems: Array<{
    name: string;
    quantity: number;
    price: number;
    type: 'physical' | 'digital';
  }>;
  onContinueShopping: () => void;
  onViewOrder: () => void;
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({
  paymentData,
  customerInfo,
  orderItems,
  onContinueShopping,
  onViewOrder,
}) => {
  const [showConfetti, setShowConfetti] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60); // 1 minute en secondes

  useEffect(() => {
    // Afficher le contenu après la fin de l'animation de confettis (3 secondes)
    const contentTimer = setTimeout(() => {
      setShowContent(true);
    }, 3500);

    // Timer de 1 minute
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(contentTimer);
      clearInterval(interval);
    };
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const digitalProducts = orderItems.filter(item => item.type === 'digital');
  const physicalProducts = orderItems.filter(item => item.type === 'physical');

  return (
    <>
      {/* Animation de confettis */}
      <AnimatePresence>
        {showConfetti && (
          <ConfettiAnimation
            duration={3000}
            onComplete={() => setShowConfetti(false)}
          />
        )}
      </AnimatePresence>

      {/* Contenu principal avec animation d'entrée */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="max-w-2xl mx-auto space-y-6"
          >
            {/* Compte à rebours en haut */}
            {timeRemaining > 0 && (
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200 shadow-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Cette page s'affiche pendant {formatTime(timeRemaining)}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Succès principal */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-green-900 mb-2">
                  Paiement Confirmé !
                </h1>
                <p className="text-green-700 mb-4">
                  Merci {customerInfo.firstName} ! Votre commande a été payée avec succès.
                </p>
                <div className="flex justify-center space-x-2">
                  <Badge className="bg-green-600 text-white">
                    {paymentData.amount ? paymentData.amount.toLocaleString('fr-FR') : '0'} FCFA
                  </Badge>
                  <Badge variant="outline" className="border-green-600 text-green-600">
                    {paymentData.payment_method === 'stripe' ? 'Carte Bancaire' : 
                     paymentData.payment_method === 'cash_on_delivery' ? 'Paiement à la livraison' : 
                     'Mobile Money'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Détails de la transaction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="h-5 w-5 text-blue-600" />
                  <span>Détails de la transaction</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Référence:</span>
                    <p className="font-mono font-medium">{paymentData.reference || paymentData.bill_id || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Transaction ID:</span>
                    <p className="font-mono font-medium">
                      {paymentData.transaction_id || paymentData.payment_intent_id || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Date de paiement:</span>
                    <p className="font-medium">{formatDate(paymentData.paid_at)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Méthode:</span>
                    <p className="font-medium">
                      {paymentData.payment_method === 'stripe' ? 'Carte Bancaire (Stripe)' : 
                       paymentData.payment_method === 'cash_on_delivery' ? 'Paiement à la livraison' : 
                       'Mobile Money'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Produits commandés */}
            <Card>
              <CardHeader>
                <CardTitle>Produits commandés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {digitalProducts.length > 0 && (
                    <div>
                      <h4 className="font-medium text-green-700 mb-2 flex items-center">
                        <Download className="h-4 w-4 mr-2" />
                        Produits numériques
                      </h4>
                      <div className="space-y-2">
                        {digitalProducts.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-green-50 rounded">
                            <span className="font-medium">{item.name}</span>
                            <div className="text-right">
                              <div className="text-sm text-gray-600">
                                {item.quantity}x {(item.price * item.quantity).toLocaleString('fr-FR')} FCFA
                              </div>
                              <Badge className="bg-green-600 text-white text-xs">
                                Téléchargeable
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {physicalProducts.length > 0 && (
                    <div>
                      <h4 className="font-medium text-blue-700 mb-2 flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Produits physiques
                      </h4>
                      <div className="space-y-2">
                        {physicalProducts.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                            <span className="font-medium">{item.name}</span>
                            <div className="text-right">
                              <div className="text-sm text-gray-600">
                                {item.quantity}x {(item.price * item.quantity).toLocaleString('fr-FR')} FCFA
                              </div>
                              <Badge className="bg-blue-600 text-white text-xs">
                                Livraison
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Prochaines étapes */}
            <Card>
              <CardHeader>
                <CardTitle>Prochaines étapes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {digitalProducts.length > 0 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2 flex items-center">
                      <Download className="h-4 w-4 mr-2" />
                      Produits numériques
                    </h4>
                    <p className="text-sm text-green-700">
                      Vous recevrez un email avec les liens de téléchargement dans les prochaines minutes.
                      Les liens sont valables 7 jours.
                    </p>
                  </div>
                )}

                {physicalProducts.length > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Produits physiques
                    </h4>
                    <p className="text-sm text-blue-700">
                      Le vendeur vous contactera dans les 24h pour organiser la livraison.
                      Vous recevrez un email de confirmation avec les détails.
                    </p>
                  </div>
                )}

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Confirmation par email
                  </h4>
                  <p className="text-sm text-gray-700">
                    Un récapitulatif de votre commande a été envoyé à {customerInfo.email}.
                    {paymentData.reference && (
                      <> Conservez cette référence: <span className="font-mono font-medium">{paymentData.reference}</span></>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex space-x-3">
              <Button onClick={onViewOrder} className="flex-1">
                Voir ma commande
              </Button>
              <Button variant="outline" onClick={onContinueShopping} className="flex-1">
                Continuer mes achats
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PaymentSuccess;

