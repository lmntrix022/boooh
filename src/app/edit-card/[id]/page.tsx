"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ModernCardForm } from "@/components/forms/ModernCardForm";
import { usePremiumToast } from "@/hooks/usePremiumToast";
import { Loader2 } from "lucide-react";

// Type definition for business card data
type BusinessCardData = {
  id: string;
  name: string | null;
  title: string | null;
  company: string | null;
  description: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  company_logo_url: string | null;
  latitude: number | null;
  longitude: number | null;
  theme: string | null;
  is_public: boolean | null;
  custom_fields: any;
};

export default function EditCardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = usePremiumToast();
  const [loadingCard, setLoadingCard] = useState(true);
  const [initialData, setInitialData] = useState<any>(null);

  // Charger les données de la carte
  useEffect(() => {
    if (!id) return;

    const fetchCard = async () => {
      try {
        setLoadingCard(true);

        // Récupérer la carte
        const { data: rawCard, error: cardError } = await supabase
          .from("business_cards")
          .select('*')
          .eq('id', id)
          .single();

        if (cardError) {
          throw cardError;
        }

        // Type assertion: business_cards table may not be in generated types
        const card = rawCard as unknown as BusinessCardData | null;

        if (!card) {
          toast.error("Erreur", "Cette carte de visite n'existe pas ou ne vous appartient pas.");
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
          
          // Champs personnalisés
          location: "",
          skills: "",
          backgroundColor: "",
          backgroundImage: "",
          
          // Réseaux sociaux
          linkedin: "",
          instagram: "",
          twitter: "",
          facebook: "",
          youtube: "",
          whatsapp: "",
          portfolio: ""
        };

        // Traiter les champs personnalisés
        if (card.custom_fields) {
          const customFields = card.custom_fields as any;
          
          if (customFields.location) {
            formData.location = customFields.location;
          }
          
          if (customFields.skills && Array.isArray(customFields.skills)) {
            formData.skills = customFields.skills.join(', ');
          }
          
          if (customFields.backgroundColor) {
            formData.backgroundColor = customFields.backgroundColor;
          }
          
          if (customFields.backgroundImage) {
            formData.backgroundImage = customFields.backgroundImage;
          }
        }

        // Traiter les liens sociaux
        if (socialLinks) {
          socialLinks.forEach((link: any) => {
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
              case 'whatsapp':
                formData.whatsapp = link.url;
                break;
              case 'portfolio':
                formData.portfolio = link.url;
                break;
            }
          });
        }

        setInitialData(formData);
      } catch (error: any) {
        // Error log removed
        toast.error("Erreur", "Impossible de charger les données de la carte");
        navigate('/dashboard');
      } finally {
        setLoadingCard(false);
      }
    };

    fetchCard();
  }, [id, navigate, toast]);

  // Fonction de sauvegarde
  const handleSave = async (data: any) => {
    if (!id) throw new Error("ID manquant");

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
        latitude: data.selectedLocation?.latitude || null,
        longitude: data.selectedLocation?.longitude || null,
        custom_fields: {
          location: data.location,
          backgroundColor: data.backgroundColor,
          backgroundImage: data.backgroundImage,
          skills: data.skills ? data.skills.split(',').map((s: string) => s.trim()) : [],
        },
        updated_at: new Date().toISOString()
      };

      // Mettre à jour la carte
      // Type assertion for update payload - suppress Supabase type errors
      const { error: cardError } = await (supabase
        .from("business_cards")
        .update as any)(updateData)
        .eq('id', id);

      if (cardError) throw cardError;

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
      if (data.whatsapp) socialLinks.push({ platform: 'whatsapp', url: data.whatsapp, card_id: id });
      if (data.portfolio) socialLinks.push({ platform: 'portfolio', url: data.portfolio, card_id: id });

      if (socialLinks.length > 0) {
        // Type assertion for insert payload - suppress Supabase type errors
        const { error: socialError } = await (supabase
          .from("social_links")
          .insert as any)(socialLinks);

        if (socialError) {
          // Error log removed
        }
      }

      // Pas de retour pour respecter Promise<void>
    } catch (error: any) {
      // Error log removed
      throw new Error(error.message || "Erreur lors de la mise à jour de la carte");
    }
  };

  // Fonction de publication
  const handlePublish = async (data: any) => {
    try {
      await handleSave(data);
      toast.cardUpdated();
      navigate(`/cards/${id}/view`);
    } catch (error: any) {
      toast.error("Erreur", error.message);
    }
  };

  // Affichage du chargement
  if (loadingCard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Chargement de la carte...</h2>
          <p className="text-gray-600">Récupération de vos données</p>
        </div>
      </div>
    );
  }

  // Affichage du formulaire moderne
  return (
    <ModernCardForm
      mode="edit"
      initialData={initialData}
      onSave={handleSave}
      onPublish={handlePublish}
    />
  );
} 