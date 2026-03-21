/**
 * RealityLayerContext - Singularity Design
 *
 * Morphism instead of navigation: the card is Layer 0 (visible to all).
 * The OS is Layer 1 (visible/editable only by owner via auth.uid()).
 * Same URL: /card/:id shows the card; for the owner it also reveals edit/drawer.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type Layer = 0 | 1;

/** Module key for Flyover panel (no navigation, overlay on same URL). */
export type OSModuleKey = 'crm' | 'commerce' | 'stock' | 'appointments' | 'portfolio' | 'invoicing' | 'map';

/** Contact info pour le partage natif "Envoyer ma carte" (même vCard que Enregistrer contact). */
export type ShareContactInfo = {
  name: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  avatar?: string;
  address?: string;
  description?: string;
  cardUrl?: string;
  socials?: Record<string, string>;
};

interface RealityLayerState {
  /** Current card id from route /card/:id */
  cardId: string | null;
  /** True if the authenticated user owns this card */
  isOwner: boolean;
  /** Layer 0 = card only (public). Layer 1 = card + OS (owner only) */
  activeLayer: Layer;
  /** Show OS drawer (CRM, Stock, etc.) - owner only */
  showOSDrawer: boolean;
  /** Show edit mode (edit-in-place or drawer) - owner only */
  showEditLayer: boolean;
  /** Open panel in drawer (Flyover: no navigation). null = menu list. */
  openPanel: OSModuleKey | null;
  /** Données contact pour partage natif (vCard) – fourni par le parent qui a la carte. */
  getShareContact: (() => ShareContactInfo | null) | null;
  /** Fichier vCard pré-généré pour partage synchrone (user gesture). */
  getShareFile: (() => File | null) | null;
}

interface RealityLayerContextValue extends RealityLayerState {
  setShowOSDrawer: (show: boolean) => void;
  setShowEditLayer: (show: boolean) => void;
  setOpenPanel: (key: OSModuleKey | null) => void;
}

const defaultState: RealityLayerState = {
  cardId: null,
  isOwner: false,
  activeLayer: 0,
  showOSDrawer: false,
  showEditLayer: false,
  openPanel: null,
  getShareContact: null,
  getShareFile: null,
};

const RealityLayerContext = createContext<RealityLayerContextValue | null>(null);

export function RealityLayerProvider({
  children,
  cardId: cardIdProp,
  ownerId: ownerIdProp,
  getShareContact: getShareContactProp = null,
  getShareFile: getShareFileProp = null,
}: {
  children: React.ReactNode;
  cardId?: string | null;
  /** When provided, skips the card-owner query (e.g. from parent card data). */
  ownerId?: string | null;
  /** Données contact pour "Envoyer ma carte" (même vCard que Enregistrer contact). */
  getShareContact?: (() => ShareContactInfo | null) | null;
  /** Fichier vCard pré-généré pour partage natif (évite async dans le clic). */
  getShareFile?: (() => File | null) | null;
}) {
  const { id: routeCardId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const cardId = cardIdProp ?? routeCardId ?? null;

  const { data: cardOwnerIdFromDb } = useQuery({
    queryKey: ['card-owner', cardId],
    queryFn: async () => {
      if (!cardId) return null;
      const { data } = await supabase
        .from('business_cards')
        .select('user_id')
        .eq('id', cardId)
        .single();
      return (data?.user_id as string) ?? null;
    },
    enabled: !!cardId && ownerIdProp == null,
  });

  const cardOwnerId = ownerIdProp ?? cardOwnerIdFromDb ?? null;
  const isOwner = Boolean(user?.id && cardOwnerId && user.id === cardOwnerId);
  const activeLayer: Layer = isOwner ? 1 : 0;

  const [showOSDrawer, setShowOSDrawer] = React.useState(false);
  const [showEditLayer, setShowEditLayer] = React.useState(false);
  const [openPanel, setOpenPanel] = React.useState<RealityLayerState['openPanel']>(null);

  const value = useMemo<RealityLayerContextValue>(
    () => ({
      cardId,
      isOwner,
      activeLayer,
      showOSDrawer: isOwner ? showOSDrawer : false,
      showEditLayer: isOwner ? showEditLayer : false,
      openPanel: isOwner ? openPanel : null,
      getShareContact: getShareContactProp ?? null,
      getShareFile: getShareFileProp ?? null,
      setShowOSDrawer: (v) => isOwner && setShowOSDrawer(v),
      setShowEditLayer: (v) => isOwner && setShowEditLayer(v),
      setOpenPanel: (v) => isOwner && setOpenPanel(v),
    }),
    [cardId, isOwner, activeLayer, showOSDrawer, showEditLayer, openPanel, getShareContactProp, getShareFileProp]
  );

  return (
    <RealityLayerContext.Provider value={value}>
      {children}
    </RealityLayerContext.Provider>
  );
}

export function useRealityLayer(): RealityLayerContextValue {
  const ctx = useContext(RealityLayerContext);
  if (!ctx) {
    return {
      ...defaultState,
      getShareContact: null,
      getShareFile: null,
      setShowOSDrawer: () => {},
      setShowEditLayer: () => {},
      setOpenPanel: () => {},
    };
  }
  return ctx;
}
