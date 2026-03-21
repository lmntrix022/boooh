import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, AlertCircle, CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PaymentService } from '@/services/paymentService';
import { useAuth } from '@/contexts/AuthContext';
import { OrdersService } from '@/services/ordersService';

const PaymentCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'error' | 'cancelled'>('loading');
  const [message, setMessage] = useState('');
  const [reference, setReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mobile_money' | 'stripe' | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      if (!user) {
        setStatus('error');
        setMessage('Vous devez être connecté pour vérifier le paiement');
        return;
      }

      try {
        // Récupérer le payment_id depuis l'URL (nouveau format BoohPay)
        // Support des deux formats : payment_id (snake_case) et paymentId (camelCase)
        const paymentId = searchParams.get('payment_id') || searchParams.get('paymentId');
        
        // Vérifier aussi paymentStatus si disponible (format Moneroo)
        const paymentStatusParam = searchParams.get('paymentStatus') || searchParams.get('payment_status');
        
        // Support de l'ancien format pour compatibilité
        const sessionId = searchParams.get('session_id');
        const billId = searchParams.get('bill_id');
        const cancelled = searchParams.get('status') === 'cancelled' || paymentStatusParam === 'cancelled';

        // Gérer l'annulation
        if (cancelled) {
          setStatus('cancelled');
          setMessage('Paiement annulé. Vous pouvez réessayer à tout moment.');
          return;
        }

        // Si on a un payment_id (nouveau format BoohPay)
        if (paymentId) {
          setReference(paymentId);
          
          // Si paymentStatus est déjà fourni dans l'URL (format Moneroo), utiliser directement
          if (paymentStatusParam === 'success') {
            setStatus('success');
            setMessage('Votre paiement a été effectué avec succès !');
            
            // Déterminer la méthode de paiement depuis le metadata ou gateway
            // Pour Moneroo, on peut supposer que c'est mobile_money
            setPaymentMethod('mobile_money');
            
            // Vérifier quand même le statut via BoohPay pour confirmer
            try {
              const payment = await PaymentService.checkPaymentStatus(user.id, paymentId);
              if (payment.gatewayUsed === 'STRIPE') {
                setPaymentMethod('stripe');
              } else if (payment.gatewayUsed === 'MONEROO' || payment.gatewayUsed === 'EBILLING') {
                setPaymentMethod('mobile_money');
              }
              
              // Mettre à jour la commande si nécessaire
              if (payment.metadata?.orderId) {
                // Logique de mise à jour de la commande
              }
            } catch (error) {
              console.error('Erreur lors de la vérification du paiement:', error);
              // On garde le statut success même si la vérification échoue
            }
            
            // Rediriger vers le dashboard après 2 secondes
            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
            return;
          }
          
          // Vérifier le statut via BoohPay
          const payment = await PaymentService.checkPaymentStatus(user.id, paymentId);
          
          // Déterminer la méthode de paiement depuis le gateway
          if (payment.gatewayUsed === 'STRIPE') {
            setPaymentMethod('stripe');
          } else if (payment.gatewayUsed === 'MONEROO' || payment.gatewayUsed === 'EBILLING') {
            setPaymentMethod('mobile_money');
          }

          if (payment.status === 'SUCCEEDED') {
            setStatus('success');
            setMessage('Votre paiement a été effectué avec succès !');
            
            // Mettre à jour la commande si nécessaire
            try {
              // OrdersService devrait être adapté pour utiliser paymentId
              // Pour l'instant, on utilise l'orderId du metadata si disponible
              if (payment.metadata?.orderId) {
                // Logique de mise à jour de la commande
              }
            } catch (updateError) {
              console.error('Erreur lors de la mise à jour de la commande:', updateError);
            }
            
            // Rediriger vers le dashboard après 2 secondes
            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
          } else if (payment.status === 'FAILED') {
            setStatus('failed');
            setMessage('Le paiement a échoué. Veuillez réessayer.');
          } else {
            // PENDING - continuer le polling
            setStatus('loading');
            setMessage('Paiement en attente de confirmation...');
            
            // Polling automatique
            const pollStatus = async () => {
              try {
                const updatedPayment = await PaymentService.checkPaymentStatus(user.id, paymentId);
                
                if (updatedPayment.status === 'SUCCEEDED') {
                  setStatus('success');
                  setMessage('Votre paiement a été effectué avec succès !');
                  setTimeout(() => navigate('/dashboard'), 2000);
                } else if (updatedPayment.status === 'FAILED') {
                  setStatus('failed');
                  setMessage('Le paiement a échoué. Veuillez réessayer.');
                } else {
                  // Continuer le polling après 2 secondes
                  setTimeout(pollStatus, 2000);
                }
              } catch (error) {
                console.error('Erreur lors du polling:', error);
                // Arrêter le polling en cas d'erreur
                setStatus('error');
                setMessage('Erreur lors de la vérification du paiement');
              }
            };
            
            // Démarrer le polling après 2 secondes
            setTimeout(pollStatus, 2000);
          }
          return;
        }

        // Support de l'ancien format (pour compatibilité)
        // TODO: Supprimer ce code après migration complète
        if (sessionId) {
          setPaymentMethod('stripe');
          setReference(sessionId);
          setStatus('error');
          setMessage('Ancien format de callback détecté. Veuillez utiliser payment_id.');
          return;
        }

        if (billId) {
          setPaymentMethod('mobile_money');
          setReference(billId);
          setStatus('error');
          setMessage('Ancien format de callback détecté. Veuillez utiliser payment_id.');
          return;
        }

        // Aucun paramètre valide trouvé
        setStatus('error');
        setMessage('Paramètres de callback manquants');
        setReference('');
      } catch (error) {
        console.error('Erreur lors du traitement du paiement:', error);
        setStatus('error');
        setMessage('Erreur lors du traitement du paiement: ' + (error as Error).message);
      }
    };

    processCallback();
  }, [searchParams, user, navigate]);

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleRetry = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              {status === 'loading' && 'Vérification du paiement...'}
              {status === 'success' && 'Paiement réussi !'}
              {status === 'failed' && 'Paiement échoué'}
              {status === 'cancelled' && 'Paiement annulé'}
              {status === 'error' && 'Erreur'}
            </CardTitle>
            <CardDescription className="text-center">
              {status === 'loading' && 'Veuillez patienter pendant la vérification'}
              {status === 'success' && 'Votre transaction a été confirmée'}
              {status === 'failed' && 'Votre transaction n\'a pas abouti'}
              {status === 'cancelled' && 'Le paiement a été annulé'}
              {status === 'error' && 'Une erreur est survenue'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Icône de statut */}
            <div className="flex justify-center">
              {status === 'loading' && (
                <div className="relative">
                  <Loader2 className="w-20 h-20 text-blue-600 animate-spin" />
                </div>
              )}
              {status === 'success' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                  </div>
                </motion.div>
              )}
              {status === 'failed' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-12 h-12 text-red-600" />
                  </div>
                </motion.div>
              )}
              {status === 'cancelled' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-12 h-12 text-orange-600" />
                  </div>
                </motion.div>
              )}
              {status === 'error' && (
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-12 h-12 text-gray-600" />
                </div>
              )}
            </div>

            {/* Message */}
            <Alert className={
              status === 'success' ? 'border-green-200 bg-green-50' :
              status === 'failed' ? 'border-red-200 bg-red-50' :
              status === 'error' ? 'border-gray-200 bg-gray-50' :
              'border-blue-200 bg-blue-50'
            }>
              <AlertDescription className="text-center">
                {message}
              </AlertDescription>
            </Alert>

            {/* Méthode de paiement */}
            {paymentMethod && (
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                {paymentMethod === 'stripe' ? (
                  <>
                    <CreditCard className="h-4 w-4" />
                    <span>Paiement par carte bancaire (Stripe)</span>
                  </>
                ) : (
                  <>
                    <span>📱</span>
                    <span>Paiement Mobile Money</span>
                  </>
                )}
              </div>
            )}

            {/* Référence */}
            {reference && (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">
                  {paymentMethod === 'stripe' ? 'Session ID' : 'Référence de transaction'}
                </p>
                <p className="text-sm font-mono font-semibold text-gray-900">{reference}</p>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="space-y-3">
              {status === 'success' && (
                <>
                  <div className="text-center text-sm text-gray-600 mb-2">
                    Redirection vers le dashboard...
                  </div>
                  <Button
                    onClick={handleGoToDashboard}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  >
                    Aller au dashboard maintenant
                  </Button>
                </>
              )}

              {status === 'failed' && (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleGoToDashboard}
                    className="flex-1"
                  >
                    Dashboard
                  </Button>
                  <Button
                    onClick={handleRetry}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600"
                  >
                    Réessayer
                  </Button>
                </div>
              )}

              {status === 'cancelled' && (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleGoToDashboard}
                    className="flex-1"
                  >
                    Dashboard
                  </Button>
                  <Button
                    onClick={handleRetry}
                    className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700"
                  >
                    Réessayer le paiement
                  </Button>
                </div>
              )}

              {status === 'error' && (
                <Button
                  variant="outline"
                  onClick={handleGoToDashboard}
                  className="w-full"
                >
                  Retour au dashboard
                </Button>
              )}

              {status === 'loading' && (
                <Button
                  disabled
                  className="w-full"
                >
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vérification en cours...
                </Button>
              )}
            </div>

            {/* Informations supplémentaires */}
            {status === 'success' && (
              <div className="bg-green-50 rounded-lg p-3 text-xs text-green-800">
                <p className="font-semibold mb-1">Que se passe-t-il ensuite ?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Votre commande est maintenant en cours de traitement</li>
                  <li>Vous recevrez une confirmation par email</li>
                  <li>Le vendeur sera notifié de votre paiement</li>
                </ul>
              </div>
            )}

            {status === 'failed' && (
              <div className="bg-red-50 rounded-lg p-3 text-xs text-red-800">
                <p className="font-semibold mb-1">Raisons possibles :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Solde insuffisant</li>
                  <li>Code PIN incorrect</li>
                  <li>Transaction annulée</li>
                  <li>Problème de connexion</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PaymentCallback;
