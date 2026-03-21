import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useTransform, useMotionValue } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PortfolioService } from '@/services/portfolioService';
import { logger } from '@/utils/logger';
import { 
  X, Package, Sparkles, Info, MapPin, Building2, 
  ArrowRight, Phone, Star, Clock,
  Heart, Shield, Users, CheckCircle, MessageCircle
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

interface BusinessDetailSheetProps {
  businessId: string;
  onClose: () => void;
}

// ═══════════════════════════════════════════════════════════
// ANIMATIONS
// ═══════════════════════════════════════════════════════════

const SPRING = { type: "spring" as const, stiffness: 400, damping: 30 };

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: SPRING }
};

// ═══════════════════════════════════════════════════════════
// SUB COMPONENTS
// ═══════════════════════════════════════════════════════════

const VerifiedBadge = () => (
  <motion.div
    className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-600 text-white text-[10px] font-light rounded-full"
    style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
      fontWeight: 300,
    }}
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ delay: 0.2, type: "spring" }}
  >
    <Shield className="w-2.5 h-2.5" />
    <span>Vérifié</span>
  </motion.div>
);

const StatItem = ({ value, label }: { value: string | number; label: string }) => (
  <div className="text-center">
    <div className="text-lg font-light text-gray-900 tracking-tight"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        fontWeight: 300,
      }}
    >{value}</div>
    <div className="text-[10px] text-gray-500 font-light uppercase tracking-wider"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
        fontWeight: 300,
      }}
    >{label}</div>
  </div>
);

const TabButton = ({ active, icon: Icon, label, onClick }: { 
  active: boolean; icon: React.ElementType; label: string; onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex-1 relative py-3 text-[13px] font-light transition-all",
      active ? "text-gray-900" : "text-gray-400"
    )}
    style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
      fontWeight: 300,
    }}
  >
    {active && (
      <motion.div
        className="absolute bottom-0 inset-x-4 h-0.5 bg-black rounded-full"
        layoutId="activeTab"
        transition={SPRING}
      />
    )}
    <span className="flex items-center justify-center gap-1.5">
      <Icon className="w-4 h-4" strokeWidth={active ? 2 : 1.5} />
      <span>{label}</span>
    </span>
  </button>
);

const LoadingSkeleton = () => (
  <div className="p-6 space-y-6">
    <div className="flex items-center gap-4">
      <motion.div className="w-16 h-16 rounded-2xl bg-gray-100" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
      <div className="flex-1 space-y-2">
        <motion.div className="h-5 w-32 bg-gray-100 rounded-lg" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity, delay: 0.1 }} />
        <motion.div className="h-3 w-20 bg-gray-100 rounded" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity, delay: 0.2 }} />
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export const BusinessDetailSheet: React.FC<BusinessDetailSheetProps> = ({
  businessId,
  onClose
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'about' | 'products' | 'services'>('about');
  const [isLiked, setIsLiked] = useState(false);
  const [initialTabSet, setInitialTabSet] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollY = useMotionValue(0);
  const headerScale = useTransform(scrollY, [0, 100], [1, 0.98]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => scrollY.set(container.scrollTop);
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [scrollY]);

  // --- Data Fetching ---
  const { data: business, isLoading: loadingBusiness } = useQuery<any>({
    queryKey: ['business', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_cards')
        .select('*')
        .eq('id', businessId)
        .single();
      if (error) throw error;
      if (!data) return null;
      
      const businessData = data as any;
      
      try {
        const { data: statsData } = await supabase
          .rpc('get_professional_average_rating', { professional_uuid: businessId } as any) as { data: any[] | null; error: any };
        
        if (statsData && Array.isArray(statsData) && statsData.length > 0 && statsData[0]) {
          const stats = statsData[0] as any;
          if (stats.total_reviews > 0) {
            return { ...businessData, average_rating: parseFloat(String(stats.average_rating)), total_reviews: parseInt(String(stats.total_reviews)) };
          }
        }
      } catch (e) {}
      
      const { data: reviewsData } = await supabase
        .from('professional_reviews')
        .select('rating')
        .eq('professional_id', businessId)
        .eq('is_approved', true);
      
      if (reviewsData && reviewsData.length > 0) {
        const ratings = reviewsData.map((r: any) => r.rating).filter((r: number) => r > 0 && r <= 5);
        if (ratings.length > 0) {
          const avg = ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length;
          return { ...businessData, average_rating: Math.round(avg * 10) / 10, total_reviews: ratings.length };
        }
      }
      
      return { ...businessData, average_rating: businessData?.average_rating || 0, total_reviews: businessData?.total_reviews || 0 };
    }
  });

  const { data: products = [] } = useQuery({
    queryKey: ['business-products', businessId],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').eq('card_id', businessId).eq('is_available', true);
      return data || [];
    }
  });

  const { data: services = [] } = useQuery({
    queryKey: ['business-services', businessId],
    queryFn: async () => {
      try { return await PortfolioService.getPublishedCardServices(businessId) || []; } catch { return []; }
    }
  });

  // Helper pour obtenir l'image du profil
  const getProfileImage = () => {
    if (business?.avatar_url) return business.avatar_url;
    if (business?.logo_url) return business.logo_url;
    if (business?.profile_image_url) return business.profile_image_url;
    if (business?.photo_url) return business.photo_url;
    if (business?.image_url) return business.image_url;
    return null;
  };

  const profileImage = business ? getProfileImage() : null;

  // Construire dynamiquement les onglets disponibles
  const availableTabs = React.useMemo(() => {
    const tabs: Array<{ id: 'about' | 'products' | 'services'; icon: React.ElementType; label: string }> = [];
    
    // Toujours afficher "À propos"
    tabs.push({ id: 'about', icon: Info, label: 'À propos' });
    
    // Afficher "Produits" uniquement s'il y en a
    if (products.length > 0) {
      tabs.push({ id: 'products', icon: Package, label: 'Produits' });
    }
    
    // Afficher "Services" uniquement s'il y en a
    if (services.length > 0) {
      tabs.push({ id: 'services', icon: Sparkles, label: 'Services' });
    }
    
    return tabs;
  }, [products.length, services.length]);

  // Définir l'onglet initial en fonction du contenu disponible
  React.useEffect(() => {
    if (!initialTabSet && business) {
      // Si l'onglet actuel n'est pas disponible, passer au premier disponible
      const tabIds = availableTabs.map(t => t.id);
      if (!tabIds.includes(activeTab)) {
        setActiveTab(tabIds[0] || 'about');
      }
      setInitialTabSet(true);
    }
  }, [business, availableTabs, activeTab, initialTabSet]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[70] flex items-end justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          className="relative w-full max-w-lg bg-white rounded-t-[28px] shadow-2xl overflow-hidden flex flex-col"
          style={{ maxHeight: '85vh' }}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={SPRING}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Close */}
          <motion.button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-4 h-4 text-gray-600" />
          </motion.button>

          {loadingBusiness || !business ? <LoadingSkeleton /> : (
            <>
              {/* Header */}
              <motion.div className="px-6 pb-4" style={{ scale: headerScale }}>
                <div className="flex items-start gap-4">
                  {/* Avatar avec fallbacks multiples */}
                  <div className="relative flex-shrink-0">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt={business.name}
                        className="w-16 h-16 rounded-2xl object-cover bg-gray-100 shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={cn(
                      "w-16 h-16 rounded-2xl bg-gray-600 flex items-center justify-center shadow-sm",
                      profileImage ? "hidden" : ""
                    )}>
                      <span className="text-white text-xl font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {business.name?.charAt(0)?.toUpperCase() || 'B'}
                      </span>
                    </div>
                    <motion.div
                      className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-600 rounded-xl flex items-center justify-center border-2 border-white shadow-sm"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring" }}
                    >
                      <Shield className="w-3 h-3 text-white" />
                    </motion.div>
                  </div>

                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-[17px] font-light text-gray-900 tracking-tight"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                        }}
                      >{business.name}</h2>
                      <VerifiedBadge />
                    </div>
                    {business.company && <p className="text-[13px] text-gray-500 mt-0.5">{business.company}</p>}
                    {business.business_sector && <p className="text-[12px] text-gray-400 mt-0.5">{business.business_sector}</p>}
                  </div>
                </div>

                {/* Stats - Affiche uniquement les éléments avec du contenu */}
                {(products.length > 0 || services.length > 0 || business.total_reviews > 0) && (
                  <div className="flex items-center justify-center gap-6 mt-5 py-4 bg-gray-50 rounded-2xl">
                    {products.length > 0 && (
                      <>
                        <StatItem value={products.length} label={products.length === 1 ? "Produit" : "Produits"} />
                        {(services.length > 0 || business.total_reviews > 0) && <div className="w-px h-10 bg-gray-200" />}
                      </>
                    )}
                    {services.length > 0 && (
                      <>
                        <StatItem value={services.length} label={services.length === 1 ? "Service" : "Services"} />
                        {business.total_reviews > 0 && <div className="w-px h-10 bg-gray-200" />}
                      </>
                    )}
                    {business.total_reviews > 0 && (
                      <div className="text-center">
                        <div className="flex items-center gap-1 justify-center">
                          <Star className="w-4 h-4 text-gray-600 fill-gray-600" />
                          <span className="text-lg font-light text-gray-900"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                              fontWeight: 300,
                            }}
                          >{business.average_rating?.toFixed(1)}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-light uppercase tracking-wider"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          {business.total_reviews} {business.total_reviews === 1 ? 'avis' : 'avis'}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tabs - Affichés dynamiquement */}
                {availableTabs.length > 1 && (
                  <div className="flex mt-4 bg-gray-100 rounded-2xl p-1">
                    {availableTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "flex-1 py-2.5 rounded-xl text-[13px] font-light transition-all flex items-center justify-center gap-1.5",
                          activeTab === tab.id 
                            ? "bg-white text-gray-900 shadow-sm" 
                            : "text-gray-500"
                        )}
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        <tab.icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                        
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Content */}
              <div ref={containerRef} className="flex-1 overflow-y-auto px-6 pb-28">
                <AnimatePresence mode="wait">
                  <motion.div key={activeTab} initial="hidden" animate="show" exit="hidden" variants={staggerContainer}>
                    
                    {/* About Tab */}
                    {activeTab === 'about' && (
                      <div className="space-y-4 py-2">
                        {business.description && (
                          <motion.div variants={fadeUp} className="bg-gray-50 rounded-2xl p-4">
                            <h3 className="text-[12px] font-light text-gray-500 uppercase tracking-wider mb-2"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >Description</h3>
                            <p className="text-[14px] text-gray-700 leading-relaxed font-light"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >{business.description}</p>
                          </motion.div>
                        )}

                        {(business.company || business.city) && (
                          <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
                            {business.company && (
                              <div className="bg-gray-50 rounded-2xl p-4">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm mb-3">
                                  <Building2 className="w-5 h-5 text-gray-600" />
                                </div>
                                <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Société</p>
                                <p className="text-[14px] font-medium text-gray-900">{business.company}</p>
                              </div>
                            )}
                            {business.city && (
                              <div className="bg-gray-50 rounded-2xl p-4">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm mb-3">
                                  <MapPin className="w-5 h-5 text-gray-600" />
                                </div>
                                <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1 font-light"
                                  style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                    fontWeight: 300,
                                  }}
                                >Localisation</p>
                                <p className="text-[14px] font-light text-gray-900"
                                  style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                    fontWeight: 300,
                                  }}
                                >{business.city}</p>
                              </div>
                            )}
                          </motion.div>
                        )}

                        {!business.description && !business.company && !business.city && (
                          <motion.div variants={fadeUp} className="text-center py-8">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                              <Info className="w-7 h-7 text-gray-400" />
                            </div>
                            <p className="text-[14px] text-gray-500">Aucune information disponible</p>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* Products Tab - Affiché uniquement s'il y a des produits */}
                    {activeTab === 'products' && products.length > 0 && (
                      <div className="py-2">
                        <div className="grid grid-cols-2 gap-3">
                          {products.map((product: any) => (
                            <motion.div
                              key={product.id}
                              variants={fadeUp}
                              className="group cursor-pointer"
                              onClick={() => { navigate(`/card/${product.card_id || businessId}/marketplace/product/${product.id}`); onClose(); }}
                            >
                              <div className="bg-gray-50 rounded-2xl overflow-hidden transition-all group-hover:shadow-lg group-hover:bg-white">
                                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                                  {product.images?.[0]?.url || product.image_url ? (
                                    <img src={product.images?.[0]?.url || product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="w-10 h-10 text-gray-300" />
                                    </div>
                                  )}
                                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black text-white text-[11px] font-bold rounded-lg">
                                    {product.price?.toLocaleString()} <span className="text-[9px] opacity-70">{product.currency || 'XAF'}</span>
                                  </div>
                                </div>
                                <div className="p-3">
                                  <h4 className="text-[13px] font-light text-gray-900 line-clamp-2"
                                    style={{
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                      fontWeight: 300,
                                    }}
                                  >{product.name}</h4>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Services Tab - Affiché uniquement s'il y a des services */}
                    {activeTab === 'services' && services.length > 0 && (
                      <div className="py-2 space-y-2">
                        {services.map((service: any) => {
                          const ServiceIcon = service.icon && (LucideIcons as any)[service.icon] ? (LucideIcons as any)[service.icon] : Sparkles;
                          const formatPrice = () => {
                            if (service.price_label) return service.price_label;
                            if (service.price_type === 'free') return 'Gratuit';
                            if (service.price_type === 'fixed' && service.price) return `${service.price?.toLocaleString()} FCFA`;
                            if (service.price_type === 'from' && service.price) return `Dès ${service.price?.toLocaleString()} FCFA`;
                            return 'Sur devis';
                          };

                          return (
                            <motion.div
                              key={service.id}
                              variants={fadeUp}
                              className="group flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-lg transition-all cursor-pointer"
                              onClick={() => { navigate(`/card/${businessId}/portfolio`); onClose(); }}
                            >
                              <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center text-white flex-shrink-0">
                                <ServiceIcon className="w-6 h-6" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-[15px] font-light text-gray-900"
                                  style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                    fontWeight: 300,
                                  }}
                                >{service.title}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                  {service.duration && (
                                    <span className="text-[12px] text-gray-500 flex items-center gap-1 font-light"
                                      style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                        fontWeight: 300,
                                      }}
                                    >
                                      <Clock className="w-3.5 h-3.5" />{service.duration} min
                                    </span>
                                  )}
                                  <span className="text-[13px] font-light text-gray-900"
                                    style={{
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                      fontWeight: 300,
                                    }}
                                  >{formatPrice()}</span>
                                </div>
                              </div>
                              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Bottom Actions - UNIQUE */}
              <motion.div 
                className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-white via-white to-transparent pt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-3 max-w-sm mx-auto">
                  <motion.button
                    onClick={() => setIsLiked(!isLiked)}
                    className={cn(
                      "w-14 h-14 rounded-2xl transition-all flex items-center justify-center",
                      isLiked ? "bg-rose-500 text-white" : "bg-gray-100 text-gray-600"
                    )}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Heart className={cn("w-6 h-6", isLiked && "fill-current")} />
                  </motion.button>

                  {business.phone && (
                    <motion.a
                      href={`tel:${business.phone}`}
                      className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center"
                      whileTap={{ scale: 0.95 }}
                    >
                      <Phone className="w-6 h-6" />
                    </motion.a>
                  )}

                  <motion.button
                    onClick={() => { navigate(`/card/${businessId}`); onClose(); }}
                    className="flex-1 h-14 bg-gray-900 text-white rounded-lg text-[15px] font-light flex items-center justify-center gap-2"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Visiter le profil
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};