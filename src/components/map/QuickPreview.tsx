// Composant d'aperçu rapide (micro-interaction au survol d'un marqueur)
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapMarker, MapProduct, MapService, MapBusiness, MapEvent, DynamicBadge } from './types';
import { useProductBadges, useServiceBadges, useBusinessBadges } from './hooks/useDynamicBadges';
import { Calendar, MapPin, Users, Clock, Radio, ExternalLink, Ticket } from 'lucide-react';
import { format } from 'date-fns';

interface QuickPreviewProps {
  marker: MapMarker | null;
  position: { x: number; y: number } | null;
  onViewDetails: () => void;
  onClose: () => void;
}

// Badge visuel pour le quick preview
const PreviewBadge: React.FC<{ badge: DynamicBadge }> = ({ badge }) => (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
    style={{ 
      backgroundColor: badge.bgColor,
      color: badge.color,
    }}
  >
    <span>{badge.icon}</span>
    <span>{badge.label}</span>
  </motion.div>
);

// Aperçu produit
const ProductPreview: React.FC<{ product: MapProduct; onViewDetails: () => void }> = ({ 
  product, 
  onViewDetails 
}) => {
  const { badges, primaryBadge } = useProductBadges(product);

  return (
    <div className="w-72">
      {/* Image */}
      <div className="relative h-32 rounded-t-xl overflow-hidden bg-gray-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-emerald-50 to-emerald-100">
            📦
          </div>
        )}
        
        {/* Badge principal */}
        {primaryBadge && (
          <div className="absolute top-2 left-2">
            <PreviewBadge badge={primaryBadge} />
          </div>
        )}

        {/* Prix */}
        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg">
          <span className="font-bold">{product.price.toLocaleString()}</span>
          <span className="text-xs ml-1 opacity-80">{product.currency}</span>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-3 bg-white rounded-b-xl">
        <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1">
          {product.title}
        </h3>
        
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          {product.business_avatar ? (
            <img 
              src={product.business_avatar} 
              alt="" 
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-gray-200" />
          )}
          <span className="line-clamp-1">{product.business_name}</span>
        </div>

        {/* Distance + Stock */}
        <div className="flex items-center justify-between">
          {product.distance !== undefined && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              📍 {product.distance.toFixed(1)} km
            </span>
          )}
          {product.stock_status === 'in_stock' && (
            <span className="text-xs text-emerald-600 font-medium">✓ En stock</span>
          )}
          {product.stock_status === 'low_stock' && (
            <span className="text-xs text-amber-600 font-medium">⚠️ Stock limité</span>
          )}
        </div>

        {/* CTA */}
        <motion.button
          onClick={onViewDetails}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full mt-3 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors"
        >
          Voir le produit
        </motion.button>
      </div>
    </div>
  );
};

// Aperçu service
const ServicePreview: React.FC<{ service: MapService; onViewDetails: () => void }> = ({ 
  service, 
  onViewDetails 
}) => {
  const { badges, primaryBadge } = useServiceBadges(service);

  const formatPrice = () => {
    if (service.price_label) return service.price_label;
    switch (service.price_type) {
      case 'free': return 'Gratuit';
      case 'fixed': return service.price ? `${service.price.toLocaleString()} FCFA` : 'Sur devis';
      case 'from': return service.price ? `À partir de ${service.price.toLocaleString()} FCFA` : 'Sur devis';
      default: return 'Sur devis';
    }
  };

  return (
    <div className="w-72">
      {/* Header avec icône */}
      <div className="relative h-28 rounded-t-xl overflow-hidden bg-gradient-to-br from-violet-50 via-white to-purple-50">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center text-3xl">
            ✨
          </div>
        </div>
        
        {/* Badge principal */}
        {primaryBadge && (
          <div className="absolute top-2 left-2">
            <PreviewBadge badge={primaryBadge} />
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="p-3 bg-white rounded-b-xl">
        <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1">
          {service.title}
        </h3>
        
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          {service.business_avatar ? (
            <img 
              src={service.business_avatar} 
              alt="" 
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-gray-200" />
          )}
          <span className="line-clamp-1">{service.business_name}</span>
        </div>

        {/* Prix + Distance */}
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-violet-600">{formatPrice()}</span>
          {service.distance !== undefined && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              📍 {service.distance.toFixed(1)} km
            </span>
          )}
        </div>

        {/* Durée si disponible */}
        {service.duration && (
          <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            🕐 {service.duration} min
          </div>
        )}

        {/* CTA */}
        <motion.button
          onClick={onViewDetails}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
        >
          Réserver
        </motion.button>
      </div>
    </div>
  );
};

// Aperçu événement
const EventPreview: React.FC<{ event: MapEvent; onViewDetails: () => void }> = ({ 
  event, 
  onViewDetails 
}) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPp');
    } catch {
      return dateString;
    }
  };

  const isLive = event.live_stream_status === 'live';
  const minPrice = event.is_free 
    ? 0 
    : event.tickets_config.length > 0 
      ? Math.min(...event.tickets_config.map(t => t.price))
      : 0;

  return (
    <div className="w-72">
      {/* Image couverture */}
      <div className="relative h-36 rounded-t-xl overflow-hidden bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-500">
        {event.cover_image_url ? (
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-purple-500 to-blue-500">
            📅
          </div>
        )}
        
        {/* Badge LIVE si en direct */}
        {isLive && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 left-2 px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-lg"
          >
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            LIVE
          </motion.div>
        )}

        {/* Badge type événement */}
        <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold rounded-lg">
          {event.event_type === 'physical' ? '📍 Sur place' : 
           event.event_type === 'online' ? '💻 En ligne' : 
           '🔀 Hybride'}
        </div>

        {/* Prix ou gratuit */}
        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg">
          {event.is_free ? (
            <span className="font-bold text-sm">Gratuit</span>
          ) : (
            <div>
              <span className="font-bold">{minPrice.toLocaleString()}</span>
              <span className="text-xs ml-1 opacity-80">FCFA</span>
            </div>
          )}
        </div>
      </div>

      {/* Contenu */}
      <div className="p-3 bg-white rounded-b-xl">
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 text-sm">
          {event.title}
        </h3>
        
        {/* Date et heure */}
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
          <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="line-clamp-1">{formatDate(event.start_date)}</span>
        </div>

        {/* Localisation (si physical/hybrid) */}
        {(event.event_type === 'physical' || event.event_type === 'hybrid') && event.location_name && (
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{event.location_name}</span>
          </div>
        )}

        {/* Participants */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Users className="h-3.5 w-3.5" />
            <span>
              {event.current_attendees}
              {event.max_capacity ? ` / ${event.max_capacity}` : ''} participants
            </span>
          </div>
          {event.distance !== undefined && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              📍 {event.distance.toFixed(1)} km
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <motion.button
            onClick={onViewDetails}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Voir détails
          </motion.button>
          {isLive && (
            <motion.button
              onClick={() => window.open(`/events/${event.id}/live`, '_blank')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-1.5"
            >
              <Radio className="h-3.5 w-3.5" />
              Live
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

// Aperçu business
const BusinessPreview: React.FC<{ business: MapBusiness; onViewDetails: () => void }> = ({ 
  business, 
  onViewDetails 
}) => {
  const { badges, primaryBadge } = useBusinessBadges(business);

  return (
    <div className="w-72">
      {/* Header */}
      <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-t-xl">
        <div className="flex items-center gap-3">
          {business.avatar_url ? (
            <img
              src={business.avatar_url}
              alt={business.name}
              className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-sm"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
              {business.name.charAt(0).toUpperCase()}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 line-clamp-1">{business.name}</h3>
            {business.business_sector && (
              <p className="text-sm text-gray-600 line-clamp-1">{business.business_sector}</p>
            )}
          </div>
        </div>

        {/* Badge principal */}
        {primaryBadge && (
          <div className="mt-2">
            <PreviewBadge badge={primaryBadge} />
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="p-3 bg-white rounded-b-xl">
        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          {business.products_count !== undefined && business.products_count > 0 && (
            <span className="flex items-center gap-1">
              📦 {business.products_count} produits
            </span>
          )}
          {business.services_count !== undefined && business.services_count > 0 && (
            <span className="flex items-center gap-1">
              ✨ {business.services_count} services
            </span>
          )}
        </div>

        {/* Localisation */}
        <div className="flex items-center justify-between text-sm mb-3">
          {business.city && (
            <span className="text-gray-600 flex items-center gap-1">
              🏙️ {business.city}
            </span>
          )}
          {business.distance !== undefined && (
            <span className="text-gray-500 flex items-center gap-1">
              📍 {business.distance.toFixed(1)} km
            </span>
          )}
        </div>

        {/* Rating */}
        {business.rating !== undefined && business.rating > 0 && (
          <div className="flex items-center gap-1 mb-3">
            <span className="text-amber-500">⭐</span>
            <span className="font-semibold text-gray-900">{business.rating.toFixed(1)}</span>
          </div>
        )}

        {/* CTA */}
        <motion.button
          onClick={onViewDetails}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Voir le profil
        </motion.button>
      </div>
    </div>
  );
};

// Composant principal QuickPreview
export const QuickPreview: React.FC<QuickPreviewProps> = ({
  marker,
  position,
  onViewDetails,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Délai avant affichage pour éviter les aperçus accidentels
  useEffect(() => {
    if (marker && position) {
      const timer = setTimeout(() => setIsVisible(true), 300);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [marker, position]);

  if (!marker || !position || !isVisible) return null;

  // Calculer la position de l'aperçu (éviter les débordements)
  const previewStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(position.x, window.innerWidth - 300),
    top: Math.max(position.y - 10, 10),
    zIndex: 10000,
    transform: 'translateY(-100%)',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        style={previewStyle}
        onMouseLeave={onClose}
        className="pointer-events-auto"
      >
        <div className="rounded-xl shadow-2xl overflow-hidden border border-gray-200/50 backdrop-blur-sm">
          {marker.type === 'product' && (
            <ProductPreview 
              product={marker.data as MapProduct} 
              onViewDetails={onViewDetails} 
            />
          )}
          {marker.type === 'service' && (
            <ServicePreview 
              service={marker.data as MapService} 
              onViewDetails={onViewDetails} 
            />
          )}
          {marker.type === 'business' && (
            <BusinessPreview 
              business={marker.data as MapBusiness} 
              onViewDetails={onViewDetails} 
            />
          )}
          {marker.type === 'event' && (
            <EventPreview 
              event={marker.data as MapEvent} 
              onViewDetails={onViewDetails} 
            />
          )}
        </div>

        {/* Flèche */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full">
          <div className="w-4 h-4 bg-white rotate-45 -mt-2 shadow-lg border-r border-b border-gray-200/50" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuickPreview;

