/**
 * OwnerHUD - Flyover UI
 *
 * Rendu en Portal : boutons propriétaire (Modifier, Envoyer ma carte, Dashboard) + OSDrawer en mode
 * Flyover (panels en overlay, URL inchangée). À utiliser depuis CardController uniquement.
 */

import React, { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Edit, LayoutDashboard, Share2, Loader2 } from 'lucide-react';
import { useRealityLayer } from '@/contexts/RealityLayerContext';
import { useToast } from '@/hooks/use-toast';
import { OSDrawer } from './OSDrawer';

const editPath = (id: string) => `/cards/${id}/edit`;

const btnClass =
  'w-11 h-11 rounded-full bg-white/95 backdrop-blur-md border border-white/50 shadow-lg flex items-center justify-center text-gray-800 hover:bg-white hover:shadow-xl hover:scale-105 active:scale-95 transition-shadow';

export function OwnerHUD() {
  const { cardId, isOwner, setShowOSDrawer, getShareContact } = useRealityLayer();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sharing, setSharing] = useState(false);

  const handleEdit = useCallback(() => {
    if (!cardId) return;
    navigate(editPath(cardId));
  }, [cardId, navigate]);

  /** Partage synchrone au clic (user gesture) : pas d’await avant navigator.share. */
  const handleSendCard = useCallback(() => {
    const contact = getShareContact?.() ?? null;
    const url = contact?.cardUrl || (typeof window !== 'undefined' ? window.location.href : '');
    if (!url) {
      toast({ title: 'Partage impossible', description: 'Données de la carte indisponibles.', variant: 'destructive' });
      return;
    }

    const title = contact?.name ? `${contact.name} – Carte Bööh` : 'Bööh – Ma Carte Digitale';
    const text = contact?.title || contact?.company
      ? `${contact.title || ''}${contact.title && contact.company ? ' · ' : ''}${contact.company || ''}`.trim()
      : 'Retrouvez mon univers pro sur Bööh';

    // Partager uniquement titre + texte + URL pour que le menu natif (AirDrop, etc.) s’ouvre
    // de façon fiable. Le partage avec fichier vCard échoue souvent sur Chrome/macOS et
    // consomme le user gesture, donc on ne l’utilise pas ici.
    const shareData = { title, text, url };

    if (typeof navigator !== 'undefined' && navigator.share) {
      setSharing(true);
      navigator.share(shareData)
        .then(() => {
          toast({ title: 'Partage réussi', description: 'Lien partagé.' });
        })
        .catch((err: unknown) => {
          const isAbort = (err as { name?: string })?.name === 'AbortError';
          if (isAbort) {
            toast({ title: 'Partage annulé', description: 'Vous avez fermé le partage.' });
            return;
          }
          navigator.clipboard?.writeText(url).then(() => {
            toast({ title: 'Lien copié', description: 'Partage impossible. Lien copié dans le presse-papier.', variant: 'destructive' });
          }).catch(() => {
            toast({ title: 'Partage impossible', description: 'Copiez le lien manuellement.', variant: 'destructive' });
          });
        })
        .finally(() => setSharing(false));
    } else {
      navigator.clipboard?.writeText(url).then(() => {
        toast({ title: 'Lien copié', description: 'AirDrop/partage non supporté sur ce navigateur.' });
      }).catch(() => {
        toast({ title: 'Partage non disponible', description: 'Votre navigateur ne supporte pas le partage natif.', variant: 'destructive' });
      });
    }
  }, [getShareContact, toast]);

  if (!isOwner || !cardId) return null;

  const hud = (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed top-4 right-4 z-30 flex items-center gap-2"
      >
        <motion.button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleEdit(); }}
          className={btnClass}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Modifier la carte"
        >
          <Edit className="h-5 w-5" strokeWidth={2} />
        </motion.button>
        <motion.button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleSendCard(); }}
          disabled={sharing}
          className={btnClass}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Envoyer ma carte"
        >
          {sharing ? <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2} /> : <Share2 className="h-5 w-5" strokeWidth={2} />}
        </motion.button>
        <motion.button
          type="button"
          onClick={(e) => { e.stopPropagation(); setShowOSDrawer(true); }}
          className={btnClass}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Ouvrir le dashboard"
        >
          <LayoutDashboard className="h-5 w-5" strokeWidth={2} />
        </motion.button>
      </motion.div>
      <OSDrawer useFlyover />
    </>
  );

  return typeof document !== 'undefined' ? createPortal(hud, document.body) : null;
}
