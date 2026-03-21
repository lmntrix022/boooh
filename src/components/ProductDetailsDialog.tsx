import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check, ShoppingCart, Clock, Package, Truck, Shield, Star, Heart, Share2, Minus, Plus, Download, UserPlus, ChevronLeft, ChevronRight, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { ContactAutoCreation } from '@/services/contactAutoCreation';
import { StockService } from '@/services/stockService';
import PaymentOptions from '@/components/payment/PaymentOptions';

interface Product {
  id: string;
  name: string;
  title?: string;
  price?: string | number;
  image?: string;
  images?: Array<{ url: string; alt: string; order: number }>;
  thumbnail_url?: string;
  description?: string;
  is_free?: boolean;
  currency?: string;
}


interface ProductDetailsDialogProps {
  product: Product;
  cardId: string;
}

const ProductDetailsDialog: React.FC<ProductDetailsDialogProps> = ({ product, cardId }) => {


  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPayment, setShowPayment] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<'physical' | 'digital'>('physical');
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Déterminer si c'est un produit digital ou physique
      const isDigitalProduct = product.is_free !== undefined || product.currency !== undefined || product.title !== undefined;
      setOrderType(isDigitalProduct ? 'digital' : 'physical');

      let data, error;

      if (isDigitalProduct) {
        // Pour les produits digitaux, utiliser la table dédiée digital_inquiries
        const downloadToken = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const { data: inquiryData, error: inquiryError } = await supabase
          .from("digital_inquiries")
          .insert({
            card_id: cardId,
            digital_product_id: product.id, // Référence directe vers digital_products
            client_name: name,
            client_email: email,
            client_phone: phone || null,
            quantity: 1,
            notes: `[DIGITAL_PURCHASE] Product: ${product.title || product.name} | Price: ${product.price || 0} ${product.currency || 'XOF'} | ${notes || ''}`,
            status: "pending", // En attente de paiement
            download_token: downloadToken,
            expires_at: expiresAt
          } as any)
          .select();

        data = inquiryData;
        error = inquiryError;
      } else {
        // Pour les produits physiques, utiliser product_inquiries normalement
        const { data: inquiryData, error: inquiryError } = await supabase
          .from("product_inquiries")
          .insert({
            product_id: product.id,
            card_id: cardId,
            quantity,
            client_name: name,
            client_email: email,
            client_phone: phone || null,
            notes: notes || null,
            status: "pending" // En attente de paiement
          } as any)
          .select();

        data = inquiryData;
        error = inquiryError;

        // Décrémenter le stock et enregistrer le mouvement "sale"
        try {
          await StockService.recordProductMovement(cardId, product.id, 'out', quantity, 'marketplace_purchase');
        } catch (stockErr) {
          // Warning log removed
        }
      }
        
      if (error) {
        // Error log removed
        throw error;
      }
      
      // Créer automatiquement le contact
      try {
        if (isDigitalProduct) {
          await ContactAutoCreation.createContactFromDigitalOrder(cardId, {
            client_name: name,
            client_email: email,
            client_phone: phone,
            notes: notes,
            digital_product_id: product.id,
            card_id: cardId
          });
        } else {
          await ContactAutoCreation.createContactFromOrder(cardId, {
            client_name: name,
            client_email: email,
            client_phone: phone,
            notes: notes,
            product_id: product.id,
            card_id: cardId
          });
        }
      } catch (contactError) {
        // Warning log removed
        // Ne pas faire échouer la commande si la création du contact échoue
      }

      // Sauvegarder l'ID de la commande et afficher le paiement
      if (data && data[0]) {
        // Log removed
        // Log removed
        // Log removed

        setCreatedOrderId(data[0].id);
        setShowPayment(true);

        // Log removed
        // Log removed

        toast({
          title: "Commande créée",
          description: "Veuillez procéder au paiement pour finaliser votre commande.",
        });
      } else {
        // Error log removed
        throw new Error("Aucune donnée retournée après la création de la commande");
      }
      
    } catch (error: any) {
      // Error log removed
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer votre demande. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity(Math.max(1, quantity + delta));
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      const isDigitalProduct = product.is_free !== undefined || product.currency !== undefined || product.title !== undefined;
      const tableName = isDigitalProduct ? 'digital_inquiries' : 'product_inquiries';

      // Mettre à jour la commande avec les informations de paiement
      const updateData: any = {
        payment_method: paymentData.payment_method,
        payment_status: paymentData.payment_status || 'pending',
      };

      if (paymentData.transaction_id) {
        updateData.transaction_id = paymentData.transaction_id;
      }

      if (paymentData.paid_at) {
        updateData.paid_at = paymentData.paid_at;
      }

      if (paymentData.payment_method === 'cash_on_delivery') {
        updateData.status = 'pending';
      } else if (paymentData.payment_status === 'paid') {
        updateData.status = 'confirmed';
      }

      if (!createdOrderId) {
        throw new Error("Order ID is required for update");
      }

      await supabase
        .from(tableName)
        // @ts-ignore - Les champs de paiement existent dans la table mais ne sont pas dans les types générés
        .update(updateData)
        .eq('id', createdOrderId);

      setSuccess(true);
      toast({
        title: paymentData.payment_method === 'cash_on_delivery' 
          ? "Commande créée !" 
          : "Paiement réussi !",
        description: paymentData.payment_method === 'cash_on_delivery'
          ? "Votre commande a été enregistrée. Vous paierez à la livraison."
          : "Votre commande a été confirmée.",
      });

      setTimeout(() => {
        setShowPayment(false);
        setSuccess(false);
        setQuantity(1);
        setName("");
        setEmail("");
        setPhone("");
        setNotes("");
        setCreatedOrderId(null);
      }, 3000);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du paiement",
        variant: "destructive",
      });
    }
  };


  const getImageUrl = (path: string | undefined, productType: 'physical' | 'digital' = 'physical') => {
    if (!path) return null;

    // Si c'est déjà une URL complète
    if (path.startsWith('http')) return path;

    // Déterminer le bucket selon le type de produit
    const bucketName = productType === 'digital' ? 'digital-thumbnails' : 'product-images';

    // Générer l'URL publique depuis Supabase Storage
    return supabase
      .storage
      .from(bucketName)
      .getPublicUrl(path)
      .data
      .publicUrl;
  };

  // Déterminer le type de produit basé sur les propriétés
  const isDigitalProduct = product.is_free !== undefined || product.currency !== undefined || product.title !== undefined;
  const productType = isDigitalProduct ? 'digital' : 'physical';

  // Construire le tableau d'images
  const productImages = React.useMemo(() => {
    const images: string[] = [];

    // Si le produit a un tableau d'images
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      // Trier par ordre et convertir en URLs
      const sortedImages = [...product.images].sort((a, b) => a.order - b.order);
      sortedImages.forEach(img => {
        const url = getImageUrl(img.url, productType);
        if (url) images.push(url);
      });
    }

    // Sinon, utiliser l'image principale ou thumbnail
    if (images.length === 0) {
      const fallbackUrl = getImageUrl(product.image || product.thumbnail_url, productType);
      if (fallbackUrl) images.push(fallbackUrl);
    }

    return images;
  }, [product, productType]);

  // Navigation du carousel
  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1));
  };


  return (
    <motion.div
      className="max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-gray-50/30 to-blue-50/30 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-0 relative"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header avec gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-4 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-8 -translate-x-8"></div>
        
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white truncate">
            {product.name || product.title}
          </h2>
          <p className="text-blue-100 text-sm">
            {isDigitalProduct ? 'Produit numérique' : 'Produit physique'}
          </p>
        </div>
      </div>

      {/* Contenu du modal */}
      <div className="p-4 space-y-4">
        {/* Carousel d'images du produit */}
        <div className="relative">
          {productImages.length > 0 ? (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-xl bg-gradient-to-br from-gray-50 to-gray-100">
              <img
                src={productImages[currentImageIndex]}
                alt={`${product.name || product.title} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/400x300?text=Image+non+disponible';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

              {/* Boutons de navigation (affichés seulement s'il y a plusieurs images) */}
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-10"
                    aria-label="Image précédente"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-800" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-10"
                    aria-label="Image suivante"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-800" />
                  </button>

                  {/* Indicateurs de pagination */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {productImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          index === currentImageIndex
                            ? 'w-6 bg-white'
                            : 'w-2 bg-white/60 hover:bg-white/80'
                        }`}
                        aria-label={`Aller à l'image ${index + 1}`}
                      />
                    ))}
                  </div>

                  {/* Compteur d'images */}
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium">
                    {currentImageIndex + 1} / {productImages.length}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="aspect-[4/3] w-full bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl flex items-center justify-center shadow-xl">
              <Package className="h-16 w-16 text-blue-300" />
            </div>
          )}
        </div>

        {/* Informations du produit */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 truncate">
                {product.name || product.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="secondary" className="bg-green-50 text-green-700 whitespace-nowrap">
                  En stock
                </Badge>
                {isDigitalProduct ? (
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700 whitespace-nowrap">
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Téléchargement instantané
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 whitespace-nowrap">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    Livraison 24h
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-bold text-green-600 whitespace-nowrap">
                {product.is_free ? 'Gratuit' : `${product.price} Fcfa`}
              </div>
              <div className="text-sm text-gray-500">
                Prix TTC
              </div>
            </div>
          </div>

          {product.description && (
            <p className="text-gray-600 leading-relaxed text-sm">{product.description}</p>
          )}

          {/* Avantages du produit */}
          <div className="grid grid-cols-3 gap-2">
            {isDigitalProduct ? (
              <>
                <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                  <Download className="h-5 w-5 text-purple-600" />
                  <span className="text-[11px] text-center font-medium text-purple-700">Téléchargement instantané</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span className="text-[11px] text-center font-medium text-blue-700">Accès à vie</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                  <Package className="h-5 w-5 text-green-600" />
                  <span className="text-[11px] text-center font-medium text-green-700">Format numérique</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                  <Truck className="h-5 w-5 text-blue-600" />
                  <span className="text-[11px] text-center font-medium text-blue-700">Livraison gratuite</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span className="text-[11px] text-center font-medium text-green-700">Garantie 2 ans</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                  <Package className="h-5 w-5 text-purple-600" />
                  <span className="text-[11px] text-center font-medium text-purple-700">Retour gratuit</span>
                </div>
              </>
            )}
          </div>

          <Separator className="my-4" />

          {(() => {
            if (showPayment && createdOrderId) {
              const productPrice = typeof product.price === 'number' 
                ? product.price 
                : parseFloat(product.price?.toString() || '0');
              
              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <p className="text-sm text-blue-800 font-medium">
                      Étape 2 : Choisissez votre méthode de paiement
                    </p>
                  </div>
                  <PaymentOptions
                    orderId={createdOrderId}
                    orderType={orderType}
                    amount={productPrice}
                    currency={product.currency || 'EUR'}
                    cardId={cardId}
                    productId={isDigitalProduct ? undefined : product.id}
                    digitalProductId={isDigitalProduct ? product.id : undefined}
                    customerInfo={{
                      name: name,
                      email: email,
                      phone: phone || undefined,
                    }}
                    onPaymentSuccess={(paymentData) => {
                      // Mettre à jour la commande avec les informations de paiement
                      handlePaymentSuccess(paymentData);
                    }}
                    onCancel={() => {
                      setShowPayment(false);
                      toast({
                        title: "Paiement annulé",
                        description: "Votre commande reste en attente de paiement.",
                        variant: "destructive",
                      });
                    }}
                  />
                </div>
              );
            } else if (success) {
              // Log removed
              return (
                <div className="flex flex-col items-center justify-center py-8 px-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                  <div className="bg-green-100 rounded-full p-3 mb-3">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-green-800 mb-2">
                    Paiement effectué avec succès !
                  </h3>
                  <p className="text-center text-green-600">
                    Votre commande a été confirmée. Nous vous contacterons rapidement.
                  </p>
                </div>
              );
            } else {
              // Log removed
              return (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 space-y-3">
                <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                  Quantité
                </Label>
                <div className="flex items-center justify-center gap-4 p-2 bg-white rounded-xl border border-gray-200">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(-1)}
                    className="p-2 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 hover:from-gray-100 hover:to-gray-200 transition-all duration-300 shadow-sm"
                  >
                    <Minus className="h-4 w-4 text-gray-600" />
                  </button>
                  <span className="text-lg font-semibold text-gray-900 min-w-[2ch] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(1)}
                    className="p-2 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 hover:from-gray-100 hover:to-gray-200 transition-all duration-300 shadow-sm"
                  >
                    <Plus className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Nom <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Votre nom"
                    className="border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Téléphone
                  </Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="062423478"
                    className="border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Informations supplémentaires..."
                    className="border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 min-h-[100px]"
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {isDigitalProduct ? 'Télécharger maintenant' : 'Commander maintenant'}
                  </>
                )}
              </Button>
            </form>
              );
            }
          })()}

        </div>
      </div>



    </motion.div>
  );
};

export default ProductDetailsDialog;
