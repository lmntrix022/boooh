import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { ModernCardForm } from "@/components/forms/ModernCardForm";
import { usePremiumToast } from "@/hooks/usePremiumToast";
import { supabase } from "@/integrations/supabase/client";
import { mediaService } from "@/services/mediaService";
import { useSubscription } from "@/hooks/useSubscription";
import { Loader2 } from "lucide-react";
import SubscriptionMessagesService from "@/services/subscriptionMessages";
import { useQueryClient } from "@tanstack/react-query";

const CreateCard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const toast = usePremiumToast();
  const queryClient = useQueryClient();
  const { features, isLoading: subscriptionLoading, planType } = useSubscription();
  const [cardsCount, setCardsCount] = useState<number | null>(null);
  const [checkingQuota, setCheckingQuota] = useState(true);
  const hasRedirected = useRef(false);

  // Vérifier le quota de cartes
  useEffect(() => {
    const checkQuota = async () => {
      if (!user?.id) {
        setCheckingQuota(false);
        return;
      }

      try {
        const { count, error } = await supabase
          .from('business_cards')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (error) throw error;

        setCardsCount(count || 0);
      } catch (error) {
        // Error log removed
        toast.error('❌ Erreur', 'Impossible de vérifier votre quota de cartes. Veuillez réessayer.');
      } finally {
        setCheckingQuota(false);
      }
    };

    if (!subscriptionLoading) {
      checkQuota();
    }
  }, [user?.id, subscriptionLoading]);

  // Vérifier si l'utilisateur a atteint son quota et rediriger
  useEffect(() => {
    // Ne vérifier que si les données sont chargées
    if (authLoading || subscriptionLoading || checkingQuota) {
      return;
    }

    // Si déjà redirigé, ne rien faire
    if (hasRedirected.current) {
      return;
    }

    const maxCards = features.maxCards;
    const hasReachedQuota = maxCards !== -1 && cardsCount !== null && cardsCount >= maxCards;

    if (hasReachedQuota) {
      // Marquer comme redirigé pour éviter les boucles
      hasRedirected.current = true;

      // Obtenir le message personnalisé
      const message = SubscriptionMessagesService.getQuotaExceededMessage(
        'card',
        cardsCount,
        maxCards,
        planType
      );

      // Afficher le toast avec title et description
      toast.warning(message.title, message.description);

      // Redirection avec un petit délai pour que le toast s'affiche
      setTimeout(() => {
        navigate('/pricing', { replace: true });
      }, 100);
    }
  }, [authLoading, subscriptionLoading, checkingQuota, cardsCount, features.maxCards, navigate, planType]);

  // Afficher un loader pendant la vérification
  if (authLoading || subscriptionLoading || checkingQuota) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
        </div>
      </DashboardLayout>
    );
  }

  // Vérifier le quota AVANT d'afficher le formulaire
  const maxCards = features.maxCards;
  const hasReachedQuota = maxCards !== -1 && cardsCount !== null && cardsCount >= maxCards;

  // Si le quota est atteint, ne rien afficher (la redirection se fera via useEffect)
  if (hasReachedQuota) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
        </div>
      </DashboardLayout>
    );
  }

  // Fonction de sauvegarde
  const handleSave = async (data: any) => {
    // Log removed
    // Log removed
    // Log removed
    // Log removed
    
    if (!user) throw new Error("Utilisateur non connecté");

    try {
      const { data: cardData, error: cardError } = await supabase
        .from("business_cards")
        .insert({
          user_id: user.id,
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
          latitude: data.selectedLocation?.latitude || null,
          longitude: data.selectedLocation?.longitude || null,
          custom_fields: {
            location: data.location,
            backgroundColor: data.backgroundColor,
            backgroundImage: data.backgroundImage,
            skills: data.skills ? data.skills.split(',').map((s: string) => s.trim()) : [],
          },
        })
        .select()
        .single();
        
      if (cardError) throw cardError;
      
      // Log removed
      // Log removed
      
      // Gérer les liens sociaux
      const socialLinks = [];
      if (data.linkedin) socialLinks.push({ platform: 'linkedin', url: data.linkedin, card_id: cardData.id });
      if (data.instagram) socialLinks.push({ platform: 'instagram', url: data.instagram, card_id: cardData.id });
      if (data.twitter) socialLinks.push({ platform: 'twitter', url: data.twitter, card_id: cardData.id });

      if (socialLinks.length > 0) {
        const { error: socialError } = await supabase
          .from("social_links")
          .insert(socialLinks);
          
        if (socialError) {
          // Error log removed
        }
      }

      // Gérer le contenu média
      // Log removed
      // Log removed
      
      if (data.mediaContent && data.mediaContent.length > 0) {
        // Log removed
        
        try {
          for (let i = 0; i < data.mediaContent.length; i++) {
            const media = data.mediaContent[i];
            // Log removed
            
            const mediaToSave = {
              ...media,
              card_id: cardData.id,
              order_index: i
            };
            // Log removed
            
            const savedMedia = await mediaService.createMedia(mediaToSave, cardData.id);
            // Log removed
          }
          // Log removed
        } catch (mediaError) {
          // Error log removed
          // Error log removed
          // Ne pas faire échouer la création de carte si les médias échouent
        }
      } else {
        // Log removed
      }

      // Forcer le refetch immédiatement des requêtes pour forcer le rechargement
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["user-cards"] }),
        queryClient.refetchQueries({ queryKey: ["dashboard-data"] })
      ]);
      
      return cardData;
    } catch (error: any) {
      // Error log removed
      throw new Error(error.message || "Erreur lors de la création de la carte");
    }
  };

  // Fonction de publication
  const handlePublish = async (data: any) => {
    try {
      await handleSave(data);
      toast.cardCreated();
      
      // Forcer le refetch et attendre un peu plus longtemps
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["user-cards"] }),
        queryClient.refetchQueries({ queryKey: ["dashboard-data"] })
      ]);
      
      // Attendre encore un peu pour être sûr
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      navigate("/dashboard");
    } catch (error: any) {
      toast.error("Erreur", error.message);
    }
  };

  // Redirection si non connecté
  if (!user && !authLoading) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <DashboardLayout>
      <ModernCardForm
        mode="create"
        onSave={handleSave}
        onPublish={handlePublish}
      />
    </DashboardLayout>
  );
};

export default CreateCard;
