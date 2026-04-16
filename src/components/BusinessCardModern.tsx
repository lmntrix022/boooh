import React, { memo, useState, useEffect, useMemo, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Phone, Globe, MapPin, Instagram, Linkedin, Facebook, Twitter, Youtube,
  Play, Music, Video, ShoppingCart, ExternalLink, ChevronLeft, ChevronRight,
  MessageCircle, Calendar, QrCode, Download, Loader2, Sparkles
} from "lucide-react";
import CardImageOptimizer from "@/components/utils/CardImageOptimizer";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import ProductDisplaySection from "./ProductDisplaySection";
import EventDisplaySection from "./EventDisplaySection";
import { downloadVCard } from "@/utils/vCardUtils";
import { useCardContent } from "@/hooks/useCardContent";
import { useImageOptimization } from "@/hooks/useImageOptimization";
import BusinessCardHeader from "./card/BusinessCardHeader";
import BusinessCardToggle from "./card/BusinessCardToggle";
import BusinessCardMedia from "./card/BusinessCardMedia";
import BusinessCardActions from "./card/BusinessCardActions";
import BusinessCardContent from "./card/BusinessCardContent";
import { useClickTracking } from '@/hooks/useClickTracking';
import { TikTokPlayer } from "@/components/media/TikTokPlayer";
import { useLanguage } from '@/hooks/useLanguage';
import { PlanType, PLAN_FEATURES, NEW_PLAN_FEATURES } from '@/types/subscription';
import { useAuth } from '@/contexts/AuthContext';
import QrCodeModal from "./card/QrCodeModal";
import AppointmentModal from "./card/AppointmentModal";
import ProductOrderModal from "./card/ProductOrderModal";
import BusinessCardHeaderModern from "./card/BusinessCardHeaderModern";
import CardSliderContent from "./card/CardSliderContent";
import DefaultCardContent from "./card/DefaultCardContent";

// Lazy load des composants modaux pour améliorer les performances
const ProductDetailsDialog = lazy(() => import("./ProductDetailsDialog"));

interface PortfolioSettings {
  is_enabled: boolean;
  title?: string;
  brand_color?: string;
}

interface BusinessCardProps {
  name: string;
  title: string;
  company?: string;
  companyLogo?: string;
  location?: string;
  avatar?: string;
  email?: string;
  phone?: string;
  website?: string;
  backgroundImage?: string;
  description?: string;
  address?: string;
  cardId?: string;
  cardUrl?: string;
  socials?: {
    instagram?: string;
    linkedin?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
    whatsapp?: string;
    tiktok?: string;
  };
  websites?: Array<{
    id: string;
    platform: string;
    url: string;
    label: string;
    image?: string;
  }>;
  portfolioSettings?: PortfolioSettings | null;
  portfolioProjectsCount?: number;
  skills?: string[];
  products?: Array<{
    id: string;
    name: string;
    price: string;
    image?: string;
  }>;
  digitalProducts?: Array<{
    id: string;
    title: string;
    description?: string;
    type: string;
    price: number;
    currency: string;
    is_free: boolean;
    thumbnail_url?: string;
    file_url?: string;
    preview_url?: string;
  }>;
  mediaContent?: Array<{
    id: string;
    type: string;
    url: string;
    thumbnail_url?: string;
    metadata?: any;
    duration?: number;
  }>;
  // Design tokens
  theme?: string; // ex: 'blue-600/10'
  font_family?: string; // ex: 'font-inter'
  events?: Array<{
    id: string;
    title: string;
    description?: string;
    event_type: 'physical' | 'online' | 'hybrid';
    start_date: string;
    end_date: string;
    location_name?: string;
    cover_image_url?: string;
    is_free: boolean;
    current_attendees: number;
    max_capacity?: number;
    has_live_stream?: boolean;
    live_stream_status?: 'scheduled' | 'live' | 'ended';
  }>;
}

const BusinessCardModern: React.FC<BusinessCardProps> = memo(({
  name,
  title,
  company,
  companyLogo,
  location,
  avatar,
  email,
  phone,
  website,
  backgroundImage,
  description,
  address,
  cardId,
  cardUrl,
  socials,
  websites = [],
  skills = [],
  products = [],
  digitalProducts = [],
  mediaContent = [],
  theme,
  font_family,
  portfolioSettings = null,
  portfolioProjectsCount = 0,
  events = []
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeSlider, setActiveSlider] = useState<'liens' | 'boutique'>('liens');
  const trackClick = useClickTracking();

  // Utilisation des hooks personnalisés
  const { loadingImages, imageCache, handleImageLoad, handleImageStart } = useImageOptimization(websites);
  const {
    hasPhysicalProducts,
    hasDigitalProducts,
    hasProducts,
    hasMedia,
    hasCombinedMedia,
    hasBoutiqueContent,
    shouldShowSlider,
    hasLiensContent,
    shouldShowMediaSection,
    combinedMediaContent
  } = useCardContent({
    products,
    digitalProducts,
    mediaContent,
    description,
    events,
    portfolioSettings,
    portfolioProjectsCount,
  });


  // Dynamic display logic
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [productOrderModal, setProductOrderModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [orderForm, setOrderForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    message: ''
  });

  // Design from DB
  const [dbTheme, setDbTheme] = useState<string | undefined>(undefined);
  const [dbFontFamily, setDbFontFamily] = useState<string | undefined>(undefined);
  const [dbPartyTheme, setDbPartyTheme] = useState<any>(null);

  // Plan du propriétaire de la carte
  const [ownerPlanType, setOwnerPlanType] = useState<string | null>(null);
  const [cardOwnerId, setCardOwnerId] = useState<string | null>(null);
  const [hasAvailabilityConfig, setHasAvailabilityConfig] = useState(false);

  // Vérifier si le propriétaire peut prendre des RDV
  const isOwnerViewing = user && cardOwnerId ? user.id === cardOwnerId : false;

  // Déterminer si les RDV sont activés pour ce plan
  const canBookAppointments = useMemo(() => {
    // Cas 3: Fallback pour vue publique (RLS) - Si config existe
    // On vérifie en priorité pour éviter le blocage si ownerPlanType est null (comportement normal pour visiteur)
    if (hasAvailabilityConfig) return true;

    if (!ownerPlanType) return false;

    // Vérifier dans les nouveaux plans
    const newPlanFeatures = NEW_PLAN_FEATURES[ownerPlanType as PlanType];
    if (newPlanFeatures && newPlanFeatures.hasAppointments) return true;

    // Vérifier dans les anciens plans
    const legacyPlanFeatures = PLAN_FEATURES[ownerPlanType as PlanType];
    if (legacyPlanFeatures && legacyPlanFeatures.hasAppointments) return true;

    return false;
  }, [ownerPlanType, hasAvailabilityConfig]);

  console.log('DEBUG - Appointment visibility:', {
    ownerPlanType,
    canBookAppointments,
    isOwnerViewing,
    userId: user?.id,
    cardOwnerId,
    hasAvailabilityConfig
  });

  useEffect(() => {
    const fetchDesign = async () => {
      try {
        if (!cardId) return;

        // Récupérer les données de la carte et le plan du propriétaire
        const { data: cardData, error: cardError } = await supabase
          .from('business_cards')
          .select('theme, font_family, custom_fields, party_theme_id, user_id')
          .eq('id', cardId)
          .single();

        if (cardError) {
          // Error log removed
          return;
        }

        // Stocker l'ID du propriétaire de la carte
        setCardOwnerId(cardData.user_id);

        // Récupérer le plan du propriétaire avec mapping des nouveaux plans
        if (cardData.user_id) {
          const { data: subscriptionData, error: subscriptionError } = await supabase
            .from('user_subscriptions')
            .select('plan_type')
            .eq('user_id', cardData.user_id)
            .in('status', ['active', 'trial'])
            .maybeSingle();

          if (!subscriptionError && subscriptionData) {
            // Mapper les plans de la DB vers les enums de l'application
            const dbPlanType = subscriptionData.plan_type;
            let mappedPlanType = dbPlanType;

            // Mapping des plans pour cohérence
            if (dbPlanType === 'decouverte' || dbPlanType === 'free' || dbPlanType === 'essentiel') {
              mappedPlanType = PlanType.ESSENTIEL;
            } else if (dbPlanType === 'business') {
              mappedPlanType = PlanType.BUSINESS;
            } else if (dbPlanType === 'pro' || dbPlanType === 'magic') {
              mappedPlanType = PlanType.MAGIC;
            } else if (dbPlanType === 'connexions') {
              mappedPlanType = PlanType.CONNEXIONS;
            } else if (dbPlanType === 'commerce') {
              mappedPlanType = PlanType.COMMERCE;
            } else if (dbPlanType === 'opere') {
              mappedPlanType = PlanType.OPERE;
            }

            setOwnerPlanType(mappedPlanType);
            console.log('DEBUG - Plan mapping:', {
              dbPlanType,
              mappedPlanType,
              cardOwnerId: cardData.user_id,
              userId: user?.id,
              isOwnerViewing: user && cardData.user_id ? user.id === cardData.user_id : false,
              canBookAppointments: canBookAppointments
            });
          }
        }

        // Fallback: Vérifier si une configuration de disponibilité existe pour cette carte
        // Ceci permet d'afficher le bouton même si on ne peut pas lire le plan (RLS)
        const { count: availabilityCount } = await supabase
          .from('card_availability_settings')
          .select('*', { count: 'exact', head: true })
          .eq('card_id', cardId);

        if (availabilityCount && availabilityCount > 0) {
          setHasAvailabilityConfig(true);
          console.log('DEBUG - Found availability config, enabling appointments fallback');
        }

        const t = (cardData as any)?.theme as string | undefined;
        const f = (cardData as any)?.font_family as string | undefined;
        const fFromCustom = (cardData as any)?.custom_fields?.font_family as string | undefined;
        const partyThemeId = (cardData as any)?.party_theme_id as string | undefined;

        setDbTheme(t);
        setDbFontFamily(f || fFromCustom);

        // Si un thème de fête est sélectionné, vérifier s'il est encore actif
        if (partyThemeId) {
          const { data: partyThemeData, error: partyThemeError } = await supabase
            .from('themes_party')
            .select(`
              *,
              party:party(*)
            `)
            .eq('id', partyThemeId)
            .single();

          if (!partyThemeError && partyThemeData) {
            const party = (partyThemeData as any)?.party;
            if (!party) return;
            const now = new Date();
            const startDate = party.start_date ? new Date(party.start_date) : null;
            const endDate = party.end_date ? new Date(party.end_date) : null;

            // Vérifier si la fête est encore active
            const isActive = party.is_active &&
              (!startDate || now >= startDate) &&
              (!endDate || now <= endDate);

            if (isActive) {
              setDbPartyTheme(partyThemeData);
              // Log removed
            } else {
              // La fête n'est plus active, retirer le thème
              setDbPartyTheme(null);
              // Log removed

              // Optionnel: nettoyer la base de données
              if (cardId) {
                await supabase
                  .from('business_cards')
                  // @ts-ignore - party_theme_id existe dans la table mais n'est pas dans les types générés
                  .update({ party_theme_id: null })
                  .eq('id', cardId);
              }
            }
          } else {
            setDbPartyTheme(null);
          }
        }

        // Log removed
      } catch (e) {
        // Error log removed
      }
    };
    fetchDesign();
  }, [cardId]);

  // Load Google font for dbFontFamily and apply inline fallback
  const FONT_GOOGLE_MAP: Record<string, { label: string; google: string }> = {
    'font-inter': { label: 'Inter', google: 'Inter' },
    'font-poppins': { label: 'Poppins', google: 'Poppins' },
    'font-manrope': { label: 'Manrope', google: 'Manrope' },
    'font-montserrat': { label: 'Montserrat', google: 'Montserrat' },
    'font-dm-sans': { label: 'DM Sans', google: 'DM+Sans' },
    'font-nunito': { label: 'Nunito', google: 'Nunito' },
    'font-nunito-sans': { label: 'Nunito Sans', google: 'Nunito+Sans' },
    'font-outfit': { label: 'Outfit', google: 'Outfit' },
    'font-plus-jakarta': { label: 'Plus Jakarta', google: 'Plus+Jakarta+Sans' },
    'font-rubik': { label: 'Rubik', google: 'Rubik' },
    'font-urbanist': { label: 'Urbanist', google: 'Urbanist' },
    'font-raleway': { label: 'Raleway', google: 'Raleway' },
    'font-lato': { label: 'Lato', google: 'Lato' },
    'font-open-sans': { label: 'Open Sans', google: 'Open+Sans' },
    'font-roboto': { label: 'Roboto', google: 'Roboto' },
    'font-roboto-condensed': { label: 'Roboto Condensed', google: 'Roboto+Condensed' },
    'font-worksans': { label: 'Work Sans', google: 'Work+Sans' },
    'font-quicksand': { label: 'Quicksand', google: 'Quicksand' },
    'font-josefin': { label: 'Josefin Sans', google: 'Josefin+Sans' },
    'font-lexend': { label: 'Lexend', google: 'Lexend' },
    'font-mulish': { label: 'Mulish', google: 'Mulish' },
    'font-barlow': { label: 'Barlow', google: 'Barlow' },
    'font-oxygen': { label: 'Oxygen', google: 'Oxygen' },
    'font-asap': { label: 'Asap', google: 'Asap' },
    'font-fira-sans': { label: 'Fira Sans', google: 'Fira+Sans' },
    'font-source-sans': { label: 'Source Sans 3', google: 'Source+Sans+3' },
    'font-space-grotesk': { label: 'Space Grotesk', google: 'Space+Grotesk' },
    'font-karla': { label: 'Karla', google: 'Karla' },
    'font-overpass': { label: 'Overpass', google: 'Overpass' },
    'font-cabin': { label: 'Cabin', google: 'Cabin' },
    'font-pt-sans': { label: 'PT Sans', google: 'PT+Sans' },
    'font-heebo': { label: 'Heebo', google: 'Heebo' },
    'font-be-vietnam-pro': { label: 'Be Vietnam Pro', google: 'Be+Vietnam+Pro' },
    'font-syne': { label: 'Syne', google: 'Syne' },
    'font-anton': { label: 'Anton', google: 'Anton' },
    'font-bebas': { label: 'Bebas Neue', google: 'Bebas+Neue' },
    'font-bebas-neue': { label: 'Bebas Neue', google: 'Bebas+Neue' },
    'font-playfair': { label: 'Playfair Display', google: 'Playfair+Display' },
    'font-merriweather': { label: 'Merriweather', google: 'Merriweather' },
    'font-lora': { label: 'Lora', google: 'Lora' },
    'font-dm-serif': { label: 'DM Serif Text', google: 'DM+Serif+Text' },
    'font-dm-serif-display': { label: 'DM Serif Display', google: 'DM+Serif+Display' },
    'font-cormorant': { label: 'Cormorant', google: 'Cormorant' },
    'font-cormorant-garamond': { label: 'Cormorant Garamond', google: 'Cormorant+Garamond' },
    'font-crimson-pro': { label: 'Crimson Pro', google: 'Crimson+Pro' },
    'font-eb-garamond': { label: 'EB Garamond', google: 'EB+Garamond' },
    'font-abril-fatface': { label: 'Abril Fatface', google: 'Abril+Fatface' },
    'font-oswald': { label: 'Oswald', google: 'Oswald' },
    'font-righteous': { label: 'Righteous', google: 'Righteous' },
    'font-paytone': { label: 'Paytone One', google: 'Paytone+One' },
    'font-saira': { label: 'Saira', google: 'Saira' },
    'font-titillium': { label: 'Titillium Web', google: 'Titillium+Web' },
    'font-ubuntu': { label: 'Ubuntu', google: 'Ubuntu' },
    'font-alegreya': { label: 'Alegreya', google: 'Alegreya' },
    'font-spectral': { label: 'Spectral', google: 'Spectral' },
    'font-zen-kaku': { label: 'Zen Kaku Gothic', google: 'Zen+Kaku+Gothic+New' },
    'font-space-mono': { label: 'Space Mono', google: 'Space+Mono' },
    'font-ibm-plex-sans': { label: 'IBM Plex Sans', google: 'IBM+Plex+Sans' },
    'font-ibm-plex-serif': { label: 'IBM Plex Serif', google: 'IBM+Plex+Serif' },
    'font-ibm-plex-mono': { label: 'IBM Plex Mono', google: 'IBM+Plex+Mono' },
    'font-jetbrains-mono': { label: 'JetBrains Mono', google: 'JetBrains+Mono' },
    'font-fira-code': { label: 'Fira Code', google: 'Fira+Code' },
    'font-source-code-pro': { label: 'Source Code Pro', google: 'Source+Code+Pro' }
  };

  useEffect(() => {
    const cls = dbFontFamily;
    if (!cls) return;
    const googleName = FONT_GOOGLE_MAP[cls]?.google;
    if (!googleName) return;
    const id = 'business-card-font-loader';
    const href = `https://fonts.googleapis.com/css2?family=${googleName}:wght@400;500;600;700&display=swap`;
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = href;
  }, [dbFontFamily]);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [productDetailsModal, setProductDetailsModal] = useState(false);
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<any>(null);
  const [showDescription, setShowDescription] = useState(false);



  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();

  const getPublicUrl = (path: string, bucket: string = 'avatars') => {
    if (!path) return "";
    if (path.startsWith('http')) return path;
    const url = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    return url;
  };

  // Si backgroundImage est déjà une URL complète, l'utiliser directement
  const coverImageUrl = useMemo(() => {
    if (!backgroundImage) return "";
    if (backgroundImage.startsWith('http')) return backgroundImage;
    return getPublicUrl(backgroundImage, 'card-covers');
  }, [backgroundImage]);

  const avatarUrl = useMemo(() => {
    if (!avatar) return "";
    if (avatar.startsWith('http')) return avatar;
    return getPublicUrl(avatar, 'avatars');
  }, [avatar]);


  // Fonction pour télécharger le QR Code
  const handleDownloadQR = async () => {
    if (!cardUrl) return;

    try {
      setIsDownloading(true);

      // Créer un canvas pour générer l'image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const size = 400; // Taille haute résolution
      canvas.width = size;
      canvas.height = size;

      // Créer l'image du QR Code
      const qrImage = new Image();
      qrImage.crossOrigin = 'anonymous';

      qrImage.onload = () => {
        if (ctx) {
          // Fond blanc
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, size, size);

          // Dessiner le QR Code
          ctx.drawImage(qrImage, 50, 50, size - 100, size - 100);

          // Ajouter le texte en bas
          ctx.fillStyle = '#374151';
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(t('businessCard.digitalBusinessCard'), size / 2, size - 20);

          // Télécharger l'image
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `qr-code-${name.replace(/\s+/g, '-').toLowerCase()}.png`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }
          }, 'image/png');
        }
      };

      qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(cardUrl)}`;

    } catch (error) {
      // Error log removed
    } finally {
      setIsDownloading(false);
    }
  };

  // Fonction pour partager le QR Code
  const handleShareQR = async () => {
    if (!cardUrl) return;

    try {
      setIsSharing(true);

      // Vérifier si l'API Web Share est disponible
      if (navigator.share) {
        await navigator.share({
          title: `Carte de visite de ${name}`,
          text: `Découvrez la carte de visite numérique de ${name}`,
          url: cardUrl,
        });
      } else {
        // Fallback: copier l'URL dans le presse-papiers
        await navigator.clipboard.writeText(cardUrl);

        // Afficher une notification (vous pouvez remplacer par un toast)
        alert(`Lien copié dans le presse-papiers: ${cardUrl}`);
      }
    } catch (error) {
      // Error log removed

      // Fallback: copier l'URL
      try {
        await navigator.clipboard.writeText(cardUrl);
        alert(`Lien copié dans le presse-papiers: ${cardUrl}`);
      } catch (clipboardError) {
        // Error log removed
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Fonction pour télécharger la vCard
  const handleDownloadVCard = async () => {
    try {
      await downloadVCard({
        name,
        title,
        company,
        email,
        phone,
        website,
        avatar,
        address,
        description,
        cardUrl,
        socials
      });
      if (cardId) {
        trackClick({ cardId, linkType: 'vcard', linkLabel: 'download_vcard' });
      }
    } catch (error) {
      // Error log removed
    }
  };

  // Fonction pour ouvrir le modal de commande
  const handleProductOrder = (product: any) => {
    setSelectedProduct(product);
    setProductOrderModal(true);
    // Reset du formulaire
    setOrderForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      message: ''
    });
  };

  // Fonction pour ouvrir le modal de détails du produit
  const handleProductDetails = (product: any) => {
    setSelectedProductForDetails(product);
    setProductDetailsModal(true);
  };

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
      alert('Veuillez remplir tous les champs obligatoires (*)');
      return;
    }

    setIsSubmittingOrder(true);

    try {
      // Simulation d'un appel API
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Ici vous pouvez ajouter la logique pour envoyer la commande
      // Par exemple, envoyer à Supabase ou à votre API

      // Afficher un message de succès
      alert(`Commande confirmée !\n\nProduit: ${selectedProduct.name || selectedProduct.title}\nPrix: ${selectedProduct.price || (selectedProduct.is_free ? 'Gratuit' : `${selectedProduct.price} ${selectedProduct.currency}`)}\n\nNous vous contacterons bientôt pour finaliser la commande.`);

      // Fermer le modal et reset le formulaire
      setProductOrderModal(false);
      setOrderForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        message: ''
      });

    } catch (error) {
      // Error log removed
      alert('Une erreur est survenue lors de la soumission de votre commande. Veuillez réessayer.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };


  // THEME background class
  const themeToken = (dbTheme || theme) as string | undefined;
  const token = typeof themeToken === 'string' ? themeToken : 'gray-100/10';
  const bgClass = {
    'slate-500/10': 'bg-slate-500/10', 'slate-600/10': 'bg-slate-600/10', 'slate-700/10': 'bg-slate-700/10',
    'gray-500/10': 'bg-gray-500/10', 'gray-600/10': 'bg-gray-600/10', 'gray-700/10': 'bg-gray-700/10',
    'zinc-500/10': 'bg-zinc-500/10', 'zinc-600/10': 'bg-zinc-600/10', 'zinc-700/10': 'bg-zinc-700/10',
    'neutral-500/10': 'bg-neutral-500/10', 'neutral-600/10': 'bg-neutral-600/10', 'neutral-700/10': 'bg-neutral-700/10',
    'stone-500/10': 'bg-stone-500/10', 'stone-600/10': 'bg-stone-600/10', 'stone-700/10': 'bg-stone-700/10',
    'red-500/10': 'bg-red-500/10', 'red-600/10': 'bg-red-600/10', 'red-700/10': 'bg-red-700/10',
    'orange-500/10': 'bg-orange-500/10', 'orange-600/10': 'bg-orange-600/10', 'orange-700/10': 'bg-orange-700/10',
    'amber-500/10': 'bg-amber-500/10', 'amber-600/10': 'bg-amber-600/10', 'amber-700/10': 'bg-amber-700/10',
    'yellow-500/10': 'bg-yellow-500/10', 'yellow-600/10': 'bg-yellow-600/10', 'yellow-700/10': 'bg-yellow-700/10',
    'lime-500/10': 'bg-lime-500/10', 'lime-600/10': 'bg-lime-600/10', 'lime-700/10': 'bg-lime-700/10',
    'green-500/10': 'bg-green-500/10', 'green-600/10': 'bg-green-600/10', 'green-700/10': 'bg-green-700/10',
    'emerald-500/10': 'bg-emerald-500/10', 'emerald-600/10': 'bg-emerald-600/10', 'emerald-700/10': 'bg-emerald-700/10',
    'teal-500/10': 'bg-teal-500/10', 'teal-600/10': 'bg-teal-600/10', 'teal-700/10': 'bg-teal-700/10',
    'cyan-500/10': 'bg-cyan-500/10', 'cyan-600/10': 'bg-cyan-600/10', 'cyan-700/10': 'bg-cyan-700/10',
    'sky-500/10': 'bg-sky-500/10', 'sky-600/10': 'bg-sky-600/10', 'sky-700/10': 'bg-sky-700/10',
    'blue-500/10': 'bg-blue-500/10', 'blue-600/10': 'bg-blue-600/10', 'blue-700/10': 'bg-blue-700/10',
    'indigo-500/10': 'bg-indigo-500/10', 'indigo-600/10': 'bg-indigo-600/10', 'indigo-700/10': 'bg-indigo-700/10',
    'violet-500/10': 'bg-violet-500/10', 'violet-600/10': 'bg-violet-600/10', 'violet-700/10': 'bg-violet-700/10',
    'purple-500/10': 'bg-purple-500/10', 'purple-600/10': 'bg-purple-600/10', 'purple-700/10': 'bg-purple-700/10',
    'fuchsia-500/10': 'bg-fuchsia-500/10', 'fuchsia-600/10': 'bg-fuchsia-600/10', 'fuchsia-700/10': 'bg-fuchsia-700/10',
    'pink-500/10': 'bg-pink-500/10', 'pink-600/10': 'bg-pink-600/10', 'pink-700/10': 'bg-pink-700/10',
    'rose-500/10': 'bg-rose-500/10', 'rose-600/10': 'bg-rose-600/10', 'rose-700/10': 'bg-rose-700/10'
  }[token] || 'bg-gray-500/10';

  // Font class
  const fontClass = (dbFontFamily || font_family) as string | undefined;

  // Inline fallback font-family to force rendering even if Tailwind class not present yet
  const fontLabel = FONT_GOOGLE_MAP[dbFontFamily || '']?.label;
  const inlineFontStyle: React.CSSProperties = fontLabel
    ? { fontFamily: `'${fontLabel}', sans-serif` }
    : {};

  return (
    <div className="relative">
      {/* Main card container with premium styling - pas de voile / ombre sur la carte */}
      <div 
        className={`relative max-w-sm mx-auto ${fontClass || ''} ${bgClass} overflow-hidden rounded-[32px] `} 
        style={{
          ...inlineFontStyle,
          willChange: 'transform',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden'
        }}
      >
        {/* Image de couverture en arrière-plan de toute la carte - COUVRE TOUTE LA CARTE */}
        {coverImageUrl && (
          <div className="absolute inset-0 z-0">
            <CardImageOptimizer
              src={coverImageUrl}
              alt="Cover"
              className="w-full h-full object-cover"
              type="cover"
              priority={true}
            />
          </div>
        )}

        {/* Contenu de la carte avec z-index supérieur */}
        <div className="relative z-10">
          <BusinessCardHeaderModern
            name={name}
            initials={initials}
            avatar={avatar}
            avatarUrl={avatarUrl}
            coverImageUrl={coverImageUrl}
            company={company}
            companyLogo={companyLogo}
            phone={phone}
            email={email}
            socials={socials}
            cardId={cardId}
            trackClick={trackClick}
            dbPartyTheme={dbPartyTheme}
            shouldShowSlider={shouldShowSlider}
            activeSlider={activeSlider}
            setActiveSlider={setActiveSlider}
            getPublicUrl={getPublicUrl}
          />

          {/* SLIDER PRINCIPAL - Affichage conditionnel */}
          {shouldShowSlider ? (
            <CardSliderContent
              activeSlider={activeSlider}
              description={description}
              websites={websites}
              loadingImages={loadingImages}
              onImageLoad={handleImageLoad}
              cardId={cardId}
              trackClick={trackClick}
              combinedMediaContent={combinedMediaContent}
              onSwitchToBoutique={() => setActiveSlider('boutique')}
              onQRCodeClick={() => {
                setQrDialogOpen(true);
                if (cardId) {
                  trackClick({ cardId, linkType: 'website', linkLabel: 'qr_open', linkUrl: cardUrl });
                }
              }}
              onVCardClick={handleDownloadVCard}
              onAppointmentClick={() => {
                setAppointmentDialogOpen(true);
                if (cardId) {
                  trackClick({ cardId, linkType: 'appointment', linkLabel: 'open_appointment' });
                }
              }}
              canBookAppointments={canBookAppointments}
              events={events}
              products={products}
              digitalProducts={digitalProducts}
              onProductClick={handleProductDetails}
              portfolioSettings={portfolioSettings}
              portfolioProjectsCount={portfolioProjectsCount}
              cardUrl={cardUrl}
            />
          ) : null}

          <AppointmentModal
            isOpen={appointmentDialogOpen}
            onOpenChange={setAppointmentDialogOpen}
            cardId={cardId}
          />

          <QrCodeModal
            isOpen={qrDialogOpen}
            onOpenChange={setQrDialogOpen}
            cardUrl={cardUrl}
            name={name}
            onDownload={handleDownloadQR}
            onShare={handleShareQR}
            isDownloading={isDownloading}
            isSharing={isSharing}
          />

          <ProductOrderModal
            isOpen={productOrderModal}
            onOpenChange={setProductOrderModal}
            selectedProduct={selectedProduct}
            orderForm={orderForm}
            onFormChange={handleFormChange}
            onSubmit={handleSubmitOrder}
            isSubmitting={isSubmittingOrder}
          />

          {/* Contenu par défaut si pas de produits */}
          {!shouldShowSlider && (
            <DefaultCardContent
              description={description}
              showDescription={showDescription}
              setShowDescription={setShowDescription}
              shouldShowMediaSection={shouldShowMediaSection}
              combinedMediaContent={combinedMediaContent}
              onSwitchToBoutique={() => setActiveSlider('boutique')}
              onQRCodeClick={() => setQrDialogOpen(true)}
              onVCardClick={handleDownloadVCard}
              onAppointmentClick={() => {
                setAppointmentDialogOpen(true);
                if (cardId) {
                  trackClick({ cardId, linkType: 'appointment', linkLabel: 'open_appointment' });
                }
              }}
              cardId={cardId}
              trackClick={trackClick}
              canBookAppointments={canBookAppointments}
              dbPartyTheme={dbPartyTheme}
            />
          )}

          {/* Modal de détails du produit */}
          {selectedProductForDetails && (
            <Dialog open={productDetailsModal} onOpenChange={setProductDetailsModal}>
              <DialogContent className="sm:max-w-[500px] glass-card border-2 border-white/30 shadow-2xl rounded-2xl p-6 mt-4">
                <DialogHeader>
                  <DialogTitle className="sr-only">{t('businessCard.productDetails')}</DialogTitle>
                  <DialogDescription className="sr-only">{t('publicCardActions.productDetailsDescription')}</DialogDescription>
                </DialogHeader>
                <Suspense fallback={<div className="p-6 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>}>
                  <ProductDetailsDialog
                    product={selectedProductForDetails}
                    cardId={cardId || ''}
                  />
                </Suspense>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
});

export default BusinessCardModern;