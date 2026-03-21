import React, { useState, useEffect } from "react";
import { useNavigate, Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { ModernCardForm } from "@/components/forms/ModernCardForm";
import { usePremiumToast } from "@/hooks/usePremiumToast";
import { supabase } from "@/integrations/supabase/client";
import { mediaService } from "@/services/mediaService";
import { Loader2 } from "lucide-react";
import { AnimatedOrbs } from "@/components/ui/AnimatedOrbs";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks/useLanguage";

interface WebsiteData {
  id: string;
  url: string;
  label: string;
  image: string | null;
}

const EditCard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const toast = usePremiumToast();
  const { t } = useLanguage();
  const [loadingCard, setLoadingCard] = useState(true);
  const [initialData, setInitialData] = useState<any>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [existingCustomFields, setExistingCustomFields] = useState<any>({});

  // Charger les données de la carte
  useEffect(() => {
    
    // Éviter les appels multiples
    if (hasFetched) {
      // Initial data processing
      return;
    }

    // Attendre que l'authentification soit terminée
    if (authLoading) {
      return;
    }
    
    // Vérifier que l'ID et l'utilisateur sont disponibles
    if (!id) {
      toast.error(t('editCard.errors.error'), t('editCard.errors.missingCardId'));
      navigate('/dashboard');
      return;
    }
    
    if (!user) {
      // Log removed
      return; // Le Navigate sera géré plus bas
    }
    
    const fetchCard = async () => {
      try {
        // Log removed
        setLoadingCard(true);
        
        // Récupérer la carte
        const { data: card, error: cardError } = await supabase
          .from("business_cards")
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
          
        // Log removed
          
        if (cardError) {
          // Error log removed
          throw cardError;
        }
        
        if (!card) {
          // Log removed
          toast.error(t('editCard.errors.error'), t('editCard.errors.cardNotFound'));
          navigate('/dashboard');
          return;
        }
        
        // Récupérer les liens sociaux
        const { data: socialLinks, error: linksError } = await supabase
          .from("social_links")
          .select('*')
          .eq('card_id', id);
          
        if (linksError) {
          // Error log removed
        }
        
        // Récupérer le contenu média
        const { data: mediaContent, error: mediaError } = await supabase
          .from("media_content")
          .select('*')
          .eq('card_id', id)
          .eq('is_active', true)
          .order('order_index', { ascending: true });
          
        if (mediaError) {
          // Error log removed
        }
        
        // Log removed
        
        // Préparer les données pour le formulaire moderne
        const formData = {
          // Informations de base
          name: card.name || "",
          title: card.title || "",
          company: card.company || "",
          description: card.description || "",
          
          // Contact
          email: card.email || "",
          phone: card.phone || "",
          website: card.website || "",
          address: card.address || "",
          
          // Médias
          avatarUrl: card.avatar_url || "",
          coverImageUrl: card.cover_image_url || "",
          companyLogoUrl: card.company_logo_url || "",
          
          // Localisation
          selectedLocation: card.latitude && card.longitude ? {
            latitude: card.latitude,
            longitude: card.longitude
          } : null,
          
          // Design
          theme: card.theme || "classic",
          primaryColor: "#3B82F6",
          isPublic: card.is_public || true,
          font_family: (card as any).font_family || (card.custom_fields && (card.custom_fields as any).font_family) || 'font-poppins',
          party_theme_id: (card as any).party_theme_id || null,
          
          // Champs personnalisés
          location: "",
          skills: "",
          backgroundColor: "",
          
          // Réseaux sociaux
          linkedin: "",
          instagram: "",
          twitter: "",
          facebook: "",
          youtube: "",
          whatsapp: "",
          portfolio: "",
          tiktok: "",
          discord: "",
          github: "",
          websites: [] as WebsiteData[],
          
          // Contenu média
          mediaContent: mediaContent || []
        };

        // Traiter les champs personnalisés
        if (card.custom_fields) {
          const customFields = card.custom_fields as any;
          setExistingCustomFields(customFields);
          
          if (customFields.location) {
            formData.location = customFields.location;
          }
          
          if (customFields.skills && Array.isArray(customFields.skills)) {
            formData.skills = customFields.skills.join(', ');
          }
          
          if (customFields.backgroundColor) {
            formData.backgroundColor = customFields.backgroundColor;
          }
          

        }

        // Traiter les liens sociaux
        // Social links processing
        
        if (socialLinks) {
          // Social links loaded from DB
          const websites: WebsiteData[] = [];
          
          socialLinks.forEach((link: any) => {
            // Processing social link
            switch (link.platform) {
              case 'linkedin':
                formData.linkedin = link.url;
                break;
              case 'instagram':
                formData.instagram = link.url;
                break;
              case 'twitter':
                formData.twitter = link.url;
                break;
              case 'facebook':
                formData.facebook = link.url;
                break;
              case 'youtube':
                formData.youtube = link.url;
                break;
              case 'tiktok':
                formData.tiktok = link.url;
                break;
              case 'discord':
                formData.discord = link.url;
                break;
              case 'github':
                formData.github = link.url;
                break;
              case 'whatsapp':
                formData.whatsapp = link.url;
                break;
              case 'website':
                // Processing website link
                if (link.label) {
                  const websiteData = { 
                    id: link.id, 
                    url: link.url, 
                    label: link.label,
                    image: link.image || null
                  };
                  // Adding website to array
                  websites.push(websiteData);
                } else {
                  // Website link has no label, skipping
                }
                break;
            }
          });
          
          // Ajouter les sites web
          // Final websites array
          if (websites.length > 0) {
            formData.websites = websites;
            // Websites added to formData
          } else {
            // No websites to add
          }
        }
        
        // Log removed
        setInitialData(formData);
        setHasFetched(true);
        // Log removed
      } catch (error: any) {
        // Error log removed
        toast.error(t('editCard.errors.error'), t('editCard.errors.loadError'));
        setHasFetched(true); // Marquer comme terminé même en cas d'erreur
        navigate('/dashboard');
      } finally {
        // Log removed
        setLoadingCard(false);
      }
    };
    
    fetchCard();
  }, [id, user, authLoading]);

  // Fonction de sauvegarde
  const handleSave = async (data: any) => {
    // Handle save called
    // Form data processing
    
    if (!user || !id) throw new Error(t('editCard.errors.userNotConnected'));

    try {
      // Préparer les données pour la mise à jour
      const updateData = {
        name: data.name,
        title: data.title,
        company: data.company,
        email: data.email,
        phone: data.phone,
        website: data.website,
        address: data.address,
        description: data.description,
        is_public: data.isPublic || true,
        avatar_url: data.avatarUrl,
        cover_image_url: data.coverImageUrl,
        company_logo_url: data.companyLogoUrl,
        theme: data.theme,
        font_family: data.font_family,
        party_theme_id: data.party_theme_id,
        latitude: data.selectedLocation?.latitude || null,
        longitude: data.selectedLocation?.longitude || null,
        custom_fields: {
          ...existingCustomFields,
          location: data.location,
          backgroundColor: data.backgroundColor,
          font_family: data.font_family,

          skills: data.skills ? data.skills.split(',').map((s: string) => s.trim()) : [],
        },
        updated_at: new Date().toISOString()
      };

      // Mettre à jour la carte
      // Log removed
      const { data: updatedCard, error: cardError } = await supabase
        .from("business_cards")
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select('id, theme, custom_fields, font_family, party_theme_id')
        .single();
        
      if (cardError) throw cardError;
      
      // Log removed
      if (updatedCard) {
        // Log removed
      }
      
      // Gérer le contenu média
      // Log removed
      // Log removed
      
      if (data.mediaContent && data.mediaContent.length > 0) {
        // Log removed
        
        try {
          // Supprimer les anciens médias
          const { error: deleteMediaError } = await supabase
            .from('media_content')
            .delete()
            .eq('card_id', id);
            
          if (deleteMediaError) {
            // Error log removed
          } else {
            // Log removed
          }
          
          // Ajouter les nouveaux médias
          for (let i = 0; i < data.mediaContent.length; i++) {
            const media = data.mediaContent[i];
            // Log removed
            
            const mediaToSave = {
              ...media,
              card_id: id,
              order_index: i
            };
            // Log removed
            
            const savedMedia = await mediaService.createMedia(mediaToSave, id);
            // Log removed
          }
          // Log removed
        } catch (mediaError) {
          // Error log removed
          // Error log removed
          // Ne pas faire échouer la mise à jour de carte si les médias échouent
        }
      } else {
        // Log removed
        
        // Supprimer tous les médias existants si aucun nouveau média
        try {
          const { error: deleteMediaError } = await supabase
            .from('media_content')
            .delete()
            .eq('card_id', id);
            
          if (deleteMediaError) {
            // Error log removed
          } else {
            // Log removed
          }
        } catch (error) {
          // Error log removed
        }
      }
      
      // Supprimer les anciens liens sociaux
      const { error: deleteError } = await supabase
        .from("social_links")
        .delete()
        .eq('card_id', id);
        
      if (deleteError) {
        // Error log removed
      }

      // Ajouter les nouveaux liens sociaux
      const socialLinks = [];
      if (data.linkedin) socialLinks.push({ platform: 'linkedin', url: data.linkedin, card_id: id });
      if (data.instagram) socialLinks.push({ platform: 'instagram', url: data.instagram, card_id: id });
      if (data.twitter) socialLinks.push({ platform: 'twitter', url: data.twitter, card_id: id });
      if (data.facebook) socialLinks.push({ platform: 'facebook', url: data.facebook, card_id: id });
      if (data.youtube) socialLinks.push({ platform: 'youtube', url: data.youtube, card_id: id });
      if (data.tiktok) socialLinks.push({ platform: 'tiktok', url: data.tiktok, card_id: id });
      if (data.discord) socialLinks.push({ platform: 'discord', url: data.discord, card_id: id });
      if (data.github) socialLinks.push({ platform: 'github', url: data.github, card_id: id });
      if (data.whatsapp) socialLinks.push({ platform: 'whatsapp', url: data.whatsapp, card_id: id });
      
      // Gérer les sites web (qui incluent les portfolios)
      if (data.websites && Array.isArray(data.websites)) {
        // Websites data processing
        data.websites.forEach((website: WebsiteData) => {
          // Processing website data
          
          if (website.url && website.label) {
            const socialLink = { 
              platform: 'website', 
              url: website.url, 
              label: website.label,
              image: website.image || null,
              card_id: id 
            };
            // Social link to add
            socialLinks.push(socialLink);
          }
        });
      }
      
      if (socialLinks.length > 0) {
        // Social links to insert
        const { error: socialError } = await supabase
          .from("social_links")
          .insert(socialLinks);
          
        if (socialError) {
          // Error log removed
        } else {
          // Log removed
        }
      } else {
        // Log removed
      }
      
      // Pas de retour nécessaire pour onSave
    } catch (error: any) {
      // Error log removed
      throw new Error(error.message || t('editCard.errors.updateError'));
    }
  };

  // Fonction de publication
  const handlePublish = async (data: any) => {
    try {
      await handleSave(data);
      toast.cardUpdated();
      navigate(`/cards/${id}/view`);
    } catch (error: any) {
      toast.error(t('editCard.errors.error'), error.message);
    }
  };

  // Test simple - pas de redirection pour l'instant
  // Log removed

  // Redirection si non connecté
  if (!user && !authLoading) {
    // Log removed
    return <Navigate to="/auth" replace />;
  }

  // Attendre que l'authentification soit terminée
  if (authLoading) {
    // Log removed
  return (
    <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-gray-900 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('editCard.loading.verifyingAuth')}</h2>
            <p className="text-gray-600">{t('editCard.loading.loadingSession')}</p>
          </div>
            </div>
      </DashboardLayout>
    );
  }

  // Affichage du chargement
  if (loadingCard) {
    // Log removed
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-gray-900 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('editCard.loading.loadingCard')}</h2>
            <p className="text-gray-600">{t('editCard.loading.retrievingData')}</p>
                              </div>
                            </div>
      </DashboardLayout>
    );
  }

  // Affichage du formulaire moderne
  // Log removed
  
  if (!initialData) {
    // Log removed
    return (
      <DashboardLayout>
        <div className="relative min-h-screen">
          <AnimatedOrbs />

          <div className="container max-w-7xl py-6 px-4 md:px-6 relative z-10">
            <motion.div
              className="bg-white/60 backdrop-blur-md border border-gray-200/50 shadow-sm rounded-2xl overflow-hidden relative group min-h-[400px] flex items-center justify-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ scale: 1.01, boxShadow: '0 8px 32px 0 rgba(17,24,39,0.10)' }}
            >
              <motion.div
                className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-[20vw] h-[10vw] max-w-sm rounded-full bg-gray-100r from-blue-400/20 /20 to-white/0 blur-3xl opacity-30 animate-pulse-slow z-0"
                animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="text-center p-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="inline-block"
                >
                  <Loader2 className="h-16 w-16 text-gray-900 mx-auto mb-6" />
                </motion.div>
                <h2 className="text-2xl md:text-3xl font-bold gradient-text-3d mb-3">{t('editCard.loading.loadingCard')}</h2>
                <p className="text-lg text-gray-600">{t('editCard.loading.retrievingData')}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ModernCardForm
        mode="edit"
        initialData={initialData}
        onSave={handleSave}
        onPublish={handlePublish}
      />
    </DashboardLayout>
  );
};

export default EditCard;
