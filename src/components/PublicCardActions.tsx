import React, { useState, memo, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Mail, Phone, QrCode, ShoppingCart, Star, Tag, Eye, Heart, TrendingUp, Clock, MessageCircle, Share2, Download, ExternalLink, Store, Briefcase, Loader2, Radio } from "lucide-react";
// Lazy load des composants modaux pour améliorer les performances
const AppointmentForm = lazy(() => import("./AppointmentForm"));
const ProductDetailsDialog = lazy(() => import("./ProductDetailsDialog"));
import { downloadVCard } from "@/utils/vCardUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { useClickTracking } from '@/hooks/useClickTracking';
import { useLanguage } from '@/hooks/useLanguage';
import { PlanType } from '@/types/subscription';

interface Product {
  id: string;
  name: string;
  price: string;
  image?: string;
  description?: string;
}

interface DigitalProduct {
  id: string;
  title: string;
  description?: string;
  type: string;
  price: number;
  currency: string;
  is_free: boolean;
  thumbnail_url?: string;
}

interface PortfolioSettings {
  is_enabled: boolean;
  title?: string;
  brand_color?: string;
}

interface PublicCardActionsProps {
  cardId: string;
  name?: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  avatar?: string;
  address?: string;
  description?: string;
  socials?: {
    instagram?: string;
    linkedin?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
    whatsapp?: string;
    tiktok?: string;
  };
  products?: Product[];
  digitalProducts?: DigitalProduct[];
  cardUrl?: string;
  portfolioSettings?: PortfolioSettings | null;
  portfolioProjectsCount?: number;
  eventsCount?: number;
  ownerPlanType?: string;
}

const PublicCardActions: React.FC<PublicCardActionsProps> = memo(({
  cardId,
  name,
  title,
  company,
  email,
  phone,
  website,
  avatar,
  address,
  description,
  socials,
  products = [],
  digitalProducts = [],
  cardUrl,
  portfolioSettings = null,
  portfolioProjectsCount = 0,
  eventsCount = 0,
  ownerPlanType
}) => {
  const { t } = useLanguage();
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const trackClick = useClickTracking();

  // Vérifier si le propriétaire de la carte a un plan qui permet les RDV
  const canBookAppointments = ownerPlanType === PlanType.CONNEXIONS || ownerPlanType === PlanType.OPERE;

  const handleOpenProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setProductDialogOpen(true);
    trackClick({ cardId, linkType: 'marketplace', linkLabel: `product:${product.name}` });
  };

  // Fonction pour télécharger la vCard
  const handleDownloadVCard = async () => {
    try {
      await downloadVCard({
        name: name || "",
        title: title || "",
        company: company || "",
        email: email || "",
        phone: phone || "",
        website: website || "",
        avatar: avatar || "",
        address: address || "",
        description: description || "",
        cardUrl: cardUrl || "",
        socials: socials || {}
      });
      trackClick({ cardId, linkType: 'vcard', linkLabel: 'download_vcard' });
    } catch (error) {
      // Error log removed
    }
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.5 }}
    >
      {/* Actions de contact unifiées */}
      <div className={`grid gap-3 mt-6 ${canBookAppointments ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {/* Bouton QR Code */}
        {cardUrl && (
          <motion.button
            onClick={() => { setQrDialogOpen(true); trackClick({ cardId, linkType: 'website', linkLabel: 'qr_open', linkUrl: cardUrl }); }}
            className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-3 hover:shadow-xl transition-all duration-300 flex flex-col items-center gap-1"
            whileHover={{ scale: 1.02, y: -2, backgroundColor: "rgba(255,255,255,0.3)" }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-900">{t('publicCardActions.scanQR')}</span>
          </motion.button>
        )}

        {/* Bouton vCard */}
        <motion.button
          onClick={handleDownloadVCard}
          className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-3 hover:shadow-xl transition-all duration-300 flex flex-col items-center gap-1"
          whileHover={{ scale: 1.02, y: -2, backgroundColor: "rgba(255,255,255,0.3)" }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <Download className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs font-medium text-gray-900">{t('publicCardActions.saveContact')}</span>
        </motion.button>

        {/* Bouton RDV - visible seulement pour Connexions et Opéré */}
        {canBookAppointments && (
          <motion.button
            onClick={() => { setAppointmentDialogOpen(true); trackClick({ cardId, linkType: 'appointment', linkLabel: 'open_appointment' }); }}
            className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-3 hover:shadow-xl transition-all duration-300 flex flex-col items-center gap-1"
            whileHover={{ scale: 1.02, y: -2, backgroundColor: "rgba(255,255,255,0.3)" }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-900">{t('publicCardActions.bookAppointment')}</span>
          </motion.button>
        )}
      </div>

      {(
        (products && products.length > 0) || 
        (digitalProducts && digitalProducts.length > 0) || 
        (portfolioSettings?.is_enabled && portfolioProjectsCount > 0)
      ) && (
        <motion.div 
          className="relative"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">{t('publicCardActions.productsServices')}</h3>
          </div>

          {/* Grille de produits (seulement si produits existent) */}
          {((products && products.length > 0) || (digitalProducts && digitalProducts.length > 0)) && (
            <div className="grid grid-cols-2 gap-3">
            {/* Physical Products */}
            {products && products.map((product) => (
              <motion.div
                key={`physical-${product.id}`}
                className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-lg transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                onClick={() => handleOpenProductDetails(product)}
              >
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-20 object-cover rounded-xl mb-3"
                  />
                ) : (
                  <div className="w-full h-20 bg-gray-100 rounded-xl mb-3 flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-white" />
                  </div>
                )}
                <h4 className="font-semibold text-gray-900 text-sm mb-1">{product.name}</h4>
                <p className="text-xs text-gray-600 mb-3">{product.price}</p>
                <button className="w-full bg-blue-500 text-white text-xs font-medium py-2 rounded-lg hover:bg-blue-600 transition-colors">
                  {t('publicCardActions.viewDetails')}
                </button>
              </motion.div>
            ))}

            {/* Digital Products */}
            {digitalProducts && digitalProducts.map((product) => (
              <motion.div
                key={`digital-${product.id}`}
                className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-lg transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                {product.thumbnail_url ? (
                  <img
                    src={product.thumbnail_url}
                    alt={product.title}
                    className="w-full h-20 object-cover rounded-xl mb-3"
                  />
                ) : (
                  <div className="w-full h-20 bg-gray-100 rounded-xl mb-3 flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-white" />
                  </div>
                )}
                <h4 className="font-semibold text-gray-900 text-sm mb-1">{product.title}</h4>
                <p className="text-xs text-gray-600 mb-3">
                  {product.is_free ? t('publicCardActions.free') : `${product.price} Fcfa`}
                </p>
                <button className="w-full bg-purple-500 text-white text-xs font-medium py-2 rounded-lg hover:bg-purple-600 transition-colors">
                  {t('publicCardActions.buy')}
                </button>
              </motion.div>
            ))}
            </div>
          )}

          {/* Boutons Boutique et Portfolio */}
          <div className="mt-6 space-y-3">
            {/* Bouton Voir la Boutique */}
            {((products && products.length > 0) || (digitalProducts && digitalProducts.length > 0)) && (
              <motion.a
                href={`/card/${cardId}/marketplace`}
                className="w-full flex items-center justify-center gap-3 p-4 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Store className="h-5 w-5" />
                <span className="font-medium">{t('publicCardActions.viewStore')}</span>
              </motion.a>
            )}

            {/* Bouton Mon Univers - Portfolio */}
            {portfolioSettings?.is_enabled && portfolioProjectsCount > 0 && (
              <motion.a
                href={`/card/${cardId}/portfolio`}
                className="w-full flex items-center justify-center gap-3 p-4 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Briefcase className="h-5 w-5" />
                <span className="font-medium">{portfolioSettings.title || t('publicCardActions.myUniverse')}</span>
                <span className="ml-auto px-2 py-0.5 bg-white/20 rounded-full text-xs">
                  {portfolioProjectsCount} {portfolioProjectsCount === 1 ? t('publicCardActions.project') : t('publicCardActions.projects')}
                </span>
              </motion.a>
            )}

            {/* Bouton Événements */}
            {eventsCount && eventsCount > 0 && (
              <motion.a
                href={`/card/${cardId}/events`}
                className="w-full flex items-center justify-center gap-3 p-4 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Calendar className="h-5 w-5" />
                <span className="font-medium">Mes Événements</span>
                <span className="ml-auto px-2 py-0.5 bg-white/20 rounded-full text-xs">
                  {eventsCount}
                </span>
              </motion.a>
            )}
          </div>
        </motion.div>
      )}

      <Dialog open={appointmentDialogOpen} onOpenChange={setAppointmentDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-[520px] bg-white border border-gray-200 shadow-2xl rounded-2xl p-0 mx-0 max-h-[80vh] overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-light text-gray-900 tracking-tight">
                {t('publicCardActions.bookAppointmentTitle')}
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-1 font-light leading-relaxed">
                {t('publicCardActions.bookAppointmentDescription')}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="max-h-[calc(80vh-120px)] overflow-y-auto">
            <Suspense fallback={
              <div className="p-12 text-center">
                <Loader2 className="w-10 h-10 animate-spin mx-auto text-gray-400" />
                <p className="text-gray-500 mt-4 font-light">Chargement du formulaire...</p>
              </div>
            }>
              <AppointmentForm
                cardId={cardId}
                onSuccess={() => setAppointmentDialogOpen(false)}
                onCancel={() => setAppointmentDialogOpen(false)}
              />
            </Suspense>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="w-full max-w-sm bg-white border border-gray-200 shadow-2xl rounded-2xl p-0">
          <div className="p-8">
            <DialogHeader className="text-center mb-8">
              <DialogTitle className="text-2xl font-light text-gray-900 mb-3 tracking-tight">
                {t('publicCardActions.scanQRTitle')}
              </DialogTitle>
              <DialogDescription className="text-gray-600 font-light leading-relaxed">
                {t('publicCardActions.scanQRDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center">
              {cardUrl && (
                <motion.div
                  className="relative"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <div className="w-56 h-56 p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(cardUrl)}`}
                      alt="QR Code"
                      className="w-44 h-44"
                    />
                  </div>
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center shadow-lg">
                    <QrCode className="w-5 h-5 text-white" />
                  </div>
                </motion.div>
              )}
              <p className="text-center text-sm text-gray-600 mt-6 leading-relaxed font-light max-w-xs">
                {t('publicCardActions.accessCard')}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedProduct && (
        <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
          <DialogContent className="sm:max-w-[500px] glass-card border-2 border-white/30 shadow-2xl rounded-2xl p-6 mt-4">
            <DialogHeader>
              <DialogTitle className="sr-only">{t('publicCardActions.productDetails')}</DialogTitle>
              <DialogDescription className="sr-only">{t('publicCardActions.productDetailsDescription')}</DialogDescription>
            </DialogHeader>
            <Suspense fallback={<div className="p-6 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>}>
              <ProductDetailsDialog 
                product={selectedProduct} 
                cardId={cardId}
              />
            </Suspense>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
});

PublicCardActions.displayName = 'PublicCardActions';

export default PublicCardActions;
