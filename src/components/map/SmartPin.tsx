import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { LazyMarker } from '@/components/LazyMap';
import { MapMarker, MapProduct, MapService, MapBusiness, MapEvent } from './types';
import { logger } from '@/utils/logger';

// Cache pour éviter de redessiner les canvas identiques (Perfs ++)
const iconCache = new Map<string, google.maps.Icon>();

interface SmartPinProps {
  marker: MapMarker;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

// --- UTILS : DESSIN CANVAS ---

// Fonction pour dessiner un "Squircle" (forme Apple)
const drawSquircle = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

export const SmartPin: React.FC<SmartPinProps> = ({
  marker,
  isSelected,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave
}) => {
  const [icon, setIcon] = useState<google.maps.Icon | undefined>(undefined);

  // 1. Génération de la clé de cache unique
  const cacheKey = useMemo(() => {
    const data = marker.data as any;
    const img = data.cover_image_url || data.image_url || data.thumbnail_url || data.avatar_url || 'no-img';
    const state = isSelected ? 'selected' : isHovered ? 'hover' : 'idle';
    const liveStatus = marker.type === 'event' ? (data.live_stream_status || 'none') : 'none';
    return `${marker.type}-${marker.id}-${img}-${state}-${marker.is_promotion}-${liveStatus}`;
  }, [marker, isSelected, isHovered]);

  // 2. Création de l'icône (Canvas)
  const generateIcon = useCallback(async () => {
    if (typeof document === 'undefined') return;

    // Vérification cache
    if (iconCache.has(cacheKey)) {
      setIcon(iconCache.get(cacheKey)!);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- CONFIGURATION DU DESIGN ---
    const isProduct = marker.type === 'product';
    const isEvent = marker.type === 'event';
    const scale = 2; // Retina support (x2 resolution)

    // Tailles (état actif = plus grand)
    const baseSize = isProduct ? 56 : 48;
    const size = (isSelected || isHovered) ? baseSize * 1.2 : baseSize;

    // Padding pour l'ombre
    const padding = 20;
    const canvasSize = (size + padding * 2) * scale;

    canvas.width = canvasSize;
    canvas.height = canvasSize;
    ctx.scale(scale, scale);

    const drawSize = size; // Taille réelle du dessin
    const x = padding; // Offset X
    const y = padding; // Offset Y

    // 1. OMBRE PORTÉE (Apple Style)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = (isSelected || isHovered) ? 20 : 10;
    ctx.shadowOffsetY = (isSelected || isHovered) ? 10 : 4;

    // 2. FORME DE BASE (Fond blanc)
    ctx.fillStyle = '#FFFFFF';
    if (isProduct) {
      // Produit = Squircle
      drawSquircle(ctx, x, y, drawSize, drawSize, drawSize * 0.35);
    } else if (isEvent) {
      // Événement = Squircle (comme produit mais avec style différent)
      drawSquircle(ctx, x, y, drawSize, drawSize, drawSize * 0.35);
    } else {
      // Service/Lieu = Cercle
      ctx.beginPath();
      ctx.arc(x + drawSize / 2, y + drawSize / 2, drawSize / 2, 0, Math.PI * 2);
    }
    ctx.fill();

    // Reset shadow pour le contenu
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // 3. BORDURE BLANCHE
    // On dessine le contenu légèrement plus petit pour laisser une bordure blanche
    const borderSize = 3;
    const contentSize = drawSize - (borderSize * 2);
    const contentX = x + borderSize;
    const contentY = y + borderSize;

    ctx.save(); // Sauvegarde pour le clip

    // Masque de découpe (Clip)
    ctx.beginPath();
    if (isProduct || isEvent) {
      drawSquircle(ctx, contentX, contentY, contentSize, contentSize, (drawSize * 0.35) - 1);
    } else {
      ctx.arc(contentX + contentSize / 2, contentY + contentSize / 2, contentSize / 2, 0, Math.PI * 2);
    }
    ctx.clip();

    // 4. CONTENU (Image ou Icône)
    const data = marker.data as any;
    const imageUrl = data.cover_image_url || data.image_url || data.thumbnail_url || data.avatar_url;

    if (imageUrl) {
      // Mode Image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;

      try {
        await new Promise((resolve, reject) => {
          if (img.complete) resolve(null);
          img.onload = resolve;
          img.onerror = reject;
        });
        ctx.drawImage(img, contentX, contentY, contentSize, contentSize);
      } catch (e) {
        // Fallback couleur si erreur image
        ctx.fillStyle = '#F3F4F6';
        ctx.fillRect(contentX, contentY, contentSize, contentSize);
      }
    } else {
      // Mode Icône (Gradient)
      const gradient = ctx.createLinearGradient(contentX, contentY, contentX, contentY + contentSize);
      if (isProduct) {
        gradient.addColorStop(0, '#ECFDF5'); // emerald-50
        gradient.addColorStop(1, '#D1FAE5'); // emerald-100
        ctx.fillStyle = gradient;
      } else if (marker.type === 'service') {
        gradient.addColorStop(0, '#F5F3FF'); // violet-50
        gradient.addColorStop(1, '#EDE9FE'); // violet-100
        ctx.fillStyle = gradient;
      } else if (isEvent) {
        gradient.addColorStop(0, '#FAF5FF'); // purple-50
        gradient.addColorStop(1, '#F3E8FF'); // purple-100
        ctx.fillStyle = gradient;
      } else {
        gradient.addColorStop(0, '#EFF6FF'); // blue-50
        gradient.addColorStop(1, '#DBEAFE'); // blue-100
        ctx.fillStyle = gradient;
      }
      ctx.fillRect(contentX, contentY, contentSize, contentSize);

      // Dessin d'un symbole simple au centre
      if (isEvent) {
        // Pour les événements, dessiner un calendrier simple avec Canvas
        ctx.fillStyle = '#9333EA';
        ctx.strokeStyle = '#9333EA';
        ctx.lineWidth = 3;
        const centerX = contentX + contentSize / 2;
        const centerY = contentY + contentSize / 2;
        const iconSize = contentSize * 0.5;

        // Dessiner un calendrier (rectangles)
        ctx.beginPath();
        ctx.rect(centerX - iconSize / 2, centerY - iconSize / 3, iconSize, iconSize * 0.8);
        ctx.stroke();

        // Ligne horizontale pour séparer
        ctx.beginPath();
        ctx.moveTo(centerX - iconSize / 2, centerY - iconSize / 6);
        ctx.lineTo(centerX + iconSize / 2, centerY - iconSize / 6);
        ctx.stroke();

        // Points pour jours
        ctx.fillStyle = '#9333EA';
        const dotSize = 3;
        ctx.fillRect(centerX - iconSize / 3, centerY + iconSize / 6, dotSize, dotSize);
        ctx.fillRect(centerX - dotSize, centerY + iconSize / 6, dotSize, dotSize);
        ctx.fillRect(centerX + dotSize, centerY + iconSize / 6, dotSize, dotSize);
      } else {
        ctx.fillStyle = isProduct ? '#059669' : marker.type === 'service' ? '#7C3AED' : '#2563EB';
        ctx.font = `bold ${contentSize * 0.5}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const symbol = isProduct ? '📦' : marker.type === 'service' ? '✨' : '📍';
        ctx.fillText(symbol, contentX + contentSize / 2, contentY + contentSize / 2 + 2);
      }
    }

    ctx.restore(); // Restauration après le clip

    // 5. BADGE LIVE (Notification rouge pour événements en direct)
    if (isEvent && (marker.data as MapEvent).live_stream_status === 'live') {
      const badgeSize = drawSize * 0.25;
      const badgeX = x + drawSize - (badgeSize / 2);
      const badgeY = y - (badgeSize / 4);

      // Ombre du badge
      ctx.shadowColor = 'rgba(239,68,68,0.3)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = '#EF4444'; // red-500
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeSize, 0, Math.PI * 2);
      ctx.fill();

      // Point rouge pulsant
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeSize * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. BADGE PROMOTION (Notification rouge)
    if ((marker as any).is_promotion && !isEvent) {
      const badgeSize = drawSize * 0.25;
      const badgeX = x + drawSize - (badgeSize / 2);
      const badgeY = y - (badgeSize / 4);

      // Ombre du badge
      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = '#EF4444'; // red-500
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeSize, 0, Math.PI * 2);
      ctx.fill();

      // Étoile blanche
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${badgeSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', badgeX, badgeY + 1);
    }

    // Calcul de la taille totale pour l'icône finale (utilise les variables déjà déclarées)
    const totalSize = size + (padding * 2);

    // Finalisation - créer l'objet Icon pour Google Maps
    const iconResult: google.maps.Icon = {
      url: canvas.toDataURL('image/png'),
      scaledSize: new google.maps.Size(totalSize, totalSize),
      anchor: new google.maps.Point(totalSize / 2, totalSize / 2)
    };

    iconCache.set(cacheKey, iconResult);
    setIcon(iconResult);

  }, [cacheKey, marker, isSelected, isHovered]);

  // Initialisation de l'icône
  useEffect(() => {
    if (typeof google === 'undefined' || !google.maps) return;
    generateIcon();
  }, [generateIcon]);

  // Ne pas rendre le marker si l'icône n'est pas prête
  if (!icon) {
    return null;
  }

  return (
    <LazyMarker
      position={marker.position}
      icon={icon}
      onClick={onClick}
      onMouseOver={onMouseEnter}
      onMouseOut={onMouseLeave}
      animation={isSelected && typeof google !== 'undefined' && google.maps ? google.maps.Animation.BOUNCE : undefined}
      zIndex={isSelected ? 2000 : isHovered ? 1500 : 1000}
    />
  );
};