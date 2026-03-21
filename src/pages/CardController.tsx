/**
 * CardController - Flyover UI entry for /card/:id
 *
 * Single fetch (CardService.getCardBySlug), then renders the public card view.
 * When the user is the owner: OwnerHUD (Portal) with edit/dashboard buttons and
 * OSDrawer in Flyover mode (panels in overlay, URL stays /card/:id).
 */

import React, { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { RealityLayerProvider, type ShareContactInfo } from '@/contexts/RealityLayerContext';
import { CardService } from '@/services/CardService';
import { generateCardUrl } from '@/utils/cardUrlUtils';
import { buildVCardFile } from '@/utils/vCardUtils';
import { supabase } from '@/integrations/supabase/client';
import PublicCardView from '@/pages/PublicCardView';
import { OwnerHUD } from '@/components/card/OwnerHUD';
import CardLoadingSkeleton from '@/components/ui/CardLoadingSkeleton';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const BOOH_BASE_URL = 'https://booh.ga';

function buildShareContactFromCard(card: any): ShareContactInfo {
  const socials: Record<string, string> = {};
  (card?.social_links || []).forEach((link: { platform?: string; url?: string }) => {
    if (link?.platform && link?.url) socials[link.platform] = link.url;
  });
  let avatar = card?.avatar_url ?? '';
  if (avatar && !avatar.startsWith('http')) {
    try {
      const { data } = supabase.storage.from('avatars').getPublicUrl(avatar);
      avatar = data?.publicUrl ?? avatar;
    } catch {
      const { data } = supabase.storage.from('card-images').getPublicUrl(avatar);
      avatar = data?.publicUrl ?? avatar;
    }
  }
  return {
    name: card?.name ?? '',
    title: card?.title ?? '',
    company: card?.company ?? '',
    email: card?.email ?? '',
    phone: card?.phone ?? '',
    website: (card?.social_links || []).find((l: any) => l?.platform === 'website')?.url ?? '',
    avatar,
    address: card?.address ?? '',
    description: card?.description ?? '',
    cardUrl: generateCardUrl(card?.id, card?.slug, BOOH_BASE_URL),
    socials,
  };
}

export default function CardController() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: card, isLoading, error } = useQuery({
    queryKey: ['card-controller', id],
    queryFn: () => CardService.getCardBySlug(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const isOwner = Boolean(user?.id && card?.user_id && user.id === card.user_id);
  const [shareFile, setShareFile] = useState<File | null>(null);

  const getShareContact = useMemo(
    () => (card ? () => buildShareContactFromCard(card) : null),
    [card]
  );

  useEffect(() => {
    if (!card) {
      setShareFile(null);
      return;
    }
    const contact = buildShareContactFromCard(card);
    buildVCardFile(contact as import('@/utils/vCardUtils').ContactInfo)
      .then(setShareFile)
      .catch(() => setShareFile(null));
    return () => setShareFile(null);
  }, [card]);

  const getShareFile = useMemo(() => () => shareFile, [shareFile]);

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <p className="text-gray-500">Identifiant de carte manquant.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="relative z-10 flex items-start justify-center px-4 py-6 md:py-12 min-h-screen">
          <CardLoadingSkeleton />
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] p-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Loader2 className="w-10 h-10 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Carte introuvable ou erreur de chargement.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <RealityLayerProvider cardId={card.id} ownerId={card.user_id} getShareContact={getShareContact} getShareFile={getShareFile}>
      <PublicCardView cardFromController={card} />
      {isOwner && <OwnerHUD />}
    </RealityLayerProvider>
  );
}
