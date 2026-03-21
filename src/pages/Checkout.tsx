import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ShoppingCart,
  User,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Truck,
  Package,
  Download,
  Loader2,
  CheckCircle,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCart, CartItem } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CardImageOptimizer from '@/components/utils/CardImageOptimizer';
import { ContactAutoCreation } from '@/services/contactAutoCreation';
import { StockService } from '@/services/stockService';
import PaymentMethodSelector, { PaymentMethod } from '@/components/payment/PaymentMethodSelector';
import PaymentOptions from '@/components/payment/PaymentOptions';
import { sendNewOrderEmails } from '@/services/orderEmailService';
import MobileMoneyPayment from '@/components/payment/MobileMoneyPayment';
import PaymentSuccess from '@/components/payment/PaymentSuccess';
import { SecureDownloadServiceV2 } from '@/services/secureDownloadServiceV2';
import { calculatePaymentWithFeesAndTax, type PaymentBreakdown } from '@/services/paymentCalculator';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, totalAmount, clearCart } = useCart();
  const { toast } = useToast();

  // États pour les frais et la TVA
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown | null>(null);
  const [isLoadingBreakdown, setIsLoadingBreakdown] = useState(false);

  // Calculer les frais et la TVA dès que les items changent
  useEffect(() => {
    const calculateBreakdown = async () => {
      if (items.length === 0) {
        setPaymentBreakdown(null);
        return;
      }

      setIsLoadingBreakdown(true);
      try {
        // IMPORTANT: Récupérer le user_id du VENDEUR (propriétaire de la carte)
        // Les frais sont calculés selon le type de compte du VENDEUR, pas de l'acheteur
        // FREE = 3% + 0,75€, BUSINESS/MAGIC = 1% + 0,75€
        const firstCardId = items[0]?.cardId;
        if (!firstCardId) {
          setPaymentBreakdown(null);
          return;
        }

        // Récupérer le user_id du propriétaire de la carte (le VENDEUR)
        const { data: card } = await supabase
          .from('business_cards')
          .select('user_id')
          .eq('id', firstCardId)
          .maybeSingle();

        if (!card?.user_id) {
          setPaymentBreakdown(null);
          return;
        }

        // Calculer les frais selon le type de compte du VENDEUR
        console.log(`🔍 Calcul des frais pour le vendeur (cardId: ${firstCardId}, userId: ${card.user_id})`);
        const breakdown = await calculatePaymentWithFeesAndTax(totalAmount, card.user_id);
        console.log(`💰 Breakdown calculé:`, {
          planType: breakdown.planType,
          feesPercentage: breakdown.fees.percentage,
          feesFixedFee: breakdown.fees.fixedFee,
          totalFeesFCFA: breakdown.fees.totalFeesFCFA,
          total: breakdown.total
        });
        setPaymentBreakdown(breakdown);
      } catch (error) {
        console.error('Erreur lors du calcul des frais et TVA:', error);
        setPaymentBreakdown(null);
      } finally {
        setIsLoadingBreakdown(false);
      }
    };

    calculateBreakdown();
  }, [items, totalAmount]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  // États du processus de paiement
  const [currentStep, setCurrentStep] = useState<'form' | 'payment' | 'success'>('form');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [createdOrderIds, setCreatedOrderIds] = useState<Record<string, string[]>>({}); // cardId -> array of orderIds (one per product)
  const [orderIdMap, setOrderIdMap] = useState<Record<string, string>>({}); // item.id (cart item id) -> orderId
  const [orderType, setOrderType] = useState<'physical' | 'digital'>('physical');

  // Formulaire de livraison
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    notes: '',
  });

  // Grouper les articles par vendeur (cardId)
  const itemsByCard = items.reduce((acc, item) => {
    if (!acc[item.cardId]) {
      acc[item.cardId] = [];
    }
    acc[item.cardId].push(item);
    return acc;
  }, {} as Record<string, CartItem[]>);

  const handleInputChange = (field: string, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const required = ['firstName', 'lastName', 'email', 'phone', 'address', 'city'];
    for (const field of required) {
      if (!customerInfo[field as keyof typeof customerInfo].trim()) {
        toast({
          title: 'Formulaire incomplet',
          description: `Le champ ${field} est obligatoire.`,
          variant: 'destructive',
        });
        return false;
      }
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.email)) {
      toast({
        title: 'Email invalide',
        description: 'Veuillez saisir une adresse email valide.',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  // Nouvelle fonction pour gérer la soumission du formulaire
  const handleFormSubmit = async () => {
    if (!validateForm()) return;
    if (items.length === 0) return;
    
    setIsSubmitting(true);
    
    try {
      // Créer une commande pour CHAQUE produit du panier (pas seulement le premier)
      const clientName = `${customerInfo.firstName} ${customerInfo.lastName}`;
      const deliveryAddress = `${customerInfo.address}, ${customerInfo.city}${customerInfo.postalCode ? ' ' + customerInfo.postalCode : ''}`;
      
      // Stocker les IDs de commande par cardId (un array par cardId)
      const orderIdsByCard: Record<string, string[]> = {};
      // Stocker un mapping direct item.id -> orderId pour faciliter la mise à jour
      const itemToOrderId: Record<string, string> = {};
      
      // Déterminer le type de commande (si mixte, on utilisera 'physical' par défaut)
      const hasDigitalProducts = items.some(item => item.type === 'digital');
      const hasPhysicalProducts = items.some(item => item.type === 'physical');
      setOrderType(hasDigitalProducts && !hasPhysicalProducts ? 'digital' : 'physical');
      
      // Créer une commande pour chaque produit du panier
      for (const item of items) {
        if (!orderIdsByCard[item.cardId]) {
          orderIdsByCard[item.cardId] = [];
        }
        
        if (item.type === 'digital') {
          // Créer une inquiry digitale pour ce produit
          const { data: inquiry, error } = await supabase
            .from('digital_inquiries')
            .insert({
              card_id: item.cardId,
              digital_product_id: item.productId,
              client_name: clientName,
              client_email: customerInfo.email,
              client_phone: customerInfo.phone || null,
              quantity: item.quantity,
              notes: `[ECOMMERCE_PENDING] Commande en attente de paiement\n\nProduit: ${item.name}\nQuantité: ${item.quantity}\nPrix unitaire: ${item.price} FCFA\nTotal: ${(item.price * item.quantity)} FCFA\nAdresse: ${deliveryAddress}`,
              status: 'pending',
              payment_status: 'pending',
            })
            .select()
            .single();
          
          if (error) {
            console.error('Error creating digital inquiry:', error);
            throw error;
          }
          if (inquiry) {
            orderIdsByCard[item.cardId].push(inquiry.id);
            itemToOrderId[item.id] = inquiry.id; // Mapping direct
          }
        } else {
          // Créer une inquiry physique pour ce produit
          const { data: inquiry, error } = await supabase
            .from('product_inquiries')
            .insert({
              card_id: item.cardId,
              product_id: item.productId,
              client_name: clientName,
              client_email: customerInfo.email,
              client_phone: customerInfo.phone || null,
              quantity: item.quantity,
              notes: `[ECOMMERCE_PENDING] Commande en attente de paiement\n\nProduit: ${item.name}\nQuantité: ${item.quantity}\nPrix unitaire: ${item.price} FCFA\nTotal: ${(item.price * item.quantity)} FCFA\nAdresse: ${deliveryAddress}`,
              status: 'pending',
              payment_status: 'pending',
            })
            .select()
            .single();
          
          if (error) {
            console.error('Error creating product inquiry:', error);
            throw error;
          }
          if (inquiry) {
            orderIdsByCard[item.cardId].push(inquiry.id);
            itemToOrderId[item.id] = inquiry.id; // Mapping direct
          }
        }
      }
      
      setCreatedOrderIds(orderIdsByCard);
      setOrderIdMap(itemToOrderId);
      
      // Passer à l'étape de sélection du paiement
      setCurrentStep('payment');
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la commande',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonction pour gérer la sélection de méthode de paiement
  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
  };


  // Fonction pour gérer le succès du paiement
  const handlePaymentSuccess = async (paymentResult: any) => {
    // Sauvegarder les items AVANT de modifier l'état
    const savedOrderItems = items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: typeof item.price === 'number' ? item.price : parseFloat(item.price?.toString() || '0'),
      type: item.type,
    }));

    setPaymentData({ ...paymentResult, orderItems: savedOrderItems });
    setPaymentSuccess(true);
    setCurrentStep('success');

    try {
      // Mettre à jour TOUTES les commandes avec les informations de paiement
      const paymentMethod = paymentResult.payment_method || 'mobile_money';
      const externalReference = paymentResult.reference || `ECOMMERCE-${Date.now()}`;
      const clientName = `${customerInfo.firstName} ${customerInfo.lastName}`;
      
      // Parcourir TOUS les produits du panier et mettre à jour leur commande correspondante
      for (const item of items) {
        const orderId = orderIdMap[item.id];
        if (!orderId) {
          console.warn(`No orderId found for item ${item.id}`);
          continue;
        }
          
        if (item.type === 'digital') {
          // 🔑 Générer un token DRM sécurisé pour le téléchargement
          const tokenResult = await SecureDownloadServiceV2.generateSecureToken(
            orderId,
            24, // Expire dans 24 heures
            3   // Maximum 3 téléchargements
          );

          if (!tokenResult.success) {
            console.error('Token generation failed:', tokenResult.errorMessage);
            // Continuer quand même avec la mise à jour
          }

          // Mettre à jour l'inquiry digitale avec les informations de paiement et le token
          await supabase
            .from('digital_inquiries')
            .update({
              status: paymentResult.status === 'paid' || paymentResult.payment_status === 'paid' ? 'completed' : 'pending',
              payment_status: paymentResult.payment_status || 'paid',
              payment_method: paymentMethod,
              transaction_id: paymentResult.transaction_id || paymentResult.payment_intent_id,
              paid_at: paymentResult.paid_at || new Date().toISOString(),
              external_reference: externalReference,
              ...(tokenResult.success && {
                download_token: tokenResult.downloadToken,
                expires_at: tokenResult.expiresAt,
                max_downloads: tokenResult.maxDownloads,
              }),
            })
            .eq('id', orderId);
          
          // Envoyer les emails
          const emailResult = await sendNewOrderEmails(orderId, 'digital').catch((emailError) => {
            console.error('Email sending failed for digital product:', emailError);
            return null;
          });
          if (emailResult) {
            console.log('Email result for digital product:', emailResult);
          }
          
          // Créer le contact pour ce produit digital
          try {
            await ContactAutoCreation.createContactFromDigitalOrder(item.cardId, {
              client_name: clientName,
              client_email: customerInfo.email,
              client_phone: customerInfo.phone,
              digital_product_id: item.productId,
              card_id: item.cardId,
            });
          } catch (contactError) {
            console.warn('Contact creation failed for digital product:', contactError);
          }
        } else {
          // Mettre à jour l'inquiry physique pour ce produit
          await supabase
            .from('product_inquiries')
            .update({
              status: paymentResult.status === 'paid' || paymentResult.payment_status === 'paid' ? 'confirmed' : 'pending',
              payment_status: paymentResult.payment_status || 'paid',
              payment_method: paymentMethod,
              transaction_id: paymentResult.transaction_id || paymentResult.payment_intent_id,
              paid_at: paymentResult.paid_at || new Date().toISOString(),
              external_reference: externalReference,
            })
            .eq('id', orderId);
          
          // Envoyer les emails
          await sendNewOrderEmails(orderId, 'physical').catch(() => {});
          
          // Mettre à jour le stock pour ce produit physique
          try {
            await StockService.recordProductMovement(
              item.cardId,
              item.productId,
              'out', // Type 'out' pour une vente
              item.quantity,
              `Vente via e-commerce - Commande ${orderId} - ${item.name} (x${item.quantity})`,
              orderId
            );
          } catch (stockError: any) {
            console.warn(`Stock update failed for product ${item.productId}:`, stockError?.message || stockError);
          }
          
          // Créer le contact pour ce produit physique
          try {
            await ContactAutoCreation.createContactFromOrder(item.cardId, {
              client_name: clientName,
              client_email: customerInfo.email,
              client_phone: customerInfo.phone,
              product_id: item.productId,
              card_id: item.cardId,
            });
          } catch (contactError) {
            console.warn('Contact creation failed for physical product:', contactError);
          }
        }
      }

      // Vider le panier
      clearCart();

      toast({
        title: 'Paiement confirmé !',
        description: 'Votre commande a été payée avec succès.',
      });
    } catch (error: any) {
      console.error('Error updating orders:', error);
      toast({
        title: 'Erreur',
        description: 'Paiement réussi mais erreur lors de la mise à jour de la commande.',
        variant: 'destructive',
      });
    }
  };

  // Fonction pour gérer les erreurs de paiement
  const handlePaymentError = (error: string) => {
    toast({
      title: 'Erreur de paiement',
      description: error,
      variant: 'destructive',
    });
  };


  // Fonction pour créer les inquiries avec les informations de paiement
  const createInquiriesWithPayment = async (paymentResult: any) => {
    const externalReference = paymentResult.reference || `ECOMMERCE-${Date.now()}`;
    const clientName = `${customerInfo.firstName} ${customerInfo.lastName}`;
    const deliveryAddress = `${customerInfo.address}, ${customerInfo.city}${customerInfo.postalCode ? ' ' + customerInfo.postalCode : ''}`;

    // Parcourir TOUS les produits du panier
    for (const item of items) {
        const clientEmail = customerInfo.email;
        const clientPhone = customerInfo.phone;

        // Construire les notes avec les informations de livraison et de paiement
        const orderNotes = `${customerInfo.notes || 'Commande via e-commerce'}\n\nProduit: ${item.name}\nQuantité: ${item.quantity}\nPrix unitaire: ${item.price} FCFA\nTotal: ${(item.price * item.quantity)} FCFA\nAdresse: ${deliveryAddress}\n\nPaiement: Mobile Money - ${paymentResult.transaction_id || 'N/A'}`;

        const isDigitalProduct = item.type === 'digital';

        if (isDigitalProduct) {
          // Pour les produits digitaux
          const downloadToken = `token_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

          const { data: insertedInquiry, error } = await supabase.from('digital_inquiries').insert({
            card_id: item.cardId,
            digital_product_id: item.productId,
            client_name: clientName,
            client_email: clientEmail,
            client_phone: clientPhone || null,
            quantity: item.quantity,
            notes: `[ECOMMERCE_PAID] ${orderNotes}`,
            status: 'completed',
            payment_status: 'paid',
            payment_method: 'mobile_money',
            payment_operator: 'airtelmoney', // ou 'moovmoney4' selon le numéro
            transaction_id: paymentResult.transaction_id,
            paid_at: paymentResult.paid_at || new Date().toISOString(),
            external_reference: externalReference,
            download_token: downloadToken,
            expires_at: expiresAt,
          }).select().single();

          if (error) throw error;

          // ✅ NOUVEAU: Envoyer les notifications email
          if (insertedInquiry) {
            sendNewOrderEmails(insertedInquiry.id, 'digital').catch((emailError) => {
              console.error("Order email notification failed:", emailError);
              // Don't fail the order if email fails
            });
          }

        } else {
          // Pour les produits physiques
          const { data: insertedInquiry, error } = await supabase.from('product_inquiries').insert({
            product_id: item.productId,
            card_id: item.cardId,
            client_name: clientName,
            client_email: clientEmail,
            client_phone: clientPhone || null,
            notes: orderNotes,
            quantity: item.quantity,
            status: 'confirmed', // Confirmé car payé
            payment_status: 'paid',
            payment_method: 'mobile_money',
            payment_operator: 'airtelmoney', // ou 'moovmoney4' selon le numéro
            transaction_id: paymentResult.transaction_id,
            paid_at: paymentResult.paid_at || new Date().toISOString(),
            external_reference: externalReference,
          }).select().single();

          if (error) throw error;

          // ✅ NOUVEAU: Envoyer les notifications email
          if (insertedInquiry) {
            sendNewOrderEmails(insertedInquiry.id, 'physical').catch((emailError) => {
              console.error("Order email notification failed:", emailError);
              // Don't fail the order if email fails
            });
          }

          // Mettre à jour le stock
          try {
            await StockService.recordProductMovement(
              item.cardId,
              item.productId,
              'out',
              item.quantity,
              `Vente via e-commerce - ${item.name} (x${item.quantity})`,
              insertedInquiry.id
            );
          } catch (stockError: any) {
            console.warn('Stock update failed:', stockError?.message || stockError);
          }
        }

        // Créer le contact automatiquement
        try {
          if (isDigitalProduct) {
            await ContactAutoCreation.createContactFromDigitalOrder(item.cardId, {
              client_name: clientName,
              client_email: clientEmail,
              client_phone: clientPhone,
              notes: orderNotes,
              digital_product_id: item.productId,
              card_id: item.cardId,
            });
          } else {
            await ContactAutoCreation.createContactFromOrder(item.cardId, {
              client_name: clientName,
              client_email: clientEmail,
              client_phone: clientPhone,
              notes: orderNotes,
              product_id: item.productId,
              card_id: item.cardId,
            });
          }
        } catch (contactError) {
          console.warn('Contact creation failed:', contactError);
        }
      }
  };

  // Fonction pour revenir au formulaire
  const handleBackToForm = () => {
    setCurrentStep('form');
    setSelectedPaymentMethod(null);
    setPaymentData(null);
    setPaymentSuccess(false);
  };

  // Fonction pour continuer les achats
  const handleContinueShopping = () => {
    navigate('/marketplace');
  };

  // Fonction pour voir la commande
  const handleViewOrder = () => {
    // Naviguer vers la page des achats
    navigate('/my-purchases');
  };

  // Page de succès - À vérifier AVANT le panier vide
  if (currentStep === 'success' && paymentData) {
    // Utiliser les items sauvegardés dans paymentData ou ceux du panier
    const orderItems = paymentData.orderItems || (items.length > 0 ? items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: typeof item.price === 'number' ? item.price : parseFloat(item.price?.toString() || '0'),
      type: item.type,
    })) : []);

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 py-8 px-6">
        <PaymentSuccess
          paymentData={paymentData}
          customerInfo={customerInfo}
          orderItems={orderItems}
          onContinueShopping={handleContinueShopping}
          onViewOrder={handleViewOrder}
        />
      </div>
    );
  }

  // Si le panier est vide, afficher la page de panier vide
  if (items.length === 0) {
    // Essayer de récupérer le cardId depuis différentes sources
    const stateData = (location.state as any) || {};
    const stateCardId = stateData.cardId;
    
    // Essayer de récupérer depuis itemsByCard dans le state
    let cardIdFromState = null;
    if (stateData.itemsByCard && Object.keys(stateData.itemsByCard).length > 0) {
      cardIdFromState = Object.keys(stateData.itemsByCard)[0];
    }
    
    // Priorité : stateCardId > cardId depuis itemsByCard
    const cardId = stateCardId || cardIdFromState;

    const handleBackToShop = () => {
      if (cardId) {
        // Retourner vers la marketplace de la carte
        navigate(`/card/${cardId}/marketplace`, { replace: true });
      } else {
        // Sinon retourner vers la marketplace générale
        navigate('/marketplace', { replace: true });
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-lg w-full"
        >
          {/* Card avec design moderne */}
          <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 md:p-12 overflow-hidden">
            {/* Éléments décoratifs */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-full -ml-24 -mb-24"></div>
            
            <div className="relative z-10">
              {/* Icône avec animation */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="relative mb-8"
              >
                <div className="w-32 h-32 mx-auto relative">
                  {/* Cercle avec gradient animé */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-full animate-pulse"></div>
                  {/* Icône */}
                  <div className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center border-2 border-gray-200 shadow-lg">
                    <ShoppingCart className="w-16 h-16 text-gray-400" strokeWidth={1.5} />
                  </div>
                </div>
              </motion.div>

              {/* Titre */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-4xl font-bold text-gray-900 mb-4 tracking-tight"
              >
                Panier vide
              </motion.h2>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-gray-600 mb-10 text-lg leading-relaxed"
              >
                {cardId 
                  ? "Votre panier est vide. Retournez à la boutique pour ajouter des produits."
                  : "Ajoutez des produits avant de passer commande."
                }
              </motion.p>

              {/* Bouton avec design amélioré */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <Button 
                  onClick={handleBackToShop}
                  className="group relative h-14 px-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full font-semibold text-base transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105"
                >
                  <span className="relative z-10 flex items-center space-x-2">
                    {cardId ? (
                      <>
                        <ArrowLeft className="w-5 h-5" />
                        <span>Retourner à la boutique</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        <span>Découvrir la marketplace</span>
                      </>
                    )}
                  </span>
                  {/* Effet de brillance au hover */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full"></div>
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Page de paiement
  if (currentStep === 'payment') {
    // Récupérer le premier cardId et orderId pour PaymentOptions
    const firstCardId = Object.keys(itemsByCard)[0] || Object.keys(createdOrderIds)[0];
    const firstOrderIds = firstCardId ? createdOrderIds[firstCardId] : null;
    const firstOrderId = firstOrderIds && firstOrderIds.length > 0 ? firstOrderIds[0] : null;
    const firstItem = firstCardId ? itemsByCard[firstCardId]?.[0] : items[0];
    
    // Si aucune commande n'a été créée, retourner au formulaire
    if (!firstOrderId || !firstOrderIds || firstOrderIds.length === 0) {
      setCurrentStep('form');
      return null;
    }

    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-4xl mx-auto px-6">
          <Button
            variant="ghost"
            onClick={handleBackToForm}
            className="mb-8 text-gray-900 hover:text-black hover:bg-gray-50 rounded-full px-6 py-3 h-auto font-semibold text-sm backdrop-blur-xl border border-gray-200 transition-all duration-500 hover:border-gray-300 hover:-translate-x-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" strokeWidth={2.5} />
            Retour
          </Button>

          <PaymentOptions
            orderId={firstOrderId}
            orderType={orderType}
            amount={paymentBreakdown 
              ? paymentBreakdown.total / 655 // Convertir FCFA en EUR pour Stripe avec frais
              : totalAmount / 655 // Fallback si pas de breakdown
            }
            currency="EUR" // PaymentOptions gère la conversion interne
            cardId={firstCardId}
            productId={firstItem?.type !== 'digital' ? firstItem?.productId : undefined}
            digitalProductId={firstItem?.type === 'digital' ? firstItem?.productId : undefined}
            customerInfo={{
              name: `${customerInfo.firstName} ${customerInfo.lastName}`,
              email: customerInfo.email,
              phone: customerInfo.phone || undefined,
            }}
            onPaymentSuccess={handlePaymentSuccess}
            onCancel={handleBackToForm}
            paymentBreakdown={paymentBreakdown} // Passer le breakdown pour affichage
          />
        </div>
      </div>
    );
  }

  // Formulaire principal - Design Premium
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Premium */}
        <div className="mb-12">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-8 text-gray-900 hover:text-black hover:bg-gray-50 rounded-full px-6 py-3 h-auto font-semibold text-sm backdrop-blur-xl border border-gray-200 transition-all duration-500 hover:border-gray-300 hover:-translate-x-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" strokeWidth={2.5} />
            Retour
          </Button>
          
          <div className="text-center max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                Finaliser la commande
              </h1>
              <p className="text-gray-600 text-lg font-light">
                Dernière étape avant de recevoir vos produits
              </p>
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Formulaire - Style Premium */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-7 space-y-6"
          >
            {/* Informations personnelles */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 shadow-lg border border-gray-100/50 transition-all duration-500 hover:shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                  <User className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Informations personnelles
                </h2>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 tracking-wide">
                      Prénom *
                    </label>
                    <Input
                      value={customerInfo.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Votre prénom"
                      className="h-12 rounded-xl border-gray-200 focus:border-black focus:ring-black transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 tracking-wide">
                      Nom *
                    </label>
                    <Input
                      value={customerInfo.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Votre nom"
                      className="h-12 rounded-xl border-gray-200 focus:border-black focus:ring-black transition-all duration-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 tracking-wide">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={2} />
                    <Input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="votre@email.com"
                      className="h-12 rounded-xl border-gray-200 focus:border-black focus:ring-black pl-12 transition-all duration-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 tracking-wide">
                    Téléphone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={2} />
                    <Input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="07123456 ou 06123456"
                      className="h-12 rounded-xl border-gray-200 focus:border-black focus:ring-black pl-12 transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Adresse de livraison */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 shadow-lg border border-gray-100/50 transition-all duration-500 hover:shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Adresse de livraison
                </h2>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 tracking-wide">
                    Adresse complète *
                  </label>
                  <Input
                    value={customerInfo.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Rue, numéro, quartier"
                    className="h-12 rounded-xl border-gray-200 focus:border-black focus:ring-black transition-all duration-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 tracking-wide">
                      Ville *
                    </label>
                    <Input
                      value={customerInfo.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Libreville"
                      className="h-12 rounded-xl border-gray-200 focus:border-black focus:ring-black transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 tracking-wide">
                      Code postal
                    </label>
                    <Input
                      value={customerInfo.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      placeholder="00000"
                      className="h-12 rounded-xl border-gray-200 focus:border-black focus:ring-black transition-all duration-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 tracking-wide">
                    Instructions de livraison
                  </label>
                  <Textarea
                    value={customerInfo.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Informations complémentaires pour la livraison..."
                    rows={3}
                    className="rounded-xl border-gray-200 focus:border-black focus:ring-black resize-none transition-all duration-300"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Résumé de la commande - Sticky Premium */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-5"
          >
            <div className="sticky top-8 space-y-6">
              {/* Résumé */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 shadow-lg border border-gray-100/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Votre commande
                  </h2>
                </div>

                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 transition-all duration-300"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <CardImageOptimizer
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-300" strokeWidth={2} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-600">Qté: {item.quantity}</span>
                          <span className="text-xs text-gray-400">•</span>
                          {item.type === 'digital' ? (
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <Download className="w-3 h-3" strokeWidth={2} />
                              Digital
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-blue-600">
                              <Truck className="w-3 h-3" strokeWidth={2} />
                              Physique
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">
                          {(item.price * item.quantity).toLocaleString()} <span className="text-sm font-normal text-gray-600">FCFA</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-6 space-y-4">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Sous-total</span>
                    <span className="font-semibold">{totalAmount.toLocaleString()} FCFA</span>
                  </div>
                  
                  {isLoadingBreakdown ? (
                    <div className="flex justify-center py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    </div>
                  ) : paymentBreakdown ? (
                    <>
                      {/* TVA */}
                      <div className="flex justify-between items-center text-gray-600">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🏛️</span>
                          <span className="text-sm">TVA ({paymentBreakdown.vat?.rate || 18}%)</span>
                        </div>
                        <span className="font-semibold">
                          {Math.round(paymentBreakdown.vat?.amountFCFA || 0).toLocaleString()} FCFA
                        </span>
                      </div>

                      {/* Section transparence des frais */}
                      <div className="bg-gradient-to-br from-violet-50/50 to-purple-50/50 rounded-xl p-4 border border-violet-100/50 space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center">
                            <span className="text-xs">💳</span>
                          </div>
                          <span className="text-xs font-semibold text-violet-800">Détail des frais de service</span>
                        </div>
                        
                        {/* Frais BoohPay */}
                        <div className="flex justify-between items-center text-gray-600">
                          <div className="flex items-center gap-2">
                            <img 
                              src="/logo/BoohPay.png" 
                              alt="BoohPay" 
                              className="w-4 h-4 object-contain"
                            />
                            <span className="text-xs">
                              Frais BoohPay ({paymentBreakdown.boohpayFees?.description || '1.5% + 1€'})
                            </span>
                          </div>
                          <span className="text-xs font-medium">
                            {Math.round(paymentBreakdown.boohpayFees?.totalFCFA || 0).toLocaleString()} FCFA
                          </span>
                        </div>
                        
                        {/* Commission Bööh */}
                        <div className="flex justify-between items-center text-gray-600">
                          <div className="flex items-center gap-2">
                            <img 
                              src="/booh.svg" 
                              alt="Bööh" 
                              className="w-4 h-4 object-contain"
                            />
                            <span className="text-xs">
                              Commission Bööh ({paymentBreakdown.boohCommission?.description || `${paymentBreakdown.fees.percentage}% + ${paymentBreakdown.fees.fixedFee}€`})
                            </span>
                          </div>
                          <span className="text-xs font-medium">
                            {Math.round(paymentBreakdown.boohCommission?.totalFCFA || paymentBreakdown.fees.totalFeesFCFA).toLocaleString()} FCFA
                          </span>
                        </div>

                        {/* Ligne de séparation */}
                        <div className="border-t border-violet-200/50 pt-2 flex justify-between items-center">
                          <span className="text-xs font-semibold text-gray-700">Total frais de service</span>
                          <span className="text-xs font-bold text-gray-900">
                            {Math.round(paymentBreakdown.fees.totalFeesFCFA).toLocaleString()} FCFA
                          </span>
                        </div>
                      </div>

                      {/* Note de transparence */}
                      <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                        <Lock className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <p>
                          <span className="font-medium">Transparence :</span> La TVA (18%) est reversée à l'État. Les frais de service couvrent l'infrastructure de paiement sécurisée (BoohPay) et la commission de la plateforme (Bööh).
                        </p>
                      </div>
                    </>
                  ) : null}
                  
                  <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-3xl font-bold text-gray-900 tracking-tight">
                      {paymentBreakdown 
                        ? Math.round(paymentBreakdown.total).toLocaleString()
                        : totalAmount.toLocaleString()
                      } <span className="text-lg font-normal text-gray-600">FCFA</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Badge sécurité */}
              <div className="bg-green-50/50 border border-green-200/50 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-5 h-5 text-green-700" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="font-semibold text-green-900 text-sm">Paiement 100% sécurisé</p>
                    <p className="text-xs text-green-700 mt-0.5">Vos données sont protégées</p>
                  </div>
                </div>
              </div>

              {/* Boutons de validation Premium */}
              <div className="space-y-3">
                {/* Bouton paiement normal */}
                <Button
                  onClick={handleFormSubmit}
                  disabled={isSubmitting}
                  className="w-full h-16 bg-black hover:bg-gray-800 text-white rounded-2xl font-bold text-lg tracking-wide transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-2 animate-spin" strokeWidth={2.5} />
                      Traitement en cours...
                    </>
                  ) : (
                    <>
                      Continuer vers le paiement
                      <ChevronRight className="w-6 h-6 ml-2" strokeWidth={2.5} />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;