import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ShoppingCart,
  Download,
  Package,
  Truck,
  Shield,
  Star,
  Share2,
  Heart,
  MessageSquare,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { optimizedQueries } from '@/lib/optimizedQueries';
import { supabase } from '@/integrations/supabase/client';
import CardImageOptimizer from '@/components/utils/CardImageOptimizer';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import CartButton from '@/components/cart/CartButton';
import CartDrawer from '@/components/cart/CartDrawer';
import ProductPaymentModal from '@/components/payment/ProductPaymentModal';
import { MobileMoneyService } from '@/services/mobileMoneyService';
import { ContactAutoCreation } from '@/services/contactAutoCreation';
import { formatAmount } from '@/utils/format';
import { useLanguage } from '@/hooks/useLanguage';

const ProductDetail: React.FC = () => {
  const { id: cardId, productId } = useParams<{ id: string; productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const productFromState = (location.state as any)?.product;

  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { toast } = useToast();
  const { addItem, isInCart, getItemQuantity } = useCart();

  // États pour le modal de commande
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderForm, setOrderForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    message: ''
  });

  // États pour le panier
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  // États pour le paiement direct
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  // Charger les données de la carte pour le branding
  const { data: card, isLoading: isLoadingCard } = useQuery({
    queryKey: ['product-detail-card', cardId],
    queryFn: async () => {
      if (!cardId) throw new Error('ID manquant');
      const cardData = await optimizedQueries.getCardWithRelations(cardId, true);
      
      // Si average_rating ou total_reviews sont null/0, calculer depuis professional_reviews
      if (!cardData?.average_rating || cardData.average_rating === 0 || !cardData?.total_reviews || cardData.total_reviews === 0) {
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('professional_reviews')
          .select('rating')
          .eq('professional_id', cardId)
          .eq('is_approved', true);
        
        if (!reviewsError && reviewsData && reviewsData.length > 0) {
          const ratings = reviewsData.map((r: any) => r.rating);
          const averageRating = ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length;
          const totalReviews = ratings.length;
          
          return {
            ...cardData,
            average_rating: Math.round(averageRating * 10) / 10, // Arrondir à 1 décimale
            total_reviews: totalReviews
          };
        }
      }
      
      return cardData;
    },
    enabled: !!cardId,
  });

  // Charger le produit depuis la base de données si pas dans location.state
  const { data: productFromDb, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product-detail', cardId, productId],
    queryFn: async () => {
      if (!productId || !cardId) return null;
      
      // Requête directe vers la base de données
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('card_id', cardId)
        .eq('is_available', true)
        .single();
      
      if (error) {
        // Si le produit n'est pas trouvé dans products, essayer digital_products
        const { data: digitalData, error: digitalError } = await supabase
          .from('digital_products')
          .select('*')
          .eq('id', productId)
          .eq('card_id', cardId)
          .eq('status', 'published')
          .single();
        
        if (digitalError) throw error; // Utiliser l'erreur originale
        return digitalData;
      }
      
      return data;
    },
    enabled: !!productId && !!cardId && !productFromState,
  });

  // Utiliser le produit depuis state ou depuis la base de données
  const product = productFromState || productFromDb;
  const isLoading = isLoadingCard || (isLoadingProduct && !productFromState);

  // Mapping des polices (même que BusinessCardModern)
  const FONT_GOOGLE_MAP: Record<string, string> = {
    'font-inter': 'Inter',
    'font-poppins': 'Poppins',
    'font-manrope': 'Manrope',
    'font-montserrat': 'Montserrat',
    'font-dm-sans': 'DM Sans',
    'font-nunito': 'Nunito',
    'font-nunito-sans': 'Nunito Sans',
    'font-outfit': 'Outfit',
    'font-plus-jakarta': 'Plus Jakarta Sans',
    'font-rubik': 'Rubik',
    'font-urbanist': 'Urbanist',
    'font-raleway': 'Raleway',
    'font-lato': 'Lato',
    'font-open-sans': 'Open Sans',
    'font-roboto': 'Roboto',
    'font-roboto-condensed': 'Roboto Condensed',
    'font-worksans': 'Work Sans',
    'font-quicksand': 'Quicksand',
    'font-josefin': 'Josefin Sans',
    'font-lexend': 'Lexend',
    'font-mulish': 'Mulish',
  };

  // Récupérer la police exactement comme dans BusinessCardModern (ligne 176)
  const dbFontFamily = (card as any)?.font_family || (card?.custom_fields as any)?.font_family;
  const fontFamily = dbFontFamily && FONT_GOOGLE_MAP[dbFontFamily]
    ? FONT_GOOGLE_MAP[dbFontFamily]
    : 'Poppins';

  const isPhysical = product?.type === 'physical';

  // Charger la police Google Fonts dynamiquement - MUST be called before any early returns
  useEffect(() => {
    if (fontFamily && fontFamily !== 'Poppins') {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      return () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      };
    }
  }, [fontFamily]);

  // Early returns AFTER all hooks
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 animate-spin text-gray-600" />
      </div>
    );
  }

  if (!card || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-3xl font-light mb-6 text-gray-900 tracking-tight" style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            fontWeight: 300,
          }}>{t('productDetail.notFound.title')}</h1>
          <Button
            onClick={() => navigate(`/card/${cardId}/marketplace`)}
            className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg h-12 px-8 font-light tracking-wide transition-all duration-200 shadow-sm"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            {t('productDetail.notFound.backToMarketplace')}
          </Button>
        </div>
      </div>
    );
  }

  // Fonction pour gérer les changements du formulaire
  const handleFormChange = (field: string, value: string) => {
    setOrderForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fonction pour valider le formulaire
  const validateForm = () => {
    return orderForm.firstName.trim() !== '' &&
           orderForm.lastName.trim() !== '' &&
           orderForm.email.trim() !== '' &&
           orderForm.address.trim() !== '';
  };

  // Fonction pour soumettre la commande
  const handleSubmitOrder = async () => {
    if (!validateForm()) {
      toast({
        title: t('productDetail.toasts.formIncomplete.title'),
        description: t('productDetail.toasts.formIncomplete.description'),
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingOrder(true);

    try {
      const clientName = `${orderForm.firstName} ${orderForm.lastName}`;
      const isDigitalProduct = product.type === 'digital';

      let orderError;

      if (isDigitalProduct) {
        // Pour les produits digitaux, utiliser digital_inquiries
        const downloadToken = `token_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const { error } = await (supabase as any)
          .from('digital_inquiries')
          .insert({
            card_id: cardId,
            digital_product_id: productId,
            client_name: clientName,
            client_email: orderForm.email,
            client_phone: orderForm.phone,
            notes: `${orderForm.message}\n\nAdresse: ${orderForm.address}`,
            quantity: quantity,
            status: 'pending',
            download_token: downloadToken,
            expires_at: expiresAt,
          })
          .select()
          .single();

        orderError = error;
      } else {
        // Pour les produits physiques, utiliser product_inquiries
        const { error } = await (supabase as any)
          .from('product_inquiries')
          .insert({
            product_id: productId,
            card_id: cardId,
            client_name: clientName,
            client_email: orderForm.email,
            client_phone: orderForm.phone,
            notes: `${orderForm.message}\n\nAdresse: ${orderForm.address}`,
            quantity: quantity,
            status: 'pending'
          })
          .select()
          .single();

        orderError = error;
      }

      if (orderError) {
        throw orderError;
      }

      // Créer automatiquement le contact
      try {
        if (isDigitalProduct && cardId) {
          await ContactAutoCreation.createContactFromDigitalOrder(cardId, {
            client_name: clientName,
            client_email: orderForm.email,
            client_phone: orderForm.phone,
            notes: `${orderForm.message}\n\nAdresse: ${orderForm.address}`,
            digital_product_id: productId,
            card_id: cardId
          });
        } else if (cardId) {
          await ContactAutoCreation.createContactFromOrder(cardId, {
            client_name: clientName,
            client_email: orderForm.email,
            client_phone: orderForm.phone,
            notes: `${orderForm.message}\n\nAdresse: ${orderForm.address}`,
            product_id: productId,
            card_id: cardId
          });
        }
      } catch (contactError) {
        // Warning log removed
        // Ne pas faire échouer la commande si la création du contact échoue
      }

      // Envoyer un email de notification au vendeur (si disponible)
      if (card.email) {
        // Cette partie nécessiterait une fonction Supabase Edge Function pour l'envoi d'email
        // Log removed
      }

      // Message différent selon le type de produit
      if (isDigitalProduct) {
        toast({
          title: t('productDetail.toasts.orderSaved.title'),
          description: t('productDetail.toasts.orderSaved.descriptionDigital', { firstName: orderForm.firstName }),
          action: (
            <Button
              size="sm"
              onClick={() => navigate('/my-purchases')}
              className="bg-white text-black hover:bg-gray-100"
            >
              {t('productDetail.toasts.orderSaved.seePurchases')}
            </Button>
          ),
        });
      } else {
        toast({
          title: t('productDetail.toasts.orderSaved.title'),
          description: t('productDetail.toasts.orderSaved.descriptionPhysical', { firstName: orderForm.firstName }),
        });
      }

      // Fermer le modal et reset le formulaire
      setOrderModalOpen(false);
      setOrderForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        message: ''
      });

    } catch (error: any) {
      // Error log removed
      toast({
        title: t('productDetail.toasts.error.title'),
        description: error.message || t('productDetail.toasts.error.description'),
        variant: "destructive",
      });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Fonction pour gérer le paiement direct
  const handleDirectPayment = () => {
    // Vérifier que les informations client sont remplies
    if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email || !customerInfo.phone) {
      toast({
        title: t('productDetail.toasts.missingInfo.title'),
        description: t('productDetail.toasts.missingInfo.description'),
        variant: "destructive",
      });
      return;
    }

    // Vérifier que le numéro de téléphone est valide pour Mobile Money
    const phoneInfo = MobileMoneyService.getPhoneInfo(customerInfo.phone);
    if (!phoneInfo.isValid) {
      toast({
        title: t('productDetail.toasts.invalidPhone.title'),
        description: t('productDetail.toasts.invalidPhone.description'),
        variant: "destructive",
      });
      return;
    }

    setShowPaymentModal(true);
  };

  // Fonction pour gérer le succès du paiement direct
  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      const clientName = `${customerInfo.firstName} ${customerInfo.lastName}`;
      const externalReference = paymentData.reference || `PRODUCT-${productId}-${Date.now()}`;
      
      const orderNotes = `Achat direct payé - ${product.name}\n\nPaiement: Mobile Money - ${paymentData.transaction_id || 'N/A'}`;

      if (product.type === 'digital') {
        // Pour les produits digitaux
        const downloadToken = `token_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const { error } = await (supabase as any).from('digital_inquiries').insert({
          card_id: cardId,
          digital_product_id: productId,
          client_name: clientName,
          client_email: customerInfo.email,
          client_phone: customerInfo.phone,
          quantity: quantity,
          notes: `[DIRECT_PAID] ${orderNotes}`,
          status: 'completed',
          payment_status: 'paid',
          payment_method: 'mobile_money',
          payment_operator: 'airtelmoney', // ou 'moovmoney4' selon le numéro
          transaction_id: paymentData.transaction_id,
          paid_at: paymentData.paid_at || new Date().toISOString(),
          external_reference: externalReference,
          download_token: downloadToken,
          expires_at: expiresAt,
        });

        if (error) throw error;

        toast({
          title: t('productDetail.toasts.paymentSuccess.title'),
          description: t('productDetail.toasts.paymentSuccess.descriptionDigital'),
        });

      } else {
        // Pour les produits physiques
        const { error } = await (supabase as any).from('product_inquiries').insert({
          product_id: productId,
          card_id: cardId,
          client_name: clientName,
          client_email: customerInfo.email,
          client_phone: customerInfo.phone,
          notes: orderNotes,
          quantity: quantity,
          status: 'confirmed',
          payment_status: 'paid',
          payment_method: 'mobile_money',
          payment_operator: 'airtelmoney', // ou 'moovmoney4' selon le numéro
          transaction_id: paymentData.transaction_id,
          paid_at: paymentData.paid_at || new Date().toISOString(),
          external_reference: externalReference,
        });

        if (error) throw error;

        toast({
          title: t('productDetail.toasts.paymentSuccess.title'),
          description: t('productDetail.toasts.paymentSuccess.descriptionPhysical'),
        });
      }

      // Créer le contact automatiquement
      try {
        if (product.type === 'digital') {
          await (supabase as any).from('contacts').insert({
            card_id: cardId,
            name: clientName,
            email: customerInfo.email,
            phone: customerInfo.phone,
            notes: orderNotes,
            source: 'direct_purchase_digital',
          });
        } else {
          await (supabase as any).from('contacts').insert({
            card_id: cardId,
            name: clientName,
            email: customerInfo.email,
            phone: customerInfo.phone,
            notes: orderNotes,
            source: 'direct_purchase_physical',
          });
        }
      } catch (contactError) {
        // Warning log removed
      }

    } catch (error: any) {
      // Error log removed
      toast({
        title: t('productDetail.toasts.error.title'),
        description: t('productDetail.toasts.paymentSuccess.errorDescription'),
        variant: "destructive",
      });
    }
  };

  // Fonction pour ajouter au panier
  const handleAddToCart = () => {
    if (!product || !card) return;

    // Extraire l'image correctement (tous les formats possibles)
    let productImage = '';
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      productImage = product.images[0].url;
    } else if ((product as any).image_url) {
      productImage = (product as any).image_url;
    } else if ((product as any).image) {
      productImage = (product as any).image;
    }

    addItem({
      id: `${cardId}-${productId}`,
      productId: productId!,
      cardId: cardId!,
      name: product.name,
      price: product.price,
      type: product.type,
      image: productImage,
      sellerName: card.company || card.name,
      sellerEmail: card.email ?? undefined,
    }, quantity);

    // Ouvrir le drawer du panier
    setCartDrawerOpen(true);
  };

  const handlePurchase = () => {
    // Ouvrir le modal de commande au lieu d'afficher un toast
    setOrderModalOpen(true);
  };

  const handleContact = () => {
    if (card.email) {
      window.location.href = `mailto:${card.email}?subject=Question sur ${product.name}`;
    } else {
      toast({
        title: t('productDetail.toasts.contactUnavailable.title'),
        description: t('productDetail.toasts.contactUnavailable.description'),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden" style={{ fontFamily }}>
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8">
        {/* Bouton retour - Apple minimal style */}
        <Button
          onClick={() => navigate(`/card/${cardId}/marketplace`)}
          variant="ghost"
          className="mb-4 md:mb-8 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg px-4 md:px-6 py-2.5 md:py-3 h-auto font-light text-sm border border-gray-200 transition-all duration-200 shadow-sm"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            fontWeight: 300,
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" strokeWidth={2} />
          <span className="hidden sm:inline">{t('productDetail.back')}</span>
          <span className="sm:hidden">Retour</span>
        </Button>

        {/* Contenu principal - Apple layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Galerie d'images - Apple minimal style - sticky seulement sur desktop */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="bg-white rounded-lg shadow-sm hover:shadow-sm overflow-hidden border border-gray-200 transition-all duration-200">
              <div className="relative aspect-square bg-gray-50">
                {/* Image principale */}
                {(() => {
                  // Gérer les images multiples (nouveau format)
                  const images = product.images && Array.isArray(product.images) && product.images.length > 0
                    ? product.images
                    : product.image
                    ? [{ url: product.image, alt: product.name, order: 0 }]
                    : [];

                  const currentImage = images[currentImageIndex];

                  return images.length > 0 ? (
                    <>
                      <CardImageOptimizer
                        src={currentImage.url}
                        alt={currentImage.alt || product.name}
                        className="w-full h-full object-cover"
                        type="product"
                        priority={true}
                      />

                      {/* Boutons de navigation - Apple style optimisé mobile */}
                      {images.length > 1 && (
                        <>
                          <button
                            onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-all duration-200 border border-gray-200"
                            aria-label="Image précédente"
                          >
                            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-gray-700" strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-all duration-200 border border-gray-200"
                            aria-label="Image suivante"
                          >
                            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-700" strokeWidth={2} />
                          </button>

                          {/* Indicateurs de page - Apple minimal style */}
                          <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 md:gap-2 bg-white rounded-full px-3 md:px-4 py-1.5 md:py-2 border border-gray-200 shadow-sm">
                            {images.map((_: any, index: number) => (
                              <button
                                key={index}
                                onClick={() => setCurrentImageIndex(index)}
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  index === currentImageIndex
                                    ? 'bg-gray-900 w-8'
                                    : 'bg-gray-400 hover:bg-gray-600 w-2'
                                }`}
                                aria-label={`Aller à l'image ${index + 1}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <ShoppingCart className="w-20 h-20 text-gray-300" />
                    </div>
                  );
                })()}

                {/* Badge type - Apple minimalist optimisé mobile */}
                <div className="absolute top-3 md:top-5 left-3 md:left-5">
                  <div className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-white text-gray-900 text-xs font-light shadow-sm border border-gray-200 flex items-center gap-1.5 md:gap-2 hover:bg-gray-50 transition-all duration-200">
                    {isPhysical ? (
                      <>
                        <Package className="w-3 h-3 md:w-3.5 md:h-3.5" strokeWidth={2.5} />
                        <span className="hidden sm:inline">{t('productDetail.badges.physical')}</span>
                        <span className="sm:hidden">Physique</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3 h-3 md:w-3.5 md:h-3.5" strokeWidth={2.5} />
                        <span className="hidden sm:inline">{t('productDetail.badges.digital')}</span>
                        <span className="sm:hidden">Numérique</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions rapides - Apple style optimisé mobile */}
                <div className="absolute top-3 md:top-5 right-3 md:right-5 flex gap-2 md:gap-3">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="rounded-full w-10 h-10 md:w-12 md:h-12 bg-white backdrop-blur-md shadow-sm hover:shadow-sm hover:scale-105 transition-all duration-200 border border-gray-200"
                  >
                    <Heart className="w-4 h-4" strokeWidth={2.5} />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="rounded-full w-10 h-10 md:w-12 md:h-12 bg-white backdrop-blur-md shadow-sm hover:shadow-sm hover:scale-105 transition-all duration-200 border border-gray-200"
                  >
                    <Share2 className="w-4 h-4" strokeWidth={2.5} />
                  </Button>
                </div>
              </div>

              {/* Miniatures des images si plus d'une image */}
              {(() => {
                const images = product.images && Array.isArray(product.images) && product.images.length > 0
                  ? product.images
                  : product.image
                  ? [{ url: product.image, alt: product.name, order: 0 }]
                  : [];

                return images.length > 1 && (
                  <div className="p-3 md:p-5 grid grid-cols-4 gap-2 md:gap-3 bg-white border-t border-gray-200">
                    {images.map((img: any, index: number) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`relative aspect-square rounded-lg overflow-hidden border transition-all duration-200 ${
                          index === currentImageIndex
                            ? 'border-gray-900 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={img.alt || `${product.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Informations produit - Apple design */}
          <div className="space-y-4 md:space-y-6">
            {/* En-tête - Apple typography */}
            <div className="bg-white rounded-lg p-5 md:p-8 shadow-sm border border-gray-200 transition-all duration-200">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-light text-gray-900 mb-4 md:mb-6 tracking-tight leading-tight md:leading-none" style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
              }}>
                {product.name}
              </h1>

              {/* Prix - Apple large pricing */}
              <div className="flex items-baseline gap-2 md:gap-3 mb-6 md:mb-8">
                <p className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 tracking-tighter leading-none" style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                }}>
                  {product.price > 0 ? formatAmount(product.price) : 'Gratuit'}
                </p>
              </div>

              {/* Badges - Apple minimal grayscale */}
              <div className="flex flex-wrap gap-2 md:gap-3 mb-6 md:mb-8">
                <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-gray-100 text-gray-700 rounded-full text-xs font-light border border-gray-200 tracking-wide">
                  <Shield className="w-3 h-3 md:w-3.5 md:h-3.5" strokeWidth={2.5} />
                  <span className="hidden sm:inline">{t('productDetail.badges.securePayment')}</span>
                  <span className="sm:hidden">Sécurisé</span>
                </div>
                {isPhysical && (
                  <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-gray-100 text-gray-700 rounded-full text-xs font-light border border-gray-200 tracking-wide">
                    <Truck className="w-3 h-3 md:w-3.5 md:h-3.5" strokeWidth={2.5} />
                    <span className="hidden sm:inline">{t('productDetail.badges.deliveryAvailable')}</span>
                    <span className="sm:hidden">Livraison</span>
                  </div>
                )}
              </div>

              {/* Quantité - Apple minimal style */}
              {isPhysical && (
                <div className="mb-6 md:mb-8">
                  <label className="block text-sm font-light text-gray-700 mb-3 md:mb-4 tracking-wide" style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}>
                    {t('productDetail.quantity')}
                  </label>
                  <div className="flex items-center gap-3 md:gap-4 bg-gray-50 rounded-lg p-1 border border-gray-200">
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-11 h-11 md:w-12 md:h-12 rounded-lg hover:bg-white transition-all duration-200 border-gray-200"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <span className="text-lg md:text-xl font-light">-</span>
                    </Button>
                    <span className="text-xl md:text-2xl font-light min-w-[48px] md:w-16 text-center text-gray-900" style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                    }}>{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-11 h-11 md:w-12 md:h-12 rounded-lg hover:bg-white transition-all duration-200 border-gray-200"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <span className="text-lg md:text-xl font-light">+</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Boutons d'action - Apple minimal design */}
              <div className="space-y-3 md:space-y-4">
                {/* Bouton Ajouter au panier - Apple minimal black button */}
                <Button
                  onClick={handleAddToCart}
                  className="w-full h-12 md:h-14 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-light text-sm md:text-base tracking-wide transition-all duration-200 shadow-sm"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 mr-2" strokeWidth={2} />
                  <span className="hidden sm:inline">{isInCart(productId!) ? t('productDetail.addMore') : t('productDetail.addToCart')}</span>
                  <span className="sm:hidden">{isInCart(productId!) ? 'Ajouter' : 'Panier'}</span>
                  {isInCart(productId!) && (
                    <span className="ml-2 px-2 md:px-3 py-0.5 md:py-1 bg-white/20 rounded-lg text-xs font-light">
                      ({getItemQuantity(productId!)})
                    </span>
                  )}
                </Button>

                <div className="flex gap-2 md:gap-3">
                  {/* Bouton Commander - Apple minimal outline */}
                  <Button
                    onClick={handlePurchase}
                    variant="outline"
                    className="flex-1 h-11 md:h-12 rounded-lg font-light text-xs md:text-sm tracking-wide hover:bg-gray-50 transition-all duration-200 border-gray-200 shadow-sm"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {isPhysical ? (
                      <>
                        <Package className="w-4 h-4 mr-1 md:mr-2" strokeWidth={2} />
                        <span className="hidden sm:inline">{t('productDetail.buy')}</span>
                        <span className="sm:hidden">Acheter</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-1 md:mr-2" strokeWidth={2} />
                        <span className="hidden sm:inline">{t('productDetail.get')}</span>
                        <span className="sm:hidden">Obtenir</span>
                      </>
                    )}
                  </Button>

                  {/* Bouton Contacter - Apple minimal outline */}
                  <Button
                    variant="outline"
                    className="flex-1 h-11 md:h-12 rounded-lg font-light text-xs md:text-sm tracking-wide hover:bg-gray-50 transition-all duration-200 border-gray-200 shadow-sm"
                    onClick={handleContact}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-1 md:mr-2" strokeWidth={2} />
                    <span className="hidden sm:inline">{t('productDetail.question')}</span>
                    <span className="sm:hidden">Contact</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Formulaire d'informations client pour paiement direct */}
            <div className="bg-white rounded-lg p-5 md:p-8 shadow-sm border border-gray-200 transition-all duration-200">
              <h3 className="text-xl md:text-2xl font-light text-gray-900 mb-5 md:mb-6 tracking-tight" style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
              }}>
                {t('productDetail.paymentInfo.title')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-5 md:mb-6">
                <div>
                  <label className="block text-xs md:text-sm font-light text-gray-700 mb-2" style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}>
                    {t('productDetail.paymentInfo.firstName')}
                  </label>
                  <Input
                    value={customerInfo.firstName}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder={t('productDetail.paymentInfo.firstNamePlaceholder')}
                    className="rounded-lg h-11 md:h-12 text-base border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900"
                    style={{ fontSize: '16px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-light text-gray-700 mb-2" style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}>
                    {t('productDetail.paymentInfo.lastName')} <span className="text-gray-500">*</span>
                  </label>
                  <Input
                    value={customerInfo.lastName}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder={t('productDetail.paymentInfo.lastNamePlaceholder')}
                    className="rounded-lg h-11 md:h-12 text-base border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900"
                    style={{ fontSize: '16px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-light text-gray-700 mb-2" style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}>
                    {t('productDetail.paymentInfo.email')} <span className="text-gray-500">*</span>
                  </label>
                  <Input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder={t('productDetail.paymentInfo.emailPlaceholder')}
                    className="rounded-lg h-11 md:h-12 text-base border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900"
                    style={{ fontSize: '16px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-light text-gray-700 mb-2" style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}>
                    {t('productDetail.paymentInfo.phone')} <span className="text-gray-500">*</span>
                  </label>
                  <Input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder={t('productDetail.paymentInfo.phonePlaceholder')}
                    className="rounded-lg h-11 md:h-12 text-base border-gray-200 focus:ring-1 focus:ring-gray-200 focus:border-gray-900"
                    style={{ fontSize: '16px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                    autoComplete="tel"
                  />
                </div>
              </div>

              {/* Boutons de paiement direct */}
              <div className="space-y-3">
                <Button
                  onClick={handleDirectPayment}
                  className="w-full h-12 md:h-14 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-light text-sm md:text-base tracking-wide transition-all duration-200 shadow-sm"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <CreditCard className="w-4 h-4 md:w-5 md:h-5 mr-2" strokeWidth={2} />
                  <span className="hidden sm:inline">{t('productDetail.paymentInfo.payNow', { amount: formatAmount(product.price) })}</span>
                  <span className="sm:hidden">Payer - {formatAmount(product.price)}</span>
                </Button>
                <p className="text-xs text-gray-500 text-center" style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}>
                  {t('productDetail.paymentInfo.securePayment')}
                </p>
              </div>
            </div>

            {/* Onglets de détails - Apple minimal design */}
            <div className="bg-white rounded-lg p-5 md:p-8 shadow-sm border border-gray-200 transition-all duration-200">
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="w-full grid grid-cols-2 h-11 md:h-14 bg-gray-100 rounded-lg p-1">
                  <TabsTrigger value="description" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 font-light text-xs md:text-sm" style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}>
                    {t('productDetail.tabs.description')}
                  </TabsTrigger>
                  <TabsTrigger value="seller" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 font-light text-xs md:text-sm" style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}>
                    {t('productDetail.tabs.seller')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="description" className="mt-5 md:mt-8">
                  <p className="text-gray-700 text-sm md:text-base leading-relaxed whitespace-pre-line" style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}>
                    {product.description || t('productDetail.noDescription')}
                  </p>
                </TabsContent>

                <TabsContent value="seller" className="mt-5 md:mt-8">
                  <div className="flex items-center gap-4 md:gap-6">
                    {card.avatar_url && (
                      <div className="relative group flex-shrink-0">
                        <img
                          src={card.avatar_url}
                          alt={card.name || ''}
                          className="relative w-16 h-16 md:w-24 md:h-24 rounded-full object-cover border border-gray-200 shadow-sm"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-light text-lg md:text-2xl text-gray-900 tracking-tight truncate" style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}>{card.company || card.name}</h3>
                      <p className="text-gray-600 text-sm md:text-base mb-2 md:mb-3 truncate" style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}>{card.title}</p>
                      {((card.average_rating && card.average_rating > 0) || (card.total_reviews && card.total_reviews > 0)) && (
                        <div className="flex items-center gap-2 md:gap-3 mt-2 md:mt-3 flex-wrap">
                          <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-gray-100 text-gray-700 rounded-lg border border-gray-200 shadow-sm">
                            <Star className="w-3 h-3 md:w-4 md:h-4 fill-gray-600 text-gray-600" strokeWidth={2} />
                            <span className="text-xs md:text-sm font-light" style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}>
                              {card.average_rating && card.average_rating > 0 
                                ? typeof card.average_rating === 'number' 
                                  ? card.average_rating.toFixed(1) 
                                  : parseFloat(String(card.average_rating || '0')).toFixed(1)
                                : '0.0'}
                            </span>
                          </div>
                          <span className="text-xs md:text-sm text-gray-500 font-light" style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}>
                            {t('productDetail.reviewsCount', { count: card.total_reviews || 0 })}
                          </span>
                        </div>
                      )}
                      {card.email && (
                        <div className="mt-3 md:mt-4">
                          <Button
                            variant="outline"
                            onClick={handleContact}
                            className="w-full md:w-auto rounded-lg font-light text-xs md:text-sm tracking-wide hover:bg-gray-50 transition-all duration-200 border-gray-200 shadow-sm"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                              fontWeight: 300,
                            }}
                          >
                            <MessageSquare className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2" strokeWidth={2} />
                            {t('productDetail.question')}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de commande de produit - Apple minimal style */}
      <Dialog open={orderModalOpen} onOpenChange={setOrderModalOpen}>
        <DialogContent className="max-w-[400px] w-[90vw] bg-white border border-gray-200 shadow-sm rounded-lg p-0 overflow-hidden">
          <div className="relative">
            {/* Header compact - Apple minimal */}
            <div className="bg-gray-900 p-4 text-white">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-light text-white" style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                    }}>{t('productDetail.orderModal.title')}</DialogTitle>
                    <p className="text-gray-300 text-xs font-light" style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}>{t('productDetail.orderModal.subtitle')}</p>
                  </div>
                </div>
              </DialogHeader>
            </div>

            {/* Contenu compact */}
            <div className="p-5 md:p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-3">
                {/* Informations du produit compactes */}
                <div className="flex gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="h-4 w-4 text-gray-500" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-light text-gray-900 text-sm truncate" style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}>
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-light text-gray-900" style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}>
                        {product.price > 0 ? formatAmount(product.price) : 'Gratuit'}
                      </span>
                      {isPhysical && (
                        <span className="bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5 rounded-lg border border-gray-200 font-light" style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}>
                          x{quantity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Formulaire compact */}
                <div className="space-y-2">
                  <h4 className="text-sm font-light text-gray-800" style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}>{t('productDetail.orderModal.deliveryInfo')}</h4>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-light text-gray-700 mb-1" style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}>
                        {t('productDetail.orderModal.firstName')}
                      </label>
                      <input
                        type="text"
                        value={orderForm.firstName}
                        onChange={(e) => handleFormChange('firstName', e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-200 focus:border-gray-900 text-xs"
                        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                        placeholder={t('productDetail.orderModal.firstNamePlaceholder')}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-light text-gray-700 mb-1" style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}>
                        {t('productDetail.orderModal.lastName')}
                      </label>
                      <input
                        type="text"
                        value={orderForm.lastName}
                        onChange={(e) => handleFormChange('lastName', e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-200 focus:border-gray-900 text-xs"
                        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                        placeholder={t('productDetail.orderModal.lastNamePlaceholder')}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-light text-gray-700 mb-1" style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}>
                      {t('productDetail.orderModal.email')}
                    </label>
                    <input
                      type="email"
                      value={orderForm.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-200 focus:border-gray-900 text-xs"
                      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                      placeholder={t('productDetail.orderModal.emailPlaceholder')}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-light text-gray-700 mb-1" style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}>
                      {t('productDetail.orderModal.phone')}
                    </label>
                    <input
                      type="tel"
                      value={orderForm.phone}
                      onChange={(e) => handleFormChange('phone', e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-200 focus:border-gray-900 text-xs"
                      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                      placeholder={t('productDetail.orderModal.phonePlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-light text-gray-700 mb-1" style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}>
                      {t('productDetail.orderModal.address')}
                    </label>
                    <textarea
                      value={orderForm.address}
                      onChange={(e) => handleFormChange('address', e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-200 focus:border-gray-900 text-xs resize-none"
                      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                      placeholder={t('productDetail.orderModal.addressPlaceholder')}
                      rows={2}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-light text-gray-700 mb-1" style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}>
                      {t('productDetail.orderModal.message')}
                    </label>
                    <textarea
                      value={orderForm.message}
                      onChange={(e) => handleFormChange('message', e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-200 focus:border-gray-900 text-xs resize-none"
                      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                      placeholder={t('productDetail.orderModal.messagePlaceholder')}
                      rows={2}
                    />
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setOrderModalOpen(false)}
                    className="flex-1 text-xs font-light border-gray-200 shadow-sm"
                    disabled={isSubmittingOrder}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('productDetail.orderModal.cancel')}
                  </Button>
                  <Button
                    onClick={handleSubmitOrder}
                    disabled={isSubmittingOrder}
                    className="flex-1 bg-gray-900 hover:bg-gray-800 text-white text-xs font-light shadow-sm"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {isSubmittingOrder ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        {t('productDetail.orderModal.sending')}
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-3 h-3 mr-1" />
                        {t('productDetail.orderModal.confirm')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de paiement direct */}
      <ProductPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        product={{
          id: productId!,
          name: product.name,
          price: product.price,
          type: product.type,
          image: product.image,
        }}
        customerInfo={customerInfo}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Bouton flottant du panier */}
      <CartButton onClick={() => setCartDrawerOpen(true)} />

      {/* Drawer du panier */}
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
    </div>
  );
};

export default ProductDetail;
